---
title: "UsrProcess_0c71a12CTI5: Hardcoded Sender and Role-Based CC"
aliases: [indirect-chain-hardcoded, usrprocess-0c71a12, servicedesk-sender, first-line-cc, роль-1-линия]
tags: [bpmsoft, bpmn, notifications, wave2, gotcha, c-sharp]
sources:
  - "daily/2026-04-14.md"
created: 2026-04-16
updated: 2026-04-16
---

# UsrProcess_0c71a12CTI5: Hardcoded Sender and Role-Based CC

The indirect notification chain process `UsrProcess_0c71a12CTI5` (triggered after `ReopenCaseAndNotifyAssignee` changes case status) contains **three hardcoded parameters** in its `EmailTemplateUserTask2` element. The sender is fixed to `servicedesk@cti.ru` and the CC is fixed to the entire "1-я линия" role — meaning all role members receive the customer reply notification. Deactivating this process (as planned in Task 2.3 Variant 2) is a behavior change that removes this role-wide CC.

## Key Points

- **Hardcoded sender:** `servicedesk@cti.ru` — referenced by MailboxSyncSettings UId `8cdcb9c4...`; cannot be changed without modifying the process schema
- **Hardcoded CC:** role "1-я линия" (VwSysFunctionalRole UId `e142ad2e...`) — all members of this role receive a CC copy of the engineer reply notification
- Three parameters total are hardcoded in `EmailTemplateUserTask2` of `UsrProcess_0c71a12CTI5`
- `VwSysFunctionalRole` is a **View** in PostgreSQL, not a direct table — it cannot be queried as `SysFunctionalRole`; must use the `Vw`-prefixed view name
- When Task 2.3 Variant 2 deactivates this process, the role-wide CC to "1-я линия" is also removed — this is a side-effect that requires stakeholder awareness

## Details

`UsrProcess_0c71a12CTI5` is the indirect BPMN chain discovered during Task 2.3 analysis. Its execution path is: `ReopenCaseAndNotifyAssignee` (C# class) changes case status → status-change StartSignal fires → `UsrProcess_0c71a12CTI5` enqueues and sends an email. This process was not designed as part of Wave 2 — it is an existing production process.

The hardcoded values were found by reading the process schema from the CTI binary archive using the Python reader script. The `EmailTemplateUserTask2` activity contains:
1. **Sender mailbox:** MailboxSyncSettings UId `8cdcb9c4-...` = `servicedesk@cti.ru`
2. **CC role:** VwSysFunctionalRole UId `e142ad2e-...` = "1-я линия"
3. **Third parameter** (exact nature not recorded — read from process BPMN XML)

The CC to the entire "1-я линия" role is significant: it means **every member of the first-line support role receives a copy** of the notification sent when a customer replies to a case. Currently (with toggle=1 and `UsrProcess_0c71a12CTI5` active), this is the production behavior.

**Task 2.3 implication:** When Variant 2 is implemented (toggle=0, `UsrProcess_0c71a12CTI5` deactivated), the new BPMN `UsrSendNotificationToCaseOwnerCustom1` takes over. Unless it explicitly replicates the role-based CC, the "1-я линия" group will no longer receive automatic copies of customer-reply notifications. This behavior change — from role-wide CC to owner-only notification — must be confirmed with stakeholders before deployment.

**Adding customer email text to the notification (Task 2.3 goal)** compounds the privacy consideration: if the role-wide CC is preserved in the new BPMN, all "1-я линия" members will see the customer email content. If it is removed, only the case owner sees it. Neither choice is obviously correct — it depends on the team's escalation and visibility policy.

**PostgreSQL/BPMSoft view gotcha:** When inspecting role data in the database, querying `SysFunctionalRole` directly fails or returns different data from what is expected. `VwSysFunctionalRole` is a view (prefixed `Vw`) that aggregates role data — always use the `Vw`-prefixed name when querying functional roles in the BPMSoft PostgreSQL schema.

## Related Concepts

- [[concepts/run-reopen-case-notify-assignee]] — the C# class whose status-change triggers `UsrProcess_0c71a12CTI5`; feature toggle that controls whether this chain runs
- [[concepts/wave2-task23-consolidation-design]] — Variant 2 deactivates this process; the role-CC side-effect needs explicit decision in the design
- [[concepts/bpmn-signal-filter-diagnostics]] — indirect chains triggered by StartSignal; same architecture as this process's trigger mechanism
- [[concepts/bpmsoft-feature-flags-storage]] — AdminUnitFeatureState storage context; the toggle `RunReopenCaseAndNotifyAssigneeClass=1` keeps this process active on production

## Sources

- [[daily/2026-04-14.md]] — Session 21e5095d: CTI archive read for `UsrProcess_0c71a12CTI5`; three hardcoded parameters in `EmailTemplateUserTask2` identified; sender = `servicedesk@cti.ru` (MailboxSyncSettings `8cdcb9c4...`); CC = role "1-я линия" (VwSysFunctionalRole `e142ad2e...`); `VwSysFunctionalRole` confirmed as View not table; role-wide CC implication for Task 2.3 Variant 2 noted
