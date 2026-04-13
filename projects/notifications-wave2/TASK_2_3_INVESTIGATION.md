# Задача 2.3 — Исследование механизма уведомлений

**Дата:** 2026-04-12 (обновлено 2026-04-13)  
**Статус:** Исследование завершено, выбор подхода — в следующей сессии

---

## Проблема

При проектировании задачи 2.3 предполагалось, что инженер **уже получает email** при ответе клиента, и нужно лишь добавить в него текст письма. Анализ кода показал, что **ни один из механизмов платформы не отправляет email инженеру** — все создают только push-уведомление (запись Reminding, отображается в колокольчике внутри BPMSoft).

**Требуется подтверждение:** получает ли инженер реальное письмо в Outlook, или видит только уведомление внутри системы?

---

## Что показал анализ кода

### Полная цепочка при получении email от клиента

```
Входящий email → Activity (Type=Email, CaseId=..., MessageType=Incoming)
  │
  ├─ UsrActivityCcEventListener.OnSaving()
  │    └─ Сохраняет CC из письма в Case.UsrCcEmails
  │
  ├─ [Платформа] Привязывает Activity к Case
  │
  └─ Сигнал → RunSendNotificationCaseOwnerProcess (оркестратор)
       │
       └─ ScriptTask1: проверяет FeatureToggle("RunReopenCaseAndNotifyAssigneeClass")
            │
            ├─ [toggle = 1, НАШ СЛУЧАЙ] → C#-класс ReopenCaseAndNotifyAssignee.Run()
            │     1. CaseBroker.ReopenOnCondition() — меняет статус на «Получен ответ»
            │     2. NotifyOwner() — создаёт Reminding (push) ← ТОЛЬКО ЭТО
            │     3. UpdateActivityProcessed() — Activity.ServiceProcessed = true
            │
            └─ [toggle = 0] → SubProcess → BPMN SendNotificationToCaseOwner
                  (замещён UsrSendNotificationToCaseOwnerCustom1 в CTI)
                  → делает то же самое: статус + Reminding (push)
```

**Feature-toggle на проде:** `RunReopenCaseAndNotifyAssigneeClass = 1` → работает C#-класс.

### Что делает ReopenCaseAndNotifyAssignee (CaseService)

Файл: `CaseService/Schemas/ReopenCaseAndNotifyAssignee/ReopenCaseAndNotifyAssignee.cs`

```csharp
public void Run() {
    Entity caseEntity = LoadCase(CaseId, ColumnAliases);
    // 1. Переоткрытие (смена статуса)
    ReopenedCount = CaseBroker.ReopenOnCondition(new[] { caseEntity }, ReopeningCondition, true);
    // 2. Push-уведомление ← создаёт Reminding, НЕ email
    if (caseEntity.GetTypedColumnValue<Guid>(OwnerIdColumnName) != default(Guid)) {
        NotifyOwner(caseEntity);
    }
    // 3. Пометка Activity как обработанной
    if (ActivityId != default(Guid) && !IsFinalStatus(caseEntity)) {
        UpdateActivityProcessed(ActivityId);
    }
}
```

Метод `NotifyOwner()` (строки 118–158) создаёт `Reminding` с текстом:
```
"Получен новый email по обращению №{Number}"
```
**Email НЕ создаётся и НЕ отправляется.**

### А что с SendEmailToCaseStatusChanged?

При смене статуса на «Получен ответ» также срабатывает `SendEmailToCaseOnStatusChange` (feature-toggle `SendEmailToCaseOnStatusChangeClass = 1`). Но он отправляет email **клиенту** (контактному лицу/инициатору), не инженеру:

```csharp
// SendEmailToCaseStatusChanged.cs, метод SendImmidiateNotification()
var emails = CaseContactPersonHelper.GetContactPersonEmails(caseEntity.PrimaryColumnValue);
// → contactEmail = email клиента
// → initiatorEmail = email инициатора
```

### Что с BPMN-процессом UsrSendNotificationToCaseOwnerCustom1?

**НЕ выполняется на проде.** Оркестратор `RunSendNotificationCaseOwnerProcess` при `RunReopenCaseAndNotifyAssigneeClass = 1` направляет на C#-класс, BPMN-подпроцесс пропускается.

Диаграмма BPMN (на случай если понадобится вернуться к этому пути):

```
Start1 → ReadCaseData → ReadDataUserTask2
  ├─ [Default] → ExclusiveGateway1
  │    ├─ [Cond] → Terminate1 (пропуск)
  │    └─ [Default] → CreateNotificationScriptTask → Terminate1
  │                          (push-уведомление)
  └─ [Cond] → ExclusiveGateway2
       ├─ [Cond] → FormulaTask1 → ChangeDataUserTask1 ─┐
       └─ [Default] → ChangeDataUserTask2 ──────────────┤
                                                        ↓
                                                  ExclusiveGateway3 → SetActivityServiceProcessed
                                                        ↓
                                                  ExclusiveGateway1 (та же)
```

---

## Что нужно проверить (2026-04-13)

### Проверка 1: Приходит ли email в Outlook?

1. Попросить инженера показать: при ответе клиента на обращение — что он видит?
2. Если это письмо в Outlook → найти это письмо, посмотреть From/To/Subject
3. Если это уведомление в колокольчике BPMSoft → значит email нет

### Проверка 2: SQL-запрос

Найти исходящие email, привязанные к обращениям, адресованные инженерам:

```sql
-- Последние исходящие email по обращениям (не клиентам, а сотрудникам)
SELECT 
    a."Title", 
    a."Sender", 
    a."Recepient", 
    a."CopyRecepient",
    a."CreatedOn",
    c."Number" AS "CaseNumber"
FROM "Activity" a
JOIN "Case" c ON c."Id" = a."CaseId"
JOIN "Contact" co ON co."Email" = a."Recepient"
WHERE a."TypeId" = 'e2831dec-cfc0-df11-b00f-001d60e938c6'  -- Email
  AND a."MessageTypeId" = '7f6d3f94-f36b-1410-068c-20cf30b39373'  -- Исходящее
  AND a."CreatedOn" > NOW() - INTERVAL '7 days'
  AND co."Id" IN (SELECT DISTINCT "OwnerId" FROM "Case" WHERE "OwnerId" IS NOT NULL)
ORDER BY a."CreatedOn" DESC
LIMIT 20;
```

### Проверка 3: Reminding

Посмотреть последние push-уведомления в системе:

```sql
SELECT r."SubjectCaption", r."RemindTime", c."Name" AS "ContactName"
FROM "Reminding" r
JOIN "Contact" c ON c."Id" = r."ContactId"
WHERE r."SubjectCaption" LIKE '%email%обращени%'
   OR r."SubjectCaption" LIKE '%Получен%'
ORDER BY r."RemindTime" DESC
LIMIT 20;
```

---

## Влияние на дизайн задачи 2.3

### Если email НЕ приходит (только push) — наиболее вероятно

Задача 2.3 = **создание новой функциональности** (email-уведомление инженеру), а не доработка существующей.

Дизайн по сути верный (C#-класс `UsrNewEmailNotifier` создаёт email с текстом клиента), но **точка вставки другая**:

| Вариант | Суть | Плюсы | Минусы |
|---------|------|-------|--------|
| **A. EventListener на Activity** | `[EntityEventListener(SchemaName = "Activity")]`, OnInserted — при создании входящего email по обращению вызывает `UsrNewEmailNotifier` | Не зависит от feature-toggle, не трогает существующие процессы | Нужен перезапуск Kestrel. Создание Activity внутри EventListener на Activity — риск вложенных событий |
| **B. Замещение ReopenCaseAndNotifyAssignee** | Наследник с переопределением `Run()` — добавить вызов `UsrNewEmailNotifier` после `NotifyOwner()` | Встраивается в существующую цепочку | Нужно зарегистрировать через ClassFactory `[DefaultBinding]`. Связанность с платформенным классом |
| **C. Переключить feature-toggle на BPMN** | `RunReopenCaseAndNotifyAssigneeClass = 0` → BPMN-процесс активируется → модифицируем его | Простая модификация BPMN (как в исходном дизайне) | Рискованно — C#-класс мог быть включён по причине. Нужно проверить что BPMN-процесс корректно работает |
| **D. Отдельный BPMN-процесс** | Новый процесс, слушает тот же сигнал (новый email) | Полная независимость | Избыточная сложность, два процесса на одно событие |

**Рекомендация:** Вариант B (замещение C#-класса) — наименее инвазивный и точно встраивается в рабочую цепочку. Но нужно проверить возможность `[DefaultBinding]` замещения `ReopenCaseAndNotifyAssignee`.

### Если email ПРИХОДИТ (откуда-то)

Нужно найти механизм и уже в него встроить текст клиента. Возможные источники:
- Кастомная CaseNotificationRule с шаблоном для ответственного (проверить в справочнике)
- Какой-то процесс, не входящий в CaseService (проверить другие пакеты)
- Сторонняя интеграция

---

## Дополнительные вопросы из обсуждения (на паузе)

### Вопрос 2: Ответ инженера через почту

Идея: инженер отвечает на уведомительное письмо → ответ через систему уходит клиенту.
Технически возможно (Reply-To, email threading), но **отдельная задача** (предложено как 2.6).
**Связь с трудозатратами:** если инженер отвечает через почту, он обходит форму обращения и не регистрирует трудозатраты → нужен механизм создания задачи. Зафиксировать в проекте трудозатрат.

### Вопрос 3: CC во внутренних уведомлениях

Проблема: `UsrActivityCcEventListener` добавляет CC клиента ко ВСЕМ исходящим email по обращению, включая внутренние уведомления.
Решение Евгения: тег в теме письма (напр. `[INT]`) + доработка EventListener для пропуска таких писем.
**Статус:** на паузе до завтра.

---

## Источники (проанализированный код)

| Файл | Пакет | Что найдено |
|------|-------|-------------|
| `ReopenCaseAndNotifyAssignee.cs` | CaseService | Создаёт только Reminding, не email |
| `SendEmailToCaseStatusChanged.cs` | CaseService | Email клиенту, не инженеру |
| `RunSendNotificationCaseOwnerProcess/metadata.json` | CaseService | Оркестратор: toggle → C#-класс или BPMN |
| `SendNotificationToCaseOwner/metadata.json` | CaseService | Стандартный BPMN = только Reminding |
| `UsrSendNotificationToCaseOwnerCustom1/metadata.json` | CTI (из архива 2026-04-11) | Кастомный BPMN = только Reminding |
| `UsrActivityCcEventListener.cs` | CTI | CC для исходящих, CC-сбор для входящих |
| `CaseMessageListener.cs` | CaseService | Портальные сообщения, не email |

---

## Результаты сессии 2026-04-13: найден пропущенный процесс

### Ошибка предыдущего анализа

В анализе 2026-04-12 был сделан неверный вывод: **"ни один механизм не отправляет email инженеру"**. Это оказалось неправдой — email отправляет процесс `UsrProcess_0c71a12CTI5`, который был пропущен при анализе.

**Причина промаха:** имя процесса автогенерированное, не содержит ключевых слов (Email, Notification). Процесс триггерится не на входящий email напрямую, а на **смену статуса обращения** — косвенная связь через побочный эффект C#-класса.

### Полная реальная цепочка (подтверждено)

```
Входящий email от клиента
  │
  └─ RunSendNotificationCaseOwnerProcess (оркестратор, CaseService)
       │
       └─ toggle RunReopenCaseAndNotifyAssigneeClass = 1 (на проде)
            │
            └─ C#-класс ReopenCaseAndNotifyAssignee.Run()
                 ├─ CaseBroker.ReopenOnCondition(predicate=ReopeningCondition)
                 │    → если (IsResolved || IsPaused) && !IsFinal && !IsReopened
                 │    → StatusId = CaseStatusReopenedId ("Получен ответ")
                 │    → если ClearAssigneeOnCaseReopening=true → OwnerId = null (у нас false)
                 ├─ NotifyOwner() → push-уведомление (Reminding в колокольчик)
                 └─ UpdateActivityProcessed() → Activity.ServiceProcessed = true
                      │
                      └─ [Смена Status → StartSignal на объект Case]
                           │
                           └─ UsrProcess_0c71a12CTI5  ← ВТОРОЙ ПРОЦЕСС (пропущен ранее!)
                                ├─ StartSignal: Case.Status изменён на "Получен ответ"
                                ├─ ReadDataUserTask1 → Case (Number, Owner...)
                                ├─ ReadDataUserTask2 → Contact (email ответственного)
                                └─ EmailTemplateUserTask2 → ОТПРАВЛЯЕТ EMAIL инженеру
                                     ├─ Шаблон: 18834f34-0ebc-4392-a313-c21f40ea0d26
                                     ├─ Кому: email ответственного (из Contact)
                                     ├─ CC: из справочника
                                     └─ Отправитель: из справочника почтовых ящиков
```

### UsrProcess_0c71a12CTI5 — детали

- **Caption:** "Отправка уведомлений ответственному о Смене статуса обращения"
- **UId:** `cf34d5cc-43e8-4495-841b-c2e2eb90cbb1`
- **Parent:** `UsrProcess_0c71a12` (UId: `b042cadb-3678-48ba-b050-fbc7260aa0e2`)
- **Пакет:** CTI (6 версий: base, CTI1-CTI5)
- **Триггер:** StartSignal на изменение Case, фильтр Status = "Получен ответ" (`f063ebbe-fdc6-4982-8431-d8cfa52fedcf`)
- **Отслеживаемая колонка:** `a71adaea-3464-4dee-bb4f-c7a535450ad7` (StatusId)
- **Email-шаблон:** `18834f34-0ebc-4392-a313-c21f40ea0d26`
- **CreateActivity:** false (не создаёт Activity, только отправляет)

### CaseBroker.ReopenOnCondition() — полный код

**Путь:** `PKG_BPMSoft_Full_House_1.9.0.14114/Case/Schemas/CaseBroker/CaseBroker.cs`

```csharp
public virtual int ReopenOnCondition(IEnumerable<Entity> entities, Predicate<Entity> predicate,
        bool needFetch = false) {
    int reopened = 0;
    foreach (Entity entity in entities) {
        if (predicate(entity)) {
            var localEntity = GetEntity(entity, needFetch);
            localEntity.SetColumnValue("StatusId", CaseConsts.CaseStatusReopenedId);
            var clearAssigneeOnCaseReopening = SysSettings
                .GetValue<bool>(userConnection, "ClearAssigneeOnCaseReopening", true);
            if (clearAssigneeOnCaseReopening) {
                localEntity.SetColumnValue("OwnerId", null);
            }
            localEntity.Save(false);
            reopened++;
        }
    }
    return reopened;
}
```

### ReopeningCondition — предикат

**Путь:** `PKG_BPMSoft_Full_House_1.9.0.14114/CaseService/Schemas/ReopenCaseAndNotifyAssignee/ReopenCaseAndNotifyAssignee.cs:219`

```csharp
protected virtual bool ReopeningCondition(Entity caseEntity) {
    return !IsReopenStatus(caseEntity)    // НЕ уже "Получен ответ"
        && !IsFinalStatus(caseEntity)      // НЕ Закрыто/Отменено
        && IsResolvedOrPaused(caseEntity); // Решено/Работы выполнены ИЛИ любой Paused-статус
}
```

Использует `CaseStatusStore` — читает флаги `IsFinal`, `IsResolved`, `IsPaused` из справочника `CaseStatus`.

### Справочник состояний обращений (с прода 2026-04-13)

| Статус | IsFinal | IsResolved | IsPaused | Предикат сработает? |
|--------|---------|------------|----------|---------------------|
| Новое | — | — | — | **Нет** |
| В работе | — | — | — | **Нет** |
| **Ожидает ответа** | — | — | **Да** | **Да → "Получен ответ"** |
| Отложен | — | — | **Да** | Да |
| Передано сервис-менеджеру | — | — | **Да** | Да |
| Направлено в группу специализации | — | — | **Да** | Да |
| Находится в работе у вендора | — | — | **Да** | Да |
| Передано в отдел логистики | — | — | **Да** | Да |
| Ожидаем поставщика | — | — | **Да** | Да |
| Ожидается применение релиза | — | — | **Да** | Да |
| Ожидает повторение проблемы | — | — | **Да** | Да |
| Идет доработка | — | — | **Да** | Да |
| Идет тестирование | — | — | **Да** | Да |
| Передано в отдел разработки | — | — | **Да** | Да |
| Передано в SD | — | — | **Да** | Да |
| Приостановлен | — | — | **Да** | Да |
| **Решено** | — | **Да** | — | **Да → "Получен ответ"** |
| Работы выполнены | — | **Да** | — | Да |
| Получен ответ | — | — | — | **Нет** (IsReopened) |
| Получен ответ (удален) | — | — | — | **Нет** |
| Закрыто | **Да** | — | — | **Нет** (IsFinal) |
| Отменено | **Да** | — | — | **Нет** (IsFinal) |

**Итого:** предикат сработает для **16 из 22** статусов (все Paused + Resolved).

### Сравнение C#-пути (toggle=1) и BPMN-пути (toggle=0)

| Аспект | C#-класс (toggle=1, сейчас) | BPMN (toggle=0) |
|--------|----------------------------|-----------------|
| Предикат | `!IsReopened && !IsFinal && (IsResolved \|\| IsPaused)` — 16 статусов | ExclusiveGateway — нужно проверить условия |
| Смена статуса | `CaseBroker.ReopenOnCondition()` → Entity.Save | ChangeDataUserTask → прямое обновление |
| Очистка Owner | Через `ClearAssigneeOnCaseReopening` (default=true, у нас=false) | ExclusiveGateway2 проверяет ту же настройку |
| Push | `NotifyOwner()` → Reminding | `CreateNotificationScriptTask` → Reminding |
| ServiceProcessed | Ставит **true** | Ставит **false** |
| Email инженеру | НЕТ (делает отдельный UsrProcess_0c71a12CTI5) | НЕТ (тоже триггерит UsrProcess_0c71a12CTI5) |

### Влияние на задачу 2.3 — обновлённый вывод

**Email инженеру уже отправляется** через `UsrProcess_0c71a12CTI5`. Задача 2.3 — **не создание новой функциональности**, а **добавление текста клиентского письма в существующий email**.

Три варианта подхода (выбор — в следующей сессии):

| # | Подход | Суть | Плюсы | Минусы |
|---|--------|------|-------|--------|
| 1 | **Модифицировать шаблон/процесс UsrProcess_0c71a12CTI5** | Добавить текст письма в существующий email | Минимум изменений, toggle не трогаем | Два процесса на одно событие (косвенная связь) |
| 2 | **Toggle=0, консолидация в BPMN** | Переключить на BPMN, объединить push+email в одном процессе, удалить UsrProcess_0c71a12CTI5 | Одна точка управления, чистая архитектура | Нужно проверить условия гейтвеев BPMN, тестирование |
| 3 | **Toggle=1, замещение C#-класса** | Наследник ReopenCaseAndNotifyAssignee с добавлением email | Встраивается в рабочую цепочку | Сложнее, зависимость от платформенного класса |

### Открытый вопрос: ServiceProcessed = true vs false

C#-класс ставит `Activity.ServiceProcessed = true`, BPMN ставит `false`. Это может быть **намеренная разница** в кастомизации CTI. При выборе подхода нужно учесть — если переключим на BPMN, поведение ServiceProcessed изменится.
