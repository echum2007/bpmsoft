---
title: "BPMSoft Time Unit Codes (TimeToPrioritize)"
aliases: [time-units, solution-time-unit, SolutionTimeUnit]
tags: [bpmsoft, data-model, sla, gotcha]
sources:
  - "daily/2026-04-06.md"
created: 2026-04-16
updated: 2026-04-16
---

# BPMSoft Time Unit Codes (TimeToPrioritize)

The `TimeToPrioritize` table stores SLA timing configuration per priority/service combination. Its `SolutionTimeUnit` column (and equivalent time unit columns) use short code strings — **not** the verbose "Calendar" prefixed names one might expect.

## Key Points

- Real codes are: `Hour`, `Day`, `Minute` — plain, no prefix
- Codes do **not** contain the word `"Calendar"` — checking `.indexOf("Calendar")` will never match and silently produces wrong results
- ESQ against `TimeToPrioritize` with three filters (Priority + ServiceInServicePact.ServicePact + ServiceInServicePact.ServiceItem) correctly returns a single matching record
- Filtering by `TimeUnitCode` string value should compare against `"Hour"`, `"Day"`, `"Minute"` directly
- If logic branches on the unit code and the result is always the "default" path, suspect a bad string comparison first

## Details

During development of the service-mode indicator, an ESQ query was confirmed to return `TimeUnitCode = "Hour"` for a real record. The original code checked `code.indexOf("Calendar") >= 0` to detect calendar-based units. Because none of the real codes contain that substring, the condition never fired, leaving `UsrServiceMode` permanently empty and the indicator invisible.

The fix is to compare against the actual codes: `"Hour"`, `"Day"`, `"Minute"`. When discriminating between calendar and non-calendar modes (if the distinction exists in the business logic), a positive whitelist approach (`code === "Hour" || code === "Day"`) is safer than a substring search.

## Related Concepts

- [[concepts/esq-timetoprioritize-filter-chain]] — how to build the correct ESQ query to reach this table
- [[concepts/bpmsoft-visible-binding-gotchas]] — another silent failure pattern discovered in the same session

## Sources

- [[daily/2026-04-06.md]] — Discovered during live ESQ debugging; `TimeUnitCode = "Hour"` confirmed via query, `indexOf("Calendar")` identified as the root cause of empty `UsrServiceMode`
