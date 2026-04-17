---
title: "Case Status: «Получен ответ» and «Переоткрыто» are the Same Status"
aliases: [case-status-reopened, received-answer-status, pereotkyto, poluchenOtvet, reopened-status-uid]
tags: [bpmsoft, data-model, case, gotcha, wave2]
sources:
  - "daily/2026-04-13.md"
created: 2026-04-16
updated: 2026-04-16
---

# Case Status: «Получен ответ» and «Переоткрыто» are the Same Status

BPMSoft's case status "Получен ответ" (Answer Received) and "Переоткрыто" (Reopened) refer to the **same database record** with the same UId (`f063ebbe-fdc6-4982-8431-d8cfa52fedcf`). The display name was changed; there is no separate "Переоткрыто" status in the system.

## Key Points

- Both names resolve to the same UId: `f063ebbe-fdc6-4982-8431-d8cfa52fedcf`
- The system originally named this status "Переоткрыто" — it was renamed to "Получен ответ" in the CTI customization
- There is no discrepancy between the C# class behavior and business requirements — both C# and BPMN set the case to the same status
- Business-correct label: **"Получен ответ"**; "Переоткрыто" is an obsolete name that is no longer used
- This status record has **no flags set** (`IsPaused=false`, `IsResolved=false`, `IsFinal=false`) — see [[concepts/reopen-case-predicate-and-status-flags]]

## Details

During Wave 2 design analysis, a question arose whether the C# class `ReopenCaseAndNotifyAssignee` and the BPMN process `UsrSendNotificationToCaseOwnerCustom1` set the case to the same or different statuses. Reading the code revealed that both reference the same status by its UId — the apparent difference in names ("Переоткрыто" in code comments vs. "Получен ответ" in the UI) was simply a renaming that had occurred at some point in the project's history.

This is a non-obvious gotcha: searching the source packages or documentation for "Переоткрыто" and "Получен ответ" may surface different hits, but they describe the same entity. Always compare by UId when investigating case status transitions, not by display name.

For Wave 2 task 2.3 design, this finding eliminated the hypothesis that the two execution paths (C# vs BPMN) were sending the case into different states. The only real difference between them is the `Activity.ServiceProcessed` flag value and the notification mechanism — not the resulting case status.

## Related Concepts

- [[concepts/reopen-case-predicate-and-status-flags]] — status flag semantics; "Получен ответ" correctly has no flags set (it is the target state, not a trigger state)
- [[concepts/run-reopen-case-notify-assignee]] — the C# class that transitions a case into this status
- [[concepts/activity-service-processed]] — the field that differs between C# and BPMN paths after both reach this status

## Sources

- [[daily/2026-04-13.md]] — Session f8b29840: UId `f063ebbe-fdc6-4982-8431-d8cfa52fedcf` confirmed for both "Получен ответ" and "Переоткрыто"; user confirmed "Получен ответ" as the correct business name; "Переоткрыто" confirmed obsolete
