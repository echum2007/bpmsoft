# Инструкция по внедрению индикатора режима обслуживания на CasePage

**Проект:** BPMSoft 1.9, пакет CTI (`21b087cf-bb70-cdc0-5180-6979fdd2220c`)
**Дата:** 2026-04-05
**Статус:** Реализовано, ожидает переноса на прод

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
  - Любой другой код (Hour, Day, Minute) → режим **24×7**
- **Связь с договором:** через `ServiceInServicePact` (не напрямую через `ServicePact`)
- **Атрибут:** `UsrServiceMode` (TEXT, виртуальный, только в памяти страницы)
- **Отображение:** `contentType: BPMSoft.ContentType.LABEL` — модельный элемент в формате надписи
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

### DOM-элемент (результат)

```html
<label id="CasePageUsrServiceModeLabelLabel"
    class="t-label usr-service-mode-label usr-service-mode-calendar"
    data-item-marker="UsrServiceModeLabel">24×7 (календарное время)</label>
```

---

## Компоненты

| # | Артефакт | Тип | Статус |
|---|---|---|---|
| 1 | CSS-схема `UsrCasePageCSS` | Модуль с LESS (в CTI) | ✅ |
| 2 | Атрибут `UsrServiceMode` в CasePage | JS (attributes) | ✅ |
| 3 | Элемент `UsrServiceModeLabel` в diff | JS (diff, contentType: LABEL) | ✅ |
| 4 | Методы updateServiceModeIndicator, getServiceModeVisible, applyServiceModeStyle | JS (methods) | ✅ |
| 5 | Вызовы в `onEntityInitialized` и `onConfItemChanged` | JS (methods) | ✅ |
| 6 | Подписки dependencies на Priority, ServiceItem, ServicePact | JS (attributes) | ✅ |

---

## Шаг 1. CSS-схема `UsrCasePageCSS`

> В BPMSoft 1.9 отдельного типа схемы «CSS» нет. Стили оформляются как **«Модуль»** (ClientUnit) с LESS-файлом.

### Инструкция
1. Открыть **Конфигурация** → пакет **CTI**
2. Нажать **«Добавить»** → **«Модуль»**
3. Название схемы: `UsrCasePageCSS`
4. В JS-редакторе заменить содержимое на:

```javascript
define("UsrCasePageCSS", [], function() {
    return {};
});
```

5. Переключиться на вкладку **LESS** и вставить:

```less
.usr-service-mode-label {
    padding: 2px 0;
    margin-bottom: 4px;
}

.usr-service-mode-label.usr-service-mode-working {
    display: inline-block;
    background-color: #e8f5e9;
    color: #2e7d32;
    font-weight: bold;
    padding: 2px 8px;
    border-radius: 4px;
}

.usr-service-mode-label.usr-service-mode-calendar {
    display: inline-block;
    background-color: #ffebee;
    color: #c62828;
    font-weight: bold;
    padding: 2px 8px;
    border-radius: 4px;
}
```

> **Важно:** CSS-селекторы `.class1.class2` (оба класса на одном элементе), а НЕ `.class1 .class2` (вложенность) — `<label>` не содержит вложенных элементов.

6. **Сохранить**

---

## Шаг 2. Полный код CasePage (CTI)

Вставляется через **мастер раздела → Исходный код** (сохраняет локализацию).

Можно также через **Конфигурация → CTI → CasePage → Исходный код**, но тогда **сначала** нужно сохранить через мастер раздела без изменений, чтобы зафиксировать ресурсы локализации.

### Ключевые элементы индикатора в коде

**В `attributes`:**

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

Подписки на `ServicePact` и `ServiceItem` добавлены в их собственные `dependencies`:

```javascript
// В ServicePact.dependencies:
{ columns: ["ServicePact"], methodName: "updateServiceModeIndicator" },

// В ServiceItem.dependencies:
{ columns: ["ServiceItem"], methodName: "updateServiceModeIndicator" },
```

> **Важно:** подписка `onServicePactChanged` в ServicePact.dependencies должна быть сохранена — не заменять её, а добавить рядом.

**В `diff`:**

```javascript
{
    "operation": "insert",
    "name": "UsrServiceModeLabel",
    "parentName": "ProfileContainer",
    "propertyName": "items",
    "index": 2,
    "values": {
        "contentType": BPMSoft.ContentType.LABEL,
        "caption": {"bindTo": "UsrServiceMode"},
        "visible": {"bindTo": "getServiceModeVisible"},
        "classes": {"labelClass": ["usr-service-mode-label"]},
        "layout": {
            "colSpan": 24,
            "column": 0,
            "row": 2
        }
    }
},
```

> Используется `contentType: BPMSoft.ContentType.LABEL` — модельный элемент с типом отображения «надпись». Именно так ProfileContainer может его отрисовать. Документация: `klientskaya-razrabotka.pdf`, стр. 972.

**В `methods`:**

```javascript
updateServiceModeIndicator: function() {
    var priority = this.get("Priority");
    var serviceItem = this.get("ServiceItem");
    var servicePact = this.get("ServicePact");

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
        } else if (code.length > 0) {
            this.set("UsrServiceMode", "24×7 (календарное время)");
        } else {
            this.set("UsrServiceMode", "");
        }
        this.applyServiceModeStyle();
    }, this);
},

getServiceModeVisible: function() {
    var mode = this.get("UsrServiceMode");
    return !Ext.isEmpty(mode);
},

applyServiceModeStyle: function() {
    var mode = this.get("UsrServiceMode") || "";
    Ext.defer(function() {
        var el = document.querySelector(".usr-service-mode-label");
        if (!el) {
            return;
        }
        el.classList.remove("usr-service-mode-working", "usr-service-mode-calendar");
        if (mode.indexOf("8") >= 0) {
            el.classList.add("usr-service-mode-working");
        } else if (mode.indexOf("24") >= 0) {
            el.classList.add("usr-service-mode-calendar");
        }
    }, 100, this);
},
```

**Вызовы:**

```javascript
// В onEntityInitialized — в конце метода:
this.updateServiceModeIndicator();

// В onConfItemChanged — в конце ESQ-коллбека, после this.set("Account", ...):
this.updateServiceModeIndicator();
```

---

## Публикация и проверка

1. **Сохранить** через мастер раздела (или Конфигурацию)
2. На странице **Конфигурация** нажать кнопку **«Компилировать»**
3. Очистить кэш браузера: **Ctrl+Shift+R**
4. Открыть обращение где заполнены Приоритет, Сервис и Сервисный договор
5. Под полем «Приоритет» должен появиться индикатор:
   - 🟢 **8×5 (рабочее время)** — зелёным
   - 🔴 **24×7 (календарное время)** — красным
6. Изменить Приоритет — индикатор должен обновиться без сохранения
7. Создать новое обращение, выбрать КЕ — индикатор должен заполниться автоматически

---

## Известные ограничения

| Ситуация | Поведение |
|---|---|
| Не заполнен хотя бы один из трёх полей (Приоритет/Сервис/Договор) | Индикатор скрыт |
| В `TimeToPrioritize` нет записи для данной комбинации | Индикатор скрыт |

---

История подходов и журнал изменений → [SERVICE_MODE_INDICATOR_HISTORY.md](SERVICE_MODE_INDICATOR_HISTORY.md)
