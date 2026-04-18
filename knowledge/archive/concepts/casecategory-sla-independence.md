---
title: "CaseCategory Independence from SLA and Wave 2 Notifications"
aliases: [case-category, casecategory, категория-обращения, category-sla]
tags: [bpmsoft, sla, notifications, wave2, design-decision]
sources:
  - "daily/2026-04-12.md"
created: 2026-04-16
updated: 2026-04-16
---

# CaseCategory Independence from SLA and Wave 2 Notifications

BPMSoft's `CaseCategory` (Категория обращения) classifies cases per ITIL (Incident, Request, etc.). Despite having six influence points on case processing, it does not affect SLA calculation and was explicitly rejected as a Wave 2 notification trigger criterion. The governing principle: SLA determines notification strictness, not ITIL classification.

## Key Points

- `CaseCategory` has 6 influence points: notification templates (via `CaseNotificationRule` by Category+Status pair), mailbox selection, auto-detection from incoming email, subject line formation, incident BPMN process routing, and service-based auto-fill
- `CaseCategory` does **not** affect SLA calculation — SLA is determined by Priority, Service Contract (`ServicePact`), and support level
- Using Category as an urgency criterion in notifications creates a control gap: a critical case mis-categorized as "Request" instead of "Incident" would escape strict notification rules
- Wave 2 notification thresholds, timings, and escalations are tied **exclusively to SLA** — both categories receive identical notification rules
- **Principle: SLA defines control strictness; classification does not**

## Details

During Wave 2 notifications analysis, six ways in which `CaseCategory` influences case processing were documented. The question was whether to use Category as a trigger condition for Wave 2 notification rules (e.g., applying stricter escalation only to Incidents).

The proposal was rejected on resilience grounds. If notification rules branch on Category, a mis-categorization (common in practice — customers and first-line agents often categorize incorrectly at intake) causes a critical case to fall outside strict monitoring. SLA, by contrast, is automatically calculated from objective parameters (priority, contract terms) and cannot be mis-categorized. An urgent case with a tight SLA will always have that SLA regardless of its Category field.

The `CaseNotificationRule` entity links Category to notification templates (e.g., "when case status changes to X for category Y, send template Z"). This is used for **content** differentiation (different wording for incidents vs. requests), not for **trigger** differentiation. Wave 2 uses this entity only for template selection, not for deciding whether to notify at all.

The analysis was captured in `projects/notifications-wave2/ANALYSIS.md`, section 2.4.

## Related Concepts

- [[concepts/esq-timetoprioritize-filter-chain]] — SLA data model; shows how Priority and ServicePact (not Category) determine timing
- [[concepts/custom-invokable-macro-pattern]] — Wave 2 task 2.3 design context where Category analysis was part of scoping
- [[concepts/bpmn-signal-filter-diagnostics]] — example where signal filter conditions (not category) determine whether a process fires

## Sources

- [[daily/2026-04-12.md]] — Session 48e6d055: six Category influence points enumerated; Category rejected as Wave 2 criterion; principle "SLA determines strictness, not classification" established; analysis added to ANALYSIS.md section 2.4
