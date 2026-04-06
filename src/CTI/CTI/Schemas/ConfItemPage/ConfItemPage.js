define("ConfItemPage", [], function() {
	return {
		entitySchemaName: "ConfItem",
		attributes: {},
		modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
		details: /**SCHEMA_DETAILS*/{
			"ConfItemUserDetail6fac1fcc": {
				"schemaName": "ConfItemUserDetail",
				"entitySchemaName": "ConfItemUser",
				"filter": {
					"detailColumn": "ConfItem",
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
				"operation": "insert",
				"name": "LOOKUP5b66f1fc-6067-4ac3-aa43-cd3e68551e67",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 0,
						"row": 1,
						"layoutName": "Header"
					},
					"bindTo": "UsrVendor",
					"enabled": true,
					"contentType": 3
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "merge",
				"name": "Status",
				"values": {
					"enabled": false
				}
			},
			{
				"operation": "remove",
				"name": "Status",
				"properties": [
					"labelConfig"
				]
			},
			{
				"operation": "insert",
				"name": "Categorya0c0db8c-0570-4ba2-a2d3-9a2dfcf3c9aa",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 0,
						"row": 2,
						"layoutName": "Header"
					},
					"bindTo": "Category",
					"enabled": true,
					"contentType": 5
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 3
			},
			{
				"operation": "merge",
				"name": "Type",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 0,
						"row": 3
					},
					"contentType": 5,
					"enabled": true
				}
			},
			{
				"operation": "merge",
				"name": "Model",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 0,
						"row": 4
					}
				}
			},
			{
				"operation": "insert",
				"name": "Address42896b54-8155-474c-b7e8-9f9877190e04",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 13,
						"row": 4,
						"layoutName": "Header"
					},
					"bindTo": "Address"
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 8
			},
			{
				"operation": "merge",
				"name": "GeneralInfoTab",
				"values": {
					"order": 0
				}
			},
			{
				"operation": "merge",
				"name": "RelationshipTab",
				"values": {
					"order": 1
				}
			},
			{
				"operation": "insert",
				"name": "ConfItemUserDetail6fac1fcc",
				"values": {
					"itemType": 2,
					"markerValue": "added-detail"
				},
				"parentName": "RelationshipTab",
				"propertyName": "items",
				"index": 3
			},
			{
				"operation": "merge",
				"name": "HistoryTab",
				"values": {
					"order": 2
				}
			},
			{
				"operation": "merge",
				"name": "NotesFilesTab",
				"values": {
					"order": 3
				}
			},
			{
				"operation": "merge",
				"name": "ESNTab",
				"values": {
					"order": 4
				}
			},
			{
				"operation": "remove",
				"name": "Category"
			},
			{
				"operation": "remove",
				"name": "User"
			},
			{
				"operation": "move",
				"name": "SerialNumber",
				"parentName": "Header",
				"propertyName": "items",
				"index": 6
			},
			{
				"operation": "move",
				"name": "InventoryNumber",
				"parentName": "Header",
				"propertyName": "items",
				"index": 4
			},
			{
				"operation": "move",
				"name": "Name",
				"parentName": "Header",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "move",
				"name": "WarrantyUntil",
				"parentName": "ActualStatusGroup_GridLayout",
				"propertyName": "items",
				"index": 3
			},
			{
				"operation": "move",
				"name": "ParentConfItem",
				"parentName": "ActualStatusGroup_GridLayout",
				"propertyName": "items",
				"index": 2
			},
			{
				"operation": "move",
				"name": "Owner",
				"parentName": "ActualStatusGroup_GridLayout",
				"propertyName": "items",
				"index": 0
			}
		]/**SCHEMA_DIFF*/
	};
});
