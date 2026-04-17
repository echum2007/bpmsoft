---
title: "Two CC Fields in BPMSoft Case: Reply vs Case-Level"
aliases: [cc-field-duality, cc-reply-field, cc-case-field, copyrecepient-scope]
tags: [bpmsoft, cc-notifications, ui, design, case]
sources:
  - "daily/2026-04-08.md"
created: 2026-04-16
updated: 2026-04-16
---

# Two CC Fields in BPMSoft Case: Reply vs Case-Level

BPMSoft's Case form has two distinct CC fields that serve different scopes. The reply-level CC (on the message composer) is a one-time, per-reply field. The case-level CC (on the case card itself) is a persistent field applied to all outgoing notifications for the case. They do not sync with each other, and this is by design.

## Key Points

- **Reply-level CC** — appears in the message/reply composer panel; applies only to that single outgoing message; not persisted back to the case record
- **Case-level CC** (`CopyRecepient` column on the `Case` entity, with the platform's typo) — applies to all outgoing notifications for the lifetime of the case
- Values entered in the reply-level CC do **not** populate the case-level CC field — this is expected, documented behavior, not a bug
- Incoming emails with CC recipients update the case-level `CopyRecepient` field via `UsrCcAddressResolver`
- The user-facing documentation (`CC_USER_GUIDE.md`) explicitly explains this distinction to avoid confusion

## Details

The duality exists because BPMSoft distinguishes between the "envelope" of a single reply (who receives this specific message) and the "standing list" of CC recipients for the case as a whole. An agent may want to CC a colleague on one reply without permanently adding them to all future notifications.

When a customer sends an email with CC recipients, those recipients are captured into the case-level `CopyRecepient` field by the `UsrCcAddressResolver` EventListener, so they are included in subsequent outgoing notifications. This inbound flow is automatic.

The outbound reply form's CC field is intentionally ephemeral. If an agent needs to permanently add someone to case notifications, they must edit the case-level CC field directly on the case card, not via the reply composer.

This design decision was documented in `CC_USER_GUIDE.md` in non-technical language after users confused the two fields during testing.

## Related Concepts

- [[concepts/cc-address-normalization]] — normalization logic for the case-level `CopyRecepient` field
- [[concepts/labor-records-design-decisions]] — another project where UX distinction between related fields required explicit documentation

## Sources

- [[daily/2026-04-08.md]] — Reply-level CC confirmed as intentionally not persisted to case-level CC; `CC_USER_GUIDE.md` written to document the distinction without technical terminology
