# Реализация CC-адресов в email-уведомлениях

**Проект:** BPMSoft 1.9, пакет CTI  
**Статус:** Тестирование (ожидает проверки на почтовой подсистеме)

## Архитектура

- **Хранение CC:** колонки `UsrCcEmails` (Text 500) в объектах `Case` и `ServicePact`
- **Формат:** адреса через пробел (аналог `Activity.CopyRecepient`)
- **Точка интеграции:** `EntityEventListener` на `Activity` (OnSaving) — покрывает все пути отправки
- **Почему не BPMN:** EventListener срабатывает при любом способе отправки письма

## UsrCcAddressResolver.cs

```csharp
namespace BPMSoft.Configuration
{
    using System;
    using System.Collections.Generic;
    using BPMSoft.Common;
    using BPMSoft.Core;
    using BPMSoft.Core.DB;

    public class UsrCcAddressResolver
    {
        private readonly UserConnection _userConnection;

        public UsrCcAddressResolver(UserConnection userConnection)
        {
            _userConnection = userConnection;
        }

        /// <summary>
        /// Возвращает объединённую строку CC-адресов для обращения.
        /// Адреса из Case.UsrCcEmails и ServicePact.UsrCcEmails объединяются,
        /// дубли исключаются.
        /// </summary>
        public string GetCcForCase(Guid caseId)
        {
            if (caseId == Guid.Empty)
                return string.Empty;

            string caseCc = string.Empty;
            string pactCc = string.Empty;

            var select = new Select(_userConnection)
                    .Column("Case", "UsrCcEmails")
                    .Column("ServicePact", "UsrCcEmails").As("PactCcEmails")
                .From("Case")
                .LeftOuterJoin("ServicePact")
                    .On("Case", "ServicePactId").IsEqual("ServicePact", "Id")
                .Where("Case", "Id").IsEqual(Column.Parameter(caseId))
                as Select;

            using (var dbExecutor = _userConnection.EnsureDBConnection())
            using (var reader = select.ExecuteReader(dbExecutor))
            {
                if (reader.Read())
                {
                    caseCc = reader.GetColumnValue<string>("UsrCcEmails") ?? string.Empty;
                    pactCc = reader.GetColumnValue<string>("PactCcEmails") ?? string.Empty;
                }
            }

            return MergeAddresses(caseCc, pactCc);
        }

        /// <summary>
        /// Дописывает новые CC-адреса в Case.UsrCcEmails с дедупликацией.
        /// </summary>
        public void MergeIncomingCcToCase(Guid caseId, string incomingCc)
        {
            if (caseId == Guid.Empty || string.IsNullOrEmpty(incomingCc))
                return;

            string currentCaseCc = string.Empty;

            var select = new Select(_userConnection)
                    .Column("Case", "UsrCcEmails")
                .From("Case")
                .Where("Case", "Id").IsEqual(Column.Parameter(caseId))
                as Select;

            using (var dbExecutor = _userConnection.EnsureDBConnection())
            using (var reader = select.ExecuteReader(dbExecutor))
            {
                if (reader.Read())
                    currentCaseCc = reader.GetColumnValue<string>("UsrCcEmails") ?? string.Empty;
            }

            var merged = MergeAddresses(currentCaseCc, incomingCc);

            if (merged == currentCaseCc)
                return;

            var update = new Update(_userConnection, "Case")
                .Set("UsrCcEmails", Column.Parameter(merged))
                .Where("Id").IsEqual(Column.Parameter(caseId))
                as Update;

            update.Execute();
        }

        /// <summary>
        /// Объединяет строки адресов, исключает дубли (без учёта регистра).
        /// Разделители: пробел и точка с запятой.
        /// </summary>
        public string MergeAddresses(string first, string second)
        {
            var separators = new[] { ' ', ';' };
            var addresses = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var addr in first.Split(separators, StringSplitOptions.RemoveEmptyEntries))
                addresses.Add(addr.Trim());

            foreach (var addr in second.Split(separators, StringSplitOptions.RemoveEmptyEntries))
                addresses.Add(addr.Trim());

            return string.Join(" ", addresses);
        }
    }
}
```

## UsrActivityCcEventListener.cs

```csharp
namespace BPMSoft.Configuration
{
    using System;
    using BPMSoft.Core.Entities;
    using BPMSoft.Core.Entities.Events;

    [EntityEventListener(SchemaName = "Activity")]
    public class UsrActivityCcEventListener : BaseEntityEventListener
    {
        // Guid из БД тестовой системы
        private static readonly Guid EmailActivityTypeId =
            new Guid("e2831dec-cfc0-df11-b00f-001d60e938c6");

        private static readonly Guid OutgoingMessageTypeId =
            new Guid("7f6d3f94-f36b-1410-068c-20cf30b39373");

        public override void OnSaving(object sender, EntityBeforeEventArgs e)
        {
            var activity = (Entity)sender;

            // Только Email-активности
            var typeId = activity.GetTypedColumnValue<Guid>("TypeId");
            if (typeId != EmailActivityTypeId)
                return;

            // Только активности, связанные с обращением
            var caseId = activity.GetTypedColumnValue<Guid>("CaseId");
            if (caseId == Guid.Empty)
                return;

            var messageTypeId = activity.GetTypedColumnValue<Guid>("MessageTypeId");
            var resolver = new UsrCcAddressResolver(activity.UserConnection);

            if (messageTypeId == OutgoingMessageTypeId)
            {
                // Исходящее: дописываем CC из обращения и сервисного договора
                var additionalCc = resolver.GetCcForCase(caseId);
                if (string.IsNullOrEmpty(additionalCc))
                    return;

                var currentCc = activity.GetTypedColumnValue<string>("CopyRecepient") ?? string.Empty;
                var resultCc = string.IsNullOrEmpty(currentCc)
                    ? additionalCc
                    : currentCc + " " + additionalCc;

                activity.SetColumnValue("CopyRecepient", resultCc);
            }
            else if (messageTypeId == Guid.Empty)
            {
                // Входящее (MessageTypeId = NULL): сохраняем CC в обращение
                var incomingCc = activity.GetTypedColumnValue<string>("CopyRecepient") ?? string.Empty;
                if (string.IsNullOrEmpty(incomingCc))
                    return;

                resolver.MergeIncomingCcToCase(caseId, incomingCc);
            }
        }
    }
}
```

## Инструкция по внедрению

1. Конфигурация → схема `Case` (CTI) → дизайнер объекта → Добавить колонку `UsrCcEmails` (Text 500) → Опубликовать
2. То же самое для `ServicePact` (CTI)
3. Мастер раздела «Обращения» → Страница редактирования → добавить поле `UsrCcEmails`
4. Мастер раздела «Сервисные договоры» → то же самое
5. Конфигурация → пакет CTI → Добавить → Исходный код → `UsrCcAddressResolver` → вставить код → Сохранить → Опубликовать
6. То же для `UsrActivityCcEventListener`
7. **Перезапустить Kestrel** — обязательно!

## SQL для проверки

```sql
-- Проверить колонку
SELECT column_name FROM information_schema.columns
WHERE table_name = 'Case' AND column_name = 'UsrCcEmails';

-- Последние исходящие письма по обращениям
SELECT "Id", "CopyRecepient", "CaseId", "MessageTypeId", "CreatedOn"
FROM "Activity"
WHERE "TypeId" = 'e2831dec-cfc0-df11-b00f-001d60e938c6'
AND "MessageTypeId" = '7f6d3f94-f36b-1410-068c-20cf30b39373'
ORDER BY "CreatedOn" DESC
LIMIT 10;
```
