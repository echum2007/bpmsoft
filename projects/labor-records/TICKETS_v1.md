# Подсистема трудозатрат — Тикет-план MVP

**Дата:** 2026-04-25
**Источники:** [ARCHITECTURE_v1.md](ARCHITECTURE_v1.md), [DECISIONS_v1.md](DECISIONS_v1.md)
**Пакет:** CTI
**Версия пакета СТА:** 1.6.0.190 (на момент архива 2026-04-23)

---

## Карта тикетов

| # | Тикет | Этап | Зависит от | Артефакт | Время оценочно |
|---|-------|------|-----------|----------|----------------|
| T-01 | Аудит и заполнение `UsrResponsibleServiceManager` на ServicePact | 0 | — | Данные | 1ч |
| T-02 | ServicePact: добавить `UsrOvertimeAllowed` + `UsrResponsibleServiceManager` | 1 | T-01 | Object (CTI replace) | 1ч |
| T-03 | UsrLaborRecords: новые колонки + `UsrLaborRecordsStage` | 1 | — | Object | 1.5ч |
| T-04 | SysSettings: 3 настройки | 1 | — | SysSettings | 0.5ч |
| T-05 | 4 функциональные роли | 1 | — | FuncRole | 1ч |
| T-06 | Объектные права на `UsrLaborRecords` | 1 | T-03, T-05 | Rights | 1ч |
| T-07 | EventListener `UsrLaborRecordsEventListener` | 2 | T-02, T-03, T-04 | SourceCode (C#) | 3ч |
| T-08 | Включить «Доступно визирование в разделе» → `UsrLaborRecordsVisa` | 3 | T-03 | Object (auto) | 0.5ч |
| T-09 | Права на `UsrLaborRecordsVisa` | 3 | T-08, T-05 | Rights | 1ч |
| T-10 | `UsrLaborRecordsModalPage` (AMD-модуль popup) + CSS | 4 | T-03, T-04 | ClientUnitSchema | 4ч |
| T-11 | Замещение `SocialMessagePublisherPage` в CTI | 4 | T-10 | ClientUnitSchema | 3ч |
| T-12 | Бизнес-правила на `UsrLaborRecords.Page` | 4 | T-03 | BusinessRule | 1ч |
| T-13 | DCM-кейс `UsrLaborRecordsCase` (стадии + визы) | 5 | T-08, T-09 | Case | 4ч |
| T-14 | 3 EmailTemplate + BPMN `UsrLaborRecordsNotifications` | 5 | T-13 | Process + Email | 3ч |
| T-15 | Раздел «Управление трудозатратами» через мастер разделов | 6 | T-03, T-13 | Section | 2ч |
| T-16 | Правило цветового выделения `UsrIsFormallyWorkTime` | 6 | T-15 | ColoringRule | 0.5ч |
| T-17 | Настройка рабочих мест (роли → раздел) | 6 | T-15 | Workplace | 0.5ч |
| T-18 | E2E-тестирование на dev по сценарию из ARCHITECTURE раздел 7 | 7 | T-01..T-17 | Test | 4ч |
| T-19 | Перенос пакета CTI на прод + миграция СМ | 8 | T-18 | Deploy | 2ч |

**Итого: ~34 часа MVP без буфера. С буфером 30% → ~44 часа = ~1 рабочая неделя.**

Фактическая команда — Евгений + Claude. Буфер нужен на R1 (валидация замещения `SocialMessagePublisherPage` в CTI), на отладку DCM-переходов, на возможное переоткрытие визирования.

---

## T-01 — Миграция: заполнить `UsrResponsibleServiceManager` на ServicePact

**Этап:** 0 (Подготовка)
**Зависит от:** —
**Решение в DECISIONS:** Q1 (3 уровня защиты)

### Что делаем

Перед добавлением обязательного поля на ServicePact — нужно заполнить его на всех актуальных договорах, иначе при первом редактировании договора пользователи получат ошибку «обязательное поле не заполнено» на пустом месте.

### Шаги

1. **Извлечь список договоров без СМ** (SQL на dev/прод):

   ```sql
   SELECT sp."Id", sp."Name", sp."Status_Id"
   FROM "ServicePact" sp
   WHERE sp."UsrResponsibleServiceManager_Id" IS NULL
     AND sp."Status_Id" IN (
       SELECT "Id" FROM "ServicePactStatus" WHERE "Name" IN ('Активный', 'Согласован')
     );
   ```

   *Колонка `UsrResponsibleServiceManager_Id` появится только после T-02; до T-02 этот SQL вернёт ошибку. Альтернатива до T-02: получить список **всех** активных договоров и согласовать с заказчиком.*

2. **Согласовать с руководителями сервиса** список и проставить ответственных СМ — централизованно (Excel → ручной ввод в системе) или массовым UPDATE.

3. **Чеклист готовности:**
   - [ ] Все активные ServicePact имеют `UsrResponsibleServiceManager` ≠ NULL.
   - [ ] Согласовано с руководителями сервиса.
   - [ ] Список архивных/закрытых договоров — оставить пустыми (на них списания не создаются).

### Verify

```sql
SELECT COUNT(*) FROM "ServicePact"
WHERE "UsrResponsibleServiceManager_Id" IS NULL
  AND "Status_Id" IN (SELECT "Id" FROM "ServicePactStatus" WHERE "Name" IN ('Активный', 'Согласован'));
-- Ожидается: 0
```

---

## T-02 — ServicePact: добавить поля

**Этап:** 1 (Данные)
**Зависит от:** T-01 (миграция должна быть готова)
**Артефакт:** Object (CTI replace)

### Что делаем

В замещении `ServicePact` (CTI, UId `46e84fce-9ad8-4b09-8407-281cbb4cb824`) добавить две колонки.

### Шаги

Конфигурация → пакет CTI → найти схему `ServicePact` → открыть.

**Колонка 1: `UsrOvertimeAllowed`**

| Поле | Значение |
|------|----------|
| Код | UsrOvertimeAllowed |
| Заголовок | Разрешены сверхурочные |
| Тип | Логическое |
| Значение по умолчанию | Нет (`false`) |
| Обязательное | Нет |

**Колонка 2: `UsrResponsibleServiceManager`**

| Поле | Значение |
|------|----------|
| Код | UsrResponsibleServiceManager |
| Заголовок | Ответственный сервис-менеджер |
| Тип | Связь с `Contact` |
| Обязательное | **Да** (Q1, уровень 1 защиты) |
| Каскадное удаление | Нет |

Сохранить и опубликовать схему.

**На странице `ServicePactPage`** (CTI, UId `f7a41e49-b2a3-4f00-a31d-da14efe43756`):
- Добавить оба поля в diff (например, в группу «Основная информация»).
- Для `UsrResponsibleServiceManager` — установить `isRequired: true` в `attributes`.

Сохранить и опубликовать страницу.

### Verify

- В БД: `\d "ServicePact"` (psql) — обе колонки присутствуют.
- В UI: открыть любой договор → видны оба поля; при попытке сохранить с пустым `UsrResponsibleServiceManager` — ошибка «обязательное поле не заполнено».

### Откат

В мастере объектов удалить обе колонки → опубликовать. Если данные уже введены — сначала очистить таблицу `ServicePact` от значений.

---

## T-03 — UsrLaborRecords: новые колонки

**Этап:** 1
**Зависит от:** —
**Артефакт:** Object
**Решение в DECISIONS:** Q8 (DateTime для работы IsTimeInWorkingInterval)

### Что делаем

В существующем объекте `UsrLaborRecords` (CTI, UId `d4459d30-e952-43c9-81a2-5c9441fefd16`) добавить 4 новые колонки и сделать `UsrOverTime` редактируемым.

### Шаги

Конфигурация → пакет CTI → объект `UsrLaborRecords` → открыть.

**Колонка 1: `UsrWorkDate`**

| Поле | Значение |
|------|----------|
| Код | UsrWorkDate |
| Заголовок | Дата и время работ |
| Тип | Дата/время |
| Обязательное | Да |
| Значение по умолчанию | Текущая дата/время (через бизнес-правило на странице) |

**Колонка 2: `UsrSourceMessage`**

| Поле | Значение |
|------|----------|
| Код | UsrSourceMessage |
| Заголовок | Сообщение источника |
| Тип | Связь с `Activity` |
| Обязательное | Нет (nullable) |
| Каскадное удаление | Нет |

**Колонка 3: `UsrIsFormallyWorkTime`**

| Поле | Значение |
|------|----------|
| Код | UsrIsFormallyWorkTime |
| Заголовок | Формально рабочее время |
| Тип | Логическое |
| Значение по умолчанию | Нет (`false`) |
| Обязательное | Нет |
| Read-only на UI | Да (computed в EventListener) |

**Колонка 4: `UsrLaborRecordsStage` (lookup стадий DCM)**

Сначала создать справочник:

Конфигурация → пакет CTI → Добавить → **«Объект»**:

| Поле | Значение |
|------|----------|
| Заголовок | Стадии трудозатрат |
| Код | UsrLaborRecordsStage |
| Родительский объект | BaseLookup |
| Пакет | CTI |

Сохранить и опубликовать.

Затем зарегистрировать в Дизайнере системы → «Справочники» → «Добавить справочник»:
- Название: `Стадии трудозатрат`
- Объект: `UsrLaborRecordsStage`

Данные через раздел «Справочники»:

| Название |
|----------|
| Черновик |
| На верификации |
| На утверждении |
| На доработке |
| Утверждено |
| Отклонено |

Привязать данные к пакету CTI: Конфигурация → CTI → Добавить → «Данные»:
- Объект: `UsrLaborRecordsStage`
- Тип установки: Установка
- Колонки: Id, Name, Description
- Привязанные данные: все 6 записей

После создания справочника — добавить колонку `UsrLaborRecordsStage` (Lookup → UsrLaborRecordsStage) в объект `UsrLaborRecords`.

**Изменить существующую колонку `UsrOverTime`:**
- Снять признак «Read-only на странице» (если стоит). Поле должно быть редактируемым в popup и через деталь.

Сохранить и опубликовать объект.

**Виртуальная колонка `UsrTotalMinutes`** — добавляется на стороне реестра в T-15, не в объекте.

### Verify

- В БД: `\d "UsrLaborRecords"` — все 4 новых колонки присутствуют.
- В UI: открыть страницу записи трудозатрат → видны все 4 поля.
- Тестовая запись с заполненным `UsrWorkDate = сейчас` сохраняется без ошибок (EventListener в T-07 ещё не подключён).

### Откат

В обратном порядке: удалить колонку → удалить справочник → опубликовать.

---

## T-04 — SysSettings: 3 настройки

**Этап:** 1
**Зависит от:** —
**Артефакт:** SysSettings

### Шаги

Дизайнер системы → «Системные настройки» → «Добавить».

**Настройка 1: `UsrLaborRecordsMaxBackdateDays`**

| Поле | Значение |
|------|----------|
| Код | UsrLaborRecordsMaxBackdateDays |
| Название | Макс. дней назад для списания трудозатрат |
| Тип | Целое число |
| Значение по умолчанию | 3 |
| Описание | Сколько календарных дней назад максимум можно списывать (Q10) |

**Настройка 2: `UsrLaborRecordsCalendarId`**

| Поле | Значение |
|------|----------|
| Код | UsrLaborRecordsCalendarId |
| Название | Календарь по умолчанию для трудозатрат |
| Тип | Справочник → Calendar |
| Значение по умолчанию | то же, что в системной настройке `BaseCalendar` |

**Настройка 3: `UsrLaborRecordsRequireVisaComment`**

Проверить — может, уже есть стандартная `RequireVisaComment` (используется механизмом виз). Если есть — нашу не создавать.

### Привязать к пакету CTI

Конфигурация → CTI → Добавить → «Данные»:
- Объект: `SysSettings` + `SysSettingsValue`
- Записи: 3 наших настройки

### Verify

`SELECT "Code", "DefValue" FROM "SysSettings" WHERE "Code" LIKE 'UsrLaborRecords%';` — 2-3 строки.

---

## T-05 — Функциональные роли (4 шт)

**Этап:** 1
**Зависит от:** —
**Артефакт:** FuncRole

### Шаги

Дизайнер системы → «Управление пользователями» → «Функциональные роли» → «Добавить».

| Роль | Кто входит (организационные роли) | Назначение |
|------|------------------------------------|------------|
| `CTI.Ответственные сервис-менеджеры` | СМ договоров (см. с заказчиком) | Верификация переработок по своим договорам |
| `CTI.Руководители сервис-менеджеров` | Руководители СМ | Верификация переработок по любым договорам |
| `CTI.Руководители согласования трудозатрат` | Руководители (по списку с заказчиком) | Утверждение переработок (Этап 2 DCM) |
| `CTI.Аналитики трудозатрат` | Аналитики (см. с заказчиком, Q2) | Чтение всех + экспорт; **без права утверждать** |

### Привязать роли и пользователей

Состав ролей — согласовать с заказчиком списком. До получения списка — создать пустые роли, наполнить позже.

### Verify

В разделе «Функциональные роли» — все 4 видны. Проверить, что у `CTI.Аналитики трудозатрат` нет права «Визирование».

---

## T-06 — Объектные права на `UsrLaborRecords`

**Этап:** 1
**Зависит от:** T-03, T-05
**Артефакт:** Rights

### Что делаем

Настроить операционные и записные права для 4 ролей + Инженеры + Администратор.

### Шаги

В замещении `UsrLaborRecords` → «Доступ» (Rights).

**Операционные права (на чтение/запись/удаление):**

| Роль | Read | Append | Edit | Delete |
|------|------|--------|------|--------|
| Все сотрудники | ❌ | ❌ | ❌ | ❌ |
| `CTI.Инженеры` | ✅ (свои через Owner) | ✅ | ✅ (свои) | ❌ |
| `CTI.Ответственные сервис-менеджеры` | ✅ (через `UsrServicePact.UsrResponsibleServiceManager`) | ❌ | ❌ | ❌ |
| `CTI.Руководители сервис-менеджеров` | ✅ все | ❌ | ❌ | ❌ |
| `CTI.Руководители согласования трудозатрат` | ✅ все | ❌ | ❌ | ❌ |
| `CTI.Аналитики трудозатрат` | ✅ все | ❌ | ❌ | ❌ |
| Системный администратор | ✅ | ✅ | ✅ | ✅ |

**Записные права (record-level)** — для MVP: оставить операционных прав. Запись «инженер видит только свои» делается через **Owner = CreatedBy** (стандартное поведение). Запись «СМ видит только свои договоры» — через record-level правила, **в MVP можно отложить** (см. ARCHITECTURE раздел 2.2 п.9). Подтвердить с заказчиком.

### Verify

Зайти под пользователем-инженером → раздел «Управление трудозатратами» → видны только свои записи. Зайти под аналитиком → видны все, кнопок «Утвердить» нет.

---

## T-07 — EventListener `UsrLaborRecordsEventListener`

**Этап:** 2 (Серверная логика)
**Зависит от:** T-02, T-03, T-04
**Артефакт:** SourceCode (C#)
**Требует:** **рестарт Kestrel** после публикации

### Что делаем

C#-обработчик события `OnSaving` на `UsrLaborRecords`. Две задачи:
1. Защита от договоров без `UsrResponsibleServiceManager` (Q1, уровень 2).
2. Расчёт `UsrIsFormallyWorkTime` через `TermCalculatorActions.IsTimeInWorkingInterval` (R3 снят 2026-04-25).

### Создание схемы

Конфигурация → CTI → Добавить → «Исходный код»:

| Поле | Значение |
|------|----------|
| Заголовок | UsrLaborRecordsEventListener |
| Код | UsrLaborRecordsEventListener |
| Пакет | CTI |

### Код

```csharp
namespace BPMSoft.Configuration
{
    using System;
    using BPMSoft.Common;
    using BPMSoft.Core;
    using BPMSoft.Core.Configuration;
    using BPMSoft.Core.Entities;
    using BPMSoft.Core.Entities.Events;

    [EntityEventListener(SchemaName = "UsrLaborRecords")]
    public class UsrLaborRecordsEventListener : BaseEntityEventListener
    {
        public override void OnSaving(object sender, EntityBeforeEventArgs e) {
            base.OnSaving(sender, e);
            var entity = (Entity)sender;
            var userConnection = entity.UserConnection;

            // ===== Шаг 1: Защита от договоров без СМ (Q1, уровень 2) =====
            var servicePactId = entity.GetTypedColumnValue<Guid>("UsrServicePactId");
            if (servicePactId == Guid.Empty) {
                throw new Exception("Невозможно списать время: договор обращения не определён.");
            }

            var responsibleSmId = GetResponsibleSmId(userConnection, servicePactId);
            if (responsibleSmId == Guid.Empty) {
                throw new Exception(
                    "Невозможно списать время: у договора не назначен ответственный сервис-менеджер. " +
                    "Обратитесь к руководителю сервиса.");
            }

            // ===== Шаг 2: Расчёт UsrIsFormallyWorkTime =====
            var isOverTime = entity.GetTypedColumnValue<bool>("UsrOverTime");
            if (!isOverTime) {
                entity.SetColumnValue("UsrIsFormallyWorkTime", false);
                return;
            }

            var workDate = entity.GetTypedColumnValue<DateTime>("UsrWorkDate");
            var calendarId = ResolveCalendarId(userConnection, servicePactId);
            if (calendarId == Guid.Empty) {
                // Нет календаря — не можем определить, оставляем false (не подсвечиваем)
                entity.SetColumnValue("UsrIsFormallyWorkTime", false);
                return;
            }

            var actions = new TermCalculatorActions(userConnection, calendarId);
            var isWorkTime = actions.IsTimeInWorkingInterval(workDate);
            entity.SetColumnValue("UsrIsFormallyWorkTime", isWorkTime);
        }

        /// <summary>
        /// Каскад: ServiceInServicePact.CalendarId → ServicePact.CalendarId → SysSettings UsrLaborRecordsCalendarId.
        /// Аналог TermCalculatorITILService.GetCalendarId().
        /// </summary>
        private Guid ResolveCalendarId(UserConnection uc, Guid servicePactId) {
            // Попытка 1: ServicePact.Calendar (если в CTI ServicePact колонка Calendar существует)
            var esq = new EntitySchemaQuery(uc.EntitySchemaManager, "ServicePact");
            var calCol = esq.AddColumn("CalendarId").Name;
            esq.Filters.Add(esq.CreateFilterWithParameters(FilterComparisonType.Equal, "Id", servicePactId));
            var entity = esq.GetEntityCollection(uc).FirstOrDefault();
            if (entity != null) {
                var calId = entity.GetTypedColumnValue<Guid>(calCol);
                if (calId != Guid.Empty) {
                    return calId;
                }
            }

            // Попытка 2: SysSettings UsrLaborRecordsCalendarId
            var settingValue = (Guid)Core.Configuration.SysSettings.GetValue(uc, "UsrLaborRecordsCalendarId", Guid.Empty);
            if (settingValue != Guid.Empty) {
                return settingValue;
            }

            // Попытка 3: BaseCalendar (системная)
            return (Guid)Core.Configuration.SysSettings.GetValue(uc, "BaseCalendar", Guid.Empty);
        }

        private Guid GetResponsibleSmId(UserConnection uc, Guid servicePactId) {
            var esq = new EntitySchemaQuery(uc.EntitySchemaManager, "ServicePact");
            var smCol = esq.AddColumn("UsrResponsibleServiceManagerId").Name;
            esq.Filters.Add(esq.CreateFilterWithParameters(FilterComparisonType.Equal, "Id", servicePactId));
            var entity = esq.GetEntityCollection(uc).FirstOrDefault();
            return entity != null ? entity.GetTypedColumnValue<Guid>(smCol) : Guid.Empty;
        }
    }
}
```

**Замечания к коду:**
- `using System.Linq;` нужно добавить в начало (для `FirstOrDefault`).
- `TermCalculatorActions` — публичный класс из пакета `SLM`. Если при компиляции «type not found» — добавить ссылку через `Dependencies` пакета CTI на `SLM` (обычно уже есть, проверить).
- При добавлении в `using` — `BPMSoft.Configuration` (там лежит `TermCalculatorActions`).
- Использование `entity.GetTypedColumnValue<Guid>("UsrServicePactId")` (с суффиксом `Id`) — стандартное обращение к FK-колонке.

### Шаги внедрения

1. Создать схему «Исходный код» с кодом выше.
2. Сохранить, скомпилировать (Конфигурация → «Компилировать»).
3. Если ошибки компиляции — исправить.
4. **Опубликовать схему.**
5. **Рестарт Kestrel:** `sudo systemctl restart bpmsoft-full-house.service` на dev/прод.
6. Дождаться поднятия сервиса (~30 сек).

### Verify

1. Создать тестовую запись `UsrLaborRecords` через popup или деталь:
   - Договор без СМ → ожидается ошибка с понятным текстом.
   - Договор с СМ, `UsrOverTime = false` → сохраняется, `UsrIsFormallyWorkTime = false`.
   - Договор с СМ, `UsrOverTime = true`, `UsrWorkDate = суббота 11:00` → `UsrIsFormallyWorkTime = false` (выходной → НЕ формально рабочее).
   - Договор с СМ, `UsrOverTime = true`, `UsrWorkDate = понедельник 14:00` → `UsrIsFormallyWorkTime = true` (попадает в WorkingTimeInterval).

### Откат

1. Снять с публикации схему `UsrLaborRecordsEventListener`.
2. Рестарт Kestrel.

---

## T-08 — Включить «Доступно визирование в разделе»

**Этап:** 3 (Визирование)
**Зависит от:** T-03 (объект готов)
**Артефакт:** auto-create `UsrLaborRecordsVisa`
**⚠️ НЕОБРАТИМО** (R5 в ARCHITECTURE)

### Что делаем

Активировать встроенный механизм визирования в разделе `UsrLaborRecords`. После этого автоматически:
- Создастся объект `UsrLaborRecordsVisa`.
- На странице записи появится вкладка «Визы».
- Активируются стандартные кнопки утверждения в Центре уведомлений и на панели действий (Q6 — без кастома).

### Шаги

1. Открыть раздел `UsrLaborRecords` (после T-15 он будет в меню; до T-15 — через дизайнер разделов).
2. «Вид» → «Открыть мастер раздела».
3. Установить признак **«Доступно визирование в разделе»**.
4. Сохранить.
5. **Подтвердить** в системном предупреждении: операция необратима.
6. Обновить страницу браузера.

### Verify

- Появилась вкладка «Визы» на странице записи трудозатрат.
- В Конфигурации → CTI появился объект `UsrLaborRecordsVisa`.
- В таблице БД: `\d "UsrLaborRecordsVisa"` — таблица существует.

### Откат

**Откат невозможен.** Если нужно убрать функциональность визирования — удалить вкладку «Визы» с страницы (но объект останется в БД). Подтверждено документацией.

---

## T-09 — Права на `UsrLaborRecordsVisa`

**Этап:** 3
**Зависит от:** T-08, T-05
**Артефакт:** Rights
**Связь с DECISIONS:** Q9 (Comment-поле автоматически создаётся в `UsrLaborRecordsVisa`)

### Шаги

В объекте `UsrLaborRecordsVisa` → «Доступ».

| Роль | Read | Edit | Delete |
|------|------|------|--------|
| `CTI.Инженеры` | ✅ (по своим записям) | ❌ | ❌ |
| `CTI.Ответственные сервис-менеджеры` | ✅ | ✅ (только когда визирующий) | ❌ |
| `CTI.Руководители сервис-менеджеров` | ✅ | ✅ | ❌ |
| `CTI.Руководители согласования трудозатрат` | ✅ | ✅ (только когда визирующий) | ❌ |
| `CTI.Аналитики трудозатрат` | ✅ | ❌ | ❌ |
| Системный администратор | ✅ | ✅ | ✅ |

### Verify

Под визирующей ролью — кнопки Утвердить/Отклонить в центре уведомлений работают. Под инженером — только просмотр.

---

## T-10 — `UsrLaborRecordsModalPage` (popup) + CSS

**Этап:** 4 (Клиент)
**Зависит от:** T-04
**Артефакт:** ClientUnitSchema (AMD)

### Что делаем

AMD-модуль формы списания, который открывается в `ModalBox.show()`. Содержит поля: Дата/время, Часы, Минуты, Переработка, Комментарий. Кнопки: Подтвердить, Отмена.

### Создание

Конфигурация → CTI → Добавить → **«Модуль»** (ClientUnitSchema):

| Поле | Значение |
|------|----------|
| Заголовок | UsrLaborRecordsModalPage |
| Код | UsrLaborRecordsModalPage |
| Пакет | CTI |

### Код модуля

```javascript
define("UsrLaborRecordsModalPage", [
    "ModalBox",
    "ConfigurationConstants",
    "css!UsrLaborRecordsModalPageCss"
], function(ModalBox) {
    return {
        attributes: {
            "WorkDate": { dataValueType: BPMSoft.DataValueType.DATE_TIME, value: null },
            "Hours": { dataValueType: BPMSoft.DataValueType.INTEGER, value: 0 },
            "Minutes": { dataValueType: BPMSoft.DataValueType.INTEGER, value: 30 },
            "OverTime": { dataValueType: BPMSoft.DataValueType.BOOLEAN, value: false },
            "Comment": { dataValueType: BPMSoft.DataValueType.TEXT, value: "" },
            "MaxBackdateDays": { dataValueType: BPMSoft.DataValueType.INTEGER, value: 3 }
        },
        methods: {
            init: function(callback, scope) {
                this.callParent(arguments);
                this.set("WorkDate", new Date());
                // Прочитать SysSettings UsrLaborRecordsMaxBackdateDays
                BPMSoft.SysSettings.querySysSettingsItem("UsrLaborRecordsMaxBackdateDays",
                    function(value) { this.set("MaxBackdateDays", value || 3); }, this);
            },
            onConfirmClick: function() {
                if (!this.validateForm()) { return; }
                var data = {
                    workDate: this.get("WorkDate"),
                    hours: this.get("Hours"),
                    minutes: this.get("Minutes"),
                    overTime: this.get("OverTime"),
                    comment: this.get("Comment")
                };
                this.sandbox.publish("LaborRecordsConfirmed", data, [this.sandbox.id]);
                ModalBox.close();
            },
            onCancelClick: function() {
                this.sandbox.publish("LaborRecordsCancelled", null, [this.sandbox.id]);
                ModalBox.close();
            },
            validateForm: function() {
                var totalMinutes = (this.get("Hours") || 0) * 60 + (this.get("Minutes") || 0);
                if (totalMinutes < 1) {
                    this.showInformationDialog("Длительность должна быть не менее 1 минуты.");
                    return false;
                }
                var workDate = this.get("WorkDate");
                if (!workDate) {
                    this.showInformationDialog("Заполните дату и время работ.");
                    return false;
                }
                var now = new Date();
                var maxDays = this.get("MaxBackdateDays") || 3;
                var minDate = new Date(now.getTime() - maxDays * 24 * 60 * 60 * 1000);
                if (workDate < minDate) {
                    this.showInformationDialog("Списать можно не ранее чем за " + maxDays + " дней назад.");
                    return false;
                }
                if (workDate > now) {
                    this.showInformationDialog("Дата работ не может быть в будущем.");
                    return false;
                }
                return true;
            }
        },
        diff: [
            // Контейнер заголовка
            { operation: "insert", name: "HeaderContainer", parentName: "modalBox", propertyName: "items",
              values: { itemType: 0 /* Container */, caption: { bindTo: "Resources.Strings.HeaderCaption" } } },
            // Поля формы
            { operation: "insert", name: "WorkDateField", parentName: "modalBox", propertyName: "items",
              values: { bindTo: "WorkDate", caption: { bindTo: "Resources.Strings.WorkDateCaption" } } },
            { operation: "insert", name: "HoursField", parentName: "modalBox", propertyName: "items",
              values: { bindTo: "Hours", caption: { bindTo: "Resources.Strings.HoursCaption" } } },
            { operation: "insert", name: "MinutesField", parentName: "modalBox", propertyName: "items",
              values: { bindTo: "Minutes", caption: { bindTo: "Resources.Strings.MinutesCaption" } } },
            { operation: "insert", name: "OverTimeField", parentName: "modalBox", propertyName: "items",
              values: { bindTo: "OverTime", caption: { bindTo: "Resources.Strings.OverTimeCaption" } } },
            { operation: "insert", name: "CommentField", parentName: "modalBox", propertyName: "items",
              values: { bindTo: "Comment", caption: { bindTo: "Resources.Strings.CommentCaption" }, contentType: 1 /* Multiline */ } },
            // Кнопки
            { operation: "insert", name: "ConfirmButton", parentName: "modalBox", propertyName: "items",
              values: { itemType: 5 /* Button */, caption: { bindTo: "Resources.Strings.ConfirmCaption" },
                        click: { bindTo: "onConfirmClick" }, style: "green" } },
            { operation: "insert", name: "CancelButton", parentName: "modalBox", propertyName: "items",
              values: { itemType: 5, caption: { bindTo: "Resources.Strings.CancelCaption" },
                        click: { bindTo: "onCancelClick" } } }
        ]
    };
});
```

### Локализуемые строки

В мастере локализуемых строк добавить:
- `HeaderCaption` = «Списание трудозатрат»
- `WorkDateCaption` = «Дата и время работ»
- `HoursCaption` = «Часы»
- `MinutesCaption` = «Минуты»
- `OverTimeCaption` = «Переработка»
- `CommentCaption` = «Комментарий»
- `ConfirmCaption` = «Подтвердить»
- `CancelCaption` = «Отмена»

### CSS-схема `UsrLaborRecordsModalPageCss`

Конфигурация → CTI → Добавить → «Модуль» → выбрать тип CSS/Less. Минимум:

```less
.usr-labor-records-modal {
    padding: 16px;
    .field { margin-bottom: 12px; }
    .buttons { text-align: right; }
}
```

### Verify

После публикации (рестарт Kestrel НЕ нужен, это клиентская схема):
- В DevTools браузера выполнить:
  ```javascript
  require(["UsrLaborRecordsModalPage", "ModalBox"], function(modalSchema, ModalBox) {
      ModalBox.show({ widthPixels: 560, heightPixels: 360 });
      // Должна появиться форма
  });
  ```
- Заполнить, нажать Подтвердить → ModalBox закрывается. Проверить через `sandbox` подписку, что событие пришло.

### Откат

Снять схемы с публикации. Никаких побочных эффектов в БД.

---

## T-11 — Замещение `SocialMessagePublisherPage` в CTI

**Этап:** 4
**Зависит от:** T-10
**Артефакт:** ClientUnitSchema
**Связан с риском R1** — проверить здесь, что в CTI ещё нет своего замещения

### Что делаем

В пакете CTI создать (или дополнить, если уже есть) замещающую схему `SocialMessagePublisherPage`. Переопределить `onPublishButtonClick` так, чтобы:
1. При первом нажатии — открыть `UsrLaborRecordsModalPage` через `ModalBox.show()`.
2. После подтверждения popup — создать запись `UsrLaborRecords`, поднять флаг `LaborRecordsConfirmed`, повторно вызвать `onPublishButtonClick` → улетит в `callParent` → опубликуется.
3. После успешной публикации — обновить `UsrSourceMessage` записи трудозатрат на Id созданного Activity.

### Pre-check (R1 валидация)

Конфигурация → CTI → найти схему с кодом `SocialMessagePublisherPage`. Если уже существует кастомизация — посмотреть, что в ней, и встроиться, не сломав.

```bash
# Проверка на dev-сервере (от bpmsoft):
# Через SQL — есть ли наша замещающая схема?
psql -c "SELECT s.\"Name\", p.\"Name\" FROM \"SysSchema\" s JOIN \"SysPackage\" p ON s.\"SysPackageId\" = p.\"Id\" WHERE s.\"Name\" = 'SocialMessagePublisherPage' AND p.\"Name\" = 'CTI';"
```

Если возвращает строку — открыть схему и читать; если пусто — создавать новую замещающую.

### Создание (если в CTI ещё нет)

Конфигурация → CTI → Добавить → «Замещающий клиентский модуль»:
- Родитель: `SocialMessagePublisherPage` (пакет `SocialMessagePublisher`).
- Код: `SocialMessagePublisherPage`.
- Пакет: CTI.

### Код

```javascript
define("SocialMessagePublisherPage", [
    "ModalBox",
    "ServiceHelper",
    "ConfigurationConstants",
    "BPMSoftCore"
], function(ModalBox, ServiceHelper) {
    return {
        attributes: {
            "LaborRecordsConfirmed": {
                dataValueType: BPMSoft.DataValueType.BOOLEAN,
                value: false
            },
            "PendingLaborRecordId": {
                dataValueType: BPMSoft.DataValueType.GUID,
                value: BPMSoft.GUID_EMPTY
            }
        },
        methods: {
            // Проверка роли пользователя
            isCurrentUserEngineer: function() {
                // Вернуть true только для роли CTI.Инженеры
                // Простейший вариант: проверить через UserConnection.CurrentUser.SysAdminUnitId.
                // Лучший: через сервис BPMSoft.UserRolesUtilities (если есть), или ESQ к SysUserInRole.
                // Для MVP — синхронно через атрибут (см. ниже init).
                return this.get("IsCurrentUserEngineer") === true;
            },

            init: function() {
                this.callParent(arguments);
                this.checkUserInEngineerRole();
            },

            checkUserInEngineerRole: function() {
                // ESQ на SysUserInRole
                var esq = this.Ext.create("BPMSoft.EntitySchemaQuery", { rootSchemaName: "SysUserInRole" });
                esq.addColumn("Id");
                esq.filters.add("UserFilter",
                    esq.createColumnFilterWithParameter(BPMSoft.ComparisonType.EQUAL, "SysUser",
                        BPMSoft.SysValue.CURRENT_USER_CONTACT.value || this.Terrasoft.SysValue.CURRENT_USER.value));
                esq.filters.add("RoleFilter",
                    esq.createColumnFilterWithParameter(BPMSoft.ComparisonType.EQUAL, "SysRole.Name", "CTI.Инженеры"));
                esq.getEntityCollection(function(result) {
                    this.set("IsCurrentUserEngineer", result.success && result.collection.getCount() > 0);
                }, this);
            },

            // Главный override: перехват клика «Опубликовать»
            onPublishButtonClick: function() {
                // Если popup уже подтверждён в этой сессии публикации — пропускаем
                if (this.get("LaborRecordsConfirmed") === true) {
                    this.set("LaborRecordsConfirmed", false);
                    return this.callParent(arguments);
                }

                // Если пользователь не инженер — стандартное поведение
                if (!this.isCurrentUserEngineer()) {
                    return this.callParent(arguments);
                }

                // Открыть popup
                this.openLaborRecordsModal();
                // НЕ вызываем callParent — публикация ждёт подтверждения popup
            },

            openLaborRecordsModal: function() {
                var modalConfig = {
                    widthPixels: 560,
                    heightPixels: 420
                };
                ModalBox.show(modalConfig);
                this.sandbox.loadModule("UsrLaborRecordsModalPage", {
                    renderTo: ModalBox.getContainer().get(0),
                    id: this.sandbox.id + "_laborModal"
                });
                // Подписаться на события popup
                this.sandbox.subscribe("LaborRecordsConfirmed", this.onLaborRecordsConfirmed, [this.sandbox.id + "_laborModal"]);
                this.sandbox.subscribe("LaborRecordsCancelled", this.onLaborRecordsCancelled, [this.sandbox.id + "_laborModal"]);
            },

            onLaborRecordsConfirmed: function(data) {
                // Шаг 1: создать запись UsrLaborRecords (без UsrSourceMessage — Activity ещё не создана)
                var insertQuery = this.Ext.create("BPMSoft.InsertQuery", { rootSchemaName: "UsrLaborRecords" });
                insertQuery.setParameterValue("UsrCase", this.get("MasterRecordId"), BPMSoft.DataValueType.GUID);
                insertQuery.setParameterValue("UsrWorkDate", data.workDate, BPMSoft.DataValueType.DATE_TIME);
                insertQuery.setParameterValue("UsrWorkDurationHours", data.hours, BPMSoft.DataValueType.INTEGER);
                insertQuery.setParameterValue("UsrWorkDurationMinutes", data.minutes, BPMSoft.DataValueType.INTEGER);
                insertQuery.setParameterValue("UsrOverTime", data.overTime, BPMSoft.DataValueType.BOOLEAN);
                insertQuery.setParameterValue("UsrWorkComments", data.comment, BPMSoft.DataValueType.TEXT);

                insertQuery.execute(function(result) {
                    if (!result.success) {
                        // EventListener мог бросить Exception (например, договор без СМ)
                        this.showInformationDialog(result.errorInfo
                            ? result.errorInfo.message
                            : "Не удалось сохранить трудозатраты.");
                        return;
                    }
                    // Сохраняем Id для второго шага
                    this.set("PendingLaborRecordId", result.id);
                    this.set("LaborRecordsConfirmed", true);
                    // Повторно вызываем — на этот раз пройдёт в callParent
                    this.onPublishButtonClick();
                }, this);
            },

            onLaborRecordsCancelled: function() {
                // Просто закрываем — публикация не происходит
                this.set("LaborRecordsConfirmed", false);
                this.set("PendingLaborRecordId", BPMSoft.GUID_EMPTY);
            },

            // Override: после успешной публикации — связываем UsrLaborRecords с Activity
            onPublished: function(response) {
                this.callParent(arguments);
                var laborRecordId = this.get("PendingLaborRecordId");
                var activityId = response && response.activityId; // или response.id, см. базовый publish
                if (laborRecordId && laborRecordId !== BPMSoft.GUID_EMPTY && activityId) {
                    this.linkLaborRecordToActivity(laborRecordId, activityId);
                }
                this.set("PendingLaborRecordId", BPMSoft.GUID_EMPTY);
            },

            linkLaborRecordToActivity: function(laborRecordId, activityId) {
                var update = this.Ext.create("BPMSoft.UpdateQuery", { rootSchemaName: "UsrLaborRecords" });
                update.setParameterValue("UsrSourceMessage", activityId, BPMSoft.DataValueType.GUID);
                update.filters.add("IdFilter",
                    update.createColumnFilterWithParameter(BPMSoft.ComparisonType.EQUAL, "Id", laborRecordId));
                update.execute(function(result) {
                    if (!result.success) {
                        // R2: не критично, запись остаётся без FK на Activity, ручное связывание возможно
                        console.warn("Не удалось связать UsrLaborRecords с Activity", result);
                    }
                }, this);
            }
        }
    };
});
```

**Важные замечания:**
- Точное имя свойства Id опубликованной активности (`response.activityId` или `response.id`) — проверить в DevTools при первом запуске. В `BaseMessagePublisherPage.onPublished` (строка 451) виден формат `response`.
- `MasterRecordId` — стандартный атрибут схемы `MessagePublisher`, содержит Id текущего Case.
- Имя роли `CTI.Инженеры` — уточнить, есть ли она в системе под этим точно именем; если другое — поменять.
- Если `EventListener` бросает Exception (договор без СМ) — `insertQuery` вернёт `success: false`, и пользователь увидит сообщение. Popup закроется (в текущей логике), что не даст пользователю поправить и повторить — это ОК для UX, потому что договор без СМ — это организационная проблема, а не ошибка ввода.

### Шаги внедрения

1. Pre-check SQL — нет ли уже замещения.
2. Если есть кастом — встроиться (объединить с нашим кодом).
3. Создать схему / отредактировать существующую.
4. Сохранить, опубликовать.
5. F5 в браузере (рестарт Kestrel НЕ нужен).

### Verify

1. Под пользователем-инженером открыть Case → лента → написать сообщение → нажать «Опубликовать».
2. Должен открыться popup `UsrLaborRecordsModalPage`.
3. Заполнить → Подтвердить → popup закрывается, сообщение публикуется в ленту.
4. Проверить в БД: `SELECT * FROM "UsrLaborRecords" WHERE "UsrCaseId" = '<caseId>' ORDER BY "CreatedOn" DESC LIMIT 1;` — есть запись с `UsrSourceMessage` на только что созданную `Activity`.
5. Под пользователем не-инженером — popup НЕ открывается, сообщение публикуется как обычно.

### Откат

Снять с публикации замещение → F5. Стандартное поведение восстановлено.

---

## T-12 — Бизнес-правила на странице `UsrLaborRecords`

**Этап:** 4
**Зависит от:** T-03
**Артефакт:** BusinessRule

### Что делаем

Дублируем валидацию popup на странице записи (для случая ручного добавления через деталь).

### Шаги

Открыть страницу `UsrLaborRecords` → раздел «Бизнес-правила».

**Правило 1: дата не в будущем**

| Поле | Значение |
|------|----------|
| Триггер | Изменение `UsrWorkDate` |
| Условие | `UsrWorkDate > Now` |
| Действие | Показать сообщение «Дата работ не может быть в будущем» |

**Правило 2: дата не раньше N дней назад**

| Поле | Значение |
|------|----------|
| Триггер | Изменение `UsrWorkDate` |
| Условие | `UsrWorkDate < Now - SysSettings(UsrLaborRecordsMaxBackdateDays)` |
| Действие | Показать сообщение «Списать можно не ранее чем за N дней назад» |

**Правило 3: длительность ≥ 1 минута**

Лучше реализовать через валидатор на EntitySchema, а не через бизнес-правило — точнее работает на сохранении.

В коде страницы (если есть замещение) или в EventListener:
```csharp
var hours = entity.GetTypedColumnValue<int>("UsrWorkDurationHours");
var minutes = entity.GetTypedColumnValue<int>("UsrWorkDurationMinutes");
if (hours * 60 + minutes < 1) {
    throw new Exception("Длительность работ должна быть не менее 1 минуты.");
}
```

— добавить в `UsrLaborRecordsEventListener.OnSaving` (после защиты от пустого СМ, до расчёта IsFormallyWorkTime). Если делаем — обновить T-07.

### Verify

В детали `UsrSchema021c2f40Detail` на CasePage → Добавить запись → попробовать ввести дату завтрашнего дня → ошибка.

---

## T-13 — DCM-кейс `UsrLaborRecordsCase`

**Этап:** 5 (Согласование)
**Зависит от:** T-08, T-09
**Артефакт:** Case

### Что делаем

Настроить кейс на разделе `UsrLaborRecords` со стадиями + элементами «Визирование» (Q4: запуск только при `UsrOverTime = true`).

### Шаги настройки колонок раздела

1. Открыть раздел `UsrLaborRecords` (после T-15) → «Вид» → «Настроить кейсы раздела».
2. Заполнить:
   - **«По какой колонке строятся стадии кейса?»** → `UsrLaborRecordsStage` (из T-03).
   - **«По какой колонке настраивать условие запуска кейса?»** → `UsrOverTime`.
3. Сохранить.

### Создание кейса

В дизайнере кейсов — «Добавить кейс»:

| Поле | Значение |
|------|----------|
| Название | Согласование переработки |
| Код | UsrLaborRecordsCase |
| **Условие запуска кейса** | `UsrOverTime = true` |

### Стадии и элементы

**Стадия 1: «Черновик»** (начальная)
- Без активных элементов. Это технический «вход» в кейс.
- Переход → автоматически на «На верификации» (по созданию записи).

**Стадия 2: «На верификации»**
- Элемент «Визирование»:
  - Раздел визирования: `UsrLaborRecords`
  - Идентификатор записи: `[#Основная запись.Id#]`
  - Кому отправить: `[#Основная запись.UsrServicePact.UsrResponsibleServiceManager#]`
  - Цель: «Верификация переработки по обращению №[#Основная запись.UsrCase.Number#]»
  - Можно делегировать: Да
- Переход при «Положительная» → стадия «На утверждении».
- Переход при «Отрицательная» → стадия «На доработке».

**Стадия 3: «На утверждении»**
- Элемент «Визирование»:
  - Кому отправить: роль `CTI.Руководители согласования трудозатрат`
  - Цель: «Утверждение переработки по обращению №[#Основная запись.UsrCase.Number#]»
- Переход при «Положительная» → стадия «Утверждено».
- Переход при «Отрицательная» → стадия «На доработке».

**Стадия 4: «На доработке»**
- Без активных элементов из коробки.
- Переход на «На верификации» — **по ручному действию инженера** «Отправить на согласование заново» (Q3 — новая виза СМ).
- Реализация: либо отдельная кнопка на странице, либо смена `UsrLaborRecordsStage` через бизнес-правило при редактировании. **MVP-вариант:** кнопка на панели действий, которая (1) обнуляет старые визы и (2) ставит `UsrLaborRecordsStage = На верификации`. DCM сам подхватит и создаст новую визу СМ.

**Стадия 5: «Утверждено»** (конечная)
- Без элементов. Запись в выгрузку.

**Стадия 6: «Отклонено»** (конечная)
- Без элементов. **В MVP не используется автоматически** (по DCM-схеме отклонение всегда идёт на «На доработке»). Оставлена на случай ручного перевода администратором или для будущего.

### Изменение прав по стадиям

В каждой стадии — элемент «Изменить права доступа»:
- На стадии «На верификации» — выдать `CTI.Ответственные сервис-менеджеры` право на чтение записи (если объектные права не покрывают).
- На стадии «На утверждении» — выдать `CTI.Руководители согласования трудозатрат` право на чтение.
- На стадии «Утверждено» — снять временные права.

**Если объектные права (T-06) уже всё покрывают — этот блок можно пропустить.**

### Активировать кейс

После настройки — нажать «Активировать» в дизайнере.

### Verify

1. Создать запись `UsrLaborRecords` с `UsrOverTime = false` → стадия НЕ установлена, кейс не запустился.
2. Создать запись с `UsrOverTime = true` → автоматически стадия «На верификации», создана виза для СМ договора.
3. Утвердить визу → стадия «На утверждении», создана виза для руководителя.
4. Утвердить → стадия «Утверждено».
5. На любом шаге отклонить → «На доработке».

---

## T-14 — 3 EmailTemplate + BPMN `UsrLaborRecordsNotifications`

**Этап:** 5
**Зависит от:** T-13
**Артефакт:** Process + Email

### EmailTemplate (3 шт)

Дизайнер системы → «Шаблоны email» → «Добавить».

**Шаблон 1: `UsrLaborRecordsVisaPositive`**

| Поле | Значение |
|------|----------|
| Код | UsrLaborRecordsVisaPositive |
| Тема | Ваша переработка по обращению №[#Case.Number#] согласована |
| Тело | «Здравствуйте, [#Owner.Name#].\n\nВаша переработка по обращению №[#Case.Number#] от [#UsrWorkDate#] согласована.\n\n--\nСистема BPMSoft» |
| Объект | UsrLaborRecords |

**Шаблон 2: `UsrLaborRecordsVisaNegative`**

| Поле | Значение |
|------|----------|
| Код | UsrLaborRecordsVisaNegative |
| Тема | Ваша переработка отклонена |
| Тело | «Здравствуйте, [#Owner.Name#].\n\nВаша переработка по обращению №[#Case.Number#] от [#UsrWorkDate#] отклонена.\nПричина: [#VisaComment#]\n\nПроверьте запись в разделе «Управление трудозатратами».» |

**Шаблон 3: `UsrLaborRecordsSendBack`**

| Поле | Значение |
|------|----------|
| Код | UsrLaborRecordsSendBack |
| Тема | Ваша переработка возвращена на доработку |
| Тело | «Здравствуйте.\n\nВаша переработка по обращению №[#Case.Number#] от [#UsrWorkDate#] возвращена на доработку.\nКомментарий: [#VisaComment#]\n\nПосле правок отправьте запись на согласование заново.» |

**Привязать шаблоны к пакету CTI** — стандартный механизм данных.

### BPMN-процесс `UsrLaborRecordsNotifications`

Конфигурация → CTI → Добавить → «Бизнес-процесс».

**Триггер:** изменение записи `UsrLaborRecords` → колонка `UsrLaborRecordsStage`.

**Логика:**
- Условие: `UsrLaborRecordsStage = Утверждено` → Script Task → отправить email инженеру по шаблону `UsrLaborRecordsVisaPositive`.
- Условие: `UsrLaborRecordsStage = Отклонено` → отправить `UsrLaborRecordsVisaNegative`.
- Условие: `UsrLaborRecordsStage = На доработке` → отправить `UsrLaborRecordsSendBack`.

**Получатель** — `CreatedBy` (инженер, создавший запись).

**Альтернатива:** не делать BPMN, а использовать встроенные уведомления виз — они приходят автоматически в центр уведомлений + email. Но в DECISIONS Q3 / Q9 явно указано, что нужны кастомные шаблоны email с понятным текстом и причиной отклонения. Поэтому BPMN нужен.

### Verify

1. Утвердить визу через центр уведомлений → стадия «Утверждено» → инженер получает email «согласована».
2. Отклонить визу с комментарием → стадия «На доработке» → инженер получает email «возвращена на доработку. Комментарий: ...».

---

## T-15 — Раздел «Управление трудозатратами»

**Этап:** 6 (Раздел)
**Зависит от:** T-03, T-13
**Артефакт:** Section

### Шаги

Дизайнер системы → «Мастер раздела» → «Создать раздел».

| Поле | Значение |
|------|----------|
| Название | Управление трудозатратами |
| Код | UsrLaborRecordsSection |
| Объект | UsrLaborRecords |
| Пакет | CTI |
| Иконка | Time / Clock (выбрать подходящую) |

### Колонки реестра

| Колонка | Источник |
|---------|----------|
| Дата работ | UsrWorkDate |
| Сотрудник | CreatedBy |
| Обращение | UsrCase.Number |
| Договор | UsrServicePact.Name |
| Длительность (мин) | виртуальная `UsrTotalMinutes` (= Hours\*60 + Minutes) — добавить через мастер виртуальных колонок |
| Переработка | UsrOverTime |
| Стадия | UsrLaborRecordsStage |
| Сервис-менеджер | UsrServicePact.UsrResponsibleServiceManager |
| Формально рабочее время | UsrIsFormallyWorkTime |
| Комментарий | UsrWorkComments |

### Фильтры

- Период (`UsrWorkDate`)
- Сотрудник (`CreatedBy`)
- Обращение / Договор
- Тип записи: Все / Только переработки / Только без переработки (Q4)
- Стадия (`UsrLaborRecordsStage`) — отображается только в режимах «Все» и «Только переработки»
- «Требуют моего внимания» (комплексный, см. ARCHITECTURE 3.6)

### Verify

Раздел появился в меню → реестр открывается → колонки заполнены данными.

---

## T-16 — Правило цветового выделения

**Этап:** 6
**Зависит от:** T-15
**Артефакт:** ColoringRule

### Шаги

В разделе → «Настройки» → «Цветовое выделение» → «Добавить правило».

| Поле | Значение |
|------|----------|
| Название | Формально рабочее время |
| Условие | `UsrIsFormallyWorkTime = true` |
| Цвет фона | Жёлтый (#FFF3CD или близкий) |

Сохранить.

### Verify

Запись с `UsrIsFormallyWorkTime = true` в реестре подсвечена жёлтым.

---

## T-17 — Настройка рабочих мест

**Этап:** 6
**Зависит от:** T-15
**Артефакт:** Workplace

### Шаги

Дизайнер системы → «Рабочие места» → выбрать рабочие места ролей и добавить раздел «Управление трудозатратами»:

- Рабочее место **Инженеры**: добавить раздел (видят только свои записи через объектные права).
- Рабочее место **Сервис-менеджеры**: добавить раздел.
- Рабочее место **Руководители**: добавить раздел.
- Рабочее место **Аналитики**: добавить раздел.
- Рабочее место **Администраторы**: добавить раздел.

### Verify

Войти под каждой ролью → в меню есть раздел «Управление трудозатратами».

---

## T-18 — E2E-тестирование на dev

**Этап:** 7 (Тестирование)
**Зависит от:** T-01..T-17
**Артефакт:** Test

### Сценарии

Прогнать **все 10 сценариев из ARCHITECTURE раздел 7**:

1. Инженер — переработка в выходной → DCM запускается, виза СМ.
2. СМ — утверждение через центр уведомлений → виза руководителя.
3. Руководитель — утверждение по одной → email инженеру «согласована».
4. Аналитик — фильтр + Excel-экспорт.
5. Инженер — обычное сообщение без переработки → DCM НЕ запускается.
6. Инженер — ручное добавление через деталь → DCM запускается (если переработка).
7. Негативный сценарий — переработка в формально рабочее → жёлтая подсветка.
8. Возврат на доработку → новая виза СМ (Q3).
9. Защита от договоров без СМ → ошибка с понятным текстом.
10. Попытка списать 4 дня назад → отклонено.

### Чеклист

- [ ] Каждый из 10 сценариев пройден успешно.
- [ ] Найденные баги зафиксированы и исправлены, повторный прогон.
- [ ] Email-уведомления приходят (проверить в Inbox).
- [ ] Performance: открытие popup ≤ 1 сек, сохранение записи ≤ 2 сек.

### Откат

Если что-то не работает — откатывать конкретные тикеты в обратном порядке.

---

## T-19 — Перенос на прод

**Этап:** 8 (Деплой)
**Зависит от:** T-18 (тестирование пройдено)
**Артефакт:** Deploy

### Pre-flight checklist

- [ ] T-18 полностью пройден на dev.
- [ ] T-01 миграция СМ выполнена на проде заранее (чтобы T-02 не сломал текущих пользователей).
- [ ] Бэкап БД продa.
- [ ] Окно для рестарта Kestrel согласовано.
- [ ] Резервная копия пакета CTI с прода (через WorkspaceConsole или UI-экспорт).

### Шаги переноса

1. **Экспорт пакета CTI с dev:** Конфигурация → CTI → «Экспортировать пакет» → скачать .zip.
2. **На прод:** UI-импорт пакета (Конфигурация → «Импортировать пакет») или WorkspaceConsole.
3. **Опубликовать все изменения** на проде.
4. **Рестарт Kestrel** на проде: `sudo systemctl restart bpmsoft-full-house.service`.
5. Дождаться поднятия (~30 сек, проверить `systemctl status`).
6. Smoke test: войти под админом, создать тестовую запись, проверить, что DCM сработал.
7. Уведомить пользователей о новом разделе и popup-механизме.

### Использовать `/deploy` скилл

Для построения полного чеклиста переноса с учётом порядка зависимостей (объект → страница → C# → EventListener → Kestrel) — запустить скилл `/deploy` с описанием изменений из этого документа.

### Откат

Если на проде что-то ломается:
1. Удалить опубликованные схемы CTI в обратном порядке.
2. Откатить пакет CTI до предыдущей версии (из бэкапа экспорта).
3. Рестарт Kestrel.

---

## v2 — что не входит в MVP (для справки)

См. ARCHITECTURE раздел 10. Кратко:
- Массовое утверждение/отклонение виз (`getSectionActions` + `BatchQuery`) — Q6.
- Удаление поля `UsrOverTimeApproval` — Q7, после аудита.
- Контроль списания при ответе через внешнюю почту — Q5.5, отдельная подзадача волны 2.5/3.
- Кастомная форма выгрузки.
- Дашборд/аналитика.

---

## Зависимости и порядок параллелизации

```
T-01 (миграция) ─┐
                 ├─→ T-02 (ServicePact)
T-04 (SysSet) ───┤
T-05 (роли) ─────┤
                 ├─→ T-07 (EventListener) → Kestrel restart
T-03 (UsrLR) ────┘
                 ├─→ T-06 (rights)
                 ├─→ T-08 (визы) → T-09 (виз-rights)
                 ├─→ T-10 (modal) → T-11 (publisher)
                 └─→ T-12 (BR)

T-08 + T-09 ─────→ T-13 (DCM) ──→ T-14 (BPMN+Email)

T-03 + T-13 ─────→ T-15 (раздел) → T-16 (color), T-17 (workplace)

Всё ─────────────→ T-18 (E2E test) → T-19 (deploy)
```

**Можно параллелить:**
- T-04, T-05, T-03 — все три без зависимостей, делать одновременно.
- T-10 (modal) и T-13 (DCM) — независимы, можно параллельно.
- T-12 (BR) — параллельно с T-11.

---

**Итого порядок выполнения:**

1. T-01 (миграция данных, до релиза)
2. Параллельно: T-02, T-03, T-04, T-05
3. T-06 (после T-03 + T-05)
4. T-07 (после T-02 + T-03 + T-04) → **рестарт Kestrel**
5. T-08 → T-09
6. Параллельно: T-10 → T-11, T-12
7. T-13 → T-14
8. T-15 → T-16, T-17
9. T-18 (E2E)
10. T-19 (прод)
