# Инструкция по внедрению индикатора режима обслуживания на CasePage

**Проект:** BPMSoft 1.9, пакет CTI (`21b087cf-bb70-cdc0-5180-6979fdd2220c`)
**Дата:** 2026-04-05
**Статус:** 📋 Готово к внедрению

---

## Суть задачи

Добавить на страницу обращения (CasePage) визуальный индикатор **«Режим обслуживания»** под полем «Приоритет».

- **8×5 (рабочее время)** — зелёный текст
- **24×7 (календарное время)** — красный текст

Индикатор вычисляется на лету через ESQ к таблице `TimeToPrioritize` по трём полям обращения: Приоритет + Сервис + Сервисный договор. В БД не сохраняется.

---

## Архитектура решения

- **Источник данных:** `TimeToPrioritize.SolutionTimeUnit.Code`
  - Code содержит `"Working"` → режим **8×5**
  - Code содержит `"Calendar"` → режим **24×7**
- **Связь с договором:** через `ServiceInServicePact` (не напрямую через `ServicePact`)
- **Атрибут:** `UsrServiceMode` (TEXT, виртуальный, только в памяти страницы)
- **Обновление:** при изменении Priority, ServiceItem, ServicePact, а также при открытии обращения (`onEntityInitialized`) и после автозаполнения из КЕ (`onConfItemChanged`)

### Справочник TimeUnit (из БД)

| Id | Code | Режим |
|---|---|---|
| `2a608ed7-d118-402a-99c0-2f583291ed2e` | WorkingHour | 8×5 |
| `bdcbb819-9b26-4627-946f-d00645a2d401` | WorkingDay | 8×5 |
| `3ab432a6-ca84-4315-ba33-f343c758a8f0` | WorkingMinute | 8×5 |
| `b788b4de-5ae9-42e2-af34-cd3ad9e6c96f` | Hour | 24×7 |
| `36df302e-5ab6-43a0-aec7-45c2795d839d` | Day | 24×7 |
| `48b4ff98-e3bf-4f59-a6cf-284e4084fb2f` | Minute | 24×7 |

---

## Компоненты

| # | Артефакт | Тип | Статус |
|---|---|---|---|
| 1 | CSS-схема `UsrCasePageCSS` | CSS (новая схема в CTI) | ⬜ |
| 2 | Атрибут `UsrServiceMode` в CasePage | JS (правка attributes) | ⬜ |
| 3 | Элемент `UsrServiceModeLabel` в diff | JS (правка diff) | ⬜ |
| 4 | Методы в CasePage | JS (правка methods) | ⬜ |
| 5 | Вызовы в `onEntityInitialized` и `onConfItemChanged` | JS (правка methods) | ⬜ |

---

## Шаг 1. CSS-схема `UsrCasePageCSS`

### Инструкция
1. Открыть **Конфигурация** → пакет **CTI**
2. Нажать **«Добавить»** → **«CSS»**
3. Название схемы: `UsrCasePageCSS`
4. Вставить код:

```css
.usr-service-mode-working .label-inner {
    color: #2e7d32;
    font-weight: bold;
}

.usr-service-mode-calendar .label-inner {
    color: #c62828;
    font-weight: bold;
}
```

5. **Сохранить** → **Опубликовать**

---

## Шаг 2. Правки в `CasePage` (CTI)

**Конфигурация → CTI → CasePage → Исходный код**

⚠️ **Критичное правило:** все методы должны быть строго **внутри** блока `methods: { ... }`. Код вне `methods` платформа игнорирует.
⚠️ **Не заменять весь исходный код схемы** — это сбросит ресурсы локализации (кнопки переключатся на английский). Вносить только точечные правки.

---

### Правка 2.1 — Атрибут `UsrServiceMode`

Найти блок `attributes: {` и добавить атрибут **первым** (перед `"ServicePact"`):

```javascript
"UsrServiceMode": {
    dataValueType: BPMSoft.DataValueType.TEXT,
    dependencies: [
        {
            columns: ["Priority"],
            methodName: "updateServiceModeIndicator"
        }
    ]
},
```

> Подписка на `Priority` здесь. Подписки на `ServiceItem` и `ServicePact` добавим в их существующие `dependencies` ниже.

---

### Правка 2.2 — Подписка на изменение `ServicePact`

Найти в атрибуте `"ServicePact"` блок `dependencies` и добавить новый элемент:

```javascript
// Найти:
dependencies: [
    {
        columns: ["ServicePact"],
        methodName: "onServicePactChanged"
    },
    // ...
]

// Добавить в массив:
{
    columns: ["ServicePact"],
    methodName: "updateServiceModeIndicator"
},
```

---

### Правка 2.3 — Подписка на изменение `ServiceItem`

Найти в атрибуте `"ServiceItem"` блок `dependencies` и добавить:

```javascript
{
    columns: ["ServiceItem"],
    methodName: "updateServiceModeIndicator"
},
```

---

### Правка 2.4 — Элемент индикатора в `diff`

Найти в блоке `diff` операцию `move` для `ServicePact`:

```javascript
{
    "operation": "move",
    "name": "ServicePact",
    "parentName": "ProfileContainer",
    "propertyName": "items",
    "index": 4
},
```

Добавить **перед** ней (через запятую) новый элемент:

```javascript
{
    "operation": "insert",
    "name": "UsrServiceModeLabel",
    "values": {
        "itemType": {"bindTo": "BPMSoft.ViewItemType.LABEL"},
        "caption": {"bindTo": "UsrServiceMode"},
        "labelClass": {"bindTo": "getServiceModeLabelClass"},
        "visible": {"bindTo": "getServiceModeVisible"}
    },
    "parentName": "ProfileContainer",
    "propertyName": "items",
    "index": 2
},
```

> `index: 2` — сразу после поля «Приоритет» (CasePriority стоит на index 1).

---

### Правка 2.5 — Три новых метода в `methods`

Найти конец метода `onConfItemChanged` (последний метод в блоке `methods`) и добавить после него через запятую:

```javascript
/**
 * Обновляет индикатор режима обслуживания.
 * ESQ к TimeToPrioritize по Priority + ServiceItem + ServicePact.
 * SolutionTimeUnit.Code: "Working*" → 8×5, "Calendar*" → 24×7.
 * Вызывается через dependencies при изменении любого из трёх полей,
 * а также явно из onConfItemChanged и onEntityInitialized.
 */
updateServiceModeIndicator: function() {
    var priority = this.get("Priority");
    var serviceItem = this.get("ServiceItem");
    var servicePact = this.get("ServicePact");

    // Если не все три поля заполнены — сбрасываем индикатор
    if (!priority || !priority.value ||
        !serviceItem || !serviceItem.value ||
        !servicePact || !servicePact.value) {
        this.set("UsrServiceMode", "");
        return;
    }

    var esq = Ext.create("BPMSoft.EntitySchemaQuery", {
        rootSchemaName: "TimeToPrioritize"
    });

    esq.addColumn("SolutionTimeUnit.Code", "TimeUnitCode");

    esq.filters.add("FilterPriority",
        BPMSoft.createColumnFilterWithParameter(
            BPMSoft.ComparisonType.EQUAL,
            "CasePriority", priority.value));

    esq.filters.add("FilterServiceItem",
        BPMSoft.createColumnFilterWithParameter(
            BPMSoft.ComparisonType.EQUAL,
            "ServiceInServicePact.ServiceItem", serviceItem.value));

    esq.filters.add("FilterServicePact",
        BPMSoft.createColumnFilterWithParameter(
            BPMSoft.ComparisonType.EQUAL,
            "ServiceInServicePact.ServicePact", servicePact.value));

    esq.getEntityCollection(function(result) {
        if (!result.success || result.collection.getCount() === 0) {
            this.set("UsrServiceMode", "");
            return;
        }
        var entity = result.collection.getByIndex(0);
        var code = entity.get("TimeUnitCode") || "";

        if (code.indexOf("Working") >= 0) {
            this.set("UsrServiceMode", "8×5 (рабочее время)");
        } else if (code.indexOf("Calendar") >= 0) {
            this.set("UsrServiceMode", "24×7 (календарное время)");
        } else {
            this.set("UsrServiceMode", "");
        }
    }, this);
},

/**
 * CSS-класс для Label индикатора.
 * Зелёный для 8×5, красный для 24×7.
 */
getServiceModeLabelClass: function() {
    var mode = this.get("UsrServiceMode") || "";
    if (mode.indexOf("8×5") >= 0) {
        return ["usr-service-mode-label", "usr-service-mode-working"];
    } else if (mode.indexOf("24×7") >= 0) {
        return ["usr-service-mode-label", "usr-service-mode-calendar"];
    }
    return ["usr-service-mode-label"];
},

/**
 * Видимость индикатора — только если значение определено.
 */
getServiceModeVisible: function() {
    var mode = this.get("UsrServiceMode");
    return !Ext.isEmpty(mode);
}
```

---

### Правка 2.6 — Вызов при открытии обращения (`onEntityInitialized`)

Найти метод `onEntityInitialized` и добавить вызов в конце перед закрывающей `}`:

```javascript
onEntityInitialized: function() {
    this.callParent(arguments);
    // ... существующий код ...
    this.startBackgroundUpdater();

    // ДОБАВИТЬ:
    this.updateServiceModeIndicator();
},
```

---

### Правка 2.7 — Вызов после автозаполнения из КЕ (`onConfItemChanged`)

Найти в методе `onConfItemChanged` коллбек `esq.getEntityCollection`. Внутри него, **после** последнего `this.set("Account", ...)`, добавить:

```javascript
// После:
if (accountsByConfItem.length > 0) {
    this.set("Account", { ... });
}

// ДОБАВИТЬ:
this.updateServiceModeIndicator();
```

> Важно вызывать именно здесь, внутри коллбека — к этому моменту ServicePact и ServiceItem уже установлены через this.set().

---

## Публикация и проверка

1. **Сохранить** → **Опубликовать** CasePage
2. Очистить кэш браузера: **Ctrl+Shift+R**
3. Открыть любое обращение где заполнены Приоритет, Сервис и Сервисный договор
4. Под полем «Приоритет» должен появиться индикатор:
   - 🟢 **8×5 (рабочее время)** — зелёным
   - 🔴 **24×7 (календарное время)** — красным
5. Изменить Приоритет — индикатор должен обновиться без сохранения
6. Создать новое обращение, выбрать КЕ — индикатор должен заполниться автоматически вместе с Сервисом и Договором

### Проверка в консоли браузера (F12)

```javascript
BPMSoft.require(["CasePage"], function(schema) {
    var methods = Object.keys(schema.methods || {});
    console.log("updateServiceModeIndicator:", methods.indexOf("updateServiceModeIndicator") >= 0);
    console.log("getServiceModeLabelClass:", methods.indexOf("getServiceModeLabelClass") >= 0);
    console.log("getServiceModeVisible:", methods.indexOf("getServiceModeVisible") >= 0);
});
```

---

## Известные ограничения

| Ситуация | Поведение |
|---|---|
| Не заполнен хотя бы один из трёх полей (Приоритет/Сервис/Договор) | Индикатор скрыт |
| В `TimeToPrioritize` нет записи для данной комбинации | Индикатор скрыт |
| Приоритет изменён — индикатор не обновляется | Не должно быть: подписка через `dependencies` на `Priority` |

---

## Журнал изменений

| Дата | Изменение |
|---|---|
| 2026-04-05 | Документ создан. Инструкция готова к внедрению. |
