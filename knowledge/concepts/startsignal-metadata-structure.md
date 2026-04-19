---
title: "StartSignal Metadata: Where Process Activation Conditions Live"
aliases: [startsignal-metadata, process-metadata, activation-conditions, metadata-column, bpmn-metadata]
tags: [bpmsoft, bpmn, processes, metadata, database, diagnostics]
sources:
  - "daily/2026-04-17.md"
created: 2026-04-18
updated: 2026-04-18
---

# StartSignal Metadata: Where Process Activation Conditions Live

The activation conditions for BPMN processes in BPMSoft are **not configured in a separate UI configuration table** — they live inside the `MetaData` column of the `VwSysProcess` view in the PostgreSQL database. This is the authoritative, single source of truth for understanding **when** and **under what conditions** a notification process will fire.

## Key Points

- **Metadata location:** `VwSysProcess.MetaData` column (binary or XML-encoded BPMN definition)
- **Contains:** Start signal filter conditions, process element definitions, hardcoded parameters (role UIds, mailbox UIds, etc.)
- **Not in UI:** There is no dedicated "start signal filter" settings page to be found in the BPMSoft interface; the logic is embedded in the process definition itself
- **Requires export:** To understand the activation logic, you must extract and parse the `MetaData` column for the relevant process
- **The gotcha:** A process that appears "active" in `VwSysProcess.Enabled` may still not fire if its start signal filter conditions are never satisfied by real data

## Details

When investigating "why didn't the notification process fire?", the instinct is to look for UI configuration: "where are the process activation filters set?" In BPMSoft, there is no dedicated configuration screen for this. Instead, the activation conditions are baked into the BPMN process definition itself, stored in the `MetaData` column.

This architectural pattern has important implications:

1. **Changes to activation logic require process redefinition.** You cannot tweak a filter in a UI and reload — you must modify the BPMN process in the designer, save it, and it will update the `MetaData` column.

2. **Reading metadata is the only way to understand production behavior.** If you want to know "why is this process not firing for my test data?", reading the UI-visible schema is insufficient. You must extract the process definition from `MetaData` and examine the start signal filter (usually expressed as conditions like `Group NOT NULL AND Owner NULL`).

3. **Metadata structure is BPMN + BPMSoft extensions.** The XML or binary format encodes:
   - `<StartEvent>` element with signal name and filter conditions
   - Each `<Task>` element with task type (script, user, service) and parameters
   - For notification tasks: hardcoded role UIds, mailbox UIds, template UIds (as shown in [[concepts/usrprocess-indirect-chain-hardcoded]])
   - Data mapping and variable bindings

4. **Parsing requires BPMSoft-specific knowledge.** The metadata is not standard BPMN XML — it includes BPMSoft-specific attributes and UId references. You may need to cross-reference those UIds in the base tables (`VwSysFunctionalRole`, `MailboxSyncSettings`, etc.) to understand what the process parameters actually refer to.

### Example: Reading StartSignal Filter Conditions

For a process like `RunSendEmailToCaseGroupV2`, the metadata contains a start signal element with filter conditions. According to the diagnosis in [[concepts/bpmn-signal-filter-diagnostics]], the actual condition is:
```
Group IS NOT NULL AND Owner IS NULL
```

This condition is stored in the `MetaData` column, not in any separate UI configuration. If you want to know this without being told, you must export `VwSysProcess.MetaData` for `RunSendEmailToCaseGroupV2` and parse the BPMN XML to extract the filter.

## Related Concepts

- [[concepts/vwsysprocess-schema-and-notification-querying]] — How to query VwSysProcess and access the MetaData column
- [[concepts/bpmn-signal-filter-diagnostics]] — Specific example: `RunSendEmailToCaseGroupV2` filter conditions are in metadata
- [[concepts/usrprocess-indirect-chain-hardcoded]] — Example of hardcoded UId parameters stored in metadata
- [[concepts/data-driven-system-analysis]] — Metadata extraction is the core practice of data-driven investigation
- [[concepts/troubleshooting-process-not-firing]] (if it exists) — "Why didn't the process fire?" → check metadata conditions against actual data

## Sources

- [[daily/2026-04-17.md]] — Session 09:14: Discovered that start signal filter conditions live in VwSysProcess.MetaData column, not in a separate UI configuration table; understanding process activation requires reading and parsing metadata, not relying on UI-visible schema
