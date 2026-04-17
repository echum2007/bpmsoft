---
title: "ESQ Filter Chain for TimeToPrioritize"
aliases: [timetoprioritize-esq, sla-esq]
tags: [bpmsoft, esq, data-model, sla]
sources:
  - "daily/2026-04-06.md"
created: 2026-04-16
updated: 2026-04-16
---

# ESQ Filter Chain for TimeToPrioritize

`TimeToPrioritize` stores SLA response/solution times per priority × service combination. Querying it requires a three-column filter chain to uniquely identify the relevant row for a given case context.

## Key Points

- Three filters are required: `CasePriority`, `ServiceInServicePact.ServicePact`, `ServiceInServicePact.ServiceItem`
- With all three filters applied, the query returns exactly **1 record**
- The path `ServiceInServicePact.ServicePact` and `ServiceInServicePact.ServiceItem` traverse the `ServiceInServicePact` linked table — a join path, not a direct column
- Confirmed working in live system during service-mode-indicator development (2026-04-06)
- Result column of interest: `SolutionTimeUnit` (or `TimeUnitCode`) — see [[concepts/time-unit-codes]]

## Details

The `TimeToPrioritize` entity is linked to service configuration via the `ServiceInServicePact` relationship. A direct filter on `ServiceItem` alone is insufficient because the same service item can appear in multiple service pacts. The correct filter chain anchors to both the pact and the item, plus the case priority, to pinpoint the exact SLA row.

When building the ESQ in JavaScript (client-side), the column path syntax for related entities uses dot notation: `"ServiceInServicePact.ServicePact"` and `"ServiceInServicePact.ServiceItem"`. The filter values should come from the case's currently loaded `ServicePact`, `ServiceItem`, and `Priority` attributes.

## Related Concepts

- [[concepts/time-unit-codes]] — codes returned by this query's `SolutionTimeUnit` column
- [[concepts/bpmsoft-visible-binding-gotchas]] — downstream issue when this query's result is used to drive UI visibility

## Sources

- [[daily/2026-04-06.md]] — Filter chain verified live; returned 1 record with `TimeUnitCode = "Hour"`
