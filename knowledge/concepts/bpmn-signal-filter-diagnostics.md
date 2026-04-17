---
title: "BPMN Signal Filter Diagnostics: Check Conditions Before Assuming Technical Failure"
aliases: [bpmn-diagnostics, signal-filter, runsendemailtocasegroupv2, process-not-firing]
tags: [bpmsoft, bpmn, processes, diagnostics, troubleshooting]
sources:
  - "daily/2026-04-11.md"
created: 2026-04-16
updated: 2026-04-16
---

# BPMN Signal Filter Diagnostics: Check Conditions Before Assuming Technical Failure

When a BPMSoft BPMN process appears to stop firing, the most common cause is not a technical breakage but a mismatch between the test data and the process's start signal filter conditions. Always verify the filter conditions match the test record before investigating infrastructure issues.

## Key Points

- `RunSendEmailToCaseGroupV2` fires **only** when `Group IS NOT NULL AND Owner IS NULL` — a case with an owner assigned will never trigger it
- A process that was working before a deployment can appear broken while actually functioning correctly if test data doesn't satisfy the trigger conditions
- The standard diagnostic sequence: first check start signal filter → then check process status (active/inactive) → then try recompile/restart
- `Compile and save` + Kestrel restart do **not** fix a process that is correctly compiled but triggered against wrong test data
- The "Изменить процесс" (Change process) menu item on an entity page is a DCM process — unrelated to BPMN signal handling

## Details

After deploying CC-notification functionality and restarting Kestrel on 2026-04-10, the process `RunSendEmailToCaseGroupV2` was not observed firing during test case creation. The initial hypothesis was that the deployment had broken something. Diagnostics showed: process status was active, recompiling and restarting produced no change.

The root cause was in the test setup: the test case was created with an owner (`Owner`) already assigned. The process's start signal filter requires `Owner IS NULL` — if an owner is present, the signal condition evaluates to false and the process is never enqueued. After creating a test case without an owner (Group filled, Owner empty), the process fired normally.

Key lesson for BPMN troubleshooting: **check signal filter conditions against actual test record values first**. This is especially important after deployments, where the natural bias is to attribute non-firing to the deployment change rather than to test data.

The "Кнопка «Сохранить новую версию»" (Save new version) button that appears when editing a system process creates a substitution of that process in the CTI package. This should be avoided unless absolutely necessary — it locks BPMSoft's system process into CTI and makes future platform upgrades harder.

## Related Concepts

- [[concepts/kestrel-restart-requirements]] — Kestrel restart is not a universal fix; this case demonstrates a situation where restart was irrelevant
- [[concepts/cti-archive-management]] — "Save new version" on a system process creates a CTI substitution, same package management concerns apply

## Sources

- [[daily/2026-04-11.md]] — Session a6bc19ca: `RunSendEmailToCaseGroupV2` appeared non-functional after Kestrel restart; root cause was test case had Owner assigned; process fired correctly when Owner was empty; confirmed `Group NOT NULL AND Owner NULL` as the required trigger state
