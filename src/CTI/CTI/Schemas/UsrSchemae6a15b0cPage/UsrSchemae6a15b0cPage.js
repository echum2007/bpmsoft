define("UsrSchemae6a15b0cPage", [], function() {
	return {
		entitySchemaName: "TimeToPrioritize",
		attributes: {},
		modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
		details: /**SCHEMA_DETAILS*/{}/**SCHEMA_DETAILS*/,
		businessRules: /**SCHEMA_BUSINESS_RULES*/{}/**SCHEMA_BUSINESS_RULES*/,
		businessRulesMultiplyActions: /**SCHEMA_ANGULAR_BUSINESS_RULES*/{}/**SCHEMA_ANGULAR_BUSINESS_RULES*/,
		methods: {},
		dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "insert",
				"name": "ServiceInServicePact31b45b1b-4d8e-43be-b7b9-23915f3efbd4",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 0,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "ServiceInServicePact"
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "CasePrioritye78e04d6-025e-4e1c-901f-d3fb57be589d",
				"values": {
					"layout": {
						"colSpan": 5,
						"rowSpan": 1,
						"column": 0,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "CasePriority"
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "SolutionTimeValuee5293c26-d8ed-46c0-9cf7-0ec9150a3f40",
				"values": {
					"layout": {
						"colSpan": 5,
						"rowSpan": 1,
						"column": 5,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "SolutionTimeValue"
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "SolutionTimeUnitfea32057-325d-46f0-93a2-9912ef0a3efc",
				"values": {
					"layout": {
						"colSpan": 6,
						"rowSpan": 1,
						"column": 10,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "SolutionTimeUnit"
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 2
			},
			{
				"operation": "insert",
				"name": "Tab5610822dTabLabel",
				"values": {
					"caption": {
						"bindTo": "Resources.Strings.Tab5610822dTabLabelTabCaption"
					},
					"items": [],
					"order": 0
				},
				"parentName": "Tabs",
				"propertyName": "tabs",
				"index": 0
			}
		]/**SCHEMA_DIFF*/
	};
});
