---
name: bpmsoft-analyst
description: >
  Эксперт по кастомизации платформы BPMSoft 1.9. Используй этот скилл всегда, когда
  задача касается BPMSoft: кастомизации объектов, UI (секции, карточки, детали),
  C# серверной логики, клиентского JavaScript, бизнес-процессов (BPMN),
  интеграций, EntityEventListener, ESQ-запросов, пакетов, управления поставками,
  отладки ошибок. Триггеры: «BPMSoft», «обращение», «Case», «ServicePact»,
  «замещение», «схема», «пакет CTI», «мастер разделов», «деталь», «EntitySchemaQuery»,
  «EventListener», «публикация», «OpublikovAt».
---

# BPMSoft 1.9 — Аналитик-разработчик

## ⚠️ ОБЯЗАТЕЛЬНОЕ ПРАВИЛО — РАБОТА С ИСХОДНИКАМИ

При любом вопросе об исходниках BPMSoft (схемы объектов, JS страниц, C# классов, BPMN-процессов):

1. **НИКОГДА не просить пользователя загружать файлы вручную**
2. **СРАЗУ** использовать `Filesystem:copy_file_user_to_claude` для копирования нужного .gz файла с машины пользователя
3. Исходники пакетов: `C:\Users\echum\Documents\BPMsoft\src\<PackageName>.gz`
4. Документация PDF: `C:\Users\echum\Documents\BPMsoft\Documentation 1.9\<Раздел>\<файл>.pdf`
5. Индекс документации: `C:\Users\echum\Documents\BPMsoft\DOCUMENTATION_INDEX.md`
6. .gz пакеты парсить через Python на Claude-контейнере: gunzip → `struct.unpack('<I', data, pos)` (4 байта LE = длина имени в UTF-16 code units, затем имя UTF-16LE, затем 4 байта длина контента, затем контент)

**Примеры:**
- Нужен `CasePage.js` → `Filesystem:copy_file_user_to_claude("C:\Users\echum\Documents\BPMsoft\src\CTI.gz")` → распарсить → найти `Schemas/CasePage/CasePage.js`
- Нужна схема `TimeToPrioritize` → скопировать `SLMITILService.gz` → распарсить → найти `Schemas/TimeToPrioritize/`
- Нужна документация по серверной разработке → скопировать соответствующий PDF и извлечь текст через `pdftotext`

## Контекст проекта

- **Платформа:** BPMSoft 1.9, .NET 8, C#, JavaScript/AMD, BPMN
- **Основной кастомный пакет:** **CTI** (UId: `21b087cf-bb70-cdc0-5180-6979fdd2220c`) — все доработки только сюда. Пакет **Custom** не используется для разработки.
- **Иерархия пакетов:** Базовые → Custom → **CTI** (CTI наследует всё)
- **Префикс пользовательских объектов:** `Usr` (системная настройка `SchemaNamePrefix`)
- **Namespace C#:** `BPMSoft.Configuration`
- **Документация:** PDF-файлы в папке `Documentation 1.9/Для разработчика/` — источник истины по API

## Принципы работы

Claude **не вносит изменения напрямую в систему**, а выдаёт:
1. **Анализ задачи** — что нужно, какие объекты затронуты
2. **Готовый код** (C#, JavaScript, SQL) — с пояснениями
3. **Пошаговую инструкцию по внедрению** в BPMSoft

Если информации недостаточно — спрашивать, не додумывать. Не фантазировать: система продуктивная, только достоверные данные. Если предлагается неоптимальный вариант — возражать и доказывать лучший.

---

## Выбор способа реализации

| Задача | Способ |
|---|---|
| Новый объект / колонка | UI: Конфигурация → дизайнер объекта, затем Опубликовать |
| Замещение объекта | UI: Конфигурация → Добавить → Замещающий объект |
| Страница / деталь (UI) | JavaScript AMD-модуль → схема «Клиентский модуль» в Конфигурации |
| Серверная логика / сервис | C# → схема «Исходный код» в Конфигурации → Опубликовать |
| EventListener | C# → схема «Исходный код» → Опубликовать → ⚠️ **перезапуск Kestrel** |
| BPMN-процессы | Дизайнер процессов (с Script Task на C# для сложной логики) |
| SQL-миграции | Конфигурация → Добавить → SQL-сценарий |
| Простые бизнес-правила | Мастер разделов (no-code) |

**⚠️ Нюансы UI (проверено на практике):**
- Кнопка открытия мастера раздела называется **«Настройка вида»** (не «Вид»)
- В мастере раздела кнопка **«Сохранить»**, а не «Опубликовать» — изменения применяются автоматически
- `GetColumnValue<T>` на `IDataReader` требует `using BPMSoft.Common`

---

## Схемы UId — текущие замещения в CTI

| Схема | UId замещения в CTI | Родитель UId |
|---|---|---|
| Case | `19cc53cb-28eb-4288-bd79-cea46e02bff4` | `117d32f9-8275-4534-8411-1c66115ce9cd` |
| ServicePact | `46e84fce-9ad8-4b09-8407-281cbb4cb824` | `595ddbda-31ce-4cca-9bdd-862257ceaf23` |
| CasePage | `17fc86cf-3425-49a8-ba13-840c514bf34d` | — |
| ServicePactPage | `f7a41e49-b2a3-4f00-a31d-da14efe43756` | — |

Полный список схем и UId — в `references/uids-and-schemas.md`.

---

## Серверная разработка (C#)

### EntitySchemaQuery (ORM)

```csharp
// Рекомендуемый способ чтения данных
var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "Case");
esq.AddColumn("Id");
esq.AddColumn("UsrCcEmails");
esq.Filters.Add(esq.CreateFilterWithParameters(
    FilterComparisonType.Equal, "Id", caseId));

var collection = esq.GetEntityCollection(UserConnection);
foreach (var entity in collection) {
    var cc = entity.GetTypedColumnValue<string>("UsrCcEmails");
}
```

### Прямые SQL-запросы (Select/Update/Delete)

```csharp
// Для сложных JOIN или когда ESQ избыточен
var select = new Select(UserConnection)
        .Column("Case", "UsrCcEmails")
        .Column("ServicePact", "UsrCcEmails").As("PactCcEmails")
    .From("Case")
    .LeftOuterJoin("ServicePact")
        .On("Case", "ServicePactId").IsEqual("ServicePact", "Id")
    .Where("Case", "Id").IsEqual(Column.Parameter(caseId))
    as Select;

using (var dbExecutor = UserConnection.EnsureDBConnection())
using (var reader = select.ExecuteReader(dbExecutor)) {
    if (reader.Read()) {
        var value = reader.GetColumnValue<string>("UsrCcEmails"); // требует using BPMSoft.Common
    }
}
```

```csharp
// Update
var update = new Update(UserConnection, "Case")
    .Set("UsrCcEmails", Column.Parameter(mergedValue))
    .Where("Id").IsEqual(Column.Parameter(caseId))
    as Update;
update.Execute();
```

### EntityEventListener

```csharp
[EntityEventListener(SchemaName = "Activity")]
public class UsrActivityCcEventListener : BaseEntityEventListener
{
    public override void OnSaving(object sender, EntityBeforeEventArgs e)
    {
        var entity = (Entity)sender;
        var typeId = entity.GetTypedColumnValue<Guid>("TypeId");
        // ... фильтрация и логика
        entity.SetColumnValue("CopyRecepient", newValue);
    }
}
```

⚠️ После публикации EventListener — **обязательный перезапуск Kestrel** (регистрируется при старте приложения).

### DI / ClassFactory

```csharp
// Получение зависимости
var resolver = ClassFactory.Get<IUsrCcAddressResolver>(
    new ConstructorArgument("userConnection", UserConnection));

// Интерфейс + реализация
public interface IUsrCcAddressResolver {
    string GetCcForCase(Guid caseId);
}

[DefaultBinding(typeof(IUsrCcAddressResolver))]
public class UsrCcAddressResolver : IUsrCcAddressResolver { ... }
```

### Веб-сервис

```csharp
[ServiceContract]
[AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
public class UsrMyService : BaseService
{
    [OperationContract]
    [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json,
               ResponseFormat = WebMessageFormat.Json,
               BodyStyle = WebMessageBodyStyle.Wrapped)]
    public string MyMethod(string param) { ... }
}
```

---

## Клиентская разработка (JavaScript/AMD)

### Структура модуля

```javascript
define("UsrMyPageV2", ["BPMSoft", "ext-base"],
    function(BPMSoft, Ext) {
    return {
        entitySchemaName: "Case",

        // Изменения интерфейса (override/add/remove элементов)
        diff: [
            {
                "operation": "insert",
                "name": "UsrMyField",
                "parentName": "Header",
                "propertyName": "items",
                "values": {
                    "layout": {"column": 0, "row": 3, "colSpan": 12}
                }
            }
        ],

        // Методы страницы
        methods: {
            onEntityInitialized: function() {
                this.callParent(arguments);
                // своя логика
            }
        },

        // Атрибуты (переменные состояния)
        attributes: {
            "UsrMyAttribute": {dataValueType: BPMSoft.DataValueType.TEXT}
        },

        // Подписка на сообщения между модулями
        messages: {}
    };
});
```

### Замещение родительского модуля

```javascript
define("CasePageV2", ["CasePageV2Resources"],
    function(resources) {
    return {
        // ExtendParent: true — модуль расширяет родителя (замещение)
        // Без этого — полная замена
        diff: [ /* только изменения относительно родителя */ ],
        methods: {
            myNewMethod: function() { ... }
        }
    };
});
```

### ESQ из клиентского кода

```javascript
var esq = BPMSoft.EntitySchemaQuery.create("Case");
esq.addColumn("Id");
esq.addColumn("UsrCcEmails");
esq.getEntityCollection(function(result) {
    if (result.success) {
        result.collection.each(function(item) {
            var cc = item.get("UsrCcEmails");
        });
    }
}, this);
```

---

## Реализованные задачи (референс-код)

### CC-адреса в email-уведомлениях по обращениям

**Задача:** Добавить поддержку CC при отправке уведомлений по обращениям (Case) — из самого обращения и из сервисного договора. Входящие письма с CC автоматически сохраняют адреса в обращение.

**Архитектурное решение:**
- Хранение: текстовые колонки `UsrCcEmails` (500 символов) в `Case` и `ServicePact`. Формат: адреса через пробел (аналог стандартного `Activity.CopyRecepient`)
- Точка интеграции: `EntityEventListener` на `Activity` (событие `OnSaving`) — покрывает все пути отправки одним компонентом
- Guid констант (из БД тестовой системы):
  - `EmailActivityTypeId` = `e2831dec-cfc0-df11-b00f-001d60e938c6`
  - `OutgoingMessageTypeId` = `7f6d3f94-f36b-1410-068c-20cf30b39373`
  - Входящие письма: `MessageTypeId = Guid.Empty` (NULL в БД)

**Компоненты:**

| Артефакт | Тип | Пакет | Статус |
|---|---|---|---|
| Колонка `UsrCcEmails` в `Case` | Колонка объекта | CTI | ✅ |
| Колонка `UsrCcEmails` в `ServicePact` | Колонка объекта | CTI | ✅ |
| Поле CC на `CasePage` | Мастер раздела | CTI | ✅ |
| Поле CC на `ServicePactPage` | Мастер раздела | CTI | ✅ |
| `UsrCcAddressResolver` | C# (Исходный код) | CTI | ✅ |
| `UsrActivityCcEventListener` | C# (Исходный код) | CTI | ✅ |

Полный код компонентов — в `references/cc-implementation.md`.

---

## Управление поставками

### Структура пакета на файловой системе

```
Pkg/CTI/
├── descriptor.json          # UId, Name, Version, Maintainer, DependsOn[]
├── Schemas/
│   ├── UsrMyEntity/         # Схема объекта
│   │   ├── descriptor.json
│   │   ├── metadata.json    # UId, тип схемы, родитель
│   │   └── properties.json  # Колонки
│   ├── UsrMyService/        # Исходный код C#
│   │   ├── descriptor.json
│   │   └── UsrMyService.cs
│   └── UsrMyPageV2/         # Клиентский модуль JS
│       ├── descriptor.json
│       └── UsrMyPageV2.js
├── SqlScripts/              # SQL-сценарии
├── Data/                    # Привязанные данные (справочники)
└── Resources/               # Локализация
```

### Перенос между средами

1. Конфигурация → меню пакета → **Экспорт** → скачивается .zip
2. На целевой среде: Дизайнер системы → «Установка и удаление приложений» → «Установить из файла»
3. После импорта — выйти и войти заново
4. ⚠️ Данные (справочники) переносятся только если привязаны к пакету: Конфигурация → пакет → Добавить → Данные

### descriptor.json пакета (пример)

```json
{
  "Descriptor": {
    "UId": "21b087cf-bb70-cdc0-5180-6979fdd2220c",
    "Name": "CTI",
    "BPMSoftVersion": "1.9.0",
    "Maintainer": "Customer",
    "DependsOn": [
      {"UId": "...", "Name": "Custom", "PackageVersion": "1.0.0"}
    ]
  }
}
```

---

## Типичные ошибки и решения

| Ситуация | Причина | Решение |
|---|---|---|
| EventListener не срабатывает | Не перезапущен Kestrel после публикации | Перезапустить Kestrel |
| `GetColumnValue<T>` не найден | Не добавлен `using BPMSoft.Common` | Добавить using |
| Схема не видна в Конфигурации | Не выбран пакет CTI как «Текущий пакет» | Дизайнер системы → Системные настройки → «Текущий пакет» |
| Поле не появляется на странице | Мастер раздела не сохранён или объект не опубликован | Проверить публикацию объекта, сохранить мастер |
| Замещение не работает | Пакет не в зависимостях CTI | Добавить зависимость в descriptor.json |
| `Column.Parameter` выдаёт ошибку типа | Передан `null` | Проверить на null перед передачей |

---

## Архитектура BPMSoft (краткий справочник)

- **Три логических уровня:** Конфигурация (JS + C# + BPMN) → База данных → Ядро (не трогать)
- **Три инфраструктурных уровня:** Браузер → Сервер приложений (.NET 8 / Kestrel) → Данные (PostgreSQL + Redis)
- **Горизонтальное масштабирование:** несколько серверов + Redis для синхронизации сессий
- **Микросервисы:** глобальный поиск (Elasticsearch), ML-сервис, синхронизация почты, поиск дублей
- **Email:** `EmailClient` (SMTP/IMAP), `ExchangeClient` (MS Exchange). Оба принимают `EmailMessage` с коллекцией `Cc`
- **Кэш (Redis):** уровни видимости — запрос / сессия / приложение

---

## Текущее состояние реализованных задач

### CC-адреса в email-уведомлениях
- **Тестовая среда:** все 6 шагов ✅ выполнены
- **Продуктивная среда:** ⬜ не перенесено — ожидает завершения тестирования почтовой подсистемы
- **Частичная проверка:** поле CC заполняется корректно, дедупликация работает
- **Актуальный код:** в `CC_IMPLEMENTATION_GUIDE.md` и в `references/cc-implementation.md`

### SLA-переработка
- Разобрана архитектура расчёта сроков (детали в `references/architecture-packages.md`)
- Вопрос 1 проработан: один сервис «Техподдержка», консультации всегда 8x5
- Вопросы 2–4 не обсуждались

---

## Справочные файлы

Читай при необходимости глубокого погружения:

- `references/uids-and-schemas.md` — все UId схем и объектов, Guid констант из БД
- `references/cc-implementation.md` — полный код CC-уведомлений (UsrCcAddressResolver + UsrActivityCcEventListener)
- `references/architecture-packages.md` — пакеты, gz-формат, SLA-архитектура, email-архитектура
- `references/bpmn-processes.md` — BPMN-процессы уведомлений, Script Task, параметры
- `references/no-code-tools.md` — мастер разделов, бизнес-правила, цветовое выделение, рабочие места

**Документация BPMSoft 1.9 (локально):** `C:\Users\echum\Documents\BPMsoft\DOCUMENTATION_INDEX.md` — индекс 30 PDF (разработчик 8, аналитик 10, администратор 6, пользователь 6)

**Проектные файлы в Claude:** `BPMSOFT_CONFIGURATION_ANALYSIS_3.md` (первичный анализ конфигурации), `CC_IMPLEMENTATION_GUIDE.md` (реализация CC)
