# Зада��а 2.3 — Текст письма клиента в уведомлении инженеру

**Статус:** Проектирование  
**Дата:** 2026-04-12  
**Приоритет:** 1 (первая задача Волны 2)  
**Автор:** Claude (аналитик-разработчик BPMSoft)

---

## 1. Проблема

Когда клиент отвечает на обращение по email, инженер получает **push-уведомление** в системе BPMSoft:

> «Получен новый email по обращению №XXX»

Текста письма в уведомлении нет. Чтобы узнать, что написал клиент, инженер должен:
1. Открыть BPMSoft
2. Найти обращение
3. Перейти на вкладку «Хронология» или «Email»
4. Прочитать письмо

Это **3–5 минут** на каждое уведомление. При 10–20 ответах в день — ощутимые потери. Инженеры откладывают реакцию до момента, когда «накопится», что ухудшает SLA.

---

## 2. Текущее состояние

### 2.1 Что происходит при получении письма от клиента

```
Входящий email → Activity (Type=Email, MessageType=Incoming, CaseId=...)
       │
       ├─ UsrActivityCcEventListener:OnSaving()
       │    └─ Сохраняет CC-адреса из письма в Case.UsrCcEmails
       │
       ├─ [Платформа] Связывает Activity с Case, меняет статус на «Получен ответ»
       │
       └─ Сигнал запускает BPMN: UsrSendNotificationToCaseOwnerCustom1
            ├─ ReadCaseData → читает Case (OwnerId, Number)
            ├─ ExclusiveGateway1 → проверка условий
            ├─ CreateNotificationScriptTask → создаёт Reminding (push)
            │    └─ SubjectCaption = "Получен новый email по обращению №{Number}"
            ├─ SetActivityServiceProcessed → Activity.ServiceProcessed = false
            └─ ChangeDataUserTask → обновление статуса
```

**Ключевое ограничение:** процесс `UsrSendNotificationToCaseOwnerCustom1` создаёт только **push-уведомление** (запись в таблице `Reminding`). Никакого email инженеру не отправляется.

### 2.2 Компоненты, связанные с задачей

| Компонент | Пакет | Что делает | Релевантность |
|-----------|-------|-----------|---------------|
| `UsrSendNotificationToCaseOwnerCustom1` | CTI | BPMN: push-уведомление при новом email | **Точка расширения** |
| `UsrSendEmailToSROwnerCustom1` | CTI | BPMN: email инженеру при назначении | Образец отправки email |
| `UsrActivityCcEventListener` | CTI | EventListener: CC-адреса | Автоматически добавит CC |
| `UsrCcAddressResolver` | CTI | Хелпер: чтение/мерж CC | Переиспользуем |
| `ActivityEmailSender` | Платформа | Отправка email по Activity | Механизм отправки |
| `AsyncEmailSender` | CaseService | Асинхронная отправка | Альтернативный механизм |

### 2.3 Параметры процесса `UsrSendNotificationToCaseOwnerCustom1`

| Параметр | Тип | Назначение |
|----------|-----|-----------|
| `ActivityId` | Guid | ID входящего письма (Activity) |
| `CaseOwnerId` | Guid | ID ответственного (из Case.OwnerId) |
| `CaseId` | Guid | ID обращения |
| `SubjectCaption` | String | Текст push-уведомления |
| `AssigneeIsCleared` | Boolean | Флаг очистки ответственного при переоткрытии |

---

## 3. Цель

Инженер получает **email-уведомление** с текстом последнего письма клиента. Формат:

```
Тема: [Обращение №INC-001234] Новый ответ от клиента
От: noreply@support.cti.ru (служба поддержки)
Кому: engineer@cti.ru
Копия: (CC из Case.UsrCcEmails + ServicePact.UsrCcEmails — автоматически)

─────────────────────────────────────────────
По обращению №INC-001234 «Не работает VPN» 
получен новый ответ от клиента Иванов Иван:
─────────────────────────────────────────────

> Добрый день!
> Проблема повторилась после перезагрузки.
> Ошибка: "Connection timeout" при подключении к vpn.company.ru.
> Скриншот во вложении.

─────────────────────────────────────────────
Открыть обращение: https://bpmsoft.cti.ru/Shell/Case/...
```

### Критерии приёмки

1. При получении входящего email по обращению инженер (Case.Owner) получает email с текстом письма клиента
2. CC-адреса из обращения и договора подставляются автоматически (через существующий `UsrActivityCcEventListener`)
3. Если у обращения нет ответственного или у ответственного нет email — уведомление не отправляется (без ошибки)
4. Тема письма содержит номер обращения для группировки в почтовом клиенте
5. Push-уведомление продолжает работать как раньше (не ломаем существующее)

---

## 4. Рассмотренные варианты

### Вариант A: Invokable-макрос `[#@Invoke.UsrLastCustomerEmailGenerator#]`

**Идея:** Создать C#-класс, реализующий `IMacrosInvokable`, зарегистрировать как макрос, добавить в шаблон email.

**Отклонён.** Feature-toggles `EmailMessageMultiLanguage` / `EmailMessageMultiLanguageV2` **выключены**. Конвейер `EmailWithMacrosManager` → `MacrosProcessor` → invokable-макросы **не вызывается**. Активен старый BPMN-путь: `AddDataUserTask → FillEmailUserTask → ActivityEmailSender.Send()`. В старом пути invokable-макросы не поддерживаются.

Включение feature-toggles повлияет на все email-уведомления системы — непредсказуемые побочные эффекты.

### Вариант B: Опция «Процитировать оригинальный email» в CaseNotificationRule

**Идея:** Включить флаг в правиле уведомлений → `ExtendedEmailWithMacrosManager` добавит тело письма.

**Отклонён.** Две проблемы:
1. `ExtendedEmailWithMacrosManager` берёт тело из `Case.ParentActivity` — это **корневое** письмо (первое обращение), а не последний ответ клиента.
2. Тот же конвейер `EmailWithMacrosManager` не активен из-за выключенных feature-toggles.

### Вариант C: EventListener на Activity (OnInserted)

**Идея:** Новый EventListener, который при сохранении входящего email создаёт исходящий email инженеру.

**Отклонён.** Создание Activity внутри EventListener на Activity — рискованно:
- Вложенные транзакции могут конфликтовать
- Новая Activity вызовет цепочку EventListener-ов (CC, другие)
- Процесс импорта email может быть чувствителен к задержкам в EventListener

### Вариант D: Новый BPMN-процесс (параллельный)

**Идея:** Создать отдельный BPMN, срабатывающий на тот же сигнал (новый email по обращению).

**Отклонён.** Избыточная сложность: два процесса на одно событие, синхронизация, дублирование логики чтения Case.

### ✅ Вариант E: C#-хелпер + ScriptTask в существующем BPMN (рекомендуемый)

**Идея:**
1. Создать C#-класс `UsrNewEmailNotifier` — вся логика формирования и отправки email
2. Добавить один ScriptTask в `UsrSendNotificationToCaseOwnerCustom1` — вызов `UsrNewEmailNotifier.NotifyOwner()`

**Преимущества:**
- Минимальная модификация BPMN (один элемент)
- Вся логика в тестируемом C#-классе
- CC-адреса подставятся автоматически (через существующий `UsrActivityCcEventListener`)
- Не зависит от feature-toggles
- Push-уведомление продолжает работать

---

## 5. Детальный дизайн

### 5.1 Компонент 1: `UsrNewEmailNotifier` (C# — Исходный код)

**Назначение:** Читает входящее письмо, формирует email-уведомление инженеру, отправляет.

```csharp
namespace BPMSoft.Configuration
{
    using System;
    using System.Text;
    using BPMSoft.Common;
    using BPMSoft.Core;
    using BPMSoft.Core.DB;
    using BPMSoft.Core.Entities;
    using BPMSoft.Core.Factories;
    using BPMSoft.Configuration;

    /// <summary>
    /// Отправляет email-уведомление ответственному по обращению
    /// с текстом последнего письма клиента.
    /// </summary>
    public class UsrNewEmailNotifier
    {
        private static readonly Guid EmailActivityTypeId =
            new Guid("e2831dec-cfc0-df11-b00f-001d60e938c6");
        private static readonly Guid OutgoingMessageTypeId =
            new Guid("7f6d3f94-f36b-1410-068c-20cf30b39373");

        /// <summary>
        /// Основной метод: отправить уведомление ответственному.
        /// Вызывается из ScriptTask BPMN-процесса.
        /// </summary>
        /// <param name="userConnection">Подключение пользователя</param>
        /// <param name="caseId">ID обращения</param>
        /// <param name="incomingActivityId">ID входящего письма (Activity)</param>
        /// <returns>true если email отправлен, false если пропущен</returns>
        public static bool NotifyOwner(
            UserConnection userConnection, Guid caseId, Guid incomingActivityId)
        {
            if (caseId == Guid.Empty || incomingActivityId == Guid.Empty)
                return false;

            // 1. Читаем данные обращения и ответственного
            var caseData = ReadCaseData(userConnection, caseId);
            if (caseData == null || string.IsNullOrEmpty(caseData.OwnerEmail))
                return false;

            // 2. Читаем тело входящего письма
            var emailData = ReadIncomingEmail(userConnection, incomingActivityId);
            if (emailData == null || string.IsNullOrEmpty(emailData.Body))
                return false;

            // 3. Получаем адрес отправителя (почтовый ящик поддержки)
            var senderEmail = Core.Configuration.SysSettings
                .GetValue<string>(userConnection, "SupportServiceEmail", string.Empty);
            if (string.IsNullOrEmpty(senderEmail))
                return false;

            // 4. Формируем email
            string subject = string.Format(
                "[Обращение №{0}] Новый ответ от клиента",
                caseData.Number);
            string body = BuildEmailBody(caseData, emailData);

            // 5. Создаём Activity (email) и отправляем
            var activityId = CreateEmailActivity(
                userConnection, subject, body, senderEmail,
                caseData.OwnerEmail, caseId);
            if (activityId == Guid.Empty)
                return false;

            SendEmail(userConnection, activityId);
            return true;
        }

        #region Чтение данных

        private static CaseInfo ReadCaseData(UserConnection uc, Guid caseId)
        {
            var select = new Select(uc)
                    .Column("Case", "Number")
                    .Column("Case", "Subject")
                    .Column("Case", "OwnerId")
                    .Column("Contact", "Email").As("OwnerEmail")
                    .Column("Contact", "Name").As("OwnerName")
                .From("Case")
                .LeftOuterJoin("Contact")
                    .On("Case", "OwnerId").IsEqual("Contact", "Id")
                .Where("Case", "Id").IsEqual(Column.Parameter(caseId))
                as Select;

            using (var dbExec = uc.EnsureDBConnection())
            using (var reader = select.ExecuteReader(dbExec))
            {
                if (!reader.Read()) return null;
                return new CaseInfo {
                    Number = reader.GetColumnValue<string>("Number") ?? string.Empty,
                    Subject = reader.GetColumnValue<string>("Subject") ?? string.Empty,
                    OwnerId = reader.GetColumnValue<Guid>("OwnerId"),
                    OwnerEmail = reader.GetColumnValue<string>("OwnerEmail") ?? string.Empty,
                    OwnerName = reader.GetColumnValue<string>("OwnerName") ?? string.Empty
                };
            }
        }

        private static EmailInfo ReadIncomingEmail(UserConnection uc, Guid activityId)
        {
            var select = new Select(uc)
                    .Column("Activity", "Title")
                    .Column("Activity", "Body")
                    .Column("Activity", "Sender")
                .From("Activity")
                .Where("Activity", "Id").IsEqual(Column.Parameter(activityId))
                as Select;

            using (var dbExec = uc.EnsureDBConnection())
            using (var reader = select.ExecuteReader(dbExec))
            {
                if (!reader.Read()) return null;
                var body = reader.GetColumnValue<string>("Body") ?? string.Empty;
                // Ограничиваем размер тела письма (защита от огромных email)
                if (body.Length > 100_000)
                    body = body.Substring(0, 100_000) + "\n<p><i>... (текст обрезан)</i></p>";
                return new EmailInfo {
                    Title = reader.GetColumnValue<string>("Title") ?? string.Empty,
                    Body = body,
                    Sender = reader.GetColumnValue<string>("Sender") ?? string.Empty
                };
            }
        }

        #endregion

        #region Формирование email

        private static string BuildEmailBody(CaseInfo c, EmailInfo e)
        {
            // Извлекаем имя отправителя из формата "Display Name <email@example.com>"
            var senderDisplay = ExtractDisplayName(e.Sender);

            var sb = new StringBuilder();
            sb.AppendLine("<div style=\"font-family: Arial, sans-serif; font-size: 14px;\">");
            sb.AppendFormat(
                "<p>По обращению <b>№{0}</b> «{1}» получен новый ответ от <b>{2}</b>:</p>",
                System.Net.WebUtility.HtmlEncode(c.Number),
                System.Net.WebUtility.HtmlEncode(c.Subject),
                System.Net.WebUtility.HtmlEncode(senderDisplay));
            sb.AppendLine("<hr style=\"border: none; border-top: 1px solid #ccc;\">");
            sb.AppendLine("<blockquote style=\"padding: 12px 16px; background: #f9f9f9; " +
                "border-left: 4px solid #2196F3; margin: 12px 0;\">");
            sb.AppendLine(e.Body); // HTML-тело письма клиента
            sb.AppendLine("</blockquote>");
            sb.AppendLine("<hr style=\"border: none; border-top: 1px solid #ccc;\">");
            sb.AppendFormat(
                "<p style=\"font-size: 12px; color: #666;\">Ответственный: {0}</p>",
                System.Net.WebUtility.HtmlEncode(c.OwnerName));
            sb.AppendLine("</div>");
            return sb.ToString();
        }

        private static string ExtractDisplayName(string sender)
        {
            if (string.IsNullOrEmpty(sender)) return "клиента";
            // Формат: "Display Name <email@example.com>" или просто "email@example.com"
            var idx = sender.IndexOf('<');
            if (idx > 0)
                return sender.Substring(0, idx).Trim().Trim('"');
            return sender.Trim();
        }

        #endregion

        #region Создание и отправка Activity

        private static Guid CreateEmailActivity(
            UserConnection uc, string subject, string body,
            string sender, string recipient, Guid caseId)
        {
            var schema = uc.EntitySchemaManager.GetInstanceByName("Activity");
            var activity = schema.CreateEntity(uc);
            activity.SetDefColumnValues();
            activity.SetColumnValue("TypeId", EmailActivityTypeId);
            activity.SetColumnValue("MessageTypeId", OutgoingMessageTypeId);
            activity.SetColumnValue("Title", subject);
            activity.SetColumnValue("Body", body);
            activity.SetColumnValue("Sender", sender);
            activity.SetColumnValue("Recepient", recipient);
            activity.SetColumnValue("CaseId", caseId);
            activity.SetColumnValue("IsHtmlBody", true);
            // CC будет добавлен автоматически через UsrActivityCcEventListener
            if (!activity.Save())
                return Guid.Empty;
            return activity.PrimaryColumnValue;
        }

        private static void SendEmail(UserConnection uc, Guid activityId)
        {
            if (uc.GetIsFeatureEnabled("UseAsyncEmailSender"))
            {
                var asyncSender = new AsyncEmailSender(uc);
                asyncSender.SendAsync(activityId);
            }
            else
            {
                var factory = ClassFactory.Get<EmailClientFactory>(
                    new ConstructorArgument("userConnection", uc));
                var sender = new ActivityEmailSender(factory, uc);
                sender.Send(activityId);
            }
        }

        #endregion

        #region DTO

        private class CaseInfo
        {
            public string Number;
            public string Subject;
            public Guid OwnerId;
            public string OwnerEmail;
            public string OwnerName;
        }

        private class EmailInfo
        {
            public string Title;
            public string Body;
            public string Sender;
        }

        #endregion
    }
}
```

### 5.2 Компонент 2: ScriptTask в BPMN-процессе

**Процесс:** `UsrSendNotificationToCaseOwnerCustom1`  
**Действие:** Добавить элемент **ScriptTask** с именем `SendEmailToOwnerScriptTask`

**Код ScriptTask:**

```csharp
var caseId = ReadCaseData.ResultEntity.PrimaryColumnValue;
UsrNewEmailNotifier.NotifyOwner(UserConnection, caseId, ActivityId);
return true;
```

**Размещение в процессе:**

```
... → CreateNotificationScriptTask → SendEmailToOwnerScriptTask → SetActivityServiceProcessed → ...
                  ↑ push-уведомление         ↑ email инженеру           ↑ обновление Activity
```

Новый ScriptTask вставляется **между** `CreateNotificationScriptTask` и `SetActivityServiceProcessed`.

---

## 6. Как работает CC (автоматически)

При вызове `activity.Save()` в методе `CreateEmailActivity`:

1. Срабатывает `UsrActivityCcEventListener.OnSaving()`
2. Определяет: это исходящий email, привязанный к Case
3. Вызывает `UsrCcAddressResolver.GetCcForCase(caseId)`
4. Дописывает CC из `Case.UsrCcEmails` + `ServicePact.UsrCcEmails` в `Activity.CopyRecepient`

**Никакого дополнительного кода для CC не нужно** — существующая инфраструктура покроет.

---

## 7. Порядок внедрения

| # | Артефакт | Тип | Способ | Перезапуск Kestrel |
|---|----------|-----|--------|-------------------|
| 1 | `UsrNewEmailNotifier` | C# (Исходный код) | Конфигурация → CTI → Добавить → Исходный код | Нет |
| 2 | Модификация BPMN | ScriptTask в процессе | Дизайнер процессов | Нет |
| 3 | Публикация | — | Опубликовать оба | **Нет** (нет EventListener) |

> **Важно:** В отличие от CC-проекта, здесь **нет нового EventListener** — перезапуск Kestrel не требуется. `UsrNewEmailNotifier` — обычный C#-класс, а ScriptTask вызывается из BPMN.

### Шаг 1. Создать `UsrNewEmailNotifier`

1. Конфигурация → пакет CTI
2. Добавить → Исходный код
3. Название: `UsrNewEmailNotifier`
4. Вставить код из п. 5.1
5. Сохранить → Опубликовать

### Шаг 2. Модифицировать BPMN-процесс

1. Конфигурация → найти `UsrSendNotificationToCaseOwnerCustom1`
2. Открыть в дизайнере процессов
3. Найти связь `CreateNotificationScriptTask` → `SetActivityServiceProcessed`
4. Удалить эту связь (стрелку)
5. Добавить элемент **Задание-сценарий** (ScriptTask):
   - Имя: `SendEmailToOwnerScriptTask`
   - Код: см. п. 5.2
6. Провести стрелки:
   - `CreateNotificationScriptTask` → `SendEmailToOwnerScriptTask`
   - `SendEmailToOwnerScriptTask` → `SetActivityServiceProcessed`
7. Сохранить → Опубликовать

---

## 8. Тестирование

### 8.1 Основной сценарий

1. Создать обращение с ответственным (у ответственного должен быть email)
2. Отправить email на адрес поддержки от имени клиента (тема = `Re: [№обращения]`)
3. Дождаться обработки (1–2 минуты)
4. **Проверить:**
   - Ответственный получил push-уведомление (как раньше)
   - Ответственный получил email с текстом клиентского письма
   - В email корректно отображается: номер обращения, тема, текст, имя отправителя
   - CC-адреса из обращения/договора подставились

### 8.2 Граничные случаи

| Кейс | Ожидаемый результат |
|------|-------------------|
| Нет ответственного (Owner = null) | Push-уведомление создаётся, email не отправляется, ошибки нет |
| У ответственного нет email | Push-уведомление создаётся, email не отправляется, ошибки нет |
| Пустой `SupportServiceEmail` | Email не отправляется, ошибки нет |
| Большое тело письма (> 100 КБ) | Текст обрезан, email отправлен |
| Письмо с HTML-форматированием | HTML сохраняется в blockquote |
| Несколько быстрых ответов подряд | Каждый генерирует отдельное уведомление |

### 8.3 Проверка SQL (до/после)

```sql
-- Последние Activity (email) от системы к инженерам
SELECT a."Title", a."Recepient", a."CopyRecepient", a."CreatedOn"
FROM "Activity" a
WHERE a."TypeId" = 'e2831dec-cfc0-df11-b00f-001d60e938c6'
  AND a."MessageTypeId" = '7f6d3f94-f36b-1410-068c-20cf30b39373'
  AND a."Title" LIKE '[Обращение №%] Новый ответ от клиента'
ORDER BY a."CreatedOn" DESC
LIMIT 10;
```

---

## 9. Риски и ограничения

| Риск | Вероятность | Влияние | Митигация |
|------|-----------|---------|-----------|
| **Email flooding** при серии быстрых ответов клиента | Средняя | Низкое (раздражение) | v1 — по одному email на каждый ответ. В будущем — дебаунс или дайджест |
| **Sender не настроен** (`SupportServiceEmail` пуст) | Низкая | Высокое (не работает) | Проверка в коде + документация |
| **Большие email** замедляют отправку | Низкая | Низкое | Обрезка до 100 КБ |
| **HTML injection** через тело клиентского письма | Средняя | Низкое (внутренний email) | Тело вставляется в blockquote; почтовые клиенты изолируют HTML |
| **Конфликт с будущим включением feature-toggles** | Низкая | Среднее | Наше решение не зависит от feature-toggles; при включении — пересмотреть |

---

## 10. Открытые вопросы (требуют решения до реализации)

1. **Ссылка на обращение в email** — нужно знать `BaseUrl` продуктивной системы для формирования прямой ссылки. Где он хранится? (`SysSettings.SiteUrl`? Или захардкодить?)

2. **Нужна ли системная настройка для отключения?** — Если инженер не хочет получать email с текстом (только push), нужен ли checkbox? Или для v1 достаточно без настройки?

3. **Подтвердить поток BPMN** — Перед модификацией открыть процесс в дизайнере и убедиться, что связь `CreateNotificationScriptTask → SetActivityServiceProcessed` действительно прямая (без промежуточных элементов).

---

## 11. Связь с другими задачами Волны 2

- **Задача 2.2** (зависание в «Получен ответ»): может переиспользовать `UsrNewEmailNotifier` для отправки напоминания (другой шаблон, но тот же механизм `CreateEmailActivity` + `SendEmail`)
- **Задача 2.4** (уведомление инженеру о смене статуса): аналогичный подход — C#-хелпер + ScriptTask/EventListener
- **Задача 2.5** (наблюдатели): когда появится, `UsrNewEmailNotifier` нужно будет расширить — отправлять не только Owner, но и наблюдателям
