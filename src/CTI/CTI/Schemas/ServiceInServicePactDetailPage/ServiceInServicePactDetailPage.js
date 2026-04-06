define("ServiceInServicePactDetailPage", [], function() {
	return {
		entitySchemaName: "ServiceInServicePact",
		attributes: {},
		modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
		details: /**SCHEMA_DETAILS*/{}/**SCHEMA_DETAILS*/,
		businessRules: /**SCHEMA_BUSINESS_RULES*/{}/**SCHEMA_BUSINESS_RULES*/,
		businessRulesMultiplyActions: /**SCHEMA_ANGULAR_BUSINESS_RULES*/{}/**SCHEMA_ANGULAR_BUSINESS_RULES*/,
		methods: {},
		dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "merge",
				"name": "Calendar",
				"values": {
					"enabled": true,
					"contentType": 5
				}
			},
			{
				"operation": "insert",
				"name": "LOOKUPd0b490b9-a40d-43c3-8b9d-040a7373d22c",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 0,
						"row": 6,
						"layoutName": "Header"
					},
					"bindTo": "UsrLookup1",
					"enabled": false,
					"contentType": 5
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 8
			},
			{
				"operation": "merge",
				"name": "TimeToPrioritizeTab",
				"values": {
					"order": 0
				}
			}
		]/**SCHEMA_DIFF*/
	};
});
