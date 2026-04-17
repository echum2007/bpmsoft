---
title: "RunReopenCaseAndNotifyAssigneeClass: Feature Toggle Bypasses BPMN for Engineer Notifications"
aliases: [run-reopen-case, reopen-case-notify, engineer-notification-gap, reminding-only, runsendnotificationcaseownerprocess]
tags: [bpmsoft, feature-toggle, c-sharp, notifications, bpmn, gotcha, wave2]
sources:
  - "daily/2026-04-12.md"
  - "daily/2026-04-13.md"
created: 2026-04-16
updated: 2026-04-16
---

# RunReopenCaseAndNotifyAssigneeClass: Feature Toggle Bypasses BPMN for Engineer Notifications

When feature toggle `RunReopenCaseAndNotifyAssigneeClass = 1` (the production default), BPMSoft's incoming reply handling completely skips the BPMN process `UsrSendNotificationToCaseOwnerCustom1` and executes the C# class `ReopenCaseAndNotifyAssignee` directly. This class creates only a `Reminding` record (push notification in the bell icon) — it does **not** send email to the engineer. No currently identified path sends email to the engineer when a customer replies.

## Key Points

- Feature toggle `RunReopenCaseAndNotifyAssigneeClass = 1` on production — **BPMN `UsrSendNotificationToCaseOwnerCustom1` does not run at all** when a customer replies
- Orchestrator `RunSendNotificationCaseOwnerProcess` checks the toggle and routes to C# class or BPMN — the BPMN path is bypassed on prod
- `ReopenCaseAndNotifyAssignee` (C# class): reopens the case if needed + creates a `Reminding` record only — no email to engineer
- `SendEmailToCaseOnStatusChange` sends email to the **client** (Initiator/Contact), not to the engineer
- Task 2.3 implementation approach: **Variant 2 selected** (2026-04-13) — switch toggle to `0`, consolidate all logic into BPMN `UsrSendNotificationToCaseOwnerCustom1`; see [[concepts/wave2-task23-consolidation-design]]
- `ReopenCaseAndNotifyAssignee` uses `ReopeningCondition` predicate: `!IsReopenStatus && !IsFinalStatus && (IsResolved || IsPaused)` — fires for 16 of 22 case statuses; see [[concepts/reopen-case-predicate-and-status-flags]]
- **Rule:** before modifying any BPMN process, verify it actually runs by checking the orchestrator and all feature toggles in the routing path

## Details

The discovery was triggered by tracing the processing chain for incoming customer replies. The entry point is the orchestrator `RunSendNotificationCaseOwnerProcess`. Inside this process, a feature toggle check routes execution:
- `RunReopenCaseAndNotifyAssigneeClass = 0` → BPMN process `UsrSendNotificationToCaseOwnerCustom1` executes
- `RunReopenCaseAndNotifyAssigneeClass = 1` (production) → C# class `ReopenCaseAndNotifyAssignee` executes directly, BPMN is skipped

The C# class `ReopenCaseAndNotifyAssignee` performs two actions: reopens the case if it was closed/resolved, and creates a `Reminding` record to appear in the engineer's notification bell. It does not invoke any email-sending logic.

`SendEmailToCaseOnStatusChange` was investigated as a potential engineer email source, but it sends to `Initiator` (the case contact/customer), not to the assigned engineer. This is consistent with its name — it is a status-change notification to the case initiator.

The practical implication for Task 2.3 (notifying the engineer with the customer email text): the BPMN modification originally planned is ineffective because the BPMN never fires on production. After deeper analysis on 2026-04-13, **Variant 2** was selected: switch toggle to `0`, consolidate all incoming-reply handling into BPMN `UsrSendNotificationToCaseOwnerCustom1`, and add the engineer email step with customer message text in that BPMN. See [[concepts/wave2-task23-consolidation-design]] for the full plan.

The C# class also sets `Activity.ServiceProcessed = true` after processing — the BPMN currently sets it to `false`. Before finalizing the BPMN implementation, BPMSoft support must clarify the purpose of this field. See [[concepts/activity-service-processed]].

Additionally, Task 2.6 was defined as a separate item: engineer replies sent via email (bypassing the BPMSoft form) should auto-create a reply to the customer — not part of Task 2.3 scope.

## Related Concepts

- [[concepts/bpmn-signal-filter-diagnostics]] — another pattern where BPMN appears non-functional; that case was a signal filter condition; this case is a feature toggle bypass — same symptom, different root cause
- [[concepts/bpmsoft-feature-flags-storage]] — how to query `AdminUnitFeatureState` to read the feature toggle value
- [[concepts/custom-invokable-macro-pattern]] — Task 2.3 design uses this macro approach; the macro remains viable, trigger mechanism is now via BPMN after toggle=0
- [[concepts/kestrel-restart-requirements]] — Variant 2 (BPMN-only) avoids Kestrel restart; would have been required for C# variant
- [[concepts/reopen-case-predicate-and-status-flags]] — `ReopeningCondition` predicate used by the C# class; BPMN gateway conditions must replicate this logic
- [[concepts/wave2-task23-consolidation-design]] — full implementation plan for Variant 2
- [[concepts/activity-service-processed]] — `ServiceProcessed` field set differently by C# vs BPMN; requires support clarification

## Sources

- [[daily/2026-04-12.md]] — Session d8411c8e: feature toggle `RunReopenCaseAndNotifyAssigneeClass = 1` confirmed on prod; `UsrSendNotificationToCaseOwnerCustom1` BPMN confirmed as not executing; `ReopenCaseAndNotifyAssignee` confirmed as Reminding-only; `SendEmailToCaseOnStatusChange` confirmed as client-facing; engineer email gap confirmed; Task 2.6 (engineer email → customer auto-reply) defined as separate item
- [[daily/2026-04-13.md]] — Session ffa57050: `ReopeningCondition` predicate read from system packages; status flags enumerated; indirect chain `UsrProcess_0c71a12CTI5` identified; Session f8b29840: Variant 2 (toggle=0, BPMN consolidation) selected; `ServiceProcessed` divergence confirmed; support ticket flagged
