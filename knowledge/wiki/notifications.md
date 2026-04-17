# Система уведомлений BPMSoft

**Обновлено:** 2026-04-15  
**Источники:** BPMSOFT_CONFIGURATION_ANALYSIS_3.md, bpmn-processes.md, архив CTI 2026-04-11

---

## Карта процессов уведомлений

| Процесс | Пакет | Триггер | Тип уведомления | CC |
|---|---|---|---|---|
| UsrSendEmailToSROwnerCustom1 | CTI | Назначение ответственного / группы | Email | ✅ |
| UsrSendNotificationToCaseOwnerCustom1 | CTI | Новый комментарий | Push (Reminding) | ❌ |
| UsrProcess_send_reg_mail | CTI | Создание обращения | Email | ✅ |
| RunSendEmailToCaseGroupV2 | CaseService | Owner=NULL и Group IS NOT NULL | Email | ✅ |
| SendEmailToCaseContactPersonsProcess | CaseService | — | Email | ✅ |
| SendEmailToCaseStatusChangedProcess | CaseService | Смена статуса | Email | ✅ |
| SendResolution | CaseService | Отправка решения | Email | ✅ |

---

## Детали ключевых процессов CTI

### UsrSendEmailToSROwnerCustom1

**UId:** `7477f83b-2d61-4541-843d-2d6444bbcd42`  
**Родитель:** `77b64dfc-5e59-42e8-baa6-a231f1fdd698` (SendEmailToSROwner)

Два пути внутри процесса:
1. **ScriptTask1 (активный):** `ActivityEmailSender.Send(activityId)` или `AsyncEmailSender.SendAsync(activityId)`
2. **ScriptTask2 (неактивный):** `AppScheduler.TriggerJob<SendMultiLanguageNotification>(...)` — только если `EmailMessageMultiLanguage` включён

Параметры: `EmailTemplateId`, `SenderEmail` (из SysSettings `SupportServiceEmail`), `Subject`, `CaseRecordId`, `IsCloseAndExit`

### UsrSendNotificationToCaseOwnerCustom1

**UId:** `2769a020-a622-498f-a15d-a9449e30dd16`  
**Тип уведомления:** Push (`Reminding`), НЕ email

Создаёт запись `Reminding` (уведомление в интерфейсе BPMSoft) + обновляет `Activity.ServiceProcessed = false`.

### UsrProcess_send_reg_mail

**UId:** `265d4466-a887-461c-906f-79f16ce9f059`  
Использует стандартный элемент `EmailTemplateUserTask`. CC не заложен в стандартном элементе.

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
| Email службы поддержки | `SupportServiceEmail` | ? | Адрес отправителя |
| Только контакту | `AutoNotifyOnlyContact` | **false** ✅ | При false CC не обнуляется |
| Мультиязычные email | `EmailMessageMultiLanguage` | **false** ❌ | Старый BPMN-путь активен |
| Мультиязычные email v2 | `EmailMessageMultiLanguageV2` | **false** ❌ | Старый BPMN-путь активен |

---

## Реализованное решение CC (на проде с 2026-04-11)

**Компоненты:**
- `Case.UsrCcEmails` — текстовая колонка (varchar 500), CC на уровне обращения
- `ServicePact.UsrCcEmails` — текстовая колонка (varchar 500), CC на уровне договора
- `UsrCcAddressResolver` — читает CC из Case и ServicePact
- `UsrActivityCcEventListener` — `OnSaving` Activity: если исходящий email + связан с Case → дописывает CC

**Формат:** адреса через пробел (как стандартное `Activity.CopyRecepient`).

**Охват:** все процессы отправки (старый + мультиязычный + ручная отправка).
