---
title: "Connection: Investigation Methodology Led to Metadata Structure Discovery"
connects:
  - "concepts/data-driven-system-analysis"
  - "concepts/vwsysprocess-schema-and-notification-querying"
  - "concepts/startsignal-metadata-structure"
  - "concepts/bpmn-signal-filter-diagnostics"
sources:
  - "daily/2026-04-17.md"
created: 2026-04-18
updated: 2026-04-18
---

# Connection: Investigation Methodology Led to Metadata Structure Discovery

The non-obvious relationship between these concepts is that the **data-driven investigation approach** not only solved an immediate troubleshooting problem but also revealed a fundamental truth about BPMSoft's architecture: **process activation conditions are not in a separate UI configuration table, they live in the `MetaData` column of `VwSysProcess`**.

## The Connection

On 2026-04-17, when the team decided to stop guessing and query the actual database state (the methodology shift), they encountered the process table structure and discovered the metadata column. This physical discovery led to understanding that:

1. You cannot find process activation rules by looking in the UI — they don't exist as a separate configuration
2. The `MetaData` column is the single source of truth for understanding when processes fire
3. Full system export is necessary because process names may not be intuitive (e.g., `UsrProcess_0c71a12CTI5`)
4. The activation conditions are embedded in the process definition, not configurable separately

## Key Insight

The shift from "mental model" thinking to "query the system" directly led to the discovery of metadata structure. Had the team continued down the assumption path (looking for UI configuration, checking deployment logs, re-running infrastructure fixes), the metadata discovery would never have happened.

This relationship matters for future debugging: **whenever you feel stuck in a troubleshooting loop (hypothesis → test → failure → refine hypothesis), the next move is to switch to data-driven investigation**. In BPMSoft specifically, this often means querying `VwSysProcess` and reading `MetaData` columns.

## Evidence

1. **Session 09:14, 2026-04-17:** Team was troubleshooting why a deployed process wasn't firing. Initial hypotheses involved deployment, caching, code issues. After Evgeny's correction to "don't guess, query the system," the team:
   - Queried `VwSysProcess` to list all notification processes
   - Discovered the `Enabled` column (not `IsActive`)
   - Identified the `MetaData` column as containing process definitions
   - Exported metadata to understand filter conditions
   - Root cause emerged: test data didn't match `Group NOT NULL AND Owner NULL` filter

2. **Same session:** Mapping complete notification flow required full process export. Non-obvious process names like `UsrProcess_0c71a12CTI5` were only discoverable by querying and reading metadata, not from documentation.

3. **Task 2.3 implications:** The metadata-driven discovery revealed hardcoded role-based CC behavior in `UsrProcess_0c71a12CTI5` that was not visible in the original process list. This change in understanding shaped the design decisions for the consolidation task.

## Related Concepts

- [[concepts/data-driven-system-analysis]] — The methodology that triggered the discovery
- [[concepts/vwsysprocess-schema-and-notification-querying]] — The technical tool that revealed the table structure
- [[concepts/startsignal-metadata-structure]] — What was discovered in the metadata column
- [[concepts/bpmn-signal-filter-diagnostics]] — The specific problem that the methodology solved
- [[concepts/usrprocess-indirect-chain-hardcoded]] — Hidden process behavior that was only discoverable via metadata parsing

## Sources

- [[daily/2026-04-17.md]] — Session 09:14: Methodology shift (query system state, not assumptions) led to VwSysProcess discovery; metadata column revealed as single source of truth for process activation logic; full table export required to map notification flow; hidden processes like `UsrProcess_0c71a12CTI5` only discoverable through metadata parsing
