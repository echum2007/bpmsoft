---
title: "Connection: Infrastructure Prerequisites Shape Feature Implementation"
connects:
  - "concepts/exchangelistenerservice-microservice-prerequisite"
  - "concepts/google-mail-oauth2-bpmsoft-integration"
  - "concepts/feature-toggle-subprocess-execution"
  - "concepts/imacrosinvokable-pattern-bpmsoft"
sources:
  - "daily/2026-04-19.md"
created: 2026-04-19
updated: 2026-04-19
---

# Connection: Infrastructure Prerequisites Shape Feature Implementation

These four concepts together reveal a critical pattern: **implementation of advanced features in BPMSoft is often blocked by infrastructure prerequisites and architectural constraints that aren't immediately obvious from documentation**. Understanding all four together shows how infrastructure (microservices), toggle logic (routing), and code patterns (macros) interact to enable or block features.

## The Connection

When attempting to implement Google Mail OAuth 2.0 integration in Wave 2 notifications:

1. **ExchangeListenerService** — Infrastructure blocker; email configuration UI is entirely blocked until microservice is running
2. **Feature-toggle logic** — Architectural constraint; execution paths are routed via toggles, changing behavior without code changes
3. **IMacrosInvokable pattern** — Code-level implementation; correct signature matters, but only if infrastructure allows the feature to run
4. **Lazy property initialization** — Service pattern; services are resolved on-demand, fitting with conditional execution (e.g., only load EmailWithMacrosManager if toggle enables notification path)

Together, they show: **a feature can fail to work at any layer: infrastructure (microservice missing), routing (toggle off), code (wrong pattern), or service resolution (ClassFactory unavailable)**.

## Key Insight

The non-obvious relationship is that **checking one layer is insufficient**. A developer might:
- Implement `IMacrosInvokable` correctly (code layer ✓) but fail because ExchangeListenerService isn't deployed (infrastructure ✗)
- Deploy the microservice correctly (infrastructure ✓) but the toggle is off (routing ✗), so the process never fires
- Get the toggle enabled (routing ✓) and service deployed (infrastructure ✓) but lazy property has a null reference exception (service resolution ✗)

Each layer has its own failure mode, and all must be correct for the feature to work end-to-end.

## Diagnostic Methodology

When a feature "doesn't work," diagnose from bottom-up through the layers:

1. **Infrastructure layer** — Is the required microservice running? (ExchangeListenerService, etc.)
2. **Routing layer** — Are feature toggles enabled? (Check VwSysProcess.MetaData for toggle conditions)
3. **Code layer** — Is the implementation pattern correct? (IMacrosInvokable signature, pattern matching existing implementations)
4. **Service resolution layer** — Are dependencies resolvable via ClassFactory? (Test instantiation in a debug context)

Skipping any layer is a common failure mode.

## Evidence

2026-04-19 session evidence:
1. **Infrastructure blocker:** ExchangeListenerService not deployed → email provider configuration UI shows "no providers configured"
2. **Toggle discovery:** RunReopenCaseAndNotifyAssigneeClass=1 routes execution away from subprocess (feature-toggle routing change)
3. **Code pattern:** IMacrosInvokable implementation for UsrLatestCustomerEmailGenerator; correct signature is critical (KeyValuePair<string, Guid>)
4. **Service initialization:** Lazy property pattern for EmailWithMacrosManager; matches platform conventions

## Related Concepts

- [[concepts/data-driven-system-analysis]] — Methodology for diagnosing across layers: query system state (toggles, microservices, metadata)
- [[concepts/lazy-property-pattern-service-initialization]] — Service resolution layer; completes the stack
- [[concepts/vwsysprocess-schema-and-notification-querying]] — Where to query toggle state and process metadata

## Sources

- [[daily/2026-04-19.md]] — Session 14:15 & 14:16: ExchangeListenerService infrastructure prerequisite discovered; Session 14:14: Feature-toggle logic (RunReopenCaseAndNotifyAssigneeClass=1) discovered; Session 14:16: IMacrosInvokable pattern and lazy property pattern implemented for Wave 2 task 2.3; all four layers demonstrated in single feature implementation cycle
