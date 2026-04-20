# Task 2.3 — Текст письма клиента в уведомлении инженеру

**Статус:** Утверждён к реализации (2026-04-20)  
**Пакет:** CTI

---

## Проблема

1. Инженер получает уведомление о новом письме клиента, но без текста — вынужден входить в систему
2. Если обращение в статусе «Новое» или «В работе» — уведомление вообще не уходит (старый процесс срабатывает только при смене статуса на «Получен ответ»)

---

## Принятые решения

| # | Вопрос | Решение |
|---|--------|---------|
| 1 | ServiceProcessed в StartSignal | Оставить фильтр `false` — INSERT Activity происходит до `UpdateActivityProcessed()` в `ReopenCaseAndNotifyAssignee.Run()` |
| 2 | Менеджер отправки | `EmailWithMacrosManager.SendEmailFromTo` — IMacrosInvokable работает через `GetTemplateBody → InvokableMacrosHelper` |
| 3 | Получатель | ESQ явно: `Case.Owner.Email`, передаётся в `SendEmailFromTo` |
| 4 | Шаблон | Клон `18834f34` — оригинал нельзя трогать пока оба процесса активны |
| 5 | Scope правил | Status + Category + EventType (EventType nullable) |
| 6 | Старый процесс | Деактивировать `UsrProcess_0c71a12CTI5` синхронно с активацией нового |
| 7 | Feature toggle | Не нужен — rollback = деактивация BPMN (30 сек) |
| 8 | Текст письма | `activityId` конкретного письма, не «последнего по времени» — исключает race condition |

---

## Архитектура

### Компонент 1: Справочник `UsrEmployeeNotificationEventType` (объект CTI)

Значения:
- `CustomerReply` — Ответ клиента
- `OwnerAssigned` — Назначение ответственного
- `GroupAssigned` — Назначение на группу
- `StatusChanged` — Смена статуса

### Компонент 2: Объект `UsrEmployeeNotificationRule` (CTI)

| Поле | Тип | Обязательное |
|------|-----|-------------|
| CaseStatusId | Case.Status (lookup) | нет |
| CaseCategoryId | Case.Category (lookup) | нет |
| UsrEventType | UsrEmployeeNotificationEventType (lookup) | нет |
| EmailTemplateId | EmailTemplate (lookup) | да |
| UsrRecipientType | UsrEmployeeNotificationRecipientType (lookup) | да |
| RoleId | SysRole (lookup) | нет |
| IsActive | Boolean | да |

RecipientType значения: `Owner` (ответственный), `Group` (группа), `Role` (роль).

### Компонент 3: C# `UsrLatestCustomerEmailGenerator` (Исходный код, CTI)

Реализует `IMacrosInvokable`. Получает `activityId` из аргумента (`KeyValuePair<string, Guid>`),
читает `Activity.Body` по Id, возвращает HTML-строку.

Регистрация в `EmailTemplateMacros`:
- ParentId = `16339f82` (InvokableMacros)
- ColumnPath = `BPMSoft.Configuration.UsrLatestCustomerEmailGenerator`
- Caption = «Письмо клиента»

Макрос в шаблоне: `[#@Invoke.UsrLatestCustomerEmailGenerator#]`

### Компонент 4: C# `UsrSendEmailToCaseOwnerOnReply` (Исходный код, CTI)

```
ActivityId → CaseId → Case (Owner, Status, Category)
→ UsrEmployeeNotificationRule (EventType=CustomerReply + фильтры)
→ для каждого правила → определить получателей → EmailWithMacrosManager.SendEmailFromTo
```

Sender: `SysSettings.GetValue(uc, "SupportServiceEmail")` → `servicedesk@cti.ru`

### Компонент 5: BPMN `UsrSendEmailToCaseOwnerOnReplyProcess` (CTI)

StartSignal — Activity INSERT:
- `TypeId = Email`
- `Direction = Incoming`
- `CaseId IS NOT NULL`
- `ServiceProcessed = false`

ScriptTask:
```csharp
var notifier = new UsrSendEmailToCaseOwnerOnReply(UserConnection);
notifier.ActivityId = Get<Guid>("ActivityId");
notifier.Execute();
```

---

## Шаблон email

Клонировать `18834f34` → `UsrNotifyEngineerOnReply`.

Добавить в тело после существующего содержимого:
```html
<br/><hr/>
<b>Сообщение клиента:</b><br/>
[#@Invoke.UsrLatestCustomerEmailGenerator#]
```

---

## Порядок реализации

1. Создать `UsrEmployeeNotificationEventType` (объект-справочник, CTI)
2. Создать `UsrEmployeeNotificationRecipientType` (объект-справочник, CTI)
3. Создать `UsrEmployeeNotificationRule` (объект, CTI)
4. Создать C# `UsrLatestCustomerEmailGenerator` + регистрация в EmailTemplateMacros (Data)
5. Клонировать шаблон `18834f34` → добавить макрос письма клиента
6. Добавить данные в `UsrEmployeeNotificationRule`:
   - Правило 1: EventType=CustomerReply, RecipientType=Owner, Template=новый, IsActive=true
   - Правило 2: EventType=CustomerReply, RecipientType=Role, RoleId=«1-я линия», Template=новый, IsActive=true
7. Создать C# `UsrSendEmailToCaseOwnerOnReply`
8. Создать BPMN `UsrSendEmailToCaseOwnerOnReplyProcess`
9. Деплой: активировать новый BPMN + деактивировать `UsrProcess_0c71a12CTI5`

---

## Риски

| Риск | Митигация |
|------|-----------|
| Race condition (другое письмо успело прийти) | Используем `activityId` конкретного письма, не «последнего по времени» |
| Owner без email | Guard в `Execute()`: выйти если `ownerEmail.IsNullOrEmpty()` |
| Роль «1-я линия» перестанет получать | Правило 2 добавляем ДО деактивации старого процесса |
| Пустое тело письма | `GetMacrosValue` возвращает `string.Empty` — блок просто не отображается |

---

## Rollback

1. Реактивировать `UsrProcess_0c71a12CTI5`
2. Деактивировать `UsrSendEmailToCaseOwnerOnReplyProcess`
3. Время: ~1 минута, без деплоя

---

## Образцы в системных пакетах

- `SymptomsGenerator.cs` — образец IMacrosInvokable
- `EmailWithMacrosManager.cs` — метод `SendEmailFromTo`
- `SendEmailToCaseStatusChanged.cs` — образец C# класса уведомлений
- `ReopenCaseAndNotifyAssignee.cs` — порядок INSERT/UPDATE для ServiceProcessed
