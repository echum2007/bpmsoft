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
| T-07 | EventListener `UsrLaborRecordsEventListener` (Q1 + расширенная серверная валидация) | 2 | T-02, T-03, T-04 | SourceCode (C#) | 4ч |
| T-08 | Включить «Доступно визирование в разделе» → `UsrLaborRecordsVisa` | 3 | T-03 | Object (auto) | 0.5ч |
| T-09 | Права на `UsrLaborRecordsVisa` | 3 | T-08, T-05 | Rights | 1ч |
| T-10 | `UsrLaborRecordsModalPage` (AMD-модуль popup) + CSS | 4 | T-03, T-04 | ClientUnitSchema | 4ч |
| T-11 | Замещение `SocialMessagePublisherPage` в CTI | 4 | T-10 | ClientUnitSchema | 3ч |
| T-12 | Бизнес-правила на `UsrLaborRecords.Page` | 4 | T-03 | BusinessRule | 1ч |
| T-13 | DCM-кейс `UsrLaborRecordsCase` (стадии + визы) | 5 | T-08, T-09 | Case | 4ч |
| T-13.5 | Кнопка «Отправить на согласование заново» (B2, Q3) | 5 | T-13, T-03 | ClientUnitSchema (UsrLaborRecords.Page) | 2ч |
| T-14 | 3 EmailTemplate + BPMN `UsrLaborRecordsNotifications` | 5 | T-13 | Process + Email | 3ч |
| T-15 | Раздел «Управление трудозатратами» (13 колонок + 6 групп фильтра «Моё внимание» по ролям) | 6 | T-03, T-13 | Section | 2.5ч |
| T-16 | Правило цветового выделения `UsrIsFormallyWorkTime` | 6 | T-15 | ColoringRule | 0.5ч |
| T-17 | Настройка рабочих мест (роли → раздел) | 6 | T-15 | Workplace | 0.5ч |
| T-18 | E2E-тестирование на dev (15 сценариев, расширено) | 7 | T-01..T-17 | Test | 6ч |
| T-19 | Перенос пакета CTI на прод + миграция СМ | 8 | T-18 | Deploy | 2ч |

**Итого: ~36.5 часов MVP без буфера** (правки верификации 2026-04-25: +2ч T-13.5, +1ч T-07 валидация, +2ч T-18; правка 2026-04-26: +0.5ч T-15 фильтры по ролям). **С буфером 30% → ~47.5 часов ≈ 1.2 рабочих недели.**

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
    using System.Linq;
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

            // ===== Шаг 2: Серверная валидация длительности (Группа A, Находка 1.2) =====
            var hours = entity.GetTypedColumnValue<int>("UsrWorkDurationHours");
            var minutes = entity.GetTypedColumnValue<int>("UsrWorkDurationMinutes");
            if (hours < 0 || hours > 23) {
                throw new Exception("Часы должны быть в диапазоне 0..23.");
            }
            if (minutes < 0 || minutes > 59) {
                throw new Exception("Минуты должны быть в диапазоне 0..59.");
            }
            if (hours * 60 + minutes < 1) {
                throw new Exception("Длительность работ должна быть не менее 1 минуты.");
            }

            // ===== Шаг 3: Серверная валидация даты (Q10, Находка 4.8) =====
            // Календарные дни (не рабочие). UI/popup имеют такую же проверку (T-10, T-12),
            // но если запись пришла через SQL/импорт/обход UI — сервер всё равно отклонит.
            var workDate = entity.GetTypedColumnValue<DateTime>("UsrWorkDate");
            if (workDate == default(DateTime)) {
                throw new Exception("Дата и время работ должны быть заполнены.");
            }
            var maxBackdateDays = (int)Core.Configuration.SysSettings.GetValue(
                userConnection, "UsrLaborRecordsMaxBackdateDays", 3);
            var minDate = DateTime.Now.AddDays(-maxBackdateDays);
            if (workDate < minDate) {
                throw new Exception(
                    $"Дата работ не может быть раньше чем {maxBackdateDays} календарных дней назад.");
            }
            if (workDate > DateTime.Now) {
                throw new Exception("Дата работ не может быть в будущем.");
            }

            // ===== Шаг 4: Расчёт UsrIsFormallyWorkTime =====
            var isOverTime = entity.GetTypedColumnValue<bool>("UsrOverTime");
            if (!isOverTime) {
                entity.SetColumnValue("UsrIsFormallyWorkTime", false);
                return;
            }

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
- `using System.Linq;` уже включён (для `FirstOrDefault`).
- `TermCalculatorActions` — публичный класс из пакета `SLM`. Если при компиляции «type not found» — добавить ссылку через `Dependencies` пакета CTI на `SLM` (обычно уже есть, проверить).
- При добавлении в `using` — `BPMSoft.Configuration` (там лежит `TermCalculatorActions`). Поскольку наш класс уже в `BPMSoft.Configuration`, явный `using` не нужен.
- Использование `entity.GetTypedColumnValue<Guid>("UsrServicePactId")` (с суффиксом `Id`) — стандартное обращение к FK-колонке.
- **Паттерн `entity.UserConnection` (Находка 2.7):** в BPMSoft 1.9 у `Entity` есть публичное свойство `UserConnection`. Если при компиляции «cannot access» — заменить на `((Entity)sender).UserConnection` или получить через `EntitySchemaQuery` контекст вышестоящего метода. Подтвердить при первой компиляции на dev.
- **Порядок проверок** (важно): сначала защита от пустого договора и СМ (Q1), потом валидация значений (длительность, дата), потом расчёт `IsFormallyWorkTime`. Если первые проверки не пройдут — последующие даже не запустятся, что экономит ESQ-вызовы.
- **Серверная валидация vs UI:** все проверки длительности/даты дублируются на UI (popup в T-10, бизнес-правила в T-12). Сервер — последний рубеж для случаев обхода UI (импорт, SQL, BPMN, REST API).

### Шаги внедрения

1. Создать схему «Исходный код» с кодом выше.
2. Сохранить, скомпилировать (Конфигурация → «Компилировать»).
3. Если ошибки компиляции — исправить.
4. **Опубликовать схему.**
5. **Рестарт Kestrel:** `sudo systemctl restart bpmsoft-full-house.service` на dev/прод.
6. Дождаться поднятия сервиса (~30 сек).

### Verify

**Базовые сценарии (Q1 + IsFormallyWorkTime):**

1. Создать тестовую запись `UsrLaborRecords` через popup или деталь:
   - Договор без СМ → ожидается ошибка с понятным текстом «у договора не назначен ответственный сервис-менеджер».
   - Договор с СМ, `UsrOverTime = false`, валидные часы/минуты/дата → сохраняется, `UsrIsFormallyWorkTime = false`.
   - Договор с СМ, `UsrOverTime = true`, `UsrWorkDate = суббота 11:00` → `UsrIsFormallyWorkTime = false` (выходной → НЕ формально рабочее).
   - Договор с СМ, `UsrOverTime = true`, `UsrWorkDate = понедельник 14:00` → `UsrIsFormallyWorkTime = true` (попадает в WorkingTimeInterval).

**Серверная валидация (Группа A):**

Все эти сценарии проверяем через SQL/импорт/REST (минуя UI), чтобы убедиться, что сервер ловит даже при обходе фронта:

2. **Длительность 0 минут:** INSERT с `UsrWorkDurationHours=0, UsrWorkDurationMinutes=0` → отклонено: «Длительность работ должна быть не менее 1 минуты.»
3. **Часы вне диапазона:** INSERT с `UsrWorkDurationHours=24` → отклонено: «Часы должны быть в диапазоне 0..23.»
4. **Минуты вне диапазона:** INSERT с `UsrWorkDurationMinutes=60` → отклонено: «Минуты должны быть в диапазоне 0..59.»
5. **Дата в будущем:** INSERT с `UsrWorkDate = завтра 10:00` → отклонено: «Дата работ не может быть в будущем.»
6. **Дата задним числом > N:** при `MaxBackdateDays=3` INSERT с `UsrWorkDate = 5 дней назад` → отклонено: «Дата работ не может быть раньше чем 3 календарных дней назад.»
7. **Пустая дата:** INSERT с `UsrWorkDate = NULL` → отклонено: «Дата и время работ должны быть заполнены.»

**Пример SQL для проверки 2 (под админом, через SQL-консоль):**

```sql
-- Должен упасть с ошибкой "Длительность работ должна быть не менее 1 минуты"
-- Идёт через ORM, не напрямую INSERT — потому что напрямую INSERT обходит EventListener
-- Способ: через REST API или через специальную тестовую страницу
```

**Замечание:** прямой `INSERT INTO "UsrLaborRecords"` через psql **не вызовет EventListener**, потому что EventListener работает на уровне ORM (Entity), а не БД. Для теста серверной валидации использовать REST/odata-эндпоинт BPMSoft или JS-консоль в браузере с `BPMSoft.InsertQuery`.

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
            },
            "IsCurrentUserEngineer": {
                dataValueType: BPMSoft.DataValueType.BOOLEAN,
                value: false
            },
            "IsCurrentUserEngineerLoaded": {
                // Защита от race condition (Находка 4.5): пока ESQ роли не вернулся,
                // считаем пользователя НЕ инженером и пропускаем popup.
                dataValueType: BPMSoft.DataValueType.BOOLEAN,
                value: false
            }
        },
        methods: {
            // Проверка роли пользователя
            isCurrentUserEngineer: function() {
                // Возвращаем true только если ESQ роли уже вернулся И пользователь — инженер.
                // Если ESQ ещё не завершился — возвращаем false (popup не откроется,
                // сообщение опубликуется как обычно — это безопаснее, чем сломать ленту).
                return this.get("IsCurrentUserEngineerLoaded") === true
                    && this.get("IsCurrentUserEngineer") === true;
            },

            init: function() {
                this.callParent(arguments);
                this.checkUserInEngineerRole();
            },

            checkUserInEngineerRole: function() {
                // ESQ на SysUserInRole — асинхронный.
                // Имя роли "CTI.Инженеры" — точное имя обязательно подтвердить SQL pre-check
                // ДО публикации (см. раздел "Pre-check" ниже).
                var esq = this.Ext.create("BPMSoft.EntitySchemaQuery", { rootSchemaName: "SysUserInRole" });
                esq.addColumn("Id");
                esq.filters.add("UserFilter",
                    esq.createColumnFilterWithParameter(BPMSoft.ComparisonType.EQUAL, "SysUser",
                        BPMSoft.SysValue.CURRENT_USER_CONTACT.value || this.Terrasoft.SysValue.CURRENT_USER.value));
                esq.filters.add("RoleFilter",
                    esq.createColumnFilterWithParameter(BPMSoft.ComparisonType.EQUAL, "SysRole.Name", "CTI.Инженеры"));
                esq.getEntityCollection(function(result) {
                    this.set("IsCurrentUserEngineer", result.success && result.collection.getCount() > 0);
                    this.set("IsCurrentUserEngineerLoaded", true);
                }, this);
            },

            // Главный override: перехват клика «Опубликовать»
            onPublishButtonClick: function() {
                // Если popup уже подтверждён в этой сессии публикации — пропускаем
                if (this.get("LaborRecordsConfirmed") === true) {
                    this.set("LaborRecordsConfirmed", false);
                    return this.callParent(arguments);
                }

                // Если пользователь не инженер (или ESQ роли ещё не вернулся) — стандартное поведение
                if (!this.isCurrentUserEngineer()) {
                    return this.callParent(arguments);
                }

                // === B1 (Q1 уровень 3): проверка наличия СМ у договора текущего Case ===
                // Без этой проверки инженер увидит непонятную ошибку EventListener
                // на этапе сохранения. Лучше показать понятное сообщение ДО popup.
                this.checkServicePactHasResponsibleSM(function(hasSM) {
                    if (!hasSM) {
                        this.showInformationDialog(
                            "Невозможно списать время по этому обращению: " +
                            "у договора не назначен ответственный сервис-менеджер. " +
                            "Обратитесь к руководителю сервиса."
                        );
                        // НЕ вызываем callParent — сообщение не публикуется,
                        // потому что по бизнес-логике без списания работать нельзя
                        return;
                    }
                    // СМ есть — открываем popup
                    this.openLaborRecordsModal();
                }, this);
                // НЕ вызываем callParent здесь — публикация ждёт результата проверки и popup
            },

            checkServicePactHasResponsibleSM: function(callback, scope) {
                // ESQ к Case → ServicePact → UsrResponsibleServiceManager
                var caseId = this.get("MasterRecordId");
                if (!caseId || caseId === BPMSoft.GUID_EMPTY) {
                    callback.call(scope, false);
                    return;
                }
                var esq = this.Ext.create("BPMSoft.EntitySchemaQuery", { rootSchemaName: "Case" });
                var smCol = esq.addColumn("ServicePact.UsrResponsibleServiceManager.Id");
                esq.filters.add("CaseFilter",
                    esq.createColumnFilterWithParameter(BPMSoft.ComparisonType.EQUAL, "Id", caseId));
                esq.getEntityCollection(function(result) {
                    if (!result.success || result.collection.getCount() === 0) {
                        callback.call(scope, false);
                        return;
                    }
                    var entity = result.collection.getByIndex(0);
                    var smId = entity.get(smCol.name);
                    callback.call(scope, smId && smId !== BPMSoft.GUID_EMPTY);
                }, this);
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
- Точное имя свойства Id опубликованной активности (`response.activityId` или `response.id`) — проверить в DevTools при первом запуске. В `BaseMessagePublisherPage.onPublished` (строка 451) виден формат `response`. **Без этого `linkLaborRecordToActivity` не сработает.**
- `MasterRecordId` — стандартный атрибут схемы `MessagePublisher`, содержит Id текущего Case.
- **Имя роли `CTI.Инженеры` — обязательный pre-check** (см. ниже SQL). Если в системе роль называется иначе — заменить строковый литерал в `checkUserInEngineerRole`.
- **Race condition (Находка 4.5):** ESQ роли асинхронный. Атрибут `IsCurrentUserEngineerLoaded` гарантирует, что пока ESQ не вернулся — `isCurrentUserEngineer()` возвращает `false`, popup не открывается, сообщение публикуется как обычно (безопасное поведение). Если пользователь нажмёт «Опубликовать» в первые 100-300мс после открытия CasePage — popup может не появиться. Это допустимо для MVP. Если нужно строже — переделать на синхронную проверку через `BPMSoft.UserRolesUtilities` (если есть в платформе).
- **B1 уровень 3 защиты Q1:** `checkServicePactHasResponsibleSM` проверяет наличие СМ ДО открытия popup. Если СМ нет — показывает понятное сообщение и блокирует публикацию (пользователь не может писать в ленту по обращениям с проблемными договорами — это намеренное поведение, заставляет обратиться к руководителю сервиса).
- Если `EventListener` бросает Exception (договор без СМ — резервный сценарий, когда B1 уровень 3 пропустил, например через race condition) — `insertQuery` вернёт `success: false`, и пользователь увидит сообщение. Popup закроется.

### Pre-check SQL (обязательно ДО публикации схемы)

**1. Имя роли инженеров** (Находка 4.4):

```sql
SELECT "Name" FROM "SysAdminUnit"
WHERE "Name" ILIKE '%инженер%'
  AND "SysAdminUnitTypeValue" IN (1, 6) -- 1 = функциональная, 6 = организационная
ORDER BY "Name";
```

Точное имя роли инженеров (вернёт SQL) — подставить в `checkUserInEngineerRole` вместо `"CTI.Инженеры"`.

**2. Существует ли уже замещение SocialMessagePublisherPage в CTI** (R1):

```sql
SELECT s."Name", p."Name" AS package_name
FROM "SysSchema" s
JOIN "SysPackage" p ON s."SysPackageId" = p."Id"
WHERE s."Name" = 'SocialMessagePublisherPage' AND p."Name" = 'CTI';
```

Если возвращает строку — открыть существующее замещение и встроить наш код, не создавать новое.

### Шаги внедрения

1. **Pre-check SQL** — выполнить два запроса выше: имя роли инженеров + наличие замещения SocialMessagePublisherPage в CTI.
2. Если в CTI уже есть замещение — открыть и встроить наш код (не создавать новое).
3. Подставить точное имя роли инженеров в код вместо `"CTI.Инженеры"`.
4. Создать схему / отредактировать существующую.
5. Сохранить, опубликовать.
6. F5 в браузере (рестарт Kestrel НЕ нужен).
7. Запустить блок проверки `response.id` через DevTools (см. Verify п.4) — зафиксировать имя свойства, при необходимости поправить `linkLaborRecordToActivity`.

### Verify

**Базовый сценарий (инженер):**

1. Под пользователем-инженером открыть Case **с заполненным `UsrResponsibleServiceManager`** → лента → написать сообщение → нажать «Опубликовать».
2. Должен открыться popup `UsrLaborRecordsModalPage`.
3. Заполнить → Подтвердить → popup закрывается, сообщение публикуется в ленту.
4. **Проверить имя свойства в response (TBD):** в DevTools поставить breakpoint на `onPublished`, посмотреть структуру `response`. Если `response.activityId` отсутствует — заменить в `linkLaborRecordToActivity` на `response.id` (или другое корректное имя).
5. Проверить в БД: `SELECT * FROM "UsrLaborRecords" WHERE "UsrCaseId" = '<caseId>' ORDER BY "CreatedOn" DESC LIMIT 1;` — есть запись с `UsrSourceMessage` на только что созданную `Activity`.

**B1 (Q1 уровень 3) — защита от договоров без СМ:**

6. Под инженером открыть Case **с пустым `UsrResponsibleServiceManager` договора** → лента → написать сообщение → нажать «Опубликовать».
7. **Ожидается:** сообщение НЕ публикуется, показано модальное окно: «Невозможно списать время по этому обращению: у договора не назначен ответственный сервис-менеджер. Обратитесь к руководителю сервиса.»
8. Popup `UsrLaborRecordsModalPage` НЕ открывается. В БД новых записей `UsrLaborRecords` нет.

**Регрессия для не-инженеров (Находка 5.2):**

9. Под пользователем-СМ (или любой другой не-инженерной ролью) открыть Case → лента → написать сообщение → нажать «Опубликовать».
10. **Ожидается:** popup НЕ открывается, сообщение публикуется как обычно. Это критический сценарий — без него регрессия может сломать ленту для всех остальных ролей.

**Race condition (Находка 4.5):**

11. Под инженером быстро открыть Case → не дожидаясь полной загрузки страницы (~100мс) → написать сообщение и нажать «Опубликовать».
12. Возможны два исхода: (a) popup откроется (ESQ роли успел) или (b) сообщение опубликуется без popup (ESQ ещё не вернулся). **Оба допустимы для MVP.** Если (b) — пользователь увидит, что сообщение ушло без списания, и сможет создать запись через деталь.

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

**Правило 3: длительность ≥ 1 минута и диапазоны Hours/Minutes**

Реализуется на сервере в `UsrLaborRecordsEventListener.OnSaving` — см. T-07 (Группа A серверной валидации). На странице бизнес-правила не дублируем.

**Правило 4 (B1 уровень 3, Q1) — фильтр lookup `UsrCase` в детали**

Деталь `UsrSchema021c2f40Detail` на CasePage/ServicePactPage позволяет выбрать любое обращение в lookup. Чтобы не позволить создать запись на обращение, у договора которого пустой `UsrResponsibleServiceManager` — добавить фильтр lookup.

| Поле | Значение |
|------|----------|
| Тип правила | Filtration |
| Поле формы | `UsrCase` |
| Условие фильтра | `UsrCase.ServicePact.UsrResponsibleServiceManager IS NOT NULL` |

В JS-конфиге страницы (если делаем через код, не мастер):

```javascript
rules: {
    "UsrCase": [
        {
            ruleType: BPMSoft.RuleType.FILTRATION,
            baseAttributePatch: "UsrCase",
            comparisonType: BPMSoft.ComparisonType.IS_NOT_NULL,
            attribute: "ServicePact.UsrResponsibleServiceManager",
            // фильтр обязательный (записи без СМ не показываются вообще)
            type: BPMSoft.FilterTypes.NotEmpty
        }
    ]
}
```

**Реализация через мастер бизнес-правил:** «Тип правила = Фильтрация выпадающего списка» → поле `UsrCase` → фильтр по связанной колонке `ServicePact.UsrResponsibleServiceManager` НЕ ПУСТО.

### Поле `UsrOverTime` — всегда видимо (Находка 2.4)

Старое решение «скрывать `UsrOverTime` при пустом `UsrSourceMessage`» — **отменено** (Q5 уточнение 2026-04-25, ARCHITECTURE 3.3). Поле должно быть видимо и редактируемо во всех каналах создания (popup, деталь, прямая страница).

**Действие:** проверить, что на странице `UsrLaborRecords.Page` НЕТ бизнес-правил, скрывающих `UsrOverTime`. Если найдены — удалить.

### Verify

1. **Правило 1 (дата в будущем):** в детали `UsrSchema021c2f40Detail` на CasePage → Добавить запись → ввести дату завтрашнего дня → ошибка «Дата работ не может быть в будущем».
2. **Правило 2 (дата задним числом):** ввести дату 4 дня назад (при `MaxBackdateDays = 3`) → ошибка «Списать можно не ранее чем за 3 дней назад».
3. **Правило 4 (B1 уровень 3):** на CasePage с пустым СМ договора → деталь «Трудозатраты» → Добавить → в lookup «Обращение» текущий Case (без СМ) НЕ должен отображаться. Открыть Case с заполненным СМ → запись создаётся нормально.
4. **OverTime виден:** в детали → Добавить запись → поле «Переработка» (`UsrOverTime`) **отображается и редактируемо** независимо от заполнения других полей.

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
- **Реализация кнопки — отдельный тикет T-13.5** (см. ниже). В дизайнере кейса T-13 эта стадия описывается как «принимающая» — без автоматических переходов. Переход управляется кодом кнопки, которая программно ставит `UsrLaborRecordsStage = "На верификации"`.

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

## T-13.5 — Кнопка «Отправить на согласование заново» на странице UsrLaborRecords (B2)

**Этап:** 5 (Согласование)
**Зависит от:** T-13 (DCM-кейс активирован)
**Артефакт:** ClientUnitSchema (замещение страницы UsrLaborRecords)
**Решение в DECISIONS:** Q3 (возврат с Этапа 1 — новая виза СМ)
**Время:** ~2ч + тестирование

### Что делаем

После того как руководитель отклонил визу и стадия перешла в «На доработке» — инженеру нужен механизм отправить запись на новый круг виз. В стандартном DCM такой кнопки нет, поэтому добавляем её на страницу `UsrLaborRecords.Page` (или замещение этой схемы в CTI).

### Шаги внедрения

#### 1. Создать/расширить замещение страницы UsrLaborRecords

Если в CTI ещё нет замещения страницы `UsrUsrLaborRecords6e6369a6Page` — создать.
Конфигурация → CTI → Добавить → «Замещающий клиентский модуль»:
- Родитель: `UsrUsrLaborRecords6e6369a6Page` (та же схема, что в AS-IS)
- Код: `UsrUsrLaborRecords6e6369a6Page`
- Пакет: CTI

#### 2. Добавить кнопку в diff страницы

```javascript
diff: [
    {
        operation: "insert",
        name: "ResubmitForApprovalButton",
        parentName: "ActionButtonsContainer", // или "LeftContainer", в зависимости от структуры
        propertyName: "items",
        values: {
            itemType: BPMSoft.controls.ItemType.BUTTON,
            caption: { bindTo: "Resources.Strings.ResubmitForApprovalCaption" },
            click: { bindTo: "onResubmitForApprovalClick" },
            visible: { bindTo: "getIsResubmitButtonVisible" },
            enabled: { bindTo: "getIsResubmitButtonEnabled" },
            style: BPMSoft.controls.ButtonEnums.style.GREEN
        }
    }
]
```

Локализуемая строка `ResubmitForApprovalCaption` = «Отправить на согласование заново».

#### 3. Методы видимости и обработчик клика

```javascript
methods: {
    /**
     * Видимость кнопки: только для записей в стадии «На доработке».
     * Дополнительно — только автор записи может нажать (CreatedBy = current user).
     */
    getIsResubmitButtonVisible: function() {
        var stage = this.get("UsrLaborRecordsStage");
        var stageName = stage ? stage.displayValue : null;
        if (stageName !== "На доработке") {
            return false;
        }
        var createdBy = this.get("CreatedBy");
        var currentUserContact = BPMSoft.SysValue.CURRENT_USER_CONTACT;
        if (!createdBy || !currentUserContact || !currentUserContact.value) {
            return false;
        }
        return createdBy.value === currentUserContact.value;
    },

    /**
     * Кнопка enabled только если запись сохранена (есть Id).
     */
    getIsResubmitButtonEnabled: function() {
        var id = this.get("Id");
        return id && id !== BPMSoft.GUID_EMPTY;
    },

    /**
     * Клик «Отправить на согласование заново».
     * 1. Подтверждение пользователя.
     * 2. UpdateQuery: UsrLaborRecordsStage = "На верификации".
     * 3. Перезагрузка страницы → DCM подхватит смену стадии и создаст новую визу СМ.
     */
    onResubmitForApprovalClick: function() {
        this.showConfirmationDialog(
            "Отправить запись на согласование заново? Будет создана новая виза для сервис-менеджера.",
            function(returnCode) {
                if (returnCode !== BPMSoft.MessageBoxButtons.YES.returnCode) {
                    return;
                }
                this.resubmitForApproval();
            },
            [BPMSoft.MessageBoxButtons.YES.returnCode, BPMSoft.MessageBoxButtons.NO.returnCode]
        );
    },

    resubmitForApproval: function() {
        var recordId = this.get("Id");
        // Сначала найти Id стадии "На верификации" в справочнике UsrLaborRecordsStage
        var stageEsq = this.Ext.create("BPMSoft.EntitySchemaQuery", { rootSchemaName: "UsrLaborRecordsStage" });
        stageEsq.addColumn("Id");
        stageEsq.filters.add("NameFilter",
            stageEsq.createColumnFilterWithParameter(BPMSoft.ComparisonType.EQUAL, "Name", "На верификации"));
        stageEsq.getEntityCollection(function(stageResult) {
            if (!stageResult.success || stageResult.collection.getCount() === 0) {
                this.showInformationDialog("Не найдена стадия «На верификации» в справочнике. Обратитесь к администратору.");
                return;
            }
            var verificationStageId = stageResult.collection.getByIndex(0).get("Id");

            // UpdateQuery — сменить стадию
            var update = this.Ext.create("BPMSoft.UpdateQuery", { rootSchemaName: "UsrLaborRecords" });
            update.setParameterValue("UsrLaborRecordsStage", verificationStageId, BPMSoft.DataValueType.GUID);
            update.filters.add("IdFilter",
                update.createColumnFilterWithParameter(BPMSoft.ComparisonType.EQUAL, "Id", recordId));
            update.execute(function(updResult) {
                if (!updResult.success) {
                    this.showInformationDialog("Не удалось изменить стадию: " +
                        (updResult.errorInfo ? updResult.errorInfo.message : ""));
                    return;
                }
                this.showInformationDialog(
                    "Запись отправлена на согласование заново. Новая виза для сервис-менеджера будет создана автоматически.",
                    function() {
                        // Перезагрузить страницу — увидим новую стадию и созданную визу
                        this.reloadEntity();
                    },
                    this
                );
            }, this);
        }, this);
    }
}
```

**Замечания:**
- Метод `reloadEntity()` — стандартный для BasePageV2. Если не работает — `this.sandbox.publish("UpdatePagesValues", { ... })` или `this.refreshGridData()`.
- Точное имя контейнера для кнопки (`ActionButtonsContainer`, `LeftContainer`, `combinedModeActionButtonsCardLeftContainer`) зависит от родителя. Подтвердить через инспектор DOM при первом запуске.
- Если DCM **не реагирует** на программную смену стадии (R4 для виз → может распространяться и на стадии): добавить второй шаг — InsertQuery в `UsrLaborRecordsVisa` создаёт новую визу СМ напрямую. Тогда кнопка делает оба действия.

### R4-вариант (если DCM не подхватывает смену стадии)

Запасной механизм — программное создание визы:

```javascript
createNewVisaForServiceManager: function(recordId, smContactId) {
    var insert = this.Ext.create("BPMSoft.InsertQuery", { rootSchemaName: "UsrLaborRecordsVisa" });
    insert.setParameterValue("UsrLaborRecords", recordId, BPMSoft.DataValueType.GUID);
    insert.setParameterValue("Visator", smContactId, BPMSoft.DataValueType.GUID);
    insert.setParameterValue("Status", /* GUID статуса "Ожидает визирования" */, BPMSoft.DataValueType.GUID);
    insert.setParameterValue("VisaOwner", /* GUID создателя визы */, BPMSoft.DataValueType.GUID);
    insert.execute(function(result) { /* ... */ }, this);
}
```

**Решение R4 принимается на этапе тестирования T-18 (сценарий 8).** Если DCM подхватывает — кнопка делает только UpdateQuery. Если не подхватывает — добавляется создание визы.

### Verify

1. Создать тестовую запись с переработкой → пройти весь цикл до отклонения руководителем → стадия «На доработке».
2. Открыть запись под автором (инженером): на панели действий **видна кнопка «Отправить на согласование заново»**.
3. Под другим инженером (не автором) — кнопка НЕ видна.
4. Под СМ или руководителем — кнопка НЕ видна (только автор может).
5. Нажать кнопку → подтверждение → стадия меняется на «На верификации».
6. Проверить в БД: `SELECT * FROM "UsrLaborRecordsVisa" WHERE "UsrLaborRecordsId" = '<id>' ORDER BY "CreatedOn" DESC` — должна появиться **новая виза** для СМ договора (либо автоматически от DCM, либо после R4-варианта).
7. СМ получает уведомление в центре уведомлений (как в первый раз).
8. Цикл повторяется: СМ утверждает → стадия «На утверждении» → виза руководителя.

### Откат

Снять с публикации замещение страницы → F5. Кнопка пропадёт. Существующие записи в стадии «На доработке» останутся в этой стадии — потребуется ручной перевод через админа.

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

| Колонка | Источник | Замечания |
|---------|----------|-----------|
| Дата работ | UsrWorkDate | Сортировка по умолчанию (DESC) |
| **Дата создания** | CreatedOn | Когда запись создана (для контроля «не списано вовремя») — Находка 2.10 |
| Сотрудник | CreatedBy | |
| Обращение | UsrCase.Number | |
| Договор | UsrServicePact.Name | |
| **Номер Лида** | UsrLeadNumber | Из договора, для интеграции с ERP — Находка 2.10 |
| Длительность (мин) | виртуальная `UsrTotalMinutes` (= Hours\*60 + Minutes) | Добавить через мастер виртуальных колонок |
| Переработка | UsrOverTime | |
| Стадия | UsrLaborRecordsStage | Пустая для записей без переработки (Q4) |
| Сервис-менеджер | UsrServicePact.UsrResponsibleServiceManager | Для фильтрации СМ по своим договорам |
| **Разрешены сверхурочные** | UsrServicePact.UsrOvertimeAllowed | Информационная колонка для контроста переработки vs условия договора — Находка 2.10 |
| Формально рабочее время | UsrIsFormallyWorkTime | Подсветка жёлтым (T-16) |
| Комментарий | UsrWorkComments | |

### Фильтры

**Базовые (доступны всем ролям):**

- Период (`UsrWorkDate`)
- Сотрудник (`CreatedBy`)
- Обращение / Договор
- Тип записи: Все / Только переработки / Только без переработки (Q4)
- Стадия (`UsrLaborRecordsStage`) — отображается только в режимах «Все» и «Только переработки»

**«Требуют моего внимания» — детализация по ролям (Q11, Находка 2.11):**

Это **динамический фильтр**, логика зависит от роли текущего пользователя. Реализуется через JS-метод `getDefaultFilters` или через несколько фильтров с условием на роль.

| Роль | Логика фильтра |
|------|----------------|
| `CTI.Инженеры` | `CreatedBy = [#CurrentUserContact#] AND UsrLaborRecordsStage = "На доработке"` — записи инженера, отклонённые СМ или руководителем (Находка 4.2) |
| `CTI.Ответственные сервис-менеджеры` | `UsrLaborRecordsStage = "На верификации" AND UsrServicePact.UsrResponsibleServiceManager = [#CurrentUserContact#]` — переработки на верификации по СВОИМ договорам (Q11) |
| `CTI.Руководители сервис-менеджеров` | `UsrLaborRecordsStage = "На верификации"` — все переработки на верификации (страховка для отсутствующих СМ) |
| `CTI.Руководители согласования трудозатрат` | `UsrLaborRecordsStage = "На утверждении"` — переработки, ожидающие финального утверждения |
| `CTI.Аналитики трудозатрат` | Фильтр **скрыт** или показывает все записи без фильтрации (у аналитика нет «своих» задач — Q12) |
| Системный администратор | `UsrLaborRecordsStage IN ("На верификации", "На утверждении")` — все «висящие» задачи для контроля |

**Реализация:**

Если пользователь имеет несколько ролей — фильтр работает по **наиболее специфичной** (Инженер → СМ → Руководитель СМ → Руководитель согласования → Аналитик → Админ). Логика проверки роли в JS:

```javascript
getDefaultFilters: function() {
    var filters = this.Ext.create("BPMSoft.FilterGroup");
    var currentContactId = BPMSoft.SysValue.CURRENT_USER_CONTACT.value;

    // Определить роль через ESQ к SysUserInRole (можно закешировать в атрибуте схемы раздела)
    if (this.isUserInRole("CTI.Инженеры")) {
        filters.add("EngineerFilter",
            this.Terrasoft.createColumnFilterWithParameter(
                BPMSoft.ComparisonType.EQUAL, "CreatedBy", currentContactId));
        filters.add("StageFilter",
            this.Terrasoft.createColumnFilterWithParameter(
                BPMSoft.ComparisonType.EQUAL, "UsrLaborRecordsStage.Name", "На доработке"));
    }
    // ... аналогично для остальных ролей
    return filters;
}
```

**Альтернатива — без JS:** создать **6 предустановленных групп** в реестре (для каждой роли — своя группа с фиксированными условиями). Пользователь сам выбирает свою. Менее автоматично, но проще в реализации и поддержке.

**Рекомендация:** для MVP — **6 предустановленных групп** (без JS). В v2 — переделать на динамический по роли.

### Verify

1. Раздел появился в меню → реестр открывается → все 13 колонок видны.
2. Колонка «Дата создания» отличается от «Дата работ» (когда списано задним числом).
3. Колонка «Номер Лида» подтягивается из договора.
4. Колонка «Разрешены сверхурочные» показывает true/false из договора.
5. Под пользователем-инженером в группе «Требуют моего внимания» — только записи самого инженера в стадии «На доработке».
6. Под СМ-1 в той же группе — только переработки в стадии «На верификации» по договорам, где СМ-1 ответственный.
7. Под руководителем согласования — только переработки в стадии «На утверждении».
8. Под аналитиком группа «Моё внимание» либо скрыта, либо показывает всё без фильтрации.

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

## T-18 — E2E-тестирование на dev (15 сценариев)

**Этап:** 7 (Тестирование)
**Зависит от:** T-01..T-17
**Артефакт:** Test
**Время:** 6ч (расширено с 4ч после Группы D — добавлены сценарии 11-15)

### Подготовка тестовой среды

Перед прогоном сценариев — создать тестовые данные:

- **Тестовые пользователи:** инженер-1 (CTI.Инженеры), инженер-2 (CTI.Инженеры, для проверки B2 видимости), СМ-1, СМ-2, руководитель-1, аналитик-1, админ. Пароли — стандартные тестовые.
- **Тестовый договор A:** ServicePact с заполненным `UsrResponsibleServiceManager = СМ-1`, `UsrOvertimeAllowed = true`.
- **Тестовый договор B:** ServicePact **без** `UsrResponsibleServiceManager` (для проверки Q1).
- **Тестовое обращение A1:** Case по договору A.
- **Тестовое обращение B1:** Case по договору B.
- **Календарь:** убедиться, что `UsrLaborRecordsCalendarId` = реальный рабочий календарь с настройкой выходных.

### Сценарии 1-10: бизнес-логика (из ARCHITECTURE раздел 7)

1. **Инженер — переработка в выходной.** Под инженер-1 на CasePage A1: лента → сообщение клиенту в субботу 11:00 → popup → 1ч + переработка + комментарий → подтвердить. **Ожидается:** сообщение опубликовано, запись создана с `UsrSourceMessage` на новый Activity, DCM запустился, стадия "На верификации", виза СМ-1.

2. **СМ — утверждение через центр уведомлений.** Под СМ-1: открыть колокольчик → группа "Визирование" → Утвердить запись из (1) с комментарием "Подтверждаю, действительно работа в выходной". **Ожидается:** стадия → "На утверждении", виза для руководителя-1.

3. **Руководитель — утверждение по одной → email.** Под руководителем-1: раздел "Управление трудозатратами" → фильтр "Моё внимание" → видит запись → открыть → нажать "Утвердить" на панели действий. **Ожидается:** стадия → "Утверждено", инженер-1 получил email с темой "Ваша переработка по обращению №[#] согласована".

4. **Аналитик — фильтр + Excel.** Под аналитик-1: раздел → фильтр "Период: прошлая неделя, тип: только переработки, стадия: Утверждено" → видит запись из (3) → действия → Экспорт в Excel. **Ожидается:** скачался файл, в нём колонка длительности в минутах = 60, есть колонки Дата создания, Номер Лида, Разрешены сверхурочные. Кнопок Утвердить/Отклонить у аналитика НЕТ.

5. **Инженер — обычное сообщение без переработки.** Под инженер-1 на CasePage A1: внутренний комментарий в среду 14:00 → popup → 30 мин + галка переработки НЕ ставится → подтвердить. **Ожидается:** сообщение опубликовано, запись `UsrOverTime=false`, **DCM НЕ запустился**, стадия пустая, виз нет, в реестре фильтр "Только без переработки" показывает эту запись.

6. **Инженер — ручное добавление через деталь.** Под инженер-1 на CasePage A1: деталь "Трудозатраты" → Добавить → дата = вчера 18:00, длительность 2ч, **переработка отмечена**, комментарий. **Ожидается:** запись создана, `UsrSourceMessage` пустой, DCM запустился (потому что переработка), стадия "На верификации". Поле UsrOverTime было видимо при создании.

7. **Подсветка формально рабочего времени.** Под инженер-1: создать запись с переработкой в понедельник 14:00. **Ожидается:** EventListener поставил `UsrIsFormallyWorkTime=true`, в реестре строка подсвечена жёлтым. Под руководителем-1: открыть → отклонить с комментарием "Не учитывается". Инженер получил email со ссылкой и причиной.

8. **Возврат на доработку → новая виза СМ (Q3, B2).** Продолжение (7): после отклонения руководителем стадия = "На доработке". Под инженер-1: открыть запись → видна кнопка "Отправить на согласование заново" → нажать → подтверждение → стадия → "На верификации", **создана новая виза для СМ-1**. Под инженер-2 (другой инженер): открыть ту же запись → кнопка НЕ видна. Под СМ-1: видит новую визу в колокольчике.

9. **Защита от договоров без СМ (Q1, 3 уровня) — разбито на 9a/9b/9c (Находка 5.4):**

   - **9a (уровень 1, UI required):** под СМ-1 открыть договор B → попытка сохранить с пустым `UsrResponsibleServiceManager` → UI блокирует ("обязательное поле").
   - **9b (уровень 2, EventListener):** под админом через JS-консоль выполнить `BPMSoft.InsertQuery` на UsrLaborRecords с `UsrCase = B1` (договор без СМ) → ожидается ошибка с понятным текстом.
   - **9c (уровень 3, UI-фильтр):** под инженер-1 открыть CasePage B1 → лента → "Опубликовать" → ожидается сообщение "Невозможно списать время... Обратитесь к руководителю сервиса", popup НЕ открывается, сообщение НЕ публикуется. Также — на CasePage A1 деталь "Трудозатраты" → Добавить → в lookup "Обращение" обращение B1 НЕ показывается.

10. **Попытка списать 4 дня назад.** Под инженер-1: на CasePage A1 → ручное добавление через деталь → дата = 5 дней назад → ошибка "Дата работ не может быть раньше чем 3 календарных дней назад". То же через popup.

### Сценарии 11-15: расширение (Группа D, Этап 5 верификации)

11. **Изменение UsrOverTime после создания (Находка 4.3).** Под инженер-1: создать запись с `UsrOverTime=false`, проверить — DCM не запустился. Открыть запись → поставить галку "Переработка" → сохранить. **Цель:** определить поведение DCM. Если DCM запустился — отлично. Если нет — нужно бизнес-правило (зафиксировать как находку для v2).

12. **Не-инженер пишет в ленту (Находка 5.2 — критично!).** Под СМ-1, руководителем-1, аналитик-1, админом по очереди: на CasePage A1 → лента → сообщение → "Опубликовать". **Ожидается для всех 4 ролей:** popup НЕ открывается, сообщение публикуется напрямую как обычно. **Без этого сценария — риск регрессии: лента может сломаться для всех остальных ролей.**

13. **СМ отклоняет на верификации (Находка 5.3).** Под инженер-1 создать запись с переработкой → стадия "На верификации" → виза СМ-1. Под СМ-1: отклонить с комментарием "Не вижу подтверждения переработки в комментарии работ". **Ожидается:** стадия → "На доработке", виза руководителя НЕ создана, инженер-1 получил email "возвращена на доработку. Комментарий: ...". Покрывает путь СМ → "На доработке" (отдельно от руководителя).

14. **Действия администратора (Находка 5.1).** Под админом: открыть любую запись на любой стадии → попытаться **изменить стадию вручную** через карточку → сохраняется. Создать запись через деталь — сохраняется без ограничений ролей. **Удалить** запись через действие "Удалить" → запись удалена из БД. Цель: убедиться, что у админа есть полный контроль для расшивки нештатных ситуаций.

15. **Регресс старых функций (Находка 5.5).** Открыть CasePage обращения, по которому есть **старые** записи UsrLaborRecords (созданные до внедрения, без UsrWorkDate, UsrLaborRecordsStage). **Ожидается:** (a) деталь "Трудозатраты" видна и показывает старые записи, (b) старые записи открываются без ошибок, (c) автозаполнение UsrServicePact из UsrCase работает при создании новой записи через деталь, (d) колонки реестра в новом разделе для старых записей показывают пустоту в новых полях, не падают.

### Чеклист

**Функциональный:**

- [ ] Все 15 сценариев пройдены успешно.
- [ ] Найденные баги зафиксированы и исправлены, повторный прогон проблемных.
- [ ] Email-уведомления приходят (проверить Inbox получателей в каждом из сценариев 3, 7, 8, 13).
- [ ] Сценарий 12 (не-инженер) пройден для всех 4 не-инженерных ролей — критично для регрессии.
- [ ] R4 (DCM реакция на программную смену стадии в сценарии 8) — зафиксировать поведение, при необходимости активировать резервный механизм в T-13.5.
- [ ] response.id vs response.activityId в T-11 (сценарий 1) — зафиксировано точное имя свойства, при необходимости поправлен код.

**Производительность (Находка 5.6):**

- [ ] Открытие popup ≤ 1 сек.
- [ ] Сохранение записи через popup ≤ 2 сек.
- [ ] Раздел "Управление трудозатратами" с 1000+ записей открывается ≤ 3 сек.
- [ ] Фильтр "Моё внимание" применяется ≤ 1 сек.
- [ ] Email после смены стадии приходит ≤ 30 сек.
- [ ] Переход DCM между стадиями (после клика "Утвердить") ≤ 2 сек.

**Видимость и роли:**

- [ ] Кнопка "Отправить на согласование заново" (T-13.5) видна только автору записи в стадии "На доработке" (сценарий 8).
- [ ] У роли Аналитик НЕТ кнопок Утвердить/Отклонить (сценарий 4).
- [ ] Подсветка жёлтым работает только для `UsrIsFormallyWorkTime=true` (сценарий 7).

### Откат

Если сценарий проваливается — откатывать конкретный тикет в обратном порядке. Сводный откат всего MVP: см. T-19 секция "Откат".

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

T-08 + T-09 ─────→ T-13 (DCM) ──→ T-13.5 (кнопка "Отправить заново")
                              └──→ T-14 (BPMN+Email)

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
7. T-13 → T-13.5 (параллельно T-14)
8. T-15 → T-16, T-17
9. T-18 (E2E)
10. T-19 (прод)
