---
title: "Data-Driven System Analysis: Query the System Instead of Building Mental Models"
aliases: [data-driven, system-analysis, assumptions-fail, query-first, investigative-methodology]
tags: [bpmsoft, methodology, diagnostics, best-practices, investigation]
sources:
  - "daily/2026-04-17.md"
created: 2026-04-18
updated: 2026-04-18
---

# Data-Driven System Analysis: Query the System Instead of Building Mental Models

When troubleshooting a complex system like BPMSoft, the most common failure mode is building a mental model based on partial information, UI visibility, or documentation assumptions — and then trying to fix problems based on that incomplete model. The corrective practice: **always query the actual system state before concluding something is broken.**

## Key Points

- **Mental models fail when system is complex.** BPMSoft's notification architecture has multiple overlapping processes, hardcoded parameters, and metadata-based configuration. Partial understanding leads to wrong diagnoses.
- **Documentation and UI show only partial truth.** A process can appear "active" in the UI but have activation conditions (in metadata) that are never satisfied. A table can be named `SysProcess` in documentation but accessed via the view `VwSysProcess` in practice.
- **Full record export reveals patterns.** A targeted query like `SELECT ... WHERE name LIKE '%notification%'` may miss critical processes. Exporting the complete process table and reading all metadata is the only way to map the actual flow.
- **Symptom != root cause.** A process that doesn't fire during testing looks identical to a broken process. The root cause could be: (a) the process is inactive, (b) the start signal conditions aren't met, (c) the process exists but is named differently, or (d) there is a dependent process that runs instead. Querying reveals which.
- **Cost of assumption:** In one session, 2+ hours of hypothesizing about deployment breakage, recompilation, and Kestrel restart — when the actual cause was test data not matching start signal filter conditions. The diagnostic sequence should be: query data first, then verify config, then test infra.

## Details

### The Incident: Process Appears Broken, Actually Works

A notification process (`RunSendEmailToCaseGroupV2`) was deployed as part of a feature, the system was restarted, and testing revealed the process was not firing. The initial hypothesis chain:
1. "The deployment broke it" → check process status → it's active
2. "Maybe caching?" → recompile and restart → no change
3. "Must be a code issue" → review the C# and BPMN → looks correct

**Actual root cause (found by querying and testing):** The test case was created with an `Owner` assigned. The process's start signal filter condition is `Group IS NOT NULL AND Owner IS NULL`. With an owner present, the condition is false, and the process is never enqueued. No deployment broke anything; the test was just incorrect.

The lesson: **check filter conditions against actual test data first**, before assuming infrastructure is broken.

### The Pattern: Full System Export Reveals Hidden Processes

During the same session, the team needed to map the complete notification flow to understand where customer-reply emails go and which processes send them. A targeted query for notification processes in the configuration UI found a few expected names, but the complete picture only emerged when:
1. The full `VwSysProcess` table was exported
2. All processes were listed, including ones with non-obvious names (prefixes like `UsrProcess_0c71a12CTI5`)
3. The metadata for each was parsed to understand filter conditions and hardcoded parameters

A simple `SELECT * FROM VwSysProcess` followed by a metadata parse revealed processes that were not discoverable through the UI or documentation. One of these processes (`UsrProcess_0c71a12CTI5`) was a critical piece of the notification chain — and it was hardcoded with role-based CC behavior that would be a surprise to discover mid-deployment.

### Data-Driven vs. Assumption-Driven

| Approach | Process |
|----------|---------|
| **Assumption-Driven** | Read docs → form mental model → when something breaks, debug based on model → model might be wrong → 2+ hours wasted |
| **Data-Driven** | Query actual system state → read metadata/config → verify against real test data → root cause clear in minutes |

The cost difference is significant, especially in a complex system where documentation lags behind actual implementation.

## Related Concepts

- [[concepts/vwsysprocess-schema-and-notification-querying]] — The practical tool: how to query the system to get real data
- [[concepts/startsignal-metadata-structure]] — What to look for in metadata: the filter conditions that determine process execution
- [[concepts/bpmn-signal-filter-diagnostics]] — A specific example of this methodology: diagnosed a process as broken, found it was working but test data didn't match filter conditions
- [[concepts/usrprocess-indirect-chain-hardcoded]] — Another example: discovered hardcoded role-based CC behavior by reading metadata, not by reading documentation

## Sources

- [[daily/2026-04-17.md]] — Session 09:14: Evgeny's diagnosis: Claude was building picture on assumptions rather than data; processes were discovered correctly only by chance through full table export; reminder: don't guess at API, behavior, method names, or object structures — query actual live configuration instead; cost of assumption: 2+ hours spent hypothesizing deployment breakage when root cause was test data not matching activation filter
