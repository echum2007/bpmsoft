---
title: "CTI Archive Management: Production Export vs Repository"
aliases: [cti-archive, cti-export, cti-staleness, cti-ghosts]
tags: [bpmsoft, cti, deployment, repository, gotcha]
sources:
  - "daily/2026-04-08.md"
  - "daily/2026-04-11.md"
created: 2026-04-16
updated: 2026-04-16
---

# CTI Archive Management: Production Export vs Repository

The CTI package repository copy (`src/CTI/CTI/`) can diverge from production over time, accumulating "ghost" schemas — entries for objects that were deleted from production after the export. Always use a fresh production export when deploying changes.

## Key Points

- `src/CTI/CTI/` (old path, now removed) contained an outdated export — it reflected production state at export time, **not** current production
- `src/CTI_2026-04-11_15.14.44/CTI/CTI` is the authoritative production archive as of 2026-04-11
- After each production deployment, re-export the CTI package from prod and replace the archive in the repository
- "Ghost" schemas are real: schemas present in an old export but since deleted from production still appear in the binary archive — they are not filtered out during export
- The `src/CTI/CTI/` path has been removed; it was causing confusion by appearing current when it wasn't
- **Do not use "Сохранить новую версию" (Save new version)** on system BPMN processes — it creates a CTI substitution of the system process, locking future platform upgrades to your fork

## Details

When preparing the service-mode-indicator deployment, a review of the CTI archive revealed three "ghost" entries that had existed in the old `src/CTI/CTI/` export: the detail "Сроки с приоритетами", the SLA tab, and a group containing field `UsrLookup1123415`. These schemas were present on production at the time of the original CTI export, then deleted from production, but they persisted in the repository copy because the repository was never refreshed after those deletions.

Using a stale archive to verify or deploy changes is risky: the archive appears to represent the full current CTI package but silently includes deleted schemas. If those schemas happen to collide with current schema names or UIds during import, they could cause deployment errors or resurrect deleted objects.

The correct workflow is:
1. Before any deployment: verify the archive timestamp matches or is newer than the last prod deployment
2. After any prod deployment: immediately re-export CTI from production and commit the new archive to the repository
3. Use the Python reader script (in `CLAUDE.md`) to inspect archive contents when in doubt

The name format for the archive directory encodes the export timestamp: `CTI_YYYY-MM-DD_HH.MM.SS`, making it easy to identify staleness at a glance.

## Related Concepts

- [[concepts/cc-address-normalization]] — cc-notifications was the prior production deployment that triggered the archive refresh cycle
- [[concepts/labor-records-design-decisions]] — next project where a fresh archive will be needed for deployment

## Sources

- [[daily/2026-04-08.md]] — `src/CTI/CTI/` confirmed stale vs production; three ghost schemas identified (detail "Сроки с приоритетами", SLA tab, `UsrLookup1123415` group); fresh archive `src/CTI_2026-04-11_15.14.44/` established as canonical; post-deployment re-export recommended as standard practice
- [[daily/2026-04-11.md]] — Session a6bc19ca: "Save new version" on system process confirmed as creating CTI substitution; noted as last-resort only due to upgrade risk
