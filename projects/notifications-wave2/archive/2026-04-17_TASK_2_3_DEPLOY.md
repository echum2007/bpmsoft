# Задача 2.3 — План внедрения

**Статус:** Готов к внедрению  
**Дата:** 2026-04-12  
**Дизайн:** [TASK_2_3_DESIGN.md](TASK_2_3_DESIGN.md)  
**Перезапуск Kestrel:** НЕ НУЖЕН (нет нового EventListener)

---

## Что внедряем

При получении email от клиента по обращению — ответственный инженер получает **email-уведомление с текстом письма клиента** (помимо существующего push-уведомления).

| # | Артефакт | Тип | Действие |
|---|----------|-----|----------|
| 1 | `UsrNewEmailNotifier` | C# — Исходный код | Создать новую схему |
| 2 | `UsrSendNotificationToCaseOwnerCustom1` | BPMN-процесс | Добавить ScriptTask |

---

## Предварительная проверка

Перед внедрением убедиться:

- [ ] Системная настройка `SupportServiceEmail` = `servicedesk@cti.ru` (адрес отправителя)
- [ ] Системная настройка `SiteUrl` = `bpm.cti.ru` (для ссылки в email)
- [ ] Пакет CTI доступен в Конфигурации

---

## Шаг 1. Создать схему `UsrNewEmailNotifier`

1. Перейти в **Конфигурация** → пакет **CTI**
2. **Добавить** → **Исходный код**
3. Название: `UsrNewEmailNotifier`
4. Вставить код:

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
            string body = BuildEmailBody(userConnection, caseData, emailData, caseId);

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

        private static string BuildEmailBody(
            UserConnection uc, CaseInfo c, EmailInfo e, Guid caseId)
        {
            var senderDisplay = ExtractDisplayName(e.Sender);
            var siteUrl = Core.Configuration.SysSettings
                .GetValue<string>(uc, "SiteUrl", string.Empty).TrimEnd('/');
            var caseLink = !string.IsNullOrEmpty(siteUrl)
                ? string.Format("https://{0}/Shell/Case/{1}", siteUrl, caseId)
                : string.Empty;

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
            if (!string.IsNullOrEmpty(caseLink))
            {
                sb.AppendFormat(
                    "<p><a href=\"{0}\" style=\"color: #2196F3;\">Открыть обращение в системе</a></p>",
                    caseLink);
            }
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

5. **Сохранить** → **Опубликовать**

---

## Шаг 2. Модифицировать BPMN-процесс

**Процесс:** `UsrSendNotificationToCaseOwnerCustom1`

### 2.1 Открыть процесс

1. Перейти в **Конфигурация**
2. Найти `UsrSendNotificationToCaseOwnerCustom1`
3. Открыть в **дизайнере процессов**

### 2.2 Найти точку вставки

Текущая связка (конец основной ветки):

```
... → CreateNotificationScriptTask ──→ Terminate1
             (push-уведомление)    SequenceFlow6    (конец)
```

> **Ориентир:** `CreateNotificationScriptTask` — это элемент «New notification»,
> который создаёт push-уведомление. Он соединён стрелкой напрямую с красным
> кружком завершения (`Terminate1`).

### 2.3 Вставить ScriptTask

1. **Удалить** стрелку между `CreateNotificationScriptTask` и `Terminate1`
2. **Добавить** элемент **Задание-сценарий** (ScriptTask):
   - Заголовок: `SendEmailToOwnerScriptTask`
   - Код:

```csharp
var caseId = ReadCaseData.ResultEntity.PrimaryColumnValue;
UsrNewEmailNotifier.NotifyOwner(UserConnection, caseId, ActivityId);
return true;
```

3. **Провести стрелки:**
   - `CreateNotificationScriptTask` → `SendEmailToOwnerScriptTask`
   - `SendEmailToOwnerScriptTask` → `Terminate1`

### 2.4 Результат

```
... → CreateNotificationScriptTask → SendEmailToOwnerScriptTask → Terminate1
             (push-уведомление)            (email инженеру)          (конец)
```

### 2.5 Публикация

**Сохранить** → **Опубликовать**

---

## Шаг 3. Тестирование

### 3.1 Основной сценарий

1. Выбрать обращение с ответственным (у ответственного должен быть email в карточке контакта)
2. Отправить email на `servicedesk@cti.ru` от имени клиента, привязав к обращению (тема с номером)
3. Подождать 1–2 минуты (обработка входящей почты)
4. Проверить у ответственного:

- [ ] Push-уведомление пришло (как раньше)
- [ ] Email пришёл с текстом письма клиента
- [ ] Тема: `[Обращение №INC-XXXXX] Новый ответ от клиента`
- [ ] В теле: номер обращения, тема, имя отправителя, текст письма в цитате
- [ ] Ссылка `https://bpm.cti.ru/Shell/Case/...` ведёт на обращение
- [ ] CC-адреса из обращения и договора подставились

### 3.2 Граничные случаи

| Кейс | Ожидание | Проверить |
|------|----------|-----------|
| Нет ответственного (Owner пуст) | Push создаётся, email не уходит, ошибки нет | [ ] |
| У ответственного нет email | Push создаётся, email не уходит, ошибки нет | [ ] |
| Несколько ответов подряд | Каждый — отдельное уведомление | [ ] |

### 3.3 SQL для проверки

Последние отправленные email-уведомления:

```sql
SELECT a."Title", a."Recepient", a."CopyRecepient", a."CreatedOn"
FROM "Activity" a
WHERE a."TypeId" = 'e2831dec-cfc0-df11-b00f-001d60e938c6'
  AND a."MessageTypeId" = '7f6d3f94-f36b-1410-068c-20cf30b39373'
  AND a."Title" LIKE '[Обращение №%] Новый ответ от клиента'
ORDER BY a."CreatedOn" DESC
LIMIT 10;
```

---

## Откат

Если что-то пошло не так:

1. Открыть `UsrSendNotificationToCaseOwnerCustom1` в дизайнере процессов
2. Удалить `SendEmailToOwnerScriptTask` и стрелки к нему
3. Восстановить стрелку: `CreateNotificationScriptTask` → `Terminate1`
4. Сохранить → Опубликовать
5. Схему `UsrNewEmailNotifier` можно оставить — она не вызывается без ScriptTask

---

## Контекст

- **CC-адреса** подставляются автоматически через `UsrActivityCcEventListener` при `activity.Save()` — дополнительного кода не нужно
- **Отправка** через `AsyncEmailSender` (feature-toggle `UseAsyncEmailSender` = 1 на проде)
- **Перезапуск Kestrel не нужен** — нет нового EventListener, только обычный C#-класс + ScriptTask в BPMN
