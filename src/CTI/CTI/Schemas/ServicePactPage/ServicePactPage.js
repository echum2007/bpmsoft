define("ServicePactPage", [], function() {
	return {
		entitySchemaName: "ServicePact",
		attributes: {},
		modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
		details: /**SCHEMA_DETAILS*/{
			"UsrSchema50be5dfeDetail5b92ea10": {
				"schemaName": "UsrSchema50be5dfeDetail",
				"entitySchemaName": "UsrConfIteminService",
				"filter": {
					"detailColumn": "UsrServicePact",
					"masterColumn": "Id"
				}
			},
			"UsrSchema021c2f40Detailf63db26b": {
				"schemaName": "UsrSchema021c2f40Detail",
				"entitySchemaName": "UsrLaborRecords",
				"filter": {
					"detailColumn": "UsrServicePact",
					"masterColumn": "Id"
				}
			}
		}/**SCHEMA_DETAILS*/,
		businessRules: /**SCHEMA_BUSINESS_RULES*/{}/**SCHEMA_BUSINESS_RULES*/,
		businessRulesMultiplyActions: /**SCHEMA_ANGULAR_BUSINESS_RULES*/{}/**SCHEMA_ANGULAR_BUSINESS_RULES*/,
		methods: {},
		dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "merge",
				"name": "Name",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 0,
						"row": 0
					},
					"enabled": true
				}
			},
			{
				"operation": "remove",
				"name": "Name",
				"properties": [
					"contentType",
					"labelConfig"
				]
			},
			{
				"operation": "move",
				"name": "Name",
				"parentName": "Header",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "STRINGa8dac065-48c1-49f8-b7c1-3ff2a5e9405c",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 13,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "UsrLeadNumber",
					"enabled": true
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "LOOKUP11800e1f-e67a-4cfd-b122-0aae14efbd1f",
				"values": {
					"layout": {
						"colSpan": 5,
						"rowSpan": 1,
						"column": 0,
						"row": 1,
						"layoutName": "Header"
					},
					"bindTo": "UsrContractType",
					"enabled": true,
					"contentType": 3
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 2
			},
			{
				"operation": "merge",
				"name": "Owner",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 13,
						"row": 1
					}
				}
			},
			{
				"operation": "move",
				"name": "Owner",
				"parentName": "Header",
				"propertyName": "items",
				"index": 3
			},
			{
				"operation": "merge",
				"name": "StartDate",
				"values": {
					"layout": {
						"colSpan": 5,
						"rowSpan": 1,
						"column": 0,
						"row": 2
					}
				}
			},
			{
				"operation": "move",
				"name": "StartDate",
				"parentName": "Header",
				"propertyName": "items",
				"index": 4
			},
			{
				"operation": "merge",
				"name": "Calendar",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 13,
						"row": 2
					}
				}
			},
			{
				"operation": "move",
				"name": "Calendar",
				"parentName": "Header",
				"propertyName": "items",
				"index": 5
			},
			{
				"operation": "merge",
				"name": "EndDate",
				"values": {
					"layout": {
						"colSpan": 5,
						"rowSpan": 1,
						"column": 0,
						"row": 3
					}
				}
			},
			{
				"operation": "merge",
				"name": "Status",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 13,
						"row": 3
					}
				}
			},
			{
				"operation": "merge",
				"name": "GeneralInfoTab",
				"values": {
					"order": 0
				}
			},
			{
				"operation": "insert",
				"name": "UsrSchema50be5dfeDetail5b92ea10",
				"values": {
					"itemType": 2,
					"markerValue": "added-detail"
				},
				"parentName": "GeneralInfoTab",
				"propertyName": "items",
				"index": 3
			},
			{
				"operation": "merge",
				"name": "HistoryTab",
				"values": {
					"order": 1
				}
			},
			{
				"operation": "insert",
				"name": "UsrSchema021c2f40Detailf63db26b",
				"values": {
					"itemType": 2,
					"markerValue": "added-detail"
				},
				"parentName": "HistoryTab",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "merge",
				"name": "ESNTab",
				"values": {
					"order": 3
				}
			},
			{
				"operation": "merge",
				"name": "NotesFilesTab",
				"values": {
					"order": 2
				}
			},
			{
				"operation": "remove",
				"name": "Number"
			},
			{
				"operation": "remove",
				"name": "Type"
			},
			{
				"operation": "remove",
				"name": "SupportLevel"
			}
		]/**SCHEMA_DIFF*/
	};
});
