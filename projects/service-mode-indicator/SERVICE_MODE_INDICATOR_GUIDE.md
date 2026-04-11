# Инструкция по внедрению индикатора режима обслуживания на CasePage

**Проект:** BPMSoft 1.9, пакет CTI (`21b087cf-bb70-cdc0-5180-6979fdd2220c`)
**Дата:** 2026-04-05
**Обновлено:** 2026-04-11 (перенесено на прод)
**Статус:** ✅ Внедрено на прод

---

## Суть задачи

Добавить на страницу обращения (CasePage) визуальный индикатор **«Режим обслуживания»** под полем «Приоритет».

- **8×5 (рабочее время)** — зелёный текст на зелёном фоне
- **24×7 (календарное время)** — красный текст на красном фоне

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
| --- | --- | --- |
| `2a608ed7-d118-402a-99c0-2f583291ed2e` | WorkingHour | 8×5 |
| `bdcbb819-9b26-4627-946f-d00645a2d401` | WorkingDay | 8×5 |
| `3ab432a6-ca84-4315-ba33-f343c758a8f0` | WorkingMinute | 8×5 |
| `b788b4de-5ae9-42e2-af34-cd3ad9e6c96f` | Hour | 24×7 |
| `36df302e-5ab6-43a0-aec7-45c2795d839d` | Day | 24×7 |
| `48b4ff98-e3bf-4f59-a6cf-284e4084fb2f` | Minute | 24×7 |

### DOM-элемент (результат)

```html
<label id="CasePageUsrServiceModeLabelLabel"
    class="t-label usr-service-mode-label usr-service-mode-working"
    data-item-marker="UsrServiceModeLabel">8×5 (рабочее время)</label>
```

---

## Компоненты

| # | Артефакт | Тип | Статус |
| --- | --- | --- | --- |
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
1. Нажать **«Добавить»** → **«Модуль»**
1. Название схемы: `UsrCasePageCSS`
1. В JS-редакторе заменить содержимое на:

```javascript
define("UsrCasePageCSS", [], function() {
    return {};
});
```

1. Переключиться на вкладку **LESS** и вставить:

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

1. **Сохранить**

---

## Шаг 2. Полный код CasePage

Вставляется **целиком** через **мастер раздела «Обращения» → Исходный код**.

> ⚠️ **Критично:** первая строка содержит `"css!UsrCasePageCSS"` — с префиксом `css!`. Без него BPMSoft загружает модуль как обычный JS-AMD и LESS-стили **не применяются** (индикатор появится без цвета).

### Что изменено относительно базового продового кода

1. **`define(...)`** — добавлена зависимость `"css!UsrCasePageCSS"`
1. **`attributes.ServicePact.dependencies`** — добавлена подписка на `updateServiceModeIndicator` *(рядом с `onServicePactChanged`, не вместо)*
1. **`attributes.ServiceItem.dependencies`** — добавлена подписка на `updateServiceModeIndicator`
1. **`attributes.UsrServiceMode`** — новый атрибут с подпиской на `Priority`
1. **`diff`** — новый элемент `UsrServiceModeLabel` в `ProfileContainer` с `contentType: BPMSoft.ContentType.LABEL`
1. **`onEntityInitialized`** — вызов `this.updateServiceModeIndicator()` в конце
1. **`onConfItemChanged`** — вызов `this.updateServiceModeIndicator()` в конце ESQ-коллбека
1. **`methods`** — три новых метода: `updateServiceModeIndicator`, `getServiceModeVisible`, `applyServiceModeStyle`

### Код

```javascript
define("CasePage", ["css!UsrCasePageCSS"], function() {
	return {
		entitySchemaName: "Case",
		attributes: {
			"ServicePact": {
				dataValueType: this.BPMSoft.DataValueType.LOOKUP,
				lookupListConfig: {
					filter: function() {
						var availableServicePactIds = [];

						var suitableServicePacts = this.get("SuitableServicePacts");
						Ext.Array.each(suitableServicePacts, function(item) {
							availableServicePactIds.push(item.Id);
						});

						var servicePactsByConfItem = this.get("ServicePactsByConfItem");
						Ext.Array.each(servicePactsByConfItem, function(item) {
							availableServicePactIds.push(item.Id);
						});

						var servicePactsByAccount = this.get("ServicePactsByAccount");
						Ext.Array.each(servicePactsByAccount, function(item) {
							availableServicePactIds.push(item.Id);
						});

						availableServicePactIds = availableServicePactIds.length ? availableServicePactIds : [BPMSoft.GUID_EMPTY];
						return this.BPMSoft.createColumnInFilterWithParameters("Id", availableServicePactIds);
					}
				},
				dependencies: [
					{ columns: ["ServicePact"], methodName: "onServicePactChanged" },
					{ columns: ["ServicePact"], methodName: "updateServiceModeIndicator" },
					{ columns: ["Account"], methodName: "updServicePactsByAccount" },
					{ columns: ["ConfItem"], methodName: "onConfItemChanged" }
				]
			},
			"ServiceItem": {
				dataValueType: this.BPMSoft.DataValueType.LOOKUP,
				lookupListConfig: {
					filter: function() {
						var availableServiceItemIds = [];
						var serviceItemsByConfItem = this.get("ServiceItemsByConfItem");
						Ext.Array.each(serviceItemsByConfItem, function(item) {
							availableServiceItemIds.push(item.Id);
						});
						if (availableServiceItemIds.length > 0) {
							return this.BPMSoft.createColumnInFilterWithParameters("Id", availableServiceItemIds);
						} else {
							return this.getServiceItemFilters();
						}
					}
				},
				dependencies: [
					{ columns: ["ConfItem"], methodName: "onConfItemChanged" },
					{ columns: ["ServiceItem"], methodName: "updateServiceModeIndicator" }
				]
			},
			"ServiceCategory": {
				dataValueType: this.BPMSoft.DataValueType.LOOKUP
			},
			"ConfItem": {
				dataValueType: this.BPMSoft.DataValueType.LOOKUP,
				hideActions: true,
				lookupListConfig: {
					filter: function() {
						var availableConfItemIds = [];
						var confItemsByAccount = this.get("ConfItemsByAccount");
						Ext.Array.each(confItemsByAccount, function(item) {
							availableConfItemIds.push(item.Id);
						});
						availableConfItemIds = availableConfItemIds.length ? availableConfItemIds : [BPMSoft.GUID_EMPTY];
						return this.BPMSoft.createColumnInFilterWithParameters("Id", availableConfItemIds);
					}
				},
				dependencies: [
					{ columns: ["Account"], methodName: "updConfItemsByAccount" }
				]
			},
			"Account": {
				dataValueType: this.BPMSoft.DataValueType.LOOKUP,
				lookupListConfig: {
					filter: function() {
						var availableAccountIds = [];
						var accountsByConfItem = this.get("AccountsByConfItem");
						Ext.Array.each(accountsByConfItem, function(item) {
							availableAccountIds.push(item.Id);
						});
						if (availableAccountIds.length > 0) {
							return this.BPMSoft.createColumnInFilterWithParameters("Id", availableAccountIds);
						} else {
							return null;
						}
					}
				},
				dependencies: [
					{ columns: ["ConfItem"], methodName: "onConfItemChanged" },
					{ columns: ["Account"], methodName: "onAccountChanged" }
				]
			},
			// === ИНДИКАТОР РЕЖИМА ОБСЛУЖИВАНИЯ ===
			"UsrServiceMode": {
				dataValueType: BPMSoft.DataValueType.TEXT,
				dependencies: [
					{ columns: ["Priority"], methodName: "updateServiceModeIndicator" }
				]
			},
		},
		details: /**SCHEMA_DETAILS*/{
			"UsrSchema93a28397Detaile2a45cc3": {
				"schemaName": "UsrSchema93a28397Detail",
				"entitySchemaName": "UsrLaborRecords",
				"filter": { "detailColumn": "UsrCase", "masterColumn": "Id" }
			},
			"UsrSchema021c2f40Detailc9b800cb": {
				"schemaName": "UsrSchema021c2f40Detail",
				"entitySchemaName": "UsrLaborRecords",
				"filter": { "detailColumn": "UsrCase", "masterColumn": "Id" }
			}
		}/**SCHEMA_DETAILS*/,
		modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
		dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
		businessRules: /**SCHEMA_BUSINESS_RULES*/{}/**SCHEMA_BUSINESS_RULES*/,
		diff: /**SCHEMA_DIFF*/[
			{ "operation": "merge", "name": "NewCaseProfileInfoContainer", "values": { "layout": { "colSpan": 24, "rowSpan": 1, "column": 0, "row": 12 } } },
			{ "operation": "merge", "name": "ProcessingTab", "values": { "order": 0 } },
			{ "operation": "merge", "name": "ESNTab", "values": { "order": 7 } },
			{ "operation": "merge", "name": "TimelineTab", "values": { "order": 3 } },
			{ "operation": "insert", "name": "Tabf15dc67fTabLabel", "values": { "caption": { "bindTo": "Resources.Strings.Tabf15dc67fTabLabelTabCaption" }, "items": [], "order": 4 }, "parentName": "Tabs", "propertyName": "tabs", "index": 4 },
			{ "operation": "insert", "name": "UsrSchema021c2f40Detailc9b800cb", "values": { "itemType": 2, "markerValue": "added-detail" }, "parentName": "Tabf15dc67fTabLabel", "propertyName": "items", "index": 0 },
			{ "operation": "insert", "name": "Tab01651134TabLabel", "values": { "caption": { "bindTo": "Resources.Strings.Tab01651134TabLabelTabCaption" }, "items": [], "order": 5 }, "parentName": "Tabs", "propertyName": "tabs", "index": 5 },
			{ "operation": "insert", "name": "UsrSchema93a28397Detaile2a45cc3", "values": { "itemType": 2, "markerValue": "added-detail" }, "parentName": "Tab01651134TabLabel", "propertyName": "items", "index": 0 },
			{ "operation": "merge", "name": "CaseInformationTab", "values": { "order": 2 } },
			{ "operation": "insert", "name": "UsrCcEmailsa2dd27a1-d8d7-449d-be46-99ab275a5eaa", "values": { "layout": { "colSpan": 24, "rowSpan": 1, "column": 0, "row": 4, "layoutName": "CaseInformation_gridLayout" }, "bindTo": "UsrCcEmails" }, "parentName": "CaseInformation_gridLayout", "propertyName": "items", "index": 6 },
			{ "operation": "merge", "name": "NotesFilesTab", "values": { "order": 6 } },
			// === ИНДИКАТОР РЕЖИМА ОБСЛУЖИВАНИЯ ===
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
					"layout": { "colSpan": 24, "column": 0, "row": 2 }
				}
			},
			{ "operation": "move", "name": "ServiceItem", "parentName": "ProfileContainer", "propertyName": "items", "index": 7 },
			{ "operation": "move", "name": "ConfItem", "parentName": "ProfileContainer", "propertyName": "items", "index": 8 },
			{ "operation": "move", "name": "ServicePact", "parentName": "ProfileContainer", "propertyName": "items", "index": 5 },
			{ "operation": "move", "name": "SolutionFieldContainer", "parentName": "SolutionTab_gridLayout", "propertyName": "items", "index": 3 },
			{ "operation": "move", "name": "SupportLevel", "parentName": "CaseInformation_gridLayout", "propertyName": "items", "index": 3 }
		]/**SCHEMA_DIFF*/,
		methods: {
			startBackgroundUpdater: function() {
				this._backgroundUpdaterId = setInterval(function() {
					this.runBackgroundUpdate();
				}.bind(this), 30000);
			},
			runBackgroundUpdate: function() {
				if (this.isNewMode()) {
					console.log("Background update: set RegisteredOn and recalculate terms");
					this.set("RegisteredOn", new Date());
					this.recalculateServiceTerms();
				}
			},
			onEntityInitialized: function() {
				this.callParent(arguments);
				this.setInitialValues();
				this.setDateDiff();
				this.renderCaptionStyle();
				this.applyCopyContext();
				this.calculateWorkingTime(this);
				this.fillingTimeSpentField();

				var account = this.get("Account");
				if (account && account.value) {
					console.log("onEntityInitialized: updConfItemsByAccount");
					this.updConfItemsByAccount();
				}

				console.log("onEntityInitialized: startBackgroundUpdater");
				this.startBackgroundUpdater();
				// === ИНДИКАТОР РЕЖИМА ОБСЛУЖИВАНИЯ ===
				this.updateServiceModeIndicator();
			},
			onAccountChanged: function() {
				console.log("onAccountChanged: enter");
				var account = this.get("Account");
				if (!account || !account.value) {
					console.log("onAccountChanged: clear ConfItem");
					this.set("ConfItem", null);
				}
				console.log("onAccountChanged: clear ServicePact");
				this.set("ServicePact", null);
			},
			onServicePactChanged: function() {
				console.log("onServicePactChanged: enter");
				var servicePact = this.get("ServicePact");
				var suitableServicePacts = this.get("ServicePactsByConfItem") || [];
				if (servicePact && servicePact.value) {
					var isSuitable = suitableServicePacts.some(function(item) {
						return item.Id === servicePact.value;
					});
					if (!isSuitable) {
						console.log("onServicePactChanged: clear ConfItem");
						this.set("ConfItem", null);
					}
				}
			},
			updServicePactsByAccount: function() {
				console.log("updServicePactsByAccount: enter");
				var account = this.get("Account");
				if (!account || !account.value) {
					this.set("ServicePactsByAccount", []);
				} else {
					var esq = Ext.create("BPMSoft.EntitySchemaQuery", { rootSchemaName: "ServicePact" });
					esq.addColumn("Id", "ServicePactId");
					esq.addColumn("Name", "ServicePactName");
					esq.filters.add("ServicePactAccount", this.BPMSoft.createColumnFilterWithParameter(
						this.BPMSoft.ComparisonType.EQUAL, "ServiceProvider", account.value));
					var servicePactsByAccount = [];
					esq.getEntityCollection(function(result) {
						if (!result.success) {
							BPMSoft.showErrorMessage("updServicePactsByAccount: Ошибка запроса данных");
							return;
						}
						Ext.Array.each(result.collection.getItems(), function(entity) {
							servicePactsByAccount.push({
								Id: entity.get("ServicePactId"),
								Name: entity.get("ServicePactName")
							});
						});
						this.set("ServicePactsByAccount", servicePactsByAccount);
						if (servicePactsByAccount.length > 0) {
							this.set("ServicePact", {
								value: servicePactsByAccount[0].Id,
								displayValue: servicePactsByAccount[0].Name
							});
						}
					}, this);
				}
			},
			updConfItemsByAccount: function() {
				console.log("updConfItemsByAccount: enter");
				var account = this.get("Account");
				if (!account || !account.value) {
					this.set("ConfItemsByAccount", []);
				} else {
					var esq = Ext.create("BPMSoft.EntitySchemaQuery", { rootSchemaName: "ServiceObject" });
					esq.addColumn("[UsrConfIteminService:UsrServicePact:ServicePact].UsrConfItem", "ConfItemId");
					esq.addColumn("[UsrConfIteminService:UsrServicePact:ServicePact].UsrConfItem.Name", "ConfItemName");
					esq.filters.add("ServiceObjectAccount", this.BPMSoft.createColumnFilterWithParameter(
						this.BPMSoft.ComparisonType.EQUAL, "Account", account.value));
					var confItemsByAccount = [];
					esq.getEntityCollection(function(result) {
						if (!result.success) {
							BPMSoft.showErrorMessage("updConfItemsByAccount: Ошибка запроса данных");
							return;
						}
						Ext.Array.each(result.collection.getItems(), function(entity) {
							var confItemId = entity.get("ConfItemId");
							var confItemName = entity.get("ConfItemName");
							if (!confItemId.value || !confItemName) { return; }
							confItemsByAccount.push({ Id: confItemId.value, Name: confItemName });
						});
						this.set("ConfItemsByAccount", confItemsByAccount);
					}, this);
				}
			},
			onConfItemChanged: function() {
				console.log("onConfItemChanged: enter");
				var confItem = this.get("ConfItem");
				if (!confItem || !confItem.value) {
					console.log("onConfItemChanged: clear ServiceItem");
					this.set("ServiceItem", null);
					this.set("ServicePactsByConfItem", []);
					this.set("ServiceItemsByConfItem", []);
					this.set("AccountsByConfItem", []);
				} else {
					var esq = Ext.create("BPMSoft.EntitySchemaQuery", { rootSchemaName: "UsrConfIteminService" });
					esq.addColumn("UsrServicePact", "ServicePactId");
					esq.addColumn("UsrServiceItem", "ServiceItemId");
					esq.addColumn("UsrServicePact.Name", "ServicePactName");
					esq.addColumn("UsrServiceItem.Name", "ServiceItemName");
					esq.addColumn("[ServiceObject:ServicePact:UsrServicePact].Account", "AccountId");
					esq.addColumn("[ServiceObject:ServicePact:UsrServicePact].Account.Name", "AccountName");
					esq.filters.add("ServicePactConfItem", this.BPMSoft.createColumnFilterWithParameter(
						this.BPMSoft.ComparisonType.EQUAL, "UsrConfItem", confItem.value));
					var servicePactsByConfItem = [], serviceItemsByConfItem = [], accountsByConfItem = [];
					esq.getEntityCollection(function(result) {
						if (!result.success) {
							BPMSoft.showErrorMessage("onConfItemChanged: Ошибка запроса данных");
							return;
						}
						Ext.Array.each(result.collection.getItems(), function(entity) {
							servicePactsByConfItem.push({ Id: entity.get("ServicePactId").value, Name: entity.get("ServicePactName") });
							serviceItemsByConfItem.push({ Id: entity.get("ServiceItemId").value, Name: entity.get("ServiceItemName") });
							accountsByConfItem.push({ Id: entity.get("AccountId").value, Name: entity.get("AccountName") });
						});
						this.set("ServicePactsByConfItem", servicePactsByConfItem);
						this.set("ServiceItemsByConfItem", serviceItemsByConfItem);
						this.set("AccountsByConfItem", accountsByConfItem);
						if (servicePactsByConfItem.length > 0) {
							this.set("ServicePact", { value: servicePactsByConfItem[0].Id, displayValue: servicePactsByConfItem[0].Name });
						}
						if (serviceItemsByConfItem.length > 0) {
							this.set("ServiceItem", { value: serviceItemsByConfItem[0].Id, displayValue: serviceItemsByConfItem[0].Name });
						}
						if (accountsByConfItem.length > 0) {
							this.set("Account", { value: accountsByConfItem[0].Id, displayValue: accountsByConfItem[0].Name });
						}
						// === ИНДИКАТОР РЕЖИМА ОБСЛУЖИВАНИЯ ===
						this.updateServiceModeIndicator();
					}, this);
				}
			},
			setValidationConfig: function() {
				this.callParent(arguments);
				this.addColumnValidator("UsrCcEmails", this.validateCcEmails);
			},
			validateCcEmails: function(value) {
				var cc = value || this.get("UsrCcEmails");
				if (!cc || !cc.trim()) { return { invalidMessage: "" }; }
				var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				var parts = cc.split(/[\s;,]+/);
				var invalid = [];
				Ext.Array.each(parts, function(part) {
					var trimmed = part.trim();
					if (!trimmed) { return; }
					if (trimmed.charAt(0) === "<" && trimmed.charAt(trimmed.length - 1) === ">") {
						trimmed = trimmed.substring(1, trimmed.length - 1);
					}
					if (trimmed.indexOf("@") === -1) { return; }
					if (!emailRegex.test(trimmed)) { invalid.push(trimmed); }
				});
				if (invalid.length > 0) {
					return { invalidMessage: "Некорректный формат адресов в поле CC: " + invalid.join(", ") };
				}
				return { invalidMessage: "" };
			},
			// === ИНДИКАТОР РЕЖИМА ОБСЛУЖИВАНИЯ ===
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

				var esq = Ext.create("BPMSoft.EntitySchemaQuery", { rootSchemaName: "TimeToPrioritize" });
				esq.addColumn("SolutionTimeUnit.Code", "TimeUnitCode");
				esq.filters.add("FilterPriority",
					BPMSoft.createColumnFilterWithParameter(BPMSoft.ComparisonType.EQUAL, "CasePriority", priority.value));
				esq.filters.add("FilterServiceItem",
					BPMSoft.createColumnFilterWithParameter(BPMSoft.ComparisonType.EQUAL, "ServiceInServicePact.ServiceItem", serviceItem.value));
				esq.filters.add("FilterServicePact",
					BPMSoft.createColumnFilterWithParameter(BPMSoft.ComparisonType.EQUAL, "ServiceInServicePact.ServicePact", servicePact.value));

				esq.getEntityCollection(function(result) {
					if (!result.success || result.collection.getCount() === 0) {
						this.set("UsrServiceMode", "");
						return;
					}
					var code = result.collection.getByIndex(0).get("TimeUnitCode") || "";
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
				return !Ext.isEmpty(this.get("UsrServiceMode"));
			},
			applyServiceModeStyle: function() {
				var mode = this.get("UsrServiceMode") || "";
				Ext.defer(function() {
					var el = document.querySelector(".usr-service-mode-label");
					if (!el) { return; }
					el.classList.remove("usr-service-mode-working", "usr-service-mode-calendar");
					if (mode.indexOf("8") >= 0) {
						el.classList.add("usr-service-mode-working");
					} else if (mode.indexOf("24") >= 0) {
						el.classList.add("usr-service-mode-calendar");
					}
				}, 100, this);
			}
		},
	};
});
```

---

## Шаг 3. Публикация и проверка

1. Убедиться что оба шага выполнены (`UsrCasePageCSS` и CasePage сохранены)
1. На странице **Конфигурация** нажать **«Компилировать»**
1. Очистить кэш браузера: **Ctrl+Shift+R**
1. Открыть обращение где заполнены Приоритет, Сервис и Сервисный договор
1. Под полем «Приоритет» должен появиться индикатор с цветом:
   - 🟢 **8×5 (рабочее время)** — зелёный
   - 🔴 **24×7 (календарное время)** — красный
1. Изменить Приоритет — индикатор должен обновиться без сохранения
1. Создать новое обращение, выбрать КЕ — индикатор должен заполниться автоматически

### Диагностика: текст есть, цвета нет

Значит CSS не загружен. Проверить:

- В `define(...)` стоит `"css!UsrCasePageCSS"` (с `css!`)
- `UsrCasePageCSS` существует в CTI
- Была компиляция после сохранения обеих схем

Быстрая проверка в консоли браузера (F12):

```javascript
var el = document.querySelector(".usr-service-mode-label");
console.log("element:", el ? el.outerHTML : "NOT FOUND");
var found = [];
for (var i = 0; i < document.styleSheets.length; i++) {
    try {
        var rules = document.styleSheets[i].cssRules;
        for (var j = 0; j < rules.length; j++) {
            if (rules[j].selectorText && rules[j].selectorText.indexOf("usr-service-mode") >= 0) {
                found.push(rules[j].selectorText);
            }
        }
    } catch(e) {}
}
console.log("CSS rules found:", found);
```

Если `CSS rules found: []` — CSS не загружен (проблема с `css!` или компиляцией).

---

## Известные ограничения

| Ситуация | Поведение |
| --- | --- |
| Не заполнен хотя бы один из трёх полей (Приоритет/Сервис/Договор) | Индикатор скрыт |
| В `TimeToPrioritize` нет записи для данной комбинации | Индикатор скрыт |

---

История подходов и журнал изменений → [SERVICE_MODE_INDICATOR_HISTORY.md](SERVICE_MODE_INDICATOR_HISTORY.md)
