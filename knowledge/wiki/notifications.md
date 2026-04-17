# Система уведомлений BPMSoft

**Обновлено:** 2026-04-17  
**Источники:** архив CTI 2026-04-11, выгрузки из БД (VwSysProcess.MetaData) 2026-04-17

---

## Карта процессов уведомлений

Восстановлена из MetaData (`VwSysProcess`) 2026-04-17 — достоверные данные из БД прода.

| Процесс | UId | Пакет | Триггер (StartSignal) | Получатель | Примечание |
|---------|-----|-------|----------------------|------------|------------|
| UsrSendEmailToSROwnerCustom1 | `7477f83b` | CTI | Case INSERT/UPDATE, Owner IS NOT NULL | Инженер (Owner) | Email через SendMultiLanguageNotification |
| RunSendEmailToCaseGroupV2 | `3081ee20` | CaseService | Case INSERT/UPDATE, Owner IS NULL AND Group IS NOT NULL | Группа (все участники роли) | Email через EmailWithMacrosManager.SendEmailFromTo |
| RunSendEmailToCaseGroup | `ca99430d` | CaseService | Case INSERT/UPDATE (старый формат фильтра) | Группа | Старая версия, дублирует V2 |
| RunSendNotificationCaseOwnerProcess | `69d87f84` | CaseService | Activity UPDATE: Type=Email, Case NOT NULL, ServiceProcessed=false, не авто-ответ, SendDate NOT NULL | Инженер (Owner) | Входящий email клиента → переоткрывает обращение |
| UsrSendNotificationToCaseOwnerCustom1 | `2769a020` | CTI | (запускается из RunSendNotificationCaseOwnerProcess) | Инженер (Owner) | Только Reminding (push), email НЕ отправляет |
| UsrProcess_0c71a12CTI5 | `cf34d5cc` | CTI | Case UPDATE, Status = f063ebbe (Получен ответ) | Инженер (Owner) + CC роль "1-я линия" | Email с хардкодом: sender=servicedesk@cti.ru, CC=вся роль 1-я линия |

### Полный маршрут при входящем письме клиента

```
Activity (входящий email, ServiceProcessed=false)
  → RunSendNotificationCaseOwnerProcess (StartSignal: Activity UPDATE)
      → ScriptTask1: проверяет IsFeatureEnable (RunReopenCaseAndNotifyAssigneeClass=1 на проде)
      → ScriptTask2: вызывает ReopenCaseAndNotifyAssignee.Run()
          → создаёт Reminding (push-уведомление) — email НЕ отправляется
          → меняет Case.Status = f063ebbe (Получен ответ)
  → Case.Status меняется → срабатывает UsrProcess_0c71a12CTI5
      → EmailTemplateUserTask2: email инженеру + CC роль "1-я линия"
         Шаблон: 18834f34 ("Отправка уведомления ответственному о смене статуса на Получен ответ (RU)")
         Sender: servicedesk@cti.ru (хардкод)
         CC: роль e142ad2e (1-я линия) (хардкод)
```

---

## Детали ключевых процессов CTI

### UsrSendEmailToSROwnerCustom1

**UId:** `7477f83b-2d61-4541-843d-2d6444bbcd42`  
**Триггер:** Case INSERT или UPDATE, Owner IS NOT NULL  
**ScriptTask2 (активный путь при EmailMessageMultiLanguageV2=1):**

```csharp
SenderEmail = SysSettings.GetValue<string>(UserConnection, "SupportServiceEmail", string.Empty);
// если не модифицирующий == Owner → запускает SendMultiLanguageNotification с AssigneeTemplateId
```

### UsrSendNotificationToCaseOwnerCustom1

**UId:** `2769a020-a622-498f-a15d-a9449e30dd16`  
**Тип уведомления:** только Reminding (push), email НЕ отправляется  
**Логика:**
- ExclusiveGateway: если `(IsFinalStatus OR IsResolvedStatus) AND Status != f063ebbe` → ChangeDataUserTask1 (сбрасывает Owner, ставит статус f063ebbe "Переоткрыто")
- иначе → ChangeDataUserTask2 (только ставит статус f063ebbe "Получен ответ")
- CreateNotificationScriptTask: создаёт `Reminding`

### UsrProcess_0c71a12CTI5

**UId:** `cf34d5cc-43e8-4495-841b-c2e2eb90cbb1`  
**Триггер:** Case UPDATE, Status = `f063ebbe` (Получен ответ), watches column Status  
**EmailTemplateUserTask2:**
- Шаблон: `18834f34` ("Отправка уведомления ответственному о смене статуса на Получен ответ (RU)")
- Получатель: `ReadDataUserTask2.ResultEntity.Email` (email инженера)
- CC: `[#Lookup.8153ea60...e142ad2e#]` — хардкод роль "1-я линия"
- Sender: `[#Lookup.5e487721...8cdcb9c4#]` — хардкод ящик servicedesk@cti.ru
- CreateActivity: false, Importance: High

**Содержимое шаблона 18834f34:**
- Кейс #[#Number#] сменил статус: [#Status#]
- Контрагент: [#Account#], Приоритет: [#Priority#]
- Оборудование: [#ConfItem#], Группа ответственных: [#Group#]
- Ссылка на кейс: `https://bpm.cti.ru/Navigation/Navigation.aspx?schemaName=Case&recordId=[#Id#]`
- ⚠️ Поле "Тема обращения" использует макрос `[#Owner.Salutation#]` — явная ошибка в шаблоне

---

---

## CaseNotificationRule — декларативные правила уведомлений

Таблица `CaseNotificationRule` — декларативная привязка статус+категория → шаблон.

**Структура колонок:** Id, Name, CaseStatusId, CaseCategoryId, EmailTemplateId, EmailTemplateForInitiatorId, RuleUsageId, Delay, IsQuoteOriginalEmail

**Ключевые выводы из выгрузки (2026-04-17):**

- Покрывает статусы: Новое, В работе, Решено, Закрыто, Отменено
- **Статус "Получен ответ" (f063ebbe) отсутствует** — обрабатывается только через BPMN `UsrProcess_0c71a12CTI5`
- `EmailTemplateId` — шаблон для инженера; `EmailTemplateForInitiatorId` — шаблон для клиента
- `IsQuoteOriginalEmail=true` для Новое/В работе; `false` для Закрыто/Отменено
- Все записи имеют одинаковый `RuleUsageId = e34695a7-7d65-45d8-b5a0-7b69ae52be6a`

---

## Invokable макросы в email-шаблонах

Механизм добавления динамического контента в шаблоны через C# классы.

**Как работает:**

1. Класс реализует интерфейс `IMacrosInvokable` (пакет CaseService):

```csharp
public interface IMacrosInvokable {
    UserConnection UserConnection { get; set; }
    string GetMacrosValue(object arguments); // arguments = KeyValuePair<string, Guid>(entityName, recordId)
}
```

2. Регистрация в таблице `EmailTemplateMacros`:
   - `ParentId = 16339f82-6ff0-4c75-b20d-13f07a79f854` (запись "@Invoke")
   - `ColumnPath = "BPMSoft.Configuration.ИмяКласса"` (полное имя типа)
   - `Name` — отображаемое имя макроса в UI

3. Воркер `InvokeMethodMacrosWorker` (`[MacrosWorker("{16339F82...}")]`) вызывает класс через `ClassFactory.ForceGet<IMacrosInvokable>(assemblyQualifiedName)`

**Существующие invokable макросы:**

| Name | ColumnPath | Id |
|------|-----------|-----|
| SymptomsGenerator | `BPMSoft.Configuration.SymptomsGenerator` | `77dea058` |
| EstimateLinksGenerator | `BPMSoft.Configuration.EstimateLinksGenerator` | `60445e91` |

**Образец — SymptomsGenerator:** читает `Case.Symptoms` по caseId, возвращает HTML-строку (переносы → `<br />`).

**Для задачи 2.3** нужно создать `UsrLatestCustomerEmailGenerator` по тому же паттерну + SQL-сценарий для регистрации в `EmailTemplateMacros`.

---

## Архитектура email-отправки

### Путь A — Старый BPMN (активен)

```
BPMN → AddDataUserTask (создаёт Activity)
  → ScriptTask → ActivityEmailSender.Send(activityId)
    → читает Activity.CopyRecepient из БД → отправляет
```

CC нужно добавить в `Activity.CopyRecepient` **до** вызова Send.

### Путь B — Мультиязычный (неактивен, feature-toggles выключены)

```
ScriptTask2 → AppScheduler.TriggerJob<SendMultiLanguageNotification>
  → EmailWithMacrosManager.GetCaseData(caseId)
    → читает ParentActivity.CopyRecepient
  → FillActivityWithCaseData(activity, data)  ← виртуальный метод!
    → activity.CopyRecepient = data.CC
```

Если включат `EmailMessageMultiLanguage` — CC из `ParentActivity` будет работать автоматически.

---

## Ключевые C# классы (пакет CaseService)

| Класс | Роль |
|---|---|
| `EmailWithMacrosManager` | Центральный менеджер. Виртуальный `FillActivityWithCaseData` — точка переопределения CC |
| `BaseEmailWithMacrosManager<T>` | Базовый класс |
| `ExtendedEmailWithMacrosManager` | Расширенная версия |
| `AsyncEmailSender` | Асинхронная отправка через `AppScheduler.ScheduleImmediateJob` |
| `SendMultiLanguageNotification` | Job для мультиязычной отправки |
| `ActivityEmailSender` | Платформенная сборка (dll). Читает Activity из БД и отправляет |

---

## Системные настройки, влияющие на уведомления

| Настройка | Код | Значение | Влияние |
|---|---|---|---|
| Email службы поддержки | `SupportServiceEmail` | `servicedesk@cti.ru` | Адрес отправителя |
| Сайт системы | `SiteUrl` | `bpm.cti.ru` | Ссылки в письмах |
| Мультиязычные email v2 | `EmailMessageMultiLanguageV2` | **1 (включён)** ✅ | Путь B (мультиязычный) активен |
| Переоткрытие и уведомление | `RunReopenCaseAndNotifyAssigneeClass` | **1 (включён)** ✅ | C# путь через ReopenCaseAndNotifyAssignee активен, BPMN-путь SendNotificationToCaseOwner обходится |

> ⚠️ **Важно:** `EmailMessageMultiLanguageV2=1` — путь B активен. Это означает `UsrSendEmailToSROwnerCustom1` использует `SendMultiLanguageNotification`, а не старый BPMN AddData+Script. Вики требовала уточнения — данные из БД mordor 2026-04-17.

---

## Реализованное решение CC (на проде с 2026-04-11)

**Компоненты:**
- `Case.UsrCcEmails` — текстовая колонка (varchar 500), CC на уровне обращения
- `ServicePact.UsrCcEmails` — текстовая колонка (varchar 500), CC на уровне договора
- `UsrCcAddressResolver` — читает CC из Case и ServicePact
- `UsrActivityCcEventListener` — `OnSaving` Activity: если исходящий email + связан с Case → дописывает CC

**Формат:** адреса через пробел (как стандартное `Activity.CopyRecepient`).

**Охват:** все процессы отправки (старый + мультиязычный + ручная отправка).
