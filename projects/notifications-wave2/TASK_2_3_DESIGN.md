# Задача 2.3 — Текст письма клиента в уведомлении сотруднику

**Статус:** Готово к реализации
**Дата:** 17.04.2026
**Архитектурное решение принято:** 17.04.2026

---

## 1. Проблема

Когда клиент отвечает на обращение по email:

- Сотрудник получает push-уведомление «Получен новый email по обращению №...» — текста нет
- Email-уведомление уходит **только если статус обращения изменился** на «Получен ответ» (через `UsrProcess_0c71a12CTI5`)
- Если обращение в «Новое» или «В работе» — статус не меняется → **email не уходит совсем**
- Шаблон `18834f34` не содержит текст клиентского письма

## 2. Решение

По аналогии с клиентским механизмом (`SendEmailToCaseOnStatusChange` + `CaseNotificationRule`) создаём четыре новых компонента в пакете CTI.

Новый BPMN стреляет напрямую на Activity INSERT — **без зависимости от смены статуса**.

---

## 3. Компоненты

### 3.1 `UsrLatestCustomerEmailGenerator` (C# — Исходный код)

Invokable-макрос: читает последний входящий email клиента по CaseId и возвращает HTML-тело.

Паттерн — точно как `SymptomsGenerator` (CaseService, UId `329987ff-8d3d-43d0-9d20-f67e71c9e0b6`).

```csharp
namespace BPMSoft.Configuration
{
    using System;
    using System.Collections.Generic;
    using BPMSoft.Common;
    using BPMSoft.Core;
    using BPMSoft.Core.DB;

    public class UsrLatestCustomerEmailGenerator : IMacrosInvokable
    {
        public UserConnection UserConnection { get; set; }

        // Паттерн точно как SymptomsGenerator: аргумент = KeyValuePair<string, Guid>
        private Guid GetCaseId(object argument)
        {
            var kv = argument as KeyValuePair<string, Guid>?;
            return kv.HasValue ? kv.Value.Value : Guid.Empty;
        }

        public string GetMacrosValue(object arguments)
        {
            var caseId = GetCaseId(arguments);
            if (caseId == Guid.Empty)
                return string.Empty;

            var select = new Select(UserConnection)
                    .Column("a", "Body")
                .From("Activity").As("a")
                .InnerJoin("ActivityType").As("at")
                    .On("a", "TypeId").IsEqual("at", "Id")
                .Where("a", "CaseId").IsEqual(Column.Parameter(caseId))
                    .And("at", "Code").IsEqual(Column.Const("Email"))
                    .And("a", "IsHtmlBody").IsEqual(Column.Const(true))
                .OrderByDesc("a", "CreatedOn")
                as Select;

            select.Top(1);

            using (var dbExec = UserConnection.EnsureDBConnection())
            using (var reader = select.ExecuteReader(dbExec))
            {
                if (!reader.Read())
                    return string.Empty;

                var body = reader.GetColumnValue<string>("Body") ?? string.Empty;
                if (body.Length > 50_000)
                    body = body.Substring(0, 50_000) + "<p><i>... (текст обрезан)</i></p>";
                return body;
            }
        }
    }
}
```

### 3.2 `UsrSendEmailToCaseOwnerOnReply` (C# — Исходный код)

Основной класс-обработчик. По аналогии с `SendEmailToCaseOnStatusChange` (CaseService).

```csharp
namespace BPMSoft.Configuration
{
    using System;
    using global::Common.Logging;
    using BPMSoft.Common;
    using BPMSoft.Core;
    using BPMSoft.Core.DB;
    using BPMSoft.Core.Entities;

    public class UsrSendEmailToCaseOwnerOnReply
    {
        private static readonly ILog _log = LogManager.GetLogger("EmailCases");

        private EmailWithMacrosManager _emailWithMacrosManager;

        public EmailWithMacrosManager EmailWithMacrosManager {
            get => _emailWithMacrosManager ?? (_emailWithMacrosManager = new EmailWithMacrosManager(UserConnection));
            set => _emailWithMacrosManager = value;
        }

        public UserConnection UserConnection { get; private set; }

        public UsrSendEmailToCaseOwnerOnReply(UserConnection userConnection)
        {
            UserConnection = userConnection;
        }

        /// <summary>
        /// Вызывается из ScriptTask BPMN-процесса.
        /// </summary>
        public bool Run(Guid activityId)
        {
            if (activityId == Guid.Empty)
                return false;

            var caseData = ReadCaseByActivity(activityId);
            if (caseData == null || caseData.OwnerId == Guid.Empty)
                return false;

            var ownerEmail = ReadContactEmail(caseData.OwnerId);
            if (ownerEmail.IsNullOrEmpty())
                return false;

            var rule = ReadNotificationRule(caseData.StatusId, caseData.CategoryId);
            if (rule == null || rule.EmailTemplateId == Guid.Empty)
                return false;

            var senderEmail = Core.Configuration.SysSettings
                .GetValue<string>(UserConnection, "SupportServiceEmail", string.Empty);
            if (senderEmail.IsNullOrEmpty())
                return false;

            try
            {
                EmailWithMacrosManager.SendEmailFromTo(
                    caseData.CaseId, rule.EmailTemplateId, senderEmail, ownerEmail);
            }
            catch (Exception ex)
            {
                _log.ErrorFormat(
                    "UsrSendEmailToCaseOwnerOnReply: error sending email. CaseId={0}, tplId={1}. {2}",
                    caseData.CaseId, rule.EmailTemplateId, ex.Message);
                return false;
            }
            return true;
        }

        private CaseData ReadCaseByActivity(Guid activityId)
        {
            var select = new Select(UserConnection)
                    .Column("a", "CaseId")
                    .Column("c", "OwnerId")
                    .Column("c", "StatusId")
                    .Column("c", "CategoryId")
                .From("Activity").As("a")
                .InnerJoin("Case").As("c")
                    .On("a", "CaseId").IsEqual("c", "Id")
                .Where("a", "Id").IsEqual(Column.Parameter(activityId))
                as Select;

            using (var dbExec = UserConnection.EnsureDBConnection())
            using (var reader = select.ExecuteReader(dbExec))
            {
                if (!reader.Read()) return null;
                return new CaseData {
                    CaseId = reader.GetColumnValue<Guid>("CaseId"),
                    OwnerId = reader.GetColumnValue<Guid>("OwnerId"),
                    StatusId = reader.GetColumnValue<Guid>("StatusId"),
                    CategoryId = reader.GetColumnValue<Guid>("CategoryId")
                };
            }
        }

        private string ReadContactEmail(Guid contactId)
        {
            var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "Contact");
            esq.AddColumn("Email");
            var contact = esq.GetEntity(UserConnection, contactId);
            return contact?.GetTypedColumnValue<string>("Email") ?? string.Empty;
        }

        private NotificationRule ReadNotificationRule(Guid statusId, Guid categoryId)
        {
            var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "UsrEmployeeNotificationRule");
            esq.AddColumn("UsrEmailTemplate");
            esq.Filters.Add(esq.CreateFilterWithParameters(
                FilterComparisonType.Equal, "UsrIsActive", true));
            // Фильтр: статус совпадает ИЛИ не задан
            var statusFilter = esq.CreateFilterGroup();
            statusFilter.LogicalOperation = LogicalOperationStrict.Or;
            statusFilter.Add(esq.CreateFilterWithParameters(
                FilterComparisonType.Equal, "UsrCaseStatus", statusId));
            statusFilter.Add(esq.CreateIsNullFilter("UsrCaseStatus"));
            esq.Filters.Add(statusFilter);
            // Фильтр: категория совпадает ИЛИ не задана
            var categoryFilter = esq.CreateFilterGroup();
            categoryFilter.LogicalOperation = LogicalOperationStrict.Or;
            categoryFilter.Add(esq.CreateFilterWithParameters(
                FilterComparisonType.Equal, "UsrCaseCategory", categoryId));
            categoryFilter.Add(esq.CreateIsNullFilter("UsrCaseCategory"));
            esq.Filters.Add(categoryFilter);

            var collection = esq.GetEntityCollection(UserConnection);
            if (collection.Count == 0) return null;
            return new NotificationRule {
                EmailTemplateId = collection[0].GetTypedColumnValue<Guid>("UsrEmailTemplateId")
            };
        }

        private class CaseData
        {
            public Guid CaseId;
            public Guid OwnerId;
            public Guid StatusId;
            public Guid CategoryId;
        }

        private class NotificationRule
        {
            public Guid EmailTemplateId;
        }
    }
}
```

### 3.3 `UsrEmployeeNotificationRule` (объект — справочник)

Создаётся в дизайнере объекта CTI.

| Колонка BPMSoft | Тип | Обязательное | Назначение |
| --- | --- | --- | --- |
| `UsrCaseStatusId` | Lookup → CaseStatus | Нет | Статус обращения (NULL = любой) |
| `UsrCaseCategoryId` | Lookup → CaseCategory | Нет | Категория обращения (NULL = любая) |
| `UsrEmailTemplateId` | Lookup → EmailTemplate | Да | Шаблон email |
| `UsrRuleUsageId` | Lookup → CaseNotificationRuleUsage | Нет | Сразу / С задержкой / Не используется |
| `UsrIsActive` | Boolean | Да | Активно (по умолчанию true) |

Первая запись данных:

| UsrCaseStatusId | UsrCaseCategoryId | UsrEmailTemplateId | UsrIsActive |
| --- | --- | --- | --- |
| NULL (любой) | NULL (любая) | `18834f34-...` | true |

### 3.4 `UsrSendEmailToCaseOwnerOnReplyProcess` (BPMN-процесс)

**StartSignal:** Activity INSERT

- `TypeId` = `e2831dec-cfc0-df11-b00f-001d60e938c6` (Email)
- `CaseId` IS NOT NULL
- `ServiceProcessed` = false
- Фильтр на не авто-ответ (аналогично `RunSendNotificationCaseOwnerProcess`)

**Структура:**

```text
StartSignal (Activity INSERT)
  |
  v
[ScriptTask: SendEmailScriptTask]
  UsrSendEmailToCaseOwnerOnReply notifier =
      new UsrSendEmailToCaseOwnerOnReply(UserConnection);
  notifier.Run(Get<Guid>("ActivityId"));
  return true;
  |
  v
Terminate
```

> **Feature-toggle:** при желании обернуть в `if (UserConnection.GetIsFeatureEnabled("UsrSendEmailToCaseOwnerOnReplyClass"))` — для возможности быстрого отключения без остановки процесса.

---

## 4. Регистрация макроса в EmailTemplateMacros

SQL-сценарий (добавить в пакет CTI как SQL Script):

```sql
DO $$
DECLARE
    v_id uuid := gen_random_uuid();
    v_parent_id uuid := '16339f82-6ff0-4c75-b20d-13f07a79f854';
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "EmailTemplateMacros"
        WHERE "ColumnPath" = 'BPMSoft.Configuration.UsrLatestCustomerEmailGenerator'
    ) THEN
        INSERT INTO "EmailTemplateMacros"
            ("Id", "CreatedOn", "ModifiedOn", "ParentId", "Name", "ColumnPath", "ReferenceSchemaName")
        VALUES
            (v_id, NOW(), NOW(), v_parent_id,
             'Последнее письмо клиента',
             'BPMSoft.Configuration.UsrLatestCustomerEmailGenerator',
             'Case');
    END IF;
END $$;
```

После выполнения в шаблоне `18834f34` появится макрос `[#@Invoke.UsrLatestCustomerEmailGenerator#]` — добавить его в нужное место шаблона через Дизайнер системы → Шаблоны сообщений.

---

## 5. CC — автоматически

При `activity.Save()` внутри `EmailWithMacrosManager` срабатывает `UsrActivityCcEventListener.OnSaving()` — добавляет CC из `Case.UsrCcEmails` + `ServicePact.UsrCcEmails`. Дополнительного кода не нужно.

---

## 6. Порядок внедрения

| # | Артефакт | Тип | Действие | Перезапуск Kestrel |
| --- | --- | --- | --- | --- |
| 1 | `UsrLatestCustomerEmailGenerator` | C# Исходный код | CTI → Добавить → Исходный код → Опубликовать | Нет |
| 2 | `UsrSendEmailToCaseOwnerOnReply` | C# Исходный код | CTI → Добавить → Исходный код → Опубликовать | Нет |
| 3 | `UsrEmployeeNotificationRule` | Объект | Дизайнер объекта → Опубликовать | Нет |
| 4 | `UsrSendEmailToCaseOwnerOnReplyProcess` | BPMN | Дизайнер процессов → Опубликовать | Нет |
| 5 | Регистрация макроса | SQL-сценарий | CTI → SQL Script → Выполнить | Нет |
| 6 | Макрос в шаблон `18834f34` | Шаблон | Дизайнер системы → Шаблоны сообщений | Нет |
| 7 | Запись в `UsrEmployeeNotificationRule` | Данные | UI → Справочник → Добавить запись | Нет |

> Перезапуск Kestrel не нужен — нет нового EventListener.

---

## 7. Тестирование

### 7.1 Основной сценарий

1. Создать обращение, назначить ответственного (у ответственного должен быть email)
2. Убедиться что обращение в статусе «В работе» (GAP-кейс — email не уходил раньше)
3. Отправить входящий email на `servicedesk@cti.ru`, привязать к обращению
4. Дождаться обработки (~1-2 мин)

Ожидаемый результат:

- [ ] Push-уведомление пришло (как раньше)
- [ ] Email пришёл ответственному с текстом клиентского письма
- [ ] Текст письма клиента виден в блоке цитаты
- [ ] CC-адреса из обращения и договора подставились

### 7.2 Граничные случаи

| Кейс | Ожидание |
| --- | --- |
| Обращение без ответственного | Email не уходит, ошибки нет |
| У ответственного нет email | Email не уходит, ошибки нет |
| Нет записи в `UsrEmployeeNotificationRule` | Email не уходит, ошибки нет |
| Обращение в «Новое» | Email уходит (был GAP — теперь исправлен) |
| Обращение в «Решено» | Email уходит |
| Большое тело письма (> 50 КБ) | Текст обрезан, email отправлен |

### 7.3 SQL для проверки

```sql
-- Смотрим созданные Activity от нового механизма
SELECT a."Title", a."Recepient", a."CopyRecepient", a."CreatedOn"
FROM "Activity" a
WHERE a."CaseId" = '<guid обращения>'
ORDER BY a."CreatedOn" DESC
LIMIT 5;
```

---

## 8. Что НЕ трогаем

- `UsrProcess_0c71a12CTI5` — оставляем работать параллельно до стабилизации
- `ReopenCaseAndNotifyAssignee` — системный класс, не модифицируем
- `UsrSendNotificationToCaseOwnerCustom1` — не трогаем (при toggle=1 не используется)
