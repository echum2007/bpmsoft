# Этап 2 — Сверка ARCHITECTURE раздел 3 (TO-BE) vs TICKETS

**Дата:** 2026-04-24
**Охват:** ARCHITECTURE подразделы 3.1–3.7 (модель данных, popup, ручная деталь, формально рабочее время, DCM, раздел, уведомления)
**Цель:** убедиться, что каждый архитектурный механизм имеет тикет и реализация в тикете соответствует проектному решению

---

## 3.1 Модель данных

### UsrLaborRecords — новые колонки

| Колонка | Тип | Источник ARCHITECTURE | Тикет | Статус |
|---|---|---|---|---|
| UsrWorkDate | DateTime, default Now, валидация [Now-N; Now] | 3.1 + Q8 | T-03 колонка 1 | ✅ |
| UsrSourceMessage | Lookup → Activity, nullable | 3.1 + замечание 2.2 #2 | T-03 колонка 2 | ✅ |
| UsrIsFormallyWorkTime | Boolean, computed в OnSaving | 3.1 + 3.4 | T-03 колонка 3 | ✅ |
| UsrLaborRecordsStage | Lookup → стадии DCM | 3.1 + 3.5 | T-03 колонка 4 (создание справочника + 6 записей) | ✅ |
| UsrOverTime — сделать редактируемым | — | 3.1 | T-03 "Изменить существующую" | ✅ |
| UsrTotalMinutes (виртуальная) | computed Hours*60+Minutes | 3.1 + 3.6 | T-15 (в реестре, не в объекте) | ✅ |
| UsrOverTimeApproval | deprecated, не использовать | 3.1 + Q7 | Не трогаем — оставлено как deprecated | ✅ |

**Замечаний нет.**

### ServicePact (CTI replace) — новые колонки

| Колонка | Тип | Источник | Тикет | Статус |
|---|---|---|---|---|
| UsrOvertimeAllowed | Boolean, default false | 3.1 | T-02 колонка 1 | ✅ |
| UsrResponsibleServiceManager | Lookup → Contact, ОБЯЗАТЕЛЬНОЕ | 3.1 + Q1 уровень 1 | T-02 колонка 2 + T-02 "На странице ServicePactPage: isRequired: true" | ✅ |

**Q1 защита — 3 уровня:**

| Уровень | ARCHITECTURE 3.1 | Реализация |
|---|---|---|
| UI required | На форме ServicePactPage | T-02 (isRequired: true в attributes) ✅ |
| Сервер OnSaving throw Exception | UsrLaborRecordsEventListener | T-07 (метод GetResponsibleSmId + throw) ✅ |
| UI-фильтр в popup lookup «Обращение» | `UsrServicePact.UsrResponsibleServiceManager IS NOT NULL` | T-10 (popup) + T-11 (publisher) | ❌ **НЕ РЕАЛИЗОВАНО** |

### 🔴 Находка 2.1 — Q1 уровень 3 (UI-фильтр lookup) НЕ РЕАЛИЗОВАН

**Проблема:** ARCHITECTURE 3.1 явно указывает третий уровень защиты:
> UI-фильтр в popup: lookup «Обращение» фильтруется условием `UsrServicePact.UsrResponsibleServiceManager IS NOT NULL`.

В T-10 (popup) — поля формы: Дата, Часы, Минуты, Переработка, Комментарий. **Поля «Обращение» (Case) в popup нет** — popup работает через `MasterRecordId` (Case уже открыт). Значит lookup-фильтр не там.

Что должно быть: при создании записи через **деталь** `UsrSchema021c2f40Detail` на CasePage/ServicePactPage — поле "Обращение" (Case) в форме `UsrLaborRecords.Page` должно фильтроваться так, чтобы не показывать обращения без ответственного СМ в договоре.

**Правка:** добавить в **T-12** (бизнес-правила на странице) или в T-03 (атрибуты страницы) фильтр lookup:
- Поле: `UsrCase`
- Фильтр: `UsrCase.ServicePact.UsrResponsibleServiceManager IS NOT NULL`

Или, поскольку в popup Case не выбирается (он передаётся через MasterRecordId), третий уровень защиты фактически выглядит так:
- На CasePage — кнопка "Опубликовать" открывает popup только если у текущего Case договор имеет СМ. Иначе — сообщение "У договора не назначен СМ, обратитесь к руководителю" вместо popup.

**Рекомендация:** в T-11 (замещение SocialMessagePublisherPage) добавить проверку перед `openLaborRecordsModal`:
```javascript
// Проверка: у договора текущего Case есть ли СМ
this.checkServicePactHasResponsibleSM(function(hasSM) {
    if (!hasSM) {
        this.showInformationDialog(
            "У договора данного обращения не назначен ответственный сервис-менеджер. " +
            "Обратитесь к руководителю сервиса."
        );
        return;
    }
    this.openLaborRecordsModal();
}, this);
```

И для детали — в T-03 или T-12 добавить фильтр на lookup `UsrCase`.

### SysSettings

| Код | Тип | По умолчанию | ARCHITECTURE | Тикет | Статус |
|---|---|---|---|---|---|
| UsrLaborRecordsMaxBackdateDays | Int | 3 | 3.1 + Q10 | T-04 настройка 1 | ✅ |
| UsrLaborRecordsCalendarId | Lookup Calendar | = BaseCalendar | 3.1 | T-04 настройка 2 | ✅ |
| UsrLaborRecordsRequireVisaComment | Boolean | true | 3.1 | T-04 настройка 3 (с пометкой "проверить стандартную RequireVisaComment") | ⚠️ |

### 🟡 Находка 2.2 — UsrLaborRecordsRequireVisaComment — неясная реализация

**Проблема:** в T-04 написано:
> Проверить — может, уже есть стандартная `RequireVisaComment` (используется механизмом виз). Если есть — нашу не создавать.

Это TBD. Нужно проверить в продуктовой системе наличие стандартной настройки ДО внедрения.

**Правка:** добавить в T-04 шаг pre-check:
```sql
SELECT "Code", "DefValue" FROM "SysSettings"
WHERE "Code" IN ('RequireVisaComment', 'UsrRequireVisaComment')
  OR "Code" ILIKE '%requireVisaComment%';
```
Если есть — используем её, нашу не создаём. Если нет — создаём `UsrLaborRecordsRequireVisaComment`.

---

## 3.2 Popup-конвейер (Q5)

Архитектурная схема из 3.2 — сравнение с реализацией T-11:

| Шаг схемы ARCHITECTURE 3.2 | Реализация T-10/T-11 | Статус |
|---|---|---|
| Замещение SocialMessagePublisherPage + onPublishButtonClick override | T-11 (полный код onPublishButtonClick) | ✅ |
| Если LaborRecordsConfirmed=true → callParent | T-11 (начало onPublishButtonClick) | ✅ |
| Проверка роли CTI.Инженеры | T-11 (checkUserInEngineerRole через ESQ) | ✅ |
| ModalBox.show + loadModule UsrLaborRecordsModalPage | T-10 (модуль) + T-11 (openLaborRecordsModal) | ✅ |
| Префилл: Case (MasterRecordId), Date=now, Duration, OverTime | T-10 init (WorkDate=Now) | ⚠️ префилл Case/ServicePact не делается в popup — он не нужен в форме (берётся из MasterRecordId в onLaborRecordsConfirmed) |
| После подтверждения: InsertQuery UsrLaborRecords + set флаг + повторный onPublishButtonClick | T-11 (onLaborRecordsConfirmed) | ✅ |
| После публикации: UpdateQuery UsrSourceMessage | T-11 (onPublished + linkLaborRecordToActivity) | ✅ |

### 🟡 Находка 2.3 — Двухшаговое создание: ID Activity неопределён

**Проблема:** в T-11 коде `onPublished`:
```javascript
var activityId = response && response.activityId; // или response.id, см. базовый publish
```

В комментарии сам код говорит "точное имя свойства проверить в DevTools при первом запуске". Это TBD, который критично разрешить до T-11 верификации.

**Как проверить:** на dev-сервере после T-08 (визы ещё не нужны) опубликовать сообщение через ленту CasePage с breakpoint на `onPublished`. Посмотреть объект `response`:
- `response.activityId`?
- `response.id`?
- `response.data.id`?

В distinct предложу также смотреть `this.get("MasterRecordId")` или воспользоваться последней созданной Activity через SELECT по `Owner+Case+CreatedOn`.

**Правка в T-11:** добавить verify-шаг:
> Перед публикацией — подтвердить имя свойства в `response` через DevTools breakpoint. Обновить `linkLaborRecordToActivity` с точным именем.

### Валидация в popup

| Правило ARCHITECTURE 3.2 | T-10 validateForm | Статус |
|---|---|---|
| Дата ∈ [now-N; now] | ✅ (minDate/now check) | ✅ |
| Длительность ≥ 1 минута | ✅ (totalMinutes < 1) | ✅ |

**Про Hours/Minutes bounds (0-23, 0-59):** в T-10 НЕ проверяется (полагается на input control). **Такое же замечание в Находке 1.2 по T-07 сервер.** Если фронт пропустит (через импорт/консоль) — упадёт через OnSaving.

---

## 3.3 Ручная деталь (запасной канал)

ARCHITECTURE 3.3 правила:
- UsrSourceMessage — пустой ✅ (не заполняем при ручном создании)
- Галка «Переработка» — **доступна, НЕ скрыта** (отменяет старое решение) ✅ — в T-03 "снять признак Read-only на странице"
- Бизнес-правило "скрыть OverTime при пустом UsrSourceMessage" — **отменено** ✅

**Тикет покрытия:** T-12 (бизнес-правила) + T-03 (колонка редактируема).

**Замечаний нет** — но это место стоит явно проверить в T-12: там написано только про валидацию дат и длительности, а требование "OverTime виден всегда" неявно (это отсутствие правила).

### 🟡 Находка 2.4 — T-12 не содержит явной проверки "OverTime виден"

**Проблема:** в T-12 три правила (дата не в будущем, дата не раньше N дней, длительность ≥1). Ни одно правило не запрещает что-либо связанное с OverTime. Но и явного упоминания "OverTime должен быть виден всегда" тоже нет.

Формально это ОК (отсутствие правила = поле видно по умолчанию). Но чтобы не было разночтений — добавить в T-12 явное указание:

**Правка:** в T-12 добавить раздел:
> **Поле UsrOverTime:** всегда видимо и редактируемо на странице (отмена старого решения о скрытии при пустом UsrSourceMessage, см. ARCHITECTURE 3.3, Q5 уточнение 2026-04-25). Никаких бизнес-правил, скрывающих это поле, НЕ создавать.

---

## 3.4 Формально рабочее время (EventListener)

Сравнение ARCHITECTURE 3.4 и T-07:

| Элемент 3.4 | T-07 код | Статус |
|---|---|---|
| Шаг 1: защита от пустого ServicePact | T-07 (servicePactId == Guid.Empty) | ✅ |
| Шаг 1: защита от пустого СМ (Q1 уровень 2) | T-07 (GetResponsibleSmId + throw) | ✅ |
| Шаг 2: если UsrOverTime=false → IsFormallyWorkTime=false, return | T-07 | ✅ |
| Каскад календаря: ServiceInServicePact → ServicePact → SysSettings → BaseCalendar | T-07 ResolveCalendarId (3 попытки: ServicePact.CalendarId, SysSettings, BaseCalendar) | ⚠️ **ServiceInServicePact пропущен** |
| TermCalculatorActions.IsTimeInWorkingInterval | T-07 | ✅ |
| Требует рестарт Kestrel | T-07 "Шаги внедрения" п.5 | ✅ |

### 🟡 Находка 2.5 — ResolveCalendarId: пропущен ServiceInServicePact

**Проблема:** в ARCHITECTURE 3.4 каскад описан в 3 шага:
1. `ServiceInServicePact.CalendarId` — если есть
2. `ServicePact.CalendarId` — если есть
3. `base.GetCalendarId()` (системный)

В T-07 (метод `ResolveCalendarId`) — тоже 3 шага, но:
1. `ServicePact.Calendar` (первым!)
2. SysSettings `UsrLaborRecordsCalendarId`
3. SysSettings `BaseCalendar`

**Расхождения:**
- **ServiceInServicePact пропущен полностью** — это самый специфичный уровень (календарь конкретной услуги в договоре).
- Порядок: в ARCHITECTURE сначала самое специфичное (ServiceInServicePact → ServicePact), в T-07 сразу ServicePact.

**Вопрос:** нужен ли ServiceInServicePact для labor-records? У записи UsrLaborRecords нет прямой связи с ServiceInServicePact (только Case → ServicePact). Чтобы достать ServiceInServicePact — нужно через `UsrCase.Service` или подобное, что усложняет код и может быть избыточно.

**Решение (предлагаю):** оставить T-07 как есть (без ServiceInServicePact), но убрать упоминание ServiceInServicePact из ARCHITECTURE 3.4 — оно взято из `TermCalculatorITILService.GetCalendarId()` для сценария обращений, а для записей трудозатрат эта гранулярность не нужна.

**Правка:** в ARCHITECTURE 3.4 заменить каскад на:
> 1. `ServicePact.CalendarId` — если есть
> 2. SysSettings `UsrLaborRecordsCalendarId`
> 3. SysSettings `BaseCalendar`

Либо — если нужен ServiceInServicePact — дополнить T-07 код. Требует решения.

### 🟡 Находка 2.6 — T-07 код не использует `using System.Linq;`

**Проблема:** в T-07 код использует `.FirstOrDefault()` в двух местах, но в namespace нет `using System.Linq;`. В замечаниях к коду упомянуто: «`using System.Linq;` нужно добавить в начало (для `FirstOrDefault`).»

**Правка:** добавить `using System.Linq;` в список using в начале файла.

### 🟡 Находка 2.7 — T-07 не проверяет UserConnection

**Проблема:** в коде:
```csharp
var entity = (Entity)sender;
var userConnection = entity.UserConnection;
```

У `Entity` нет публичного свойства `UserConnection` в некоторых версиях платформы — обычно `Entity.UserConnection` есть, но это нужно подтвердить. Альтернатива — через `args.UserConnection` (но `EntityBeforeEventArgs` тоже не всегда это содержит).

**Как проверить:** сверить с NotebookLM BPMSoft Documentation — стандартный паттерн получения UserConnection в EntityEventListener в BPMSoft 1.9.

**Рекомендация:** на этапе реализации — свериться с примером из `bpmsoft-new-schema` скилла или NotebookLM. Если `entity.UserConnection` не работает → использовать `(args as EntityEventArgs).Entity.UserConnection` или другой паттерн.

---

## 3.5 DCM + Визирование

| Элемент ARCHITECTURE 3.5 | T-08/T-09/T-13 | Статус |
|---|---|---|
| Галка "Доступно визирование в разделе" | T-08 | ✅ (R5 необратимо, отмечено) |
| Автосоздание UsrLaborRecordsVisa | T-08 verify | ✅ |
| Права на UsrLaborRecordsVisa | T-09 (матрица ролей) | ✅ |
| Настройка колонок раздела (UsrLaborRecordsStage + UsrOverTime) | T-13 "Шаги настройки колонок раздела" | ✅ |
| Условие запуска кейса: UsrOverTime=true | T-13 "Создание кейса" | ✅ (Q4) |
| Стадия Черновик (начальная) | T-13 | ✅ |
| Стадия На верификации + элемент Визирование (СМ) | T-13 | ✅ |
| Стадия На утверждении + элемент Визирование (руководитель) | T-13 | ✅ |
| Стадия На доработке + ручная кнопка "Отправить на согласование заново" | T-13 (описание + "MVP-вариант: кнопка на панели действий") | ⚠️ **кнопка не детализирована в тикете** |
| Стадия Утверждено (конечная) | T-13 | ✅ |
| Стадия Отклонено (неиспользуется в MVP) | T-13 | ✅ |
| Изменение прав по стадиям | T-13 "Изменение прав по стадиям" | ✅ (помечено "если объектные права не покрывают — пропустить") |

### 🔴 Находка 2.8 — Кнопка "Отправить на согласование заново" — нет реализации

**Проблема:** в T-13 стадия "На доработке" описана так:
> Без активных элементов из коробки.
> Переход на «На верификации» — **по ручному действию инженера** «Отправить на согласование заново» (Q3 — новая виза СМ).
> Реализация: либо отдельная кнопка на странице, либо смена `UsrLaborRecordsStage` через бизнес-правило при редактировании. **MVP-вариант:** кнопка на панели действий, которая (1) обнуляет старые визы и (2) ставит `UsrLaborRecordsStage = На верификации`. DCM сам подхватит и создаст новую визу СМ.

Это описание, не тикет. **В тикет-плане T-13 нет отдельного подшага "создать кнопку"**, нет кода.

**Последствие:** если оставить так — инженер на стадии "На доработке" не сможет отправить запись заново. Это блокер Q3.

**Правка:** либо:
- **Вариант A (рекомендуется):** выделить в отдельный подтикет **T-13.5** или расширить T-13 с детальным описанием:
  - Добавить на страницу `UsrLaborRecords.Page` кнопку "Отправить на согласование заново"
  - Видимость: только если `UsrLaborRecordsStage = "На доработке"` И `CreatedBy = CurrentUser`
  - Клик: UpdateQuery → ставит `UsrLaborRecordsStage = "На верификации"` + создаёт новую визу через механизм DCM (или через InsertQuery на UsrLaborRecordsVisa)
  - Нужен тест: проверить, что DCM реагирует на смену stage programmatic-ally
- **Вариант B:** использовать бизнес-правило "при редактировании записи в стадии На доработке + сохранении с определённым флагом → сменить stage". Менее явный UX, но меньше кода.

**Оценка:** +2ч в тикет T-13 или отдельный T-13.5 (+2ч).

### 🟡 Находка 2.9 — Каноническая настройка условия запуска кейса

**Проблема:** ARCHITECTURE 3.5 и T-13 согласны в части "BPMN-обёртка не требуется, встроенный механизм мастера разделов". Но нюанс:

> Документация рекомендует отключить любые BPMN-процессы перевода по стадиям для разделов с DCM.

В T-14 мы создаём BPMN `UsrLaborRecordsNotifications`, который **слушает изменение стадии** UsrLaborRecordsStage. Это не "перевод по стадиям" (перевод делает DCM), а "реакция на изменение стадии" (отправка email). Формально не противоречит, но нужно явно разграничить в документации.

**Правка:** в T-14 добавить пометку:
> **BPMN слушает, не управляет.** Этот процесс запускается **после** изменения `UsrLaborRecordsStage` (триггер — изменение колонки), отправляет email и завершается. Он НЕ меняет `UsrLaborRecordsStage` — это задача DCM. Не путать.

---

## 3.6 Раздел «Управление трудозатратами»

| Элемент 3.6 | T-15/T-16/T-17 | Статус |
|---|---|---|
| Мастер разделов, объект UsrLaborRecords | T-15 | ✅ |
| Колонки реестра (13 штук) | T-15 (10 + УТО в списке) | ⚠️ (см. ниже) |
| Виртуальная UsrTotalMinutes | T-15 | ✅ |
| Фильтры: Период, Сотрудник, Обращение, Договор, Тип, Стадия, Моё внимание | T-15 | ✅ |
| "Моё внимание" — комплексный фильтр | T-15 (описан словесно, без SQL) | ⚠️ |
| Стандартное действие "Экспорт в Excel" | T-15 (не упомянуто явно) | ⚠️ |
| Правило цветового выделения (жёлтый) | T-16 | ✅ |
| Права на раздел (объектные) | T-06 | ✅ |
| Рабочие места для 5 ролей | T-17 | ✅ |

### 🟡 Находка 2.10 — Колонки реестра: список неполный

**Проблема:** в ARCHITECTURE 3.6 колонок 13:
> Дата работ, Дата создания, Сотрудник, Обращение, Договор, **Номер Лида**, Длительность, Переработка, Стадия, Сервис-менеджер, **Разрешены сверхурочные**, Комментарий, Формально рабочее время.

В T-15 колонок 10:
> Дата работ, Сотрудник, Обращение, Договор, Длительность, Переработка, Стадия, Сервис-менеджер, Формально рабочее время, Комментарий.

**Пропущены в T-15:**
- Дата создания (`CreatedOn`)
- **Номер Лида** (`UsrLeadNumber`) — важно для интеграции с ЕRP
- **Разрешены сверхурочные** (`UsrServicePact.UsrOvertimeAllowed`)

**Правка:** в T-15 добавить 3 колонки в таблицу "Колонки реестра":
| Колонка | Источник |
|---|---|
| Дата создания | CreatedOn |
| Номер Лида | UsrLeadNumber |
| Разрешены сверхурочные | UsrServicePact.UsrOvertimeAllowed |

### 🟡 Находка 2.11 — Фильтр "Моё внимание" — нет детализации

**Проблема:** в ARCHITECTURE 3.6:
> «Требуют моего внимания» — комплексный фильтр: `Stage IN (На верификации, На утверждении) AND UsrServicePact.UsrResponsibleServiceManager = currentContactId` (для сервис-менеджера), `Stage = На утверждении` (для руководителя).

В T-15 фильтр упомянут ("«Мое внимание»"), но без формулы и без разбиения по ролям.

Это не критично — на этапе реализации можно настроить через конструктор фильтров, но для единообразной поддержки лучше зафиксировать.

**Правка:** в T-15 после таблицы колонок добавить:

```
### Фильтр "Требуют моего внимания" — логика

Для роли `CTI.Ответственные сервис-менеджеры`:
  UsrLaborRecordsStage = "На верификации"
  AND UsrServicePact.UsrResponsibleServiceManager = [#CurrentUserContact#]

Для роли `CTI.Руководители сервис-менеджеров`:
  UsrLaborRecordsStage = "На верификации"

Для роли `CTI.Руководители согласования трудозатрат`:
  UsrLaborRecordsStage = "На утверждении"

Для роли `CTI.Инженеры`:
  CreatedBy = [#CurrentUserContact#]
  AND UsrLaborRecordsStage = "На доработке"
```

Реализация — через динамическую группу в разделе (условие на текущего пользователя и его роль).

### 🟡 Находка 2.12 — "Экспорт в Excel" не в тикете

**Проблема:** ARCHITECTURE 3.6 явно пишет "«Экспорт в Excel» — стандартное действие BPMSoft." В T-15 это не упомянуто — но это "из коробки", отдельный тикет не нужен.

Однако для аналитиков (Q2) важно убедиться, что право на экспорт у роли есть.

**Правка:** в T-06 (права) добавить в заметку:
> Для `CTI.Аналитики трудозатрат` — право на операцию "Экспорт в Excel" в разделе (стандартное право BPMSoft, проверить).

---

## 3.7 Уведомления

| Событие ARCHITECTURE 3.7 | Канал | Реализация | Тикет | Статус |
|---|---|---|---|---|
| Назначена виза (На верификации) | Центр + email | Встроено визированием | T-08 | ✅ |
| Назначена виза (На утверждении) | Центр + email | Встроено | T-08 | ✅ |
| Виза положительная | Email | BPMN + шаблон `UsrLaborRecordsVisaPositive` | T-14 | ✅ |
| Виза отрицательная | Email | BPMN + шаблон `UsrLaborRecordsVisaNegative` | T-14 | ✅ |
| Возврат на доработку | Email | BPMN + шаблон `UsrLaborRecordsSendBack` | T-14 | ✅ |
| Напоминание о просроченной визе | Email | Системное (если настроено) | — | ⚠️ |

### 🟡 Находка 2.13 — "Напоминание о просроченной визе" — TBD

**Проблема:** в ARCHITECTURE 3.7 строка:
> Напоминание о просроченной визе | Визирующий | Email | Системное (если настроено)

Это не в MVP или есть из коробки? Ни в одном тикете (T-14) не упомянуто.

**Решение (предлагаю):** для MVP — оставить "как есть, если платформа шлёт — хорошо, если нет — доработка в v2". В DECISIONS пункт Q-overdue не поднимался.

**Правка:** в ARCHITECTURE 3.7 уточнить:
> Напоминание о просроченной визе — стандартное системное уведомление платформы (если настроен `OverdueVisaReminder` или аналог). **В MVP отдельной реализации нет.** Если нужна персонализация — в v2.

И пометить в "Что НЕ в MVP" в разделе 10.

### 🟡 Находка 2.14 — Комментарии отклонения в email — как работает Q9?

**Проблема:** Q9 говорит — комментарии живут ТОЛЬКО в `UsrLaborRecordsVisa.Comment`. В T-14 шаблоны email используют макрос `[#VisaComment#]`:
> Тело: «...Причина: [#VisaComment#]...»

**Вопрос:** как BPMN `UsrLaborRecordsNotifications` достаёт комментарий последней визы, чтобы передать его в шаблон? Стандартные макросы EmailTemplate работают только с полями объекта `UsrLaborRecords`, не с JOIN на `UsrLaborRecordsVisa`.

**Варианты реализации:**
- **A.** В BPMN Script Task — ESQ на `UsrLaborRecordsVisa` WHERE `UsrLaborRecords = [#id#]` ORDER BY `CreatedOn DESC` LIMIT 1, взять `Comment`, передать в EmailWithMacrosManager через MacroValues.
- **B.** Добавить виртуальную колонку на `UsrLaborRecords` `UsrLastVisaComment` (computed) — но это противоречит Q9 "комментарии только в визе".
- **C.** Использовать макрос с путём `[#UsrLaborRecordsVisa.Comment#]` — если платформа поддерживает обратные JOIN в макросах (маловероятно).

**Правка:** в T-14 явно описать Вариант A:
> **BPMN Script Task "Извлечь комментарий визы":**
> ```csharp
> var esq = new EntitySchemaQuery(uc.EntitySchemaManager, "UsrLaborRecordsVisa");
> var commentCol = esq.AddColumn("Comment").Name;
> esq.Filters.Add(esq.CreateFilterWithParameters(
>     FilterComparisonType.Equal, "UsrLaborRecords", laborRecordId));
> esq.AddOrderBy("CreatedOn", OrderDirectionStrict.Descending);
> esq.RowCount = 1;
> var visa = esq.GetEntityCollection(uc).FirstOrDefault();
> var visaComment = visa != null ? visa.GetTypedColumnValue<string>(commentCol) : "";
> // Передать в MacroValues для EmailTemplate
> ```

Либо использовать встроенный элемент "Отправить Email" с настройкой получения значения visa comment через отдельное параметризованное действие.

**Оценка:** +1ч в T-14 (реализация Script Task + тест).

---

## Итог Этапа 2

### Покрытие тикетами

| Подраздел 3.x | Тикеты | Покрытие |
|---|---|---|
| 3.1 Модель данных | T-02, T-03, T-04 | 100% ✅ |
| 3.2 Popup | T-10, T-11 | 95% (Находка 2.3 — response.id TBD) |
| 3.3 Ручная деталь | T-12 | 90% (Находка 2.4 — явность OverTime) |
| 3.4 Формально рабочее | T-07 | 85% (Находки 2.5–2.7: календарь, using, UserConnection) |
| 3.5 DCM | T-08, T-09, T-13 | 80% (Находка 2.8 — кнопка "Отправить заново" не детализирована — БЛОКЕР Q3) |
| 3.6 Раздел | T-15, T-16, T-17 | 90% (Находки 2.10–2.12: колонки, фильтр, экспорт) |
| 3.7 Уведомления | T-14 | 85% (Находки 2.13–2.14: просроченные, VisaComment в email) |

### Находок: 14

**🔴 Критические (блокеры Q-решений):**
- **2.1** Q1 уровень 3 (UI-фильтр lookup) НЕ реализован в тикетах — popup проверяет роль, но не фильтрует Case без СМ.
- **2.8** Кнопка "Отправить на согласование заново" — нет тикета/кода. Блокер Q3 (возврат на Этап 1).

**🟡 Важные (нужны правки или решения):**
- **2.2** UsrLaborRecordsRequireVisaComment — неясно, дублирует ли стандартную
- **2.3** response.activityId vs response.id — TBD в коде
- **2.4** T-12 явно не говорит "OverTime виден"
- **2.5** ResolveCalendarId каскад — ServiceInServicePact пропущен
- **2.6** `using System.Linq;` не в T-07
- **2.7** UserConnection из Entity — проверить паттерн
- **2.9** BPMN слушает vs управляет — разграничить в T-14
- **2.10** T-15: 3 колонки реестра пропущены
- **2.11** Фильтр "Моё внимание" — нет детализации SQL
- **2.12** Экспорт в Excel — право роли Аналитики
- **2.13** Напоминание о просроченной визе — TBD в MVP
- **2.14** VisaComment в email — нужен Script Task

### Блокеры для внедрения

**Один реальный блокер:** Находка 2.8 — без тикета на кнопку "Отправить заново" инженер не сможет вернуть запись из "На доработке" на новый круг согласования. Это ломает Q3.

**Оценка правок:**
- Находка 2.8 (кнопка) — +2ч (расширение T-13 или новый T-13.5)
- Находка 2.1 (UI-фильтр lookup) — +1ч (добавить в T-11 проверку + в T-12 фильтр)
- Находка 2.14 (VisaComment в email) — +1ч (Script Task в T-14)
- Остальные 11 находок — мелкие точечные правки ~2-3ч суммарно

**Общее увеличение оценки MVP:** ~6ч. Итого с буфером ~50ч (было 44ч).

**Следующий этап:** сверка ARCHITECTURE разделы 4 (карта артефактов), 5 (порядок внедрения), 6 (матрица задача↔способ) vs TICKETS.
