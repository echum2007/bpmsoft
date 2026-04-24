---
title: "BPMSoft 1.9: Business Logic Lives in Configuration Schemas, Not Core DLLs"
aliases: [configuration-vs-dll, schema-vs-assembly, package-schemas, runtime-compilation]
tags: [bpmsoft, architecture, configuration, dll, packages, troubleshooting]
sources:
  - "daily/2026-04-24.md"
created: 2026-04-24
updated: 2026-04-24
---

# BPMSoft 1.9: Business Logic Lives in Configuration Schemas, Not Core DLLs

In BPMSoft 1.9, the majority of business logic (SLA calculations, calendar checks, notification processes, entity event handlers) resides in **configuration schemas** within packages — not in pre-compiled core DLLs. These schemas are C# source files that are compiled at runtime by the platform. Searching for API methods in `.dll` files on the server will miss most of the platform's business API. The correct search target is the unpacked package schemas directory.

## Key Points

- **Business API is in package schemas** — `src/PKG_BPMSoft_Full_House_1.9.0.14114/<PackageName>/Schemas/<SchemaName>/` contains the C# source
- **Core DLLs contain only framework** — .NET runtime, Kestrel, base platform infrastructure, but not business-domain classes like `TermCalculatorActions`
- **Searching DLLs is insufficient** — `grep -a` across all 457 DLLs on dev server returned zero matches for `IsTimeInWorkingInterval`, which exists in the SLM package schema
- **Runtime compilation** — schemas are compiled by BPMSoft at startup or on publish; the compiled assemblies are held in memory by Kestrel (see [[concepts/kestrel-service-restart]])
- **Implications for API discovery** — always search both DLLs and unpacked package schemas when looking for an API; prefer package schemas for business logic

## Details

### Architecture: Two Layers of Code

BPMSoft 1.9 has a two-layer code architecture:

| Layer | Location | Contains | Search method |
| --- | --- | --- | --- |
| **Core framework** | `/opt/bpmsoft/` DLLs | .NET runtime, HTTP pipeline, ORM base, ClassFactory | `grep -a` in `.dll` files |
| **Configuration** | Package schemas (`.cs` files) | Business logic, entity handlers, processes, SLA, notifications | `grep -r` in unpacked packages |

The configuration layer is where the platform's value lives — all customization, all business rules, all domain-specific APIs. The core framework provides the infrastructure (EntitySchemaQuery, ClassFactory, Process engine) but the actual implementations live in schemas.

### Why This Matters for API Discovery

When investigating whether an API exists in BPMSoft 1.9:

1. **Don't stop at DLLs** — A negative result from DLL search doesn't mean the API doesn't exist
2. **Search unpacked packages** — The `PKG_BPMSoft_Full_House` directory contains all system package schemas as readable `.cs` files
3. **Check the right package** — Calendar logic is in `SLM`, notification logic is in `CaseService`, email logic is in `IntegrationV2`

Example of the failure mode:
```bash
# Searching DLLs — finds nothing:
grep -ra "IsTimeInWorkingInterval" /opt/bpmsoft/*.dll    # 0 results

# Searching package schemas — finds the API:
grep -r "IsTimeInWorkingInterval" PKG_BPMSoft_Full_House_1.9.0.14114/
# → SLM/Schemas/TermCalculatorActions/TermCalculatorActions.cs:109
```

### Key Packages and Their Business Domains

| Package | Business Domain |
| --- | --- |
| SLM | SLA calculations, calendar/working time, term calculators |
| CaseService | Notification BPMN processes, email sending |
| IntegrationV2 | Email client (SMTP/IMAP), `IEmailClient` |
| Exchange | Microsoft Exchange integration |
| Case | Base case entity schema |
| SLMITILService | ITIL-specific SLA: `CaseTermCalculationManager`, `TimeToPrioritize` |

### Diagnostic Tool: grep -a for Binary Search

On the dev server, `strings` was not available. The alternative `grep -a` (treat binary files as text) works reliably for searching DLLs:

```bash
grep -ra "SearchTerm" /path/to/dlls/
```

This is useful for confirming that an API does NOT exist in the core framework, after which the search should continue in package schemas.

## Related Concepts

- [[concepts/bpmsoft-calendar-api-v19]] — Concrete example: TermCalculatorActions found in SLM package schema, not in any DLL
- [[concepts/kestrel-service-restart]] — Configuration schemas are compiled at runtime; Kestrel holds compiled assemblies in memory
- [[concepts/notebooklm-cross-version-api-contamination]] — NotebookLM may suggest APIs from core DLLs of a different version; verification must cover both layers

## Sources

- [[daily/2026-04-24.md]] — Session 22:13: Searched 457 DLLs on dev-server for ICalendarRepository/IsWorkTime — zero results; found real API (TermCalculatorActions.IsTimeInWorkingInterval) in SLM package configuration schema; confirmed that BPMSoft 1.9 business logic lives in package schemas, not core DLLs; `strings` not available on dev server, used `grep -a` as alternative
