define("CasePage", [], function() {
	return {
		/**
		* Наименование схемы бизнес—объекта.
		*/
		entitySchemaName: "Case",
		/*
		* Атрибуты схемы.
		*/
		attributes: {
			/* Поле модели представления. */
			"ServicePact": {
				/* Тип данных — Поле—справочник. */
				dataValueType: this.BPMSoft.DataValueType.LOOKUP,
				/* Конфигурационный объект атрибута типа LOOKUP. */
				lookupListConfig: {
					filter: function() {
						var availableServicePactIds = [];
						
						// Добавление в список отображаемых сервисных контрактов по стандартному алгоритму добавления
						var suitableServicePacts = this.get("SuitableServicePacts");
						Ext.Array.each(suitableServicePacts, function(item) {
							availableServicePactIds.push(item.Id);
						});

						// Добавление в список отображаемых сервисных контрактов по конфигурационной единице 
						// Заполнение списка ServicePactsByConfItem производится при вызове функции onConfItemChanged
						var servicePactsByConfItem = this.get("ServicePactsByConfItem");
						Ext.Array.each(servicePactsByConfItem, function(item) {
							availableServicePactIds.push(item.Id);
						});

						// Добавление в список отображаемых сервисных контрактов по эккаунту через поле ServicePact.ServiceProvider
						// Заполнение списка ServicePactsByAccount производится при вызове функции updServicePactsByAccount
						var servicePactsByAccount = this.get("ServicePactsByAccount");
						Ext.Array.each(servicePactsByAccount, function(item) {
							availableServicePactIds.push(item.Id);
						});

						//BPMSoft.showErrorMessage("ServicePact: lookupListConfig: availableServicePactIds count: "+availableServicePactIds.length);

						// Возвращение списка сервисных контрактов и формирование итогового фильтра
						availableServicePactIds = availableServicePactIds.length ? availableServicePactIds : [BPMSoft.GUID_EMPTY];
						return this.BPMSoft.createColumnInFilterWithParameters("Id", availableServicePactIds);
					}
				},
				dependencies: [
					{
						columns: ["ServicePact"],
						methodName: "onServicePactChanged"
					},
					{
						columns: ["Account"],
						methodName: "updServicePactsByAccount"
					},
					{
						columns: ["ConfItem"],
						methodName: "onConfItemChanged"
					}
				]
			},
			"ServiceItem": {
				/* Тип данных — Поле—справочник. */
				dataValueType: this.BPMSoft.DataValueType.LOOKUP,
				/* Конфигурационный объект атрибута типа LOOKUP. */
				lookupListConfig: {
					filter: function() {
						// Добавление в список отображаемых сервисов по конфигурационной единице
						// Заполнение списка ServiceItemsByConfItem производится при вызове функции onConfItemChanged
						var availableServiceItemIds = [];
						var serviceItemsByConfItem = this.get("ServiceItemsByConfItem");
						Ext.Array.each(serviceItemsByConfItem, function(item) {
							availableServiceItemIds.push(item.Id);
						});
						
						// Возвращение списка сервисных контрактов и формирование итогового фильтра
						if (availableServiceItemIds.length > 0) {
							return this.BPMSoft.createColumnInFilterWithParameters("Id", availableServiceItemIds);
						} else {
							// Возвращение стандартного фильтра
							return this.getServiceItemFilters();
						}
					}
				},
				dependencies: [
					{
						columns: ["ConfItem"],
						methodName: "onConfItemChanged"
					}
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
						// Удален фильтр по умолчанию по привязке конфигурационных едениц через ссылку на контрагента в конфигурационной единице
						// return this.getConfItemFilters();
						
						var availableConfItemIds = [];
						
						// Добавление в список отображаемых конфигурационных единиц по контрагенту
						// Заполнение списка ConfItemsByAccount производится при вызове функции updConfItemsByAccount
						var confItemsByAccount = this.get("ConfItemsByAccount");
						Ext.Array.each(confItemsByAccount, function(item) {
							availableConfItemIds.push(item.Id);
						});

						// Возвращение списка конфигурационных единиц и формирование итогового фильтра
						availableConfItemIds = availableConfItemIds.length ? availableConfItemIds : [BPMSoft.GUID_EMPTY];
						return this.BPMSoft.createColumnInFilterWithParameters("Id", availableConfItemIds);
					}
				},
				dependencies: [
					{
						columns: ["Account"],
						methodName: "updConfItemsByAccount"
					}
				]
			},
			"Account": {
				dataValueType: this.BPMSoft.DataValueType.LOOKUP,
				lookupListConfig: {
					filter: function() {
						var availableAccountIds = [];
						
						// Добавление в список отображаемых компаний по конфигурационной единице 
						// Заполнение списка AccountsByConfItem производится при вызове функции onConfItemChanged
						var accountsByConfItem = this.get("AccountsByConfItem");
						Ext.Array.each(accountsByConfItem, function(item) {
							availableAccountIds.push(item.Id);
						});
						
						// Возвращение списка эккаунтов и формирование итогового фильтра
						if (availableAccountIds.length > 0) {
							return this.BPMSoft.createColumnInFilterWithParameters("Id", availableAccountIds);
						}
						else {
							return null;
						}
					}
				},
				dependencies: [
					{
						columns: ["ConfItem"],
						methodName: "onConfItemChanged"
					},
				    {
      					columns: ["Account"],
      					methodName: "onAccountChanged"
    				}
				]
			},
		},
		details: /**SCHEMA_DETAILS*/{
			"UsrSchema93a28397Detaile2a45cc3": {
				"schemaName": "UsrSchema93a28397Detail",
				"entitySchemaName": "UsrLaborRecords",
				"filter": {
					"detailColumn": "UsrCase",
					"masterColumn": "Id"
				}
			},
			"UsrSchema021c2f40Detailc9b800cb": {
				"schemaName": "UsrSchema021c2f40Detail",
				"entitySchemaName": "UsrLaborRecords",
				"filter": {
					"detailColumn": "UsrCase",
					"masterColumn": "Id"
				}
			}
		}/**SCHEMA_DETAILS*/,
		modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
		dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
		businessRules: /**SCHEMA_BUSINESS_RULES*/{}/**SCHEMA_BUSINESS_RULES*/,
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "merge",
				"name": "NewCaseProfileInfoContainer",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 12
					}
				}
			},
			{
				"operation": "merge",
				"name": "ProcessingTab",
				"values": {
					"order": 0
				}
			},
			{
				"operation": "merge",
				"name": "ESNTab",
				"values": {
					"order": 7
				}
			},
			{
				"operation": "merge",
				"name": "TimelineTab",
				"values": {
					"order": 3
				}
			},
			{
				"operation": "insert",
				"name": "Tabf15dc67fTabLabel",
				"values": {
					"caption": {
						"bindTo": "Resources.Strings.Tabf15dc67fTabLabelTabCaption"
					},
					"items": [],
					"order": 4
				},
				"parentName": "Tabs",
				"propertyName": "tabs",
				"index": 4
			},
			{
				"operation": "insert",
				"name": "UsrSchema021c2f40Detailc9b800cb",
				"values": {
					"itemType": 2,
					"markerValue": "added-detail"
				},
				"parentName": "Tabf15dc67fTabLabel",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "Tab01651134TabLabel",
				"values": {
					"caption": {
						"bindTo": "Resources.Strings.Tab01651134TabLabelTabCaption"
					},
					"items": [],
					"order": 5
				},
				"parentName": "Tabs",
				"propertyName": "tabs",
				"index": 5
			},
			{
				"operation": "insert",
				"name": "UsrSchema93a28397Detaile2a45cc3",
				"values": {
					"itemType": 2,
					"markerValue": "added-detail"
				},
				"parentName": "Tab01651134TabLabel",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "merge",
				"name": "CaseInformationTab",
				"values": {
					"order": 2
				}
			},
			{
				"operation": "insert",
				"name": "UsrCcEmailsa2dd27a1-d8d7-449d-be46-99ab275a5eaa",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 4,
						"layoutName": "CaseInformation_gridLayout"
					},
					"bindTo": "UsrCcEmails"
				},
				"parentName": "CaseInformation_gridLayout",
				"propertyName": "items",
				"index": 6
			},
			{
				"operation": "merge",
				"name": "NotesFilesTab",
				"values": {
					"order": 6
				}
			},
			{
				"operation": "move",
				"name": "ServiceItem",
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 7
			},
			{
				"operation": "move",
				"name": "ConfItem",
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 8
			},
			{
				"operation": "move",
				"name": "ServicePact",
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 5
			},
			{
				"operation": "move",
				"name": "SolutionFieldContainer",
				"parentName": "SolutionTab_gridLayout",
				"propertyName": "items",
				"index": 3
			},
			{
				"operation": "move",
				"name": "SupportLevel",
				"parentName": "CaseInformation_gridLayout",
				"propertyName": "items",
				"index": 3
			}
		]/**SCHEMA_DIFF*/,
		methods: {
			/**
			 * Запуск фонового интервала
			 */
			startBackgroundUpdater: function() {
				// Сохраняем ID таймера, чтобы потом можно было отменить
				this._backgroundUpdaterId = setInterval(function() {
					this.runBackgroundUpdate();
				}.bind(this), 30000); // 30 секунд
			},
			/**
			 * Логика, которая будет запускаться на фоне
			 */
			runBackgroundUpdate: function() {
				// Запускаем актуализацию дат для нового обращения
				if (this.isNewMode()) {
					console.log("Background update: set RegisteredOn and recalculate terms");
					this.set("RegisteredOn", new Date());
					this.recalculateServiceTerms();
				}
			},
			/**
			 * @inheritDoc BasePageV2#onEntityInitialized
			 * @overridden
			 */
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
				
				// Запускаем актуализацию дат для нового обращения
				console.log("onEntityInitialized: startBackgroundUpdater");
				this.startBackgroundUpdater();
			},
			/**
			 * Обработчик изменения эккаунта
			 * Очищаем поле конфигурационной единицы при сбросе эккаунта
			 * @protected
			 */
			onAccountChanged: function() {
				console.log("onAccountChanged: enter");
			  	var account = this.get("Account");
			  	if (!account || !account.value) {
					// Очищаем поле ConfItem, если Account был очищен
					console.log("onAccountChanged: clear ConfItem");
					this.set("ConfItem", null);
				}
				
				// Очищаем поле ServicePact, если Account был изменен
				console.log("onAccountChanged: clear ServicePact");
				this.set("ServicePact", null);
			},
			/**
			 * Обработчик изменения контракта на поддержку
			 * При изменении контракта выполняется проверка, что конфигурационная единица входит в данный контракт
			 * Если выбран контракт, который не входит в список контраков привязанных к данной конфигурационной единице, 
			 * то конфигурационная единица в форме очищается
			 * @protected
			 */
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
			/**
			 * Обработчик изменения заказчика
			 * @protected
			 */
			updServicePactsByAccount: function() {
				console.log("updServicePactsByAccount: enter");
				var account = this.get("Account");
				if (!account || !account.value) {
					this.set("ServicePactsByAccount", []);
				}
				else {
					// Получение списка контрактов для контрагента
					var esq = Ext.create("BPMSoft.EntitySchemaQuery", {
						rootSchemaName: "ServicePact"
					});
					
					esq.addColumn("Id","ServicePactId");
					esq.addColumn("Name","ServicePactName");
					esq.filters.add("ServicePactAccount", this.BPMSoft.createColumnFilterWithParameter(
						this.BPMSoft.ComparisonType.EQUAL, "ServiceProvider", account.value));

					// Асинхронный вызов получения списка контрактов
					var servicePactsByAccount = [];
					esq.getEntityCollection(function(result) {
						if (!result.success) {
							BPMSoft.showErrorMessage("updServicePactsByAccount: Ошибка запроса данных");
							return;
						}
						var entities = result.collection.getItems();
						Ext.Array.each(entities, function(entity) {
							var servicePactId = entity.get("ServicePactId");
							var servicePactName = entity.get("ServicePactName");
							//BPMSoft.showErrorMessage("updServicePactsByAccount: add ServicePactName: "+servicePactId);
							servicePactsByAccount.push(
									{
										Id: servicePactId,
										Name: servicePactName
									}
							);
						});

						this.set("ServicePactsByAccount", servicePactsByAccount);
						
						if (servicePactsByAccount.length > 0) {
							this.set("ServicePact",
									{
										value: servicePactsByAccount[0].Id,
										displayValue: servicePactsByAccount[0].Name
									}
							);
						}
					}, this);
				}
			},
			/**
			 * Обработчик изменения заказчика
			 * @protected
			 */
			updConfItemsByAccount: function() {
		        console.log("updConfItemsByAccount: enter");
		        var account = this.get("Account");
		        if (!account || !account.value) {
		          // console.log("updConfItemsByAccount: clear ConfItemsByAccount");
		          this.set("ConfItemsByAccount", []);
		        }
		        else {
		          // console.log("updConfItemsByAccount: accountId: "+account.Id);
		          // console.log("updConfItemsByAccount: accountId: "+account.value);
		
		          // Получение списка конфигурационных единиц для контрагента
		          var esq = Ext.create("BPMSoft.EntitySchemaQuery", {
		            rootSchemaName: "ServiceObject"
		          });
		          
		          esq.addColumn("[UsrConfIteminService:UsrServicePact:ServicePact].UsrConfItem","ConfItemId");
		          esq.addColumn("[UsrConfIteminService:UsrServicePact:ServicePact].UsrConfItem.Name","ConfItemName");
		          esq.filters.add("ServiceObjectAccount", this.BPMSoft.createColumnFilterWithParameter(
		            this.BPMSoft.ComparisonType.EQUAL, "Account", account.value));
		
		          // Асинхронный вызов получения списка конфигурационных единиц
		          var confItemsByAccount = [];
		          esq.getEntityCollection(function(result) {
		            if (!result.success) {
		              BPMSoft.showErrorMessage("updConfItemsByAccount: Ошибка запроса данных");
		              return;
		            }
		            var entities = result.collection.getItems();
		            // console.log("updConfItemsByAccount: entities count: "+entities.length);
		            Ext.Array.each(entities, function(entity) {
		              var confItemId = entity.get("ConfItemId");
		              var confItemName = entity.get("ConfItemName");
		                            if (!confItemId.value || !confItemName) {
		                                return;
		                            }
		              // console.log("updConfItemsByAccount: add ConfItem: "+confItemId.value+" "+confItemName);
		              confItemsByAccount.push(
		                  {
		                    Id: confItemId.value,
		                    Name: confItemName
		                  }
		              );
		            });
		
		            this.set("ConfItemsByAccount", confItemsByAccount);
		          }, this);
		       }
		    },
			/**
			 * Обработчик изменения конфигурационной единицы
			 * @protected
			 */
			onConfItemChanged: function() {
				console.log("updConfItemsByAccount: enter");
				var confItem = this.get("ConfItem");
				if (!confItem || !confItem.value) {
					/**
					 * Если конфигурационная единица очищена, то сброс фильтров
					 * Значение полей Эккаунт и Контракт не сбрасывается, т.к. конфигурационная единица могла 
					 * быть очищена автоматически собственно из-за изменения этих полей
					*/
					//BPMSoft.showErrorMessage("onConfItemChanged: Сброс фильтров");
					//this.set("Account", null);
					//this.set("ServicePact", null);
					
					console.log("onConfItemChanged: clear ServiceItem");
					this.set("ServiceItem", null);
					
					this.set("ServicePactsByConfItem", []);
					this.set("ServiceItemsByConfItem", []);
					this.set("AccountsByConfItem", []);
				}
				else {
					var esq = Ext.create("BPMSoft.EntitySchemaQuery", {
						rootSchemaName: "UsrConfIteminService"
					});
					
					esq.addColumn("UsrServicePact","ServicePactId");
					esq.addColumn("UsrServiceItem","ServiceItemId");
					esq.addColumn("UsrServicePact.Name","ServicePactName");
					esq.addColumn("UsrServiceItem.Name","ServiceItemName");
					esq.addColumn("[ServiceObject:ServicePact:UsrServicePact].Account","AccountId");
					esq.addColumn("[ServiceObject:ServicePact:UsrServicePact].Account.Name","AccountName");
					esq.filters.add("ServicePactConfItem", this.BPMSoft.createColumnFilterWithParameter(
						this.BPMSoft.ComparisonType.EQUAL, "UsrConfItem", confItem.value));

					var servicePactsByConfItem = [];
					var serviceItemsByConfItem = [];
					var accountsByConfItem = [];
					// Асинхронный вызов получения списка контрактов
					esq.getEntityCollection(function(result) {
						if (!result.success) {
							BPMSoft.showErrorMessage("onConfItemChanged: Ошибка запроса данных");
							return;
						}

						var entities = result.collection.getItems();
						Ext.Array.each(entities, function(entity) {
							var servicePactId = entity.get("ServicePactId");
							var servicePactName = entity.get("ServicePactName");
							var serviceItemId = entity.get("ServiceItemId");
							var serviceItemName = entity.get("ServiceItemName");
							var accountId = entity.get("AccountId");
							var accountName = entity.get("AccountName");
							servicePactsByConfItem.push(
									{
										Id: servicePactId.value,
										Name: servicePactName
									}
							);
							serviceItemsByConfItem.push(
									{
										Id: serviceItemId.value,
										Name: serviceItemName
									}
							);
							accountsByConfItem.push(
									{
										Id: accountId.value,
										Name: accountName
									}
							);
						});

						this.set("ServicePactsByConfItem", servicePactsByConfItem);
						this.set("ServiceItemsByConfItem", serviceItemsByConfItem);
						this.set("AccountsByConfItem", accountsByConfItem);

						if (servicePactsByConfItem.length > 0) {
							this.set("ServicePact",
									{
										value: servicePactsByConfItem[0].Id,
										displayValue: servicePactsByConfItem[0].Name
									}
							);
						}
						if (serviceItemsByConfItem.length > 0) {
							this.set("ServiceItem",
									{
										value: serviceItemsByConfItem[0].Id,
										displayValue: serviceItemsByConfItem[0].Name
									}
							);
						}
						
						if (accountsByConfItem.length > 0) {
							this.set("Account",
									{
										value: accountsByConfItem[0].Id,
										displayValue: accountsByConfItem[0].Name
									}
							);
						}
					}, this);
				}
			},
			/**
			 * Переопределение базового метода инициализации валидаторов.
			 * Вызывается платформой автоматически при инициализации страницы.
			 */
			setValidationConfig: function() {
				this.callParent(arguments);
				this.addColumnValidator("UsrCcEmails", this.validateCcEmails);
			},
			/**
			 * Валидатор формата email-адресов в поле CC (UsrCcEmails).
			 * @param {String} value — текущее значение поля.
			 * @returns {Object} { invalidMessage: "" } — OK или текст ошибки.
			 */
			validateCcEmails: function(value) {
				var cc = value || this.get("UsrCcEmails");
				if (!cc || !cc.trim()) {
					return { invalidMessage: "" };
				}
				var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				// Разбиваем по пробелу, точке с запятой и запятой
				// (формат хранения — пробел; ввод вручную может использовать ; или ,)
				var parts = cc.split(/[\s;,]+/);
				var invalid = [];
				Ext.Array.each(parts, function(part) {
					var trimmed = part.trim();
					if (!trimmed) { return; }
					// Убираем угловые скобки на случай формата <email@example.com>
					if (trimmed.charAt(0) === "<" && trimmed.charAt(trimmed.length - 1) === ">") {
						trimmed = trimmed.substring(1, trimmed.length - 1);
					}
					// Токены без @ — это части отображаемого имени, пропускаем
					if (trimmed.indexOf("@") === -1) { return; }
					if (!emailRegex.test(trimmed)) {
						invalid.push(trimmed);
					}
				});
				if (invalid.length > 0) {
					return {
						invalidMessage: "Некорректный формат адресов в поле CC: " + invalid.join(", ")
					};
				}
				return { invalidMessage: "" };
			}
		},
	};
});
