define("PortalCasePage", [], function() {
    return {
        entitySchemaName: "Case",
        attributes: {
            "ServicePact": {
				dataValueType: this.BPMSoft.DataValueType.LOOKUP,
				hideActions: true,
                lookupListConfig: {
					filter: function() {
						// Удален фильтр по умолчанию
						// return this.getServicePactFilter();

						var availableServicePactIds = [];
						
						// Добавление в список отображаемых сервисных контрактов по конфигурационной единице 
						// Заполнение списка ServicePactsByConfItem производится при вызове функции onConfItemChanged
						var servicePactsByConfItem = this.get("ServicePactsByConfItem");
						Ext.Array.each(servicePactsByConfItem, function(item) {
							availableServicePactIds.push(item.Id);
						});

						if ( availableServicePactIds.length > 0 ) {
							// Если определен список сервисных контрактов по конфигурационной единице, то возвращаем его
							return this.BPMSoft.createColumnInFilterWithParameters("Id", availableServicePactIds);
						} else {
							// Иначе возвращаем стандартный фильтр
							return this.getServicePactFilter();
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
            "ServiceItem": {
				dataValueType: this.BPMSoft.DataValueType.LOOKUP,
				hideActions: true,
                lookupListConfig: {
					filter: function() {
						// Удален фильтр по умолчанию
                        // return this.getServiceItemFilters();

						var availableServiceItemIds = [];

						// Добавление в список отображаемых сервисов по конфигурационной единице
						// Заполнение списка ServiceItemsByConfItem производится при вызове функции onConfItemChanged
						var serviceItemsByConfItem = this.get("ServiceItemsByConfItem");
						Ext.Array.each(serviceItemsByConfItem, function(item) {
							availableServiceItemIds.push(item.Id);
						});
						
						if (availableServiceItemIds.length > 0) {
							// Если определен список сервисов по конфигурационной единице, то возвращаем его
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
			"ConfItem": {
				dataValueType: this.BPMSoft.DataValueType.LOOKUP,
				hideActions: true,
				lookupListConfig: {
					filter: function() {
						// Удален фильтр по умолчанию по привязке конфигурационных едениц через ссылку на контрагента в конфигурационной единице
						//return this.getConfItemFilters();
						
						var availableConfItemIds = [];
						
						// Добавление в список отображаемых конфигурационных единиц по контрагенту
						// Заполнение списка ConfItemsByAccount производится при вызове функции onAccountChanged
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
						methodName: "onAccountChanged"
					}
				]
			}
        },
		modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
		details: /**SCHEMA_DETAILS*/{}/**SCHEMA_DETAILS*/,
		businessRules: /**SCHEMA_BUSINESS_RULES*/{}/**SCHEMA_BUSINESS_RULES*/,
		businessRulesMultiplyActions: /**SCHEMA_ANGULAR_BUSINESS_RULES*/{}/**SCHEMA_ANGULAR_BUSINESS_RULES*/,
		dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
        diff: /**SCHEMA_DIFF*/[
			{
				"operation": "insert",
				"name": "Priority78852d5b-d4bf-4b0b-90a8-3028e525fd14",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 2,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "Priority",
					"enabled": true,
					"contentType": 3
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 2
			},
			{
				"operation": "merge",
				"name": "ServiceItem",
				"values": {
					"enabled": false
				}
			},
			{
				"operation": "merge",
				"name": "ConfItem",
				"values": {
					"enabled": true,
					"contentType": 5
				}
			},
			{
				"operation": "insert",
				"name": "Accountb45bf858-7031-4fc7-a298-c3285b167296",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 6,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "Account",
					"enabled": false,
					"contentType": 5
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 6
			},
			{
				"operation": "insert",
				"name": "Categorye5069e20-10d9-421e-a7c1-3be47b9f6aef",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 7,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "Category"
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 7
			},
			{
				"operation": "insert",
				"name": "Subjectaea8934a-4fc5-4b60-a335-35293e92e002",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "Subject"
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 0
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
				"name": "SatisfactionLevelComment",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 1
					}
				}
			},
			{
				"operation": "remove",
				"name": "CaseCategory"
			},
			{
				"operation": "move",
				"name": "ResponseContainer",
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "move",
				"name": "SolutionContainer",
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "move",
				"name": "ResponseCaptionProfile",
				"parentName": "ResponseGridLayout",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "move",
				"name": "SolutionCaptionProfile",
				"parentName": "SolutionGridLayout",
				"propertyName": "items",
				"index": 0
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
				this.setPortalColumnValues();
				this.setDateDiff();
				this.renderCaptionStyle();
				this.setAccount();
				this.setRegisteredDate();
				this.getUserSettingsOperationRight();
				this.setStatusActionEnabled();
				this.disablingFeedback();
				
				// Запускаем актуализацию дат для нового обращения
				console.log("onEntityInitialized: startBackgroundUpdater");
				this.startBackgroundUpdater();
			},
			/**
			 * Обработчик изменения заказчика
			 * @protected
			 */
			onAccountChanged: function() {
				var account = this.get("Account");
				if (!account || !account.value) {
					console.log("onAccountChanged: Account: пустой");
					this.set("ConfItemsByAccount", []);
				}
				else {
					console.log("onAccountChanged: Account:", account.value);
					
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

						console.log("onAccountChanged: найдено записей:", result.collection.getCount());

						var entities = result.collection.getItems();
						Ext.Array.each(entities, function(entity) {
							var confItemId = entity.get("ConfItemId");
							var confItemName = entity.get("ConfItemName");

							// Проверяем, что confItemId существует и не пустое значение
							if (confItemId && confItemId.value) {
								console.log("onAccountChanged: найден ConfItem:", confItemId.value, confItemName);
								confItemsByAccount.push({ Id: confItemId.value, Name: confItemName });
							} else {
								console.log("onAccountChanged: пропущен ConfItem из-за пустого ID");
							}				
						});

						console.log("onAccountChanged: сформирован список ConfItemsByAccount:", confItemsByAccount);
						this.set("ConfItemsByAccount", confItemsByAccount);
					}, this);
				}
			},
			
			/**
			 * Обработчик изменения конфигурационной единицы
			 * @protected
			 */
			onConfItemChanged: function() {
				var confItem = this.get("ConfItem");
				if (!confItem || !confItem.value) {
					/**
					 * Если конфигурационная единица очищена, то сброс фильтров
					 * Значение полей Эккаунт и Контракт не сбрасывается
					*/
					console.log("onConfItemChanged: сброс фильтров");
					this.set("ServicePactsByConfItem", []);
					this.set("ServiceItemsByConfItem", []);
				}
				else {
					var esq = Ext.create("BPMSoft.EntitySchemaQuery", {	rootSchemaName: "UsrConfIteminService" });
					
					esq.addColumn("UsrServicePact","ServicePactId");
					esq.addColumn("UsrServiceItem","ServiceItemId");
					esq.addColumn("UsrServicePact.Name","ServicePactName");
					esq.addColumn("UsrServiceItem.Name","ServiceItemName");
					esq.filters.add("ServicePactConfItem", this.BPMSoft.createColumnFilterWithParameter(
						this.BPMSoft.ComparisonType.EQUAL, "UsrConfItem", confItem.value));

					var servicePactsByConfItem = [];
					var serviceItemsByConfItem = [];

					// Асинхронный вызов получения списка контрактов
					esq.getEntityCollection(function(result) {
						if (!result.success) {
							BPMSoft.showErrorMessage("onConfItemChanged: Ошибка запроса данных");
							return;
						}

						console.log("onConfItemChanged: найдено записей:", result.collection.getCount());

						var entities = result.collection.getItems();
						Ext.Array.each(entities, function(entity) {
							var servicePactId = entity.get("ServicePactId");
							var servicePactName = entity.get("ServicePactName");
							var serviceItemId = entity.get("ServiceItemId");
							var serviceItemName = entity.get("ServiceItemName");

							// Проверяем, что servicePactId существует и не пустое значение
							if (servicePactId && servicePactId.value) {
								console.log("onConfItemChanged: найден ServicePact:", servicePactId.value, servicePactName);
								servicePactsByConfItem.push({ Id: servicePactId.value, Name: servicePactName });
							} else {
								console.log("onConfItemChanged: пропущен ServicePact из-за пустого ID");
							}
							// Проверяем, что serviceItemId существует и не пустое значение
							if (serviceItemId && serviceItemId.value) {
								console.log("onConfItemChanged: найден ServiceItem:", serviceItemId.value, serviceItemName);
								serviceItemsByConfItem.push({ Id: serviceItemId.value, Name: serviceItemName });
							} else {
								console.log("onConfItemChanged: пропущен ServiceItem из-за пустого ID");
							}
						});

						console.log("onConfItemChanged: сформирован список ServicePactsByConfItem:", servicePactsByConfItem);
						this.set("ServicePactsByConfItem", servicePactsByConfItem);

						console.log("onConfItemChanged: сформирован список ServiceItemsByConfItem:", serviceItemsByConfItem);
						this.set("ServiceItemsByConfItem", serviceItemsByConfItem);

						if (servicePactsByConfItem.length > 0) {
							this.set("ServicePact",	{ value: servicePactsByConfItem[0].Id, displayValue: servicePactsByConfItem[0].Name	});
						}

						if (serviceItemsByConfItem.length > 0) {
							this.set("ServiceItem",	{ value: serviceItemsByConfItem[0].Id, displayValue: serviceItemsByConfItem[0].Name	});
						}
					}, this);
				}
			},

            /**
             * @inheritdoc BPMSoft.PortalCasePage#getServiceCategoryFilters
             * @overridden
             */
            getServiceCategoryFilters: function() {
                var filtersCollection = this.BPMSoft.createFilterGroup();
                var servicePact = this.get("ServicePact");
                if (!servicePact) {
                    return filtersCollection;
                }
                var servicePactFilter = this.BPMSoft.createColumnFilterWithParameter(
                        this.BPMSoft.ComparisonType.EQUAL,
                        "[ServiceItem:Category:Id].[ServiceInServicePact:ServiceItem].ServicePact",
                        servicePact.value);
                filtersCollection.add("ServicePactFilter", servicePactFilter);
                return filtersCollection;
            }

			/**
			getConfItemFilters: function() {
				var filtersCollection = this.BPMSoft.createFilterGroup();
				var account = this.get("Account");
			
				if (!account || !account.value) {
					return filtersCollection; // Если Account не задан, возвращаем пустой фильтр
				}
			
				var accountFilter = this.BPMSoft.createColumnFilterWithParameter(
					this.BPMSoft.ComparisonType.EQUAL,
					"[UsrConfIteminService:UsrServicePact:UsrConfItem].[ServiceObject:ServicePact].Account",
					account.value
				);
			
				filtersCollection.add("AccountFilter", accountFilter);
				return filtersCollection;
			}		
			*/
        }
    };
});
