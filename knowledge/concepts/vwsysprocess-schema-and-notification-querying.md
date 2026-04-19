---
title: "VwSysProcess: Querying Notification Processes from PostgreSQL"
aliases: [vwsysprocess, process-table, notification-process-query, enabled-column]
tags: [bpmsoft, database, postgresql, processes, notification, diagnostics]
sources:
  - "daily/2026-04-17.md"
created: 2026-04-18
updated: 2026-04-18
---

# VwSysProcess: Querying Notification Processes from PostgreSQL

BPMSoft's notification processes are queried from the PostgreSQL table `VwSysProcess` (a view), not from a direct table named `SysProcess`. The process activation state is stored in the `Enabled` column (not `IsActive` or `Active`). This is the authoritative source for understanding which notification processes are running in production.

## Key Points

- **Table name:** `VwSysProcess` — a view, not a direct table; queries against `SysProcess` may fail or return incomplete data
- **Activation column:** `Enabled` (boolean) — indicates whether the process is active; the column name is literal and not to be confused with other naming conventions like `IsActive`
- **Metadata column:** Contains the process definition including start signal filter conditions — this is where the business logic rules live, not in UI configuration
- **Discovery requires full record export:** A single `SELECT ... WHERE name LIKE '%notification%'` may miss processes; full table export needed for complete mapping
- **The gotcha:** You can know a process name but not know what triggers it without reading the `MetaData` column; relying on UI-visible configurations is insufficient

## Details

When investigating notification flows in BPMSoft, the instinct is to look for UI configuration panels or database tables named `SysProcess`. Neither is fully authoritative. The actual live notification process registry is `VwSysProcess` in PostgreSQL.

The problem with using `SysProcess` directly: it may be a base table that lacks the view-level aggregation and filtering that `VwSysProcess` provides. BPMSoft's architecture often uses views (`Vw`-prefixed) to present the "true" state of entities to queries.

Example query structure:
```sql
SELECT 
  Name, 
  Enabled, 
  MetaData, 
  UId, 
  CreatedOn 
FROM VwSysProcess 
WHERE Name LIKE '%notification%' OR Name LIKE '%email%'
ORDER BY Name;
```

The `MetaData` column contains the complete BPMN process definition as a binary or XML structure. This field holds:
- Start signal filter conditions (the "who triggers this and under what circumstance" logic)
- Process element definitions (script tasks, user tasks, decision points)
- Hardcoded parameters (mailbox references, role references, template references)

**Discovery methodology:** To understand a notification flow, you must:
1. Query `VwSysProcess` for all processes with names matching your domain (e.g., `%case%`, `%notification%`, `%email%`)
2. Identify the active processes (where `Enabled = true`)
3. Export the `MetaData` column for those processes
4. Parse the metadata (BPMN XML) to read the start signal filter conditions and process parameters
5. Cross-reference any UId values in the metadata (role UIds, mailbox UIds, template UIds) back to their base tables

Without querying `MetaData`, you only see the process name and status, not the logic that controls when it runs.

## Related Concepts

- [[concepts/bpmn-signal-filter-diagnostics]] — Start signal filter conditions are where the activation logic lives; these are stored in VwSysProcess.MetaData
- [[concepts/startsignal-metadata-structure]] — How to interpret the metadata column contents and extract filter conditions
- [[concepts/usrprocess-indirect-chain-hardcoded]] — Example of hardcoded process parameters found in VwSysProcess.MetaData (sender mailbox, CC role)
- [[concepts/data-driven-system-analysis]] — This querying pattern is the core of data-driven investigation

## Sources

- [[daily/2026-04-17.md]] — Session 09:14: Discovered VwSysProcess as the authoritative view vs. expected SysProcess table; confirmed `Enabled` column name; identified MetaData column as containing start signal filter conditions and process parameters; querying full table required to map notification flow
