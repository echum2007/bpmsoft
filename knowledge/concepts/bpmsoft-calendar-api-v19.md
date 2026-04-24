---
title: "BPMSoft 1.9 Calendar/Working Time API: TermCalculatorActions"
aliases: [calendar-api, working-time-api, istimeinworkinginterval, termcalculatoractions, slm-calendar]
tags: [bpmsoft, api, calendar, working-time, slm, c-sharp]
sources:
  - "daily/2026-04-24.md"
created: 2026-04-24
updated: 2026-04-24
---

# BPMSoft 1.9 Calendar/Working Time API: TermCalculatorActions

The working time API in BPMSoft 1.9 is provided by `TermCalculatorActions` class in the **SLM package** (configuration schema, not a core DLL). The key method is `IsTimeInWorkingInterval(DateTime)` which returns a boolean indicating whether a given timestamp falls within the configured working calendar. The calendar ID is resolved through the service pact chain: `ServiceInServicePact.CalendarId → ServicePact.CalendarId → base.GetCalendarId()`.

## Key Points

- **Class:** `TermCalculatorActions` in `SLM/Schemas/TermCalculatorActions/TermCalculatorActions.cs`
- **Method:** `IsTimeInWorkingInterval(DateTime) → bool` (line 109 in source)
- **Location:** Configuration schema in SLM package — **not in core DLLs** (searching DLLs will not find it)
- **Calendar resolution chain:** `ServiceInServicePact.CalendarId → ServicePact.CalendarId → base.GetCalendarId()`
- **Related classes:** `TermCalculator`, `CalendarRemindCalculator` — also in SLM package, part of the SLA calculation subsystem

## Details

### Finding the API

The API was discovered by searching the unpacked BPMSoft system packages (`src/PKG_BPMSoft_Full_House_1.9.0.14114/SLM/Schemas/`), not by searching compiled DLLs. This is a critical distinction: BPMSoft 1.9's business logic for SLA, calendars, and working time lives in **configuration schemas** that are compiled at runtime, not shipped as pre-compiled assemblies in the core runtime.

A search across all 457 DLLs on the dev server (`grep -a "IsWorkTime"`, `grep -a "ICalendarRepository"`) returned zero matches. The `strings` utility was not available on the dev server, but `grep -a` (binary-safe grep) served as a reliable alternative for searching binary files.

### Usage Context

The `TermCalculatorActions` class is part of the SLA calculation subsystem. Its primary use case is determining whether a timestamp falls within business hours for SLA timer calculations (time to response, time to resolution, etc.). In the labor-records project, this same API can be used to validate whether labor record timestamps fall within working hours.

### Calendar ID Resolution

The calendar is not hardcoded — it's resolved through the service pact hierarchy:

```
ServiceInServicePact
    .CalendarId          ← first check: calendar on the service-in-pact level
    → ServicePact
        .CalendarId      ← fallback: calendar on the pact level
        → base.GetCalendarId()  ← ultimate fallback: system default calendar
```

This means the working time check is context-dependent: different service pacts can have different calendars (e.g., 24/7 vs business hours), and the API respects this hierarchy.

### What Does NOT Exist in 1.9

The following APIs do **not exist** in BPMSoft 1.9 (they may exist in BPMSoft 8/Creatio):
- `ICalendarRepository` — interface not found in any DLL or schema
- `IsWorkTime()` — method not found anywhere in the codebase
- Any standalone calendar service accessible via `ClassFactory.Get<ICalendarRepository>()`

These were erroneously suggested by NotebookLM due to cross-version API contamination (see [[concepts/notebooklm-cross-version-api-contamination]]).

## Related Concepts

- [[concepts/notebooklm-cross-version-api-contamination]] — How the wrong API (ICalendarRepository) was initially suggested and why verification is critical
- [[concepts/bpmsoft-configuration-schema-vs-core-dll]] — Why the calendar API lives in configuration schemas, not core DLLs
- [[concepts/data-driven-system-analysis]] — The methodology that led to finding the real API: grep the actual codebase instead of trusting documentation

## Sources

- [[daily/2026-04-24.md]] — Session 22:13: Found TermCalculatorActions.IsTimeInWorkingInterval(DateTime) at line 109 in SLM/Schemas/TermCalculatorActions/TermCalculatorActions.cs; calendar ID resolution chain: ServiceInServicePact.CalendarId → ServicePact.CalendarId → base.GetCalendarId(); ICalendarRepository/IsWorkTime confirmed absent from all 457 DLLs; R3 risk for labor-records project definitively resolved
