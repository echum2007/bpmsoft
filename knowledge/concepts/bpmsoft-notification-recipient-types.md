---
title: "BPMSoft Notification Recipient Types: Initiator vs Service User"
aliases: [initiator-vs-user-of-service, notification-recipients, инициатор-пользователь-услуги, case-notification-templates]
tags: [bpmsoft, notifications, data-model, wave2, platform]
sources:
  - "daily/2026-04-14.md"
created: 2026-04-16
updated: 2026-04-16
---

# BPMSoft Notification Recipient Types: Initiator vs Service User

BPMSoft distinguishes two separate recipient types in case email notifications: **Initiator** (Инициатор) and **Service User** (Пользователь услуги). These are not the same person and have separate email templates. The distinction is documented in the official platform documentation (pp. 223–229) and was not accounted for in early Wave 2 notification analysis.

## Key Points

- **Initiator** (Инициатор) — the person who opened (registered) the case; may be an internal employee submitting a request
- **Service User** (Пользователь услуги) — the person actually receiving the service; may differ from the initiator (e.g., a manager opens a case on behalf of an end user)
- Each recipient type has **separate notification templates** — a template configured for "Initiator" will not be sent to the Service User and vice versa
- System settings control which recipient types receive which notification categories — not hardcoded in process logic
- A total of 15 notification email templates were identified in the CTI system (documented in `email_notifications_description.docx`, Table 15)
- The `CaseNotificationRule` entity maps case category + status pairs to specific templates, separately for each recipient type

## Details

The Initiator vs Service User distinction matters for Wave 2 design because adding customer email text to a notification must target the correct recipient type. A notification template addressed to "Initiator" reaches the person who opened the case; one addressed to "Service User" reaches the beneficiary. In many cases they are the same person, but in corporate ITSM scenarios (IT department submitting on behalf of business users) they differ.

This was discovered when reviewing platform documentation pages 223–229 during creation of `email_notifications_description.docx`. The documentation section describes separate recipient configuration per notification rule, including system settings that toggle which types receive automated messages. These system settings are distinct from the feature flags stored in `AdminUnitFeatureState` — they govern recipient selection, not feature activation.

The `CaseNotificationRule` entity (referenced in [[concepts/casecategory-sla-independence]]) encodes notification rules per Category+Status pair. It stores the recipient type (Initiator or Service User) alongside the template reference, delivery delay, and channel. When building Wave 2 notification triggers, the correct recipient type must be specified in the rule — using the wrong type will silently skip the intended recipient.

For the engineer notification (Task 2.3), the relevant recipient is neither Initiator nor Service User but the **case Owner** (assigned engineer). Engineer notifications use a different mechanism — direct email to the owner's address — not the `CaseNotificationRule` lookup. The Initiator/Service User distinction therefore applies primarily to customer-facing notification templates (the 15 templates in the table), not to the engineer channel being designed in Task 2.3.

## Related Concepts

- [[concepts/casecategory-sla-independence]] — `CaseNotificationRule` entity context; Category+Status pairs that link to templates per recipient type
- [[concepts/custom-invokable-macro-pattern]] — Wave 2 Task 2.3 engineer notification uses a different channel than Initiator/ServiceUser templates
- [[concepts/wave2-task23-consolidation-design]] — Task 2.3 targets the engineer (Owner), not Initiator/ServiceUser — recipient type distinction confirms scope boundary
- [[concepts/bpmsoft-feature-flags-storage]] — system settings that control feature behavior; recipient-type toggles are separate from AdminUnitFeatureState

## Sources

- [[daily/2026-04-14.md]] — Session 21e5095d: platform documentation pp. 223–229 reviewed; Initiator ≠ Service User confirmed as distinct recipient types with separate templates; 15-template table added to `email_notifications_description.docx`; `CaseNotificationRule` confirmed as the mapping entity
