define("UsrUsrLaborRecords6e6369a6Page", [], function() {
	return {
		entitySchemaName: "UsrLaborRecords",
		attributes: {},
		modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
		details: /**SCHEMA_DETAILS*/{}/**SCHEMA_DETAILS*/,
		businessRules: /**SCHEMA_BUSINESS_RULES*/{}/**SCHEMA_BUSINESS_RULES*/,
		businessRulesMultiplyActions: /**SCHEMA_ANGULAR_BUSINESS_RULES*/{
			"1a0a3822-9203-1ad0-7438-a3551d6741a1": {
				"businessRulesMultiplyActions": true,
				"name": [
					{
						"cultureName": "en-US",
						"value": "Номер Лида: Заполнять значение поля_1"
					},
					{
						"cultureName": "ru-RU",
						"value": "Номер Лида: автоматическое заполнение"
					}
				],
				"enabled": true,
				"removed": true,
				"businessRuleTree": {
					"id": "1a0a3822-9203-1ad0-7438-a3551d6741a1",
					"type": "group",
					"logicalOperator": "&",
					"actions": [
						{
							"ruleType": 3,
							"columnName": "UsrLeadNumber",
							"valuePickerData": {
								"source": "EntityColumnValuePickerProvider",
								"value": "139d4452-4415-8aaa-8453-15c01bb13e6b.6ab42472-7828-4d51-a3e6-c38b485f3252.8475b5cb-ebcd-46af-bcbb-86d0e7614b14",
								"displayValue": "Обращение.Сервисный договор.Номер лида"
							},
							"populatingAttributeSource": {
								"expression": {
									"type": 1,
									"attribute": "UsrCase",
									"attributePath": "ServicePact.UsrLeadNumber"
								}
							}
						}
					],
					"childRuleTree": []
				}
			},
			"f0e9ca5f-bb8b-fd99-679d-07075ee84131": {
				"businessRulesMultiplyActions": true,
				"name": [
					{
						"cultureName": "ru-RU",
						"value": "Договор: автоматическое заполнение"
					}
				],
				"enabled": true,
				"removed": true,
				"businessRuleTree": {
					"id": "f0e9ca5f-bb8b-fd99-679d-07075ee84131",
					"type": "group",
					"logicalOperator": "&",
					"actions": [
						{
							"ruleType": 3,
							"columnName": "UsrServicePact",
							"valuePickerData": {
								"source": "EntityColumnValuePickerProvider",
								"value": "139d4452-4415-8aaa-8453-15c01bb13e6b.6ab42472-7828-4d51-a3e6-c38b485f3252",
								"displayValue": "Обращение.Сервисный договор"
							},
							"populatingAttributeSource": {
								"expression": {
									"type": 1,
									"attribute": "UsrCase",
									"attributePath": "ServicePact"
								}
							}
						}
					],
					"childRuleTree": []
				}
			},
			"522550ed-a503-60f9-ed9d-3d53be9202c3": {
				"businessRulesMultiplyActions": true,
				"name": [
					{
						"cultureName": "en-US",
						"value": "Договор: Заполнять значение поля_2"
					},
					{
						"cultureName": "ru-RU",
						"value": "Договор: Автоматическое заполнение из обращения"
					}
				],
				"enabled": true,
				"removed": true,
				"businessRuleTree": {
					"id": "522550ed-a503-60f9-ed9d-3d53be9202c3",
					"type": "group",
					"logicalOperator": "&",
					"actions": [
						{
							"ruleType": 3,
							"columnName": "UsrServicePact",
							"valuePickerData": {
								"source": "EntityColumnValuePickerProvider",
								"value": "139d4452-4415-8aaa-8453-15c01bb13e6b.6ab42472-7828-4d51-a3e6-c38b485f3252",
								"displayValue": "Обращение.Сервисный договор"
							},
							"populatingAttributeSource": {
								"expression": {
									"type": 1,
									"attribute": "UsrCase",
									"attributePath": "ServicePact"
								}
							}
						}
					],
					"childRuleTree": []
				}
			},
			"db8ed10c-605e-05ac-eb51-e416dee09acf": {
				"businessRulesMultiplyActions": true,
				"name": [
					{
						"cultureName": "en-US",
						"value": "Номер Лида: Заполнять значение поля_2"
					},
					{
						"cultureName": "ru-RU",
						"value": "Автоматическое заполнение Номера Лида и Договора"
					}
				],
				"enabled": true,
				"removed": false,
				"businessRuleTree": {
					"id": "db8ed10c-605e-05ac-eb51-e416dee09acf",
					"type": "group",
					"logicalOperator": "&",
					"actions": [
						{
							"ruleType": 3,
							"columnName": "UsrServicePact",
							"valuePickerData": {
								"source": "EntityColumnValuePickerProvider",
								"value": "139d4452-4415-8aaa-8453-15c01bb13e6b.6ab42472-7828-4d51-a3e6-c38b485f3252",
								"displayValue": "Обращение.Сервисный договор"
							},
							"populatingAttributeSource": {
								"expression": {
									"type": 1,
									"attribute": "UsrCase",
									"attributePath": "ServicePact"
								}
							}
						},
						{
							"ruleType": 3,
							"columnName": "UsrLeadNumber",
							"valuePickerData": {
								"source": "EntityColumnValuePickerProvider",
								"value": "139d4452-4415-8aaa-8453-15c01bb13e6b.6ab42472-7828-4d51-a3e6-c38b485f3252.8475b5cb-ebcd-46af-bcbb-86d0e7614b14",
								"displayValue": "Обращение.Сервисный договор.Номер лида"
							},
							"populatingAttributeSource": {
								"expression": {
									"type": 1,
									"attribute": "UsrCase",
									"attributePath": "ServicePact.UsrLeadNumber"
								}
							}
						}
					],
					"childRuleTree": [
						{
							"id": "87b48214-2d87-3247-824f-d3e2298c2bff",
							"type": "condition",
							"conditions": {
								"comparisonType": 2,
								"leftExpression": {
									"type": 1,
									"expressionType": "ColumnBusinessRuleExpression",
									"dataValueType": 10,
									"metaPath": "139d4452-4415-8aaa-8453-15c01bb13e6b",
									"attribute": "UsrCase",
									"entitySchemaName": "Case"
								}
							}
						}
					]
				}
			}
		}/**SCHEMA_ANGULAR_BUSINESS_RULES*/,
		methods: {},
		dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "insert",
				"name": "UsrWorkDurationHours22c4a576-10a3-4679-9826-5944c08f9752",
				"values": {
					"layout": {
						"colSpan": 4,
						"rowSpan": 1,
						"column": 8,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "UsrWorkDurationHours"
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "UsrWorkDurationMinutes41a34184-70a4-4ef4-bd45-89610a8a9211",
				"values": {
					"layout": {
						"colSpan": 4,
						"rowSpan": 1,
						"column": 12,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "UsrWorkDurationMinutes"
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "UsrOverTime1d113a56-67c2-49af-ba86-9516a30afb6e",
				"values": {
					"layout": {
						"colSpan": 4,
						"rowSpan": 1,
						"column": 16,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "UsrOverTime"
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 2
			},
			{
				"operation": "insert",
				"name": "CreatedOnb7d4eb8b-9dd4-4ccb-bea4-deaaacab9048",
				"values": {
					"layout": {
						"colSpan": 8,
						"rowSpan": 1,
						"column": 0,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "CreatedOn"
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 3
			},
			{
				"operation": "insert",
				"name": "UsrLeadNumberba43429d-f1d1-4458-90ac-769882688ccd",
				"values": {
					"layout": {
						"colSpan": 4,
						"rowSpan": 1,
						"column": 0,
						"row": 1,
						"layoutName": "Header"
					},
					"bindTo": "UsrLeadNumber",
					"enabled": false
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 4
			},
			{
				"operation": "insert",
				"name": "UsrServicePacta5b6a4be-b326-425d-a8c6-b6dd4c5e0371",
				"values": {
					"layout": {
						"colSpan": 5,
						"rowSpan": 1,
						"column": 4,
						"row": 1,
						"layoutName": "Header"
					},
					"bindTo": "UsrServicePact",
					"enabled": false,
					"contentType": 5
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 5
			},
			{
				"operation": "insert",
				"name": "UsrCase138378c6-84d7-4caf-a62d-6727179deaff",
				"values": {
					"layout": {
						"colSpan": 5,
						"rowSpan": 1,
						"column": 9,
						"row": 1,
						"layoutName": "Header"
					},
					"bindTo": "UsrCase",
					"enabled": false,
					"contentType": 5
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 6
			},
			{
				"operation": "insert",
				"name": "CreatedBy86ec3867-ccc2-4ee4-a737-7c85c9f280e6",
				"values": {
					"layout": {
						"colSpan": 9,
						"rowSpan": 1,
						"column": 14,
						"row": 1,
						"layoutName": "Header"
					},
					"bindTo": "CreatedBy",
					"enabled": false,
					"contentType": 5
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 7
			},
			{
				"operation": "insert",
				"name": "UsrWorkComments936c0b16-2461-444b-8f66-df0dc7171dd0",
				"values": {
					"layout": {
						"colSpan": 23,
						"rowSpan": 1,
						"column": 0,
						"row": 2,
						"layoutName": "Header"
					},
					"bindTo": "UsrWorkComments"
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 8
			}
		]/**SCHEMA_DIFF*/
	};
});
