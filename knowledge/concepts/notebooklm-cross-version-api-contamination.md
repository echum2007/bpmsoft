---
title: "NotebookLM Cross-Version API Contamination: Wrong Platform Version in Answers"
aliases: [notebooklm-wrong-version, api-version-mismatch, cross-version-risk, creatio-vs-bpmsoft-19]
tags: [notebooklm, documentation, methodology, risk, bpmsoft, verification]
sources:
  - "daily/2026-04-24.md"
created: 2026-04-24
updated: 2026-04-24
---

# NotebookLM Cross-Version API Contamination: Wrong Platform Version in Answers

NotebookLM can return API references from a **different version of the platform** than the one being used. In the BPMSoft context, NotebookLM returned `ICalendarRepository.IsWorkTime` as the calendar API — an interface that exists in BPMSoft 8 (Creatio) but **does not exist in BPMSoft 1.9**. This type of cross-version contamination is particularly dangerous because the answer looks authoritative and plausible, but leads to a dead end when the developer searches for the API in the actual codebase.

## Key Points

- **NotebookLM doesn't distinguish platform versions** — sources may cover multiple versions; answers may mix APIs from different releases
- **ICalendarRepository.IsWorkTime is BPMSoft 8/Creatio, not 1.9** — searched 457 DLLs on dev server via `grep -a`, zero matches; confirmed absent from the entire 1.9 runtime
- **Real 1.9 API found in configuration schemas** — `TermCalculatorActions.IsTimeInWorkingInterval(DateTime)` in the SLM package, not in core DLLs
- **Verification against real code is mandatory** — NotebookLM answers about specific API names, method signatures, or class names must be verified by searching the actual codebase before using them in design documents or code
- **Risk classification: silent dead end** — unlike a compilation error (which surfaces immediately), using a non-existent API in a design document wastes hours of investigation when implementation begins

## Details

### The Incident: ICalendarRepository

During risk assessment for the labor-records project (R3: calendar/working time API availability), NotebookLM was queried about how to check if a given time falls within working hours in BPMSoft. The answer confidently referenced:

```csharp
// NotebookLM's answer (WRONG for BPMSoft 1.9):
ICalendarRepository calendarRepo = ClassFactory.Get<ICalendarRepository>();
bool isWorkTime = calendarRepo.IsWorkTime(dateTime);
```

This API signature looks correct and follows BPMSoft patterns (interface via ClassFactory, boolean return). However:

1. `grep -a "ICalendarRepository"` across all 457 DLLs on dev-server → **zero matches**
2. `grep -a "IsWorkTime"` across all DLLs → **zero matches**
3. Search in XML documentation of core assemblies → **not found**
4. The API likely exists in BPMSoft 8 (Creatio), which shares architectural patterns but has a different runtime

### The Real API in BPMSoft 1.9

The actual working time API was found by searching the unpacked configuration packages (not DLLs):

```
SLM/Schemas/TermCalculatorActions/TermCalculatorActions.cs
→ Line 109: IsTimeInWorkingInterval(DateTime) → bool
```

The calendar ID is obtained through a cascade:
```
ServiceInServicePact.CalendarId → ServicePact.CalendarId → base.GetCalendarId()
```

Key difference: this logic lives in **configuration schemas** (the SLM package), not in core .NET DLLs. Searching only DLLs would never find it.

### Why This Happens

NotebookLM synthesizes answers from all sources in its notebook. If sources include documentation spanning multiple platform versions (or if the underlying Gemini model has training data from both BPMSoft 1.9 and BPMSoft 8/Creatio), the answer may blend APIs from different versions without flagging the version mismatch.

Contributing factors:
- BPMSoft 1.9 and BPMSoft 8 share similar architectural patterns (ClassFactory, ESQ, entity schemas)
- Method names and interfaces often follow the same naming conventions across versions
- NotebookLM doesn't have version-awareness metadata in its synthesis logic

### Mitigation: Verification Protocol

When NotebookLM returns a specific API name (class, interface, method):

1. **Search the actual codebase** — `grep -a` in DLLs or `grep -r` in unpacked packages
2. **Search configuration schemas** — business logic in BPMSoft 1.9 often lives in package schemas, not core DLLs
3. **If not found in either** — the API likely doesn't exist in this version; report back to NotebookLM query log
4. **Never use unverified API names in design docs** — a design doc with `ICalendarRepository` would have sent developers on a multi-hour search

## Related Concepts

- [[concepts/notebooklm-documentation-strategy-alert-rules]] — Alert Rule 3 (report coverage gaps) should be extended to include version contamination warnings
- [[concepts/data-driven-system-analysis]] — Core methodology: verify against the actual system, not against documentation or AI-synthesized answers
- [[concepts/bpmsoft-calendar-api-v19]] — The correct API that was found after NotebookLM's answer was debunked
- [[concepts/bpmsoft-configuration-schema-vs-core-dll]] — Why the real API wasn't in DLLs: business logic lives in configuration schemas

## Sources

- [[daily/2026-04-24.md]] — Session 22:13: NotebookLM returned ICalendarRepository.IsWorkTime as calendar API; searched 457 DLLs on dev-server via grep -a, zero matches; confirmed as BPMSoft 8/Creatio API, not 1.9; real API found in SLM package configuration schema: TermCalculatorActions.IsTimeInWorkingInterval(DateTime); R3 risk resolved after codebase verification
