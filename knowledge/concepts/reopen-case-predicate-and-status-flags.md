---
title: "ReopenCaseAndNotifyAssignee: ReopeningCondition Predicate and Case Status Flags"
aliases: [reopeningcondition, case-status-flags, ispausedstatus, isresolvedstatus, isfinalstatus, case-statuses]
tags: [bpmsoft, c-sharp, notifications, wave2, data-model]
sources:
  - "daily/2026-04-13.md"
created: 2026-04-16
updated: 2026-04-16
---

# ReopenCaseAndNotifyAssignee: ReopeningCondition Predicate and Case Status Flags

The `ReopenCaseAndNotifyAssignee` C# class uses a predicate `ReopeningCondition` to decide whether to change the case status when a customer replies. The predicate is based on three boolean flags on each case status: `IsPaused`, `IsResolved`, `IsFinal`. Out of 22 case statuses, the condition fires for 16.

## Key Points

- `ReopeningCondition` = `!IsReopenStatus && !IsFinalStatus && (IsResolved || IsPaused)` — fires when case is paused or resolved but not already reopened or final
- Of 22 case statuses: **14** have `IsPaused=true`, **2** have `IsResolved=true`, **2** have `IsFinal=true`
- "Получен ответ" / "Переоткрыто" status has **no flags set** (`IsPaused=false`, `IsResolved=false`, `IsFinal=false`) — it is the target of reopening, not a trigger
- "Ожидает ответа" has `IsPaused=true` → when a customer replies to a case in "Ожидает ответа", the predicate fires and correctly transitions the case to "Получен ответ"
- The predicate logic was found by reading source code in `src/PKG_BPMSoft_Full_House_1.9.0.14114/` — always check system packages before drawing conclusions from behavior alone

## Details

The C# class `ReopenCaseAndNotifyAssignee` is invoked when feature toggle `RunReopenCaseAndNotifyAssigneeClass = 1` (see [[concepts/run-reopen-case-notify-assignee]]). Before changing the case status, it evaluates `ReopeningCondition` against the current status record. The predicate expression:

```
!IsReopenStatus && !IsFinalStatus && (IsResolved || IsPaused)
```

This reads as: "the case is not already in a re-opened state, is not in a terminal/final state, and is either resolved or paused." Cases matching this condition are eligible for reopening — i.e., status transitions to "Получен ответ" when a customer reply arrives.

The status flag distribution across the 22 system statuses:

| Flag | Count | Meaning |
|------|-------|---------|
| `IsPaused=true` | 14 | Case is waiting (no active work); reopenable |
| `IsResolved=true` | 2 | Case marked resolved but not closed |
| `IsFinal=true` | 2 | Terminal states; cannot be reopened |
| No flags | remaining | Active working states, including "Получен ответ" |

The most common trigger scenario: a case sits in "Ожидает ответа" (`IsPaused=true`), the customer sends a reply, `ReopeningCondition` evaluates to `true`, and the C# class changes the status to "Получен ответ" and creates a `Reminding` notification.

## Related Concepts

- [[concepts/run-reopen-case-notify-assignee]] — the C# class that uses this predicate; feature toggle context
- [[concepts/case-status-received-answer-reopened]] — "Получен ответ" and "Переоткрыто" are the same status record (same UId)
- [[concepts/activity-service-processed]] — `ServiceProcessed` is set differently by C# vs BPMN path when handling customer replies

## Sources

- [[daily/2026-04-13.md]] — Session ffa57050: `ReopeningCondition` predicate expression read from `PKG_BPMSoft_Full_House_1.9.0.14114`; full status flag table enumerated; "Ожидает ответа" confirmed IsPaused=true; "Получен ответ" confirmed as no-flag target status
