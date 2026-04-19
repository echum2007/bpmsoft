---
title: "Feature-Toggle Logic in BPMN Subprocess Execution"
aliases: [feature-toggle, subprocess-toggle, conditional-execution, bpmn-conditionals]
tags: [bpmsoft, bpmn, feature-toggle, subprocess, notifications, configuration]
sources:
  - "daily/2026-04-19.md"
created: 2026-04-19
updated: 2026-04-19
---

# Feature-Toggle Logic in BPMN Subprocess Execution

In BPMSoft notification processes, feature-toggle system settings can completely alter the execution path of a BPMN process. When a toggle is enabled (value=1), an entire subprocess call can be skipped, routing execution directly through an alternative code path. This creates non-obvious behavior where documentation alone cannot explain actual process flow.

## Key Points

- **Toggle value affects subprocess invocation** — `RunReopenCaseAndNotifyAssigneeClass=1` causes `SubProcess1` to be **skipped entirely**
- **Alternative code path is invoked** — When toggle is enabled, direct C# class invocation (e.g., `ReopenCaseAndNotifyAssignee.Run()`) replaces the subprocess path
- **No UI indication of the fork** — The BPMN diagram shows the subprocess, but the toggle determines if it actually executes
- **Requires reading metadata to understand** — The toggle logic is encoded in process metadata, not visible in UI or BPMN diagram visually
- **Affects entire downstream chain** — Skipping a subprocess can bypass notification processes, role assignments, or other side effects that subprocess would have triggered

## Details

When investigating "why is process X not executing?" in a notification flow, the instinct is to check:
1. Is the process enabled? (check `VwSysProcess.Enabled`)
2. Are the start signal filter conditions met?
3. Is there a code error?

What's often missed is the **toggle-based conditional execution at the parent process level**. A parent process may invoke a subprocess, but a feature-toggle can intercept that invocation and redirect to alternative code instead.

### Example: RunReopenCaseAndNotifyAssigneeClass Toggle

In the Wave 2 notification architecture:
- **Base flow:** `RunSendNotificationCaseOwnerProcess` calls `SubProcess1` (which invokes `UsrSendNotificationToCaseOwnerCustom1` process)
- **Toggle enabled (=1):** `SubProcess1` is **skipped**; instead, C# code directly calls `ReopenCaseAndNotifyAssignee.Run()`
- **Result:** The custom notification process is never invoked; role-based email routing happens through C# instead of BPMN

This architectural decision has cascading effects:
- If the old C# class (`ReopenCaseAndNotifyAssignee`) has hardcoded behavior, that behavior is active when toggle=1
- If you want to migrate to a new notification system, you must either (a) disable the toggle, or (b) update the C# code
- Testing against one code path may not catch bugs in the other code path

### Metadata Encoding

The toggle logic is not a separate "gateway" or "decision" element in the BPMN diagram. Instead, it's encoded in the `MetaData` column of `VwSysProcess` as part of the parent process definition. The `MetaData` contains:
- The subprocess element reference
- Conditional execution flags based on system settings
- Alternative code path references (class names, method names)

To understand the actual execution path, you must:
1. Query `VwSysProcess.MetaData` for the parent process
2. Parse the metadata to find toggle-based conditional logic
3. Verify the system setting value (e.g., `SELECT value FROM SysSettingsValue WHERE code = 'RunReopenCaseAndNotifyAssigneeClass'`)
4. Trace both code paths (subprocess path and C# path) to understand the difference

## Related Concepts

- [[concepts/data-driven-system-analysis]] — Requires querying system state and metadata, not relying on UI or BPMN diagram alone
- [[concepts/startsignal-metadata-structure]] — Metadata contains not just start signal conditions, but also conditional execution logic
- [[concepts/vwsysprocess-schema-and-notification-querying]] — Where to query for process definitions and toggle-based logic

## Sources

- [[daily/2026-04-19.md]] — Session 14:14: Discovered that `RunReopenCaseAndNotifyAssigneeClass=1` causes `SubProcess1` to be skipped entirely; when toggle is enabled, direct C# path invocation (`ReopenCaseAndNotifyAssignee.Run()`) is used instead of subprocess; understanding actual execution requires reading metadata and verifying system setting values
