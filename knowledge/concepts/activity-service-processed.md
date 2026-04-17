---
title: "Activity.ServiceProcessed: Boolean Field with Divergent C# vs BPMN Values"
aliases: [serviceprocessed, activity-serviceprocessed, service-processed-flag]
tags: [bpmsoft, data-model, c-sharp, bpmn, notifications, wave2, gotcha]
sources:
  - "daily/2026-04-13.md"
created: 2026-04-16
updated: 2026-04-16
---

# Activity.ServiceProcessed: Boolean Field with Divergent C# vs BPMN Values

`Activity.ServiceProcessed` is a boolean column added to the `Activity` entity in the **Case** package (UId: `1b3d86ae-616d-49c5-b738-63b2a25c9607`). The two paths for handling incoming customer replies set it to opposite values: the C# class sets it to `true`, the BPMN process sets it to `false`. The field's purpose and consuming code were not conclusively identified as of 2026-04-13.

## Key Points

- Column: `ServiceProcessed` (boolean) on the `Activity` entity; added in package `Case` (UId `1b3d86ae-616d-49c5-b738-63b2a25c9607`)
- **C# path** (`ReopenCaseAndNotifyAssignee`): sets `ServiceProcessed = true` after processing the incoming reply activity
- **BPMN path** (`UsrSendNotificationToCaseOwnerCustom1`): sets `ServiceProcessed = false`
- The purpose of the field is unclear — no consuming code (filters, queries, UI display) was positively identified that reads this value to make decisions
- Resolution: open support ticket with BPMSoft technical support to clarify semantics before relying on the field in Wave 2 design
- Until semantics are confirmed, the Wave 2 implementation (variant 2, toggle=0) should replicate the value the C# class would have set (`true`) to maintain behavioral parity

## Details

The divergence was discovered while comparing the two execution paths for incoming reply handling. When `RunReopenCaseAndNotifyAssigneeClass = 1` (production default), `ReopenCaseAndNotifyAssignee` runs and sets `ServiceProcessed = true` on the inbound `Activity`. When the toggle is `0`, `UsrSendNotificationToCaseOwnerCustom1` (BPMN) runs a Script Task that sets `ServiceProcessed = false`.

The inverse values suggest one of several possibilities:
1. The field was meant to track whether the activity was "processed by the service module" — the C# class marks it done (`true`), while the BPMN incorrectly sets it to `false` (possible legacy bug)
2. The field has opposite semantics in each context — e.g., `true` = "handled by direct C# class", `false` = "handled via BPMN process"
3. The BPMN Script Task may have a bug (should set `true` but uses `false`)

Because the field was added in the base `Case` package (not a CTI customization), it likely has a platform-defined purpose. Searching the system packages for `ServiceProcessed` usage would clarify which other processes or queries filter by this field. This was flagged as a pre-implementation action item for Wave 2 task 2.3.

For Wave 2 variant 2 (consolidating into BPMN with toggle=0), the BPMN will need to correctly set this field. Until support confirms the semantics, the safer default is `true` (matching the C# class behavior) since that is the current production behavior.

## Related Concepts

- [[concepts/run-reopen-case-notify-assignee]] — the C# class that sets `ServiceProcessed = true`; feature toggle that controls which path runs
- [[concepts/wave2-task23-consolidation-design]] — variant 2 design that must handle `ServiceProcessed` correctly in BPMN
- [[concepts/reopen-case-predicate-and-status-flags]] — the same C# class that sets this field also implements the ReopeningCondition predicate

## Sources

- [[daily/2026-04-13.md]] — Session f8b29840: `ServiceProcessed` column confirmed in `Case` package UId `1b3d86ae-616d-49c5-b738-63b2a25c9607`; C#=true, BPMN=false divergence confirmed; purpose unknown; support ticket flagged as prerequisite for finalizing variant 2 implementation
