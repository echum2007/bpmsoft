---
title: "Labor Records Project: Key Design Decisions"
aliases: [labor-records, трудозатраты, time-logging-ux, ev-time]
tags: [bpmsoft, project, labor-records, ux, design]
sources:
  - "daily/2026-04-07.md"
created: 2026-04-16
updated: 2026-04-16
---

# Labor Records Project: Key Design Decisions

The labor-records project improves BPMSoft's existing time-logging mechanism for engineers and adds an approval workflow. As of 2026-04-07, the design was captured in a business document (v1.3, not a full spec) intended for discussion with non-technical process participants.

## Key Points

- Engineers already log time in BPMSoft; this project enhances the existing mechanism and adds managerial approval — it is not a greenfield feature
- **Time-logging UX:** a popup card appears on **every** message/reply save in the case feed, not once per day — engineers must acknowledge the time spent on each interaction
- **Zero logging allowed:** entering 0h 0min is explicitly permitted, for formal/service replies that consumed no billable time
- **Overtime flag in service contract:** a new boolean field "Overtime Allowed" is added to `ServicePact` — it is **informational only**, not a technical block; visible to the manager when reviewing overtime submissions
- **EV-Time** is an external system for extracting time-log data from ExtraView (EV), the legacy system being phased out; it is distinct from BPMSoft's internal time-logging

## Details

The trigger for the time-logging popup is intentionally granular: each time an engineer saves a message or reply in a case, a card appears asking them to record time spent. This design was chosen over a once-per-day approach to keep logging in context and reduce recall errors. The tradeoff is more frequent interruptions, but the assumption is that each case interaction has a discrete, measurable cost that should be captured immediately.

Zero-hour entries are a deliberate affordance. Engineers handling administrative or routing replies (e.g., forwarding to another team, acknowledging receipt) should not be penalized for not having billable time to report. Requiring a nonzero entry would either produce inflated numbers or lead engineers to skip logging entirely.

The "Overtime Allowed" flag on `ServicePact` does not enforce any rule at the system level — it cannot block a manager from approving overtime, and it cannot prevent an engineer from submitting time beyond contractual hours. Its purpose is informational: during the approval step, the manager sees whether the service contract permits overtime, and uses that as a signal in their decision. This keeps the system flexible while surfacing the relevant policy data.

EV-Time is a separate external system, not a BPMSoft module. It was built to extract time records from ExtraView (the legacy ITSM system being replaced by BPMSoft). The labor-records project does not integrate with EV-Time — they are parallel systems covering the same conceptual domain (engineer time tracking) during the migration period.

The business document at `projects/labor-records/Процесс регистрации трудозатрат v1.3.docx` was deliberately written as a non-technical document for stakeholder discussion, separate from the technical spec (`LABOR_RECORDS_SPEC_v1.md`).

## Related Concepts

- [[concepts/esq-timetoprioritize-filter-chain]] — ServicePact is also a key entity in SLA queries; overtime flag adds to ServicePact schema
- [[concepts/claude-code-bypass-with-deny-rules]] — settings established in the same day's session

## Sources

- [[daily/2026-04-07.md]] — Design decisions finalized in stakeholder discussion prep: popup per message (not per day), zero logging allowed, overtime flag informational; EV-Time clarified as external ExtraView extraction tool; v1.3 business doc created
