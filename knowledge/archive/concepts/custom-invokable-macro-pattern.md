---
title: "Custom Invokable Macro Pattern for BPMSoft Email Notifications"
aliases: [invokable-macro, emailwithmacrosmanager, usrlatestcustomeremailtgenerator, symptomsGenerator, notifications-macro]
tags: [bpmsoft, c-sharp, email, notifications, architecture, notifications-wave2]
sources:
  - "daily/2026-04-11.md"
created: 2026-04-16
updated: 2026-04-16
---

# Custom Invokable Macro Pattern for BPMSoft Email Notifications

BPMSoft's `EmailWithMacrosManager` supports custom "invokable macros" — C# classes that dynamically generate content inserted into email notification templates. Creating a new invokable macro (rather than modifying system classes) is the lowest-risk approach for injecting case-specific data into outgoing engineer notifications.

## Key Points

- The recommended pattern for injecting the latest customer email text into engineer notifications: create `UsrLatestCustomerEmailGenerator` modelled on the existing `SymptomsGenerator` class
- `SymptomsGenerator` is the canonical example in the CTI/CaseService packages: it retrieves case symptoms and returns them as macro-expanded HTML/text
- `ExtendedEmailWithMacrosManager` (in the system packages) already has an `EmailFooterSupplier` hook — a good reference for how the macro pipeline is extended without replacing core classes
- This approach avoids substituting `EmailWithMacrosManager` itself, which would increase upgrade risk and create maintenance surface
- The architecture was documented in `projects/notifications-wave2/research-email-system-architecture.md` (EN) and `projects/notifications-wave2/ANALYSIS.md` (RU)

## Details

Task 2.3 of notifications-wave2 requires that engineer notification emails include the text of the latest customer message (the email that triggered the case or update). The naive approach — modifying the BPMN `SendEmailToSROwner` process or patching `EmailWithMacrosManager` — has high upgrade risk because these are system classes.

The invokable macro pattern works within BPMSoft's designed extension points:
1. Create a new C# class `UsrLatestCustomerEmailGenerator` in the CTI package, implementing the same interface as `SymptomsGenerator`
2. Register the class as a macro provider under a new macro token (e.g., `#UsrLatestCustomerEmail#`)
3. Add `#UsrLatestCustomerEmail#` to the relevant notification email templates in the BPMSoft admin UI
4. The class fetches the latest `Activity` linked to the `Case` where `Type = Email` and `Direction = Inbound`, extracts its `Body`, and returns it

This approach means zero changes to system processes or classes — the customization is entirely additive. `SymptomsGenerator` in the `CaseService` package is the closest existing analogue: it is a short class (~50 lines) that reads case fields and formats output for macro expansion.

`ExtendedEmailWithMacrosManager` extends the macro manager via `EmailFooterSupplier` (a strategy-pattern hook), showing that the platform architects intended this area to be extended. The same extension point can be used if the macro needs access to manager-level context rather than just entity data.

The research session produced three files:
- `research-email-system-architecture.md` (EN) — full architecture of the email notification system
- `research-cti-current-state.md` (EN) — current CTI state: 51 schemas, CC implementation, known issues
- `ANALYSIS.md` (RU) — gap analysis and task recommendations for notifications-wave2

## Related Concepts

- [[concepts/cc-address-normalization]] — the CC-notifications project that preceded wave2; uses the same `Activity.CopyRecepient` field
- [[concepts/cc-field-duality]] — understanding which CC field is permanent (case-level) vs ephemeral (reply-level) matters for macro context
- [[concepts/kestrel-restart-requirements]] — a new C# invokable macro class requires Kestrel restart after publishing

## Sources

- [[daily/2026-04-11.md]] — Session 3553f68d: research documentation structured into 3 files; `UsrLatestCustomerEmailGenerator` modelled on `SymptomsGenerator` identified as recommended approach for task 2.3; `ExtendedEmailWithMacrosManager.EmailFooterSupplier` noted as reference pattern
