define("ServiceItemPage", [], function() {
	return {
		entitySchemaName: "ServiceItem",
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
				"name": "CaseCategory",
				"values": {
					"enabled": true
				}
			},
			{
				"operation": "merge",
				"name": "ServiceConditionsTab",
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
				"operation": "merge",
				"name": "UsersTab",
				"values": {
					"order": 2
				}
			},
			{
				"operation": "merge",
				"name": "HistoryTab",
				"values": {
					"order": 3
				}
			},
			{
				"operation": "merge",
				"name": "NotesFilesTab",
				"values": {
					"order": 4
				}
			},
			{
				"operation": "merge",
				"name": "ESNTab",
				"values": {
					"order": 5
				}
			},
			{
				"operation": "move",
				"name": "Owner",
				"parentName": "Header",
				"propertyName": "items",
				"index": 6
			},
			{
				"operation": "move",
				"name": "Category",
				"parentName": "Header",
				"propertyName": "items",
				"index": 7
			},
			{
				"operation": "move",
				"name": "ReactionTimeUnit",
				"parentName": "Header",
				"propertyName": "items",
				"index": 4
			},
			{
				"operation": "move",
				"name": "Status",
				"parentName": "Header",
				"propertyName": "items",
				"index": 1
			}
		]/**SCHEMA_DIFF*/
	};
});
