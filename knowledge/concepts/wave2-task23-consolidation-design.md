---
title: "Wave 2 Task 2.3: Variant 2 — Consolidation into Single BPMN (toggle=0)"
aliases: [task-23-design, wave2-variant2, toggle-zero-consolidation, notifications-wave2-design]
tags: [bpmsoft, notifications, wave2, bpmn, architecture, design-decision]
sources:
  - "daily/2026-04-13.md"
  - "daily/2026-04-14.md"
created: 2026-04-16
updated: 2026-04-16
---

# Wave 2 Task 2.3: Variant 2 — Consolidation into Single BPMN (toggle=0)

Task 2.3 of notifications-wave2 (inject the latest customer email text into engineer notifications) was designed across two sessions on 2026-04-13. **Variant 2** was selected: switch feature toggle `RunReopenCaseAndNotifyAssigneeClass = 0`, consolidate all reply-handling logic into the BPMN process `UsrSendNotificationToCaseOwnerCustom1`, and add email-to-engineer with customer text in that BPMN. Deactivate the indirect email chain (`UsrProcess_0c71a12CTI5`).

## Key Points

- **Selected approach: Variant 2** — toggle=0, all logic in one BPMN; clean architecture with single execution path
- Three variants were considered: (1) C# subclass/decorator of `ReopenCaseAndNotifyAssignee`, (2) BPMN consolidation with toggle=0, (3) extend existing indirect chain process `UsrProcess_0c71a12CTI5`
- Implementation plan (pending `ServiceProcessed` clarification from BPMSoft support):
  1. Switch `RunReopenCaseAndNotifyAssigneeClass = 0` (system setting)
  2. Correct `ServiceProcessed` in BPMN Script Task (currently sets `false`; likely should be `true`)
  3. Add engineer email send step with `#UsrLatestCustomerEmail#` macro in BPMN
  4. Deactivate `UsrProcess_0c71a12CTI5` (no longer needed)
- **Blocker before coding:** confirm `Activity.ServiceProcessed` semantics with BPMSoft technical support
- Task 2.6 is a separate item: engineer replies sent via Outlook (bypassing BPMSoft form) should auto-create a customer reply in BPMSoft
- **Side-effect of deactivating `UsrProcess_0c71a12CTI5`:** the current process hardcodes a CC to the entire "1-я линия" role — deactivation removes this role-wide CC; the new BPMN must explicitly decide whether to replicate it (see [[concepts/usrprocess-indirect-chain-hardcoded]])

## Details

Three implementation variants were analyzed:

**Variant 1 — C# subclass/decorator:** Extend `ReopenCaseAndNotifyAssignee` in the CTI package, add email logic there, keep toggle=1. Pros: minimal change to current runtime path. Cons: C# deployment requires Kestrel restart; adds more C# to maintain; doesn't eliminate the indirect process chain.

**Variant 2 — BPMN consolidation (selected):** Set toggle=0, make `UsrSendNotificationToCaseOwnerCustom1` the sole handler. Add the engineer email step (with customer message text via invokable macro) directly in this BPMN. Deactivate `UsrProcess_0c71a12CTI5`. Pros: single control flow, visible in BPMN designer, no C# restart needed for future iterations. Cons: the BPMN currently sets `ServiceProcessed = false` (C# sets `true`) — must be reconciled; requires verifying gateway conditions in BPMN match the C# `ReopeningCondition` predicate.

**Variant 3 — Extend indirect chain:** Keep toggle=1, add engineer email to `UsrProcess_0c71a12CTI5`. The indirect chain is: C# changes status → StartSignal fires → `UsrProcess_0c71a12CTI5` runs. This is a fragile coupling that depends on the status-change signal firing reliably. Adding more logic to a fragile chain increases risk.

Variant 2 was chosen for architectural cleanliness. The indirect process chain (`UsrProcess_0c71a12CTI5`) is a discovered implementation artifact from an earlier phase, not an intentional design. Centralizing in one BPMN makes future maintenance straightforward and eliminates the hidden dependency between the C# class and the signal-triggered process.

## Related Concepts

- [[concepts/run-reopen-case-notify-assignee]] — the C# class being bypassed by toggle=0; feature toggle semantics
- [[concepts/activity-service-processed]] — `ServiceProcessed` field that differs between paths; requires BPMSoft support clarification before final implementation
- [[concepts/reopen-case-predicate-and-status-flags]] — BPMN gateway conditions in `UsrSendNotificationToCaseOwnerCustom1` must replicate `ReopeningCondition` predicate semantics
- [[concepts/custom-invokable-macro-pattern]] — the `#UsrLatestCustomerEmail#` macro approach to inject customer email text into the engineer notification
- [[concepts/kestrel-restart-requirements]] — Variant 2 (BPMN only) avoids Kestrel restart for future iterations; Variant 1 (C#) would require it
- [[concepts/usrprocess-indirect-chain-hardcoded]] — `UsrProcess_0c71a12CTI5` hardcoded sender and role-CC details; deactivating it removes role-wide CC to "1-я линия"

## Sources

- [[daily/2026-04-13.md]] — Session ffa57050: three variants analyzed; indirect chain (`UsrProcess_0c71a12CTI5`) identified as fragile; Session f8b29840: Variant 2 selected; implementation plan drafted; `ServiceProcessed` clarification flagged as pre-implementation blocker; Task 2.6 (engineer email → customer auto-reply) scoped as separate item
- [[daily/2026-04-14.md]] — Session 21e5095d: `UsrProcess_0c71a12CTI5` inspected from CTI archive; hardcoded sender `servicedesk@cti.ru` and CC to role "1-я линия" confirmed; deactivating this process removes role-wide CC — behavior change requiring stakeholder decision
