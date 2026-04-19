---
title: "Memory Compiler Scheduling: Windows Task Scheduler for Reliable Daily Execution"
aliases: [memory-compiler-scheduler, task-scheduler, automated-compilation, daily-compilation, scheduled-tasks]
tags: [knowledge-management, automation, task-scheduler, workflow, memory-compiler, bpmsoft]
sources:
  - "daily/2026-04-19.md"
created: 2026-04-19
updated: 2026-04-19
---

# Memory Compiler Scheduling: Windows Task Scheduler for Reliable Daily Execution

The memory compiler system (which extracts knowledge from daily conversation logs) was originally event-driven: compilation triggered when `flush.py` ran after 18:00 on session end. This approach is unreliable when users deviate from expected work patterns — if the computer is off at 18:00, compilation delays until the next session closes after 18:00. To ensure guaranteed daily compilation, memory compiler tasks are now scheduled via Windows Task Scheduler, running at a fixed time (19:00) daily with automatic restart if the system was powered off.

## Key Points

- **Scheduled execution (not event-driven)** — Task runs daily at 19:00 via Task Scheduler, independent of session state or flush.py events
- **StartWhenAvailable flag enabled** — If system is off at 19:00, task auto-runs at next system boot (catches missed executions)
- **Execution log location** — `memory-compiler/scripts/compile-scheduled.log` records every scheduled run and any errors
- **Reliable even with irregular user schedule** — Works whether user works 9-5 or midnight to 8am; compilation happens regardless
- **Replaces unreliable event-driven model** — No more dependency on session cleanup timing; scheduled execution is explicit and auditable
- **Windows-specific solution** — Task Scheduler is Windows equivalent to cron; `durable=true` in CronCreate would use durable cron on Unix systems

## Details

### Why Event-Driven Scheduling Fails

The original flush.py → compile.py chain had a flaw: compilation only triggered when Claude Code sessions ended **after 18:00**. This created blind spots:

1. User works 9-5, logs off at 5pm → no compilation that day (compilation waits until 6pm)
2. Computer is powered off → missed execution (next compilation happens when user next uses Claude Code after 18:00)
3. User is on vacation for a week → no compilation for 7 days
4. Long-running session → compilation delays unpredictably

Result: daily logs accumulated in `daily/` without being compiled for days, defeating the purpose of automated knowledge capture.

### Task Scheduler Solution

Windows Task Scheduler (equivalent to cron on Unix) provides deterministic scheduling:

**Task Configuration:**
- **Name:** "BPMSoft Memory Compiler" (or similar identifier)
- **Trigger:** Daily at 19:00
- **Action:** Run `uv run python <path-to-compile.py>`
- **Settings:** Enable "Start task only if system is idle" → OFF (we want it to run regardless)
- **Settings:** Enable "Run task as soon as possible after a scheduled start is missed" → ON (StartWhenAvailable)
- **Logging:** Write to `memory-compiler/scripts/compile-scheduled.log`

**Example Windows Task Scheduler command:**
```
uv run python C:\path\to\memory-compiler\scripts\compile.py
```

When scheduled at 19:00 with `StartWhenAvailable=true`:
- 19:00 on Tuesday: runs if computer is on
- Computer off at 19:00, powered on Wednesday at 10am: runs immediately at 10am (catches missed window)
- Computer off entire Wednesday: runs Thursday at 19:00 as normal

### Monitoring Execution

Task Scheduler logs execution to `compile-scheduled.log`:
```
[2026-04-19 19:00:00] Scheduled compile started
[2026-04-19 19:03:45] compile.py completed: 3 articles created, 2 updated
[2026-04-19 19:03:46] Scheduled compile finished (exit code: 0)
```

If compilation fails:
```
[2026-04-19 19:00:00] Scheduled compile started
[2026-04-19 19:01:15] Error: daily/2026-04-19.md not found
[2026-04-19 19:01:15] Scheduled compile failed (exit code: 1)
```

Monitoring the log weekly ensures:
- Compilation is running consistently
- No errors or blocked processes
- Knowledge base is being built reliably

## Related Concepts

- [[concepts/knowledge-base-file-standardization]] — Standardization helps automated compilation produce consistent output
- [[concepts/notebooklm-documentation-strategy-alert-rules]] — Related workflow: managing knowledge accumulation and curation
- [[concepts/data-driven-system-analysis]] — Query system state (Task Scheduler logs) to understand compilation health

## Sources

- [[daily/2026-04-19.md]] — Session 14:15: Restructured memory compiler scheduling; moved from event-driven (flush.py after 18:00) to Windows Task Scheduler for reliable daily execution; created task to run at 19:00 daily with StartWhenAvailable flag for missed execution catch-up; Variant B chosen: keep concepts/ as staging area with biweekly manual review → wiki/ distribution (safer than full automation); logs to compile-scheduled.log for diagnostics
