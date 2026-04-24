---
title: "BPMSoft Package Import: FK Dependency Resolution and SysImage"
aliases: [import-fk, fk-dependencies, sysimage-import, emailtemplate-migration, package-import-errors]
tags: [bpmsoft, deployment, database, import, troubleshooting, data-migration]
sources:
  - "daily/2026-04-24.md"
created: 2026-04-24
updated: 2026-04-24
---

# BPMSoft Package Import: FK Dependency Resolution and SysImage

When importing a BPMSoft package (e.g., CTI) onto a target environment, FK (foreign key) constraint violations are a common blocker. Records in data sections may reference rows in other tables that don't exist on the target server. A typical case: `EmailTemplate.PreviewImageId` references `SysImage` records that exist on the source (production) but not on the target (dev). The solution is to export both the dependent data section and its FK targets together.

## Key Points

- **FK errors block import silently at section level** — the import utility logs only the data descriptor UId, not the specific records that failed, making root cause analysis harder
- **SysImage is self-contained** — it has no outgoing foreign keys, so importing SysImage records introduces no further cascading dependencies
- **Export both sections together** — to resolve FK errors, export the referencing table (e.g., `EmailTemplate`) and the referenced table (e.g., `SysImage`) in the same import package
- **Local DB copy may diverge from prod** — records edited on prod after the DB snapshot was taken will differ; always verify against the live source when planning exports
- **Import log granularity is limited** — BPMSoft's import utility reports errors at the data section (descriptor) level, not at the individual record level; cross-referencing with the actual data is required to identify which rows caused FK violations

## Details

### The FK Dependency Chain

In the EmailTemplate migration case, the dependency is straightforward:

```
EmailTemplate.PreviewImageId → SysImage.Id
```

Three EmailTemplate records in the CTI package had `PreviewImageId` values pointing to SysImage records. On the dev server, those SysImage rows didn't exist, causing FK constraint violations during import.

The resolution requires exporting two data sections from production:
1. **SysImage** — the 3 image records referenced by EmailTemplate (self-contained, no further FKs)
2. **EmailTemplate** — the 3 template records with their PreviewImageId values intact

Import order matters: SysImage must be imported before EmailTemplate, or both in a single package where BPMSoft resolves the dependency order automatically.

### Import Log Limitations

When the import fails, the BPMSoft utility produces a log that identifies which data section descriptor failed, but does not list the individual UIds of records that caused the FK violation. For example:

```
Error in data section descriptor: {some-guid}
FK constraint violation on table EmailTemplate
```

To determine *which* of the 3 EmailTemplate records failed, you must:
1. Look up the descriptor UId to identify the table
2. Query the source database for records matching the exported set
3. Check each record's FK columns against the target database
4. Identify which FK targets are missing

This is a diagnostic limitation of the platform's import tooling, not a configuration issue.

### SysImage as a Safe Import Target

`SysImage` stores binary image data (previews, icons, logos) with a simple schema:
- `Id` (PK)
- `Name`
- `Data` (binary)
- `MimeType`
- No outgoing foreign keys

This makes it safe to import SysImage records without worrying about cascading dependencies. The only risk is ID collision (if a SysImage with the same Id already exists on the target), which BPMSoft handles via upsert logic.

### Workflow: Resolving FK Errors in Package Import

1. **Identify the failing section** — read the import log, find the descriptor UId
2. **Map the FK** — determine which column in the failing table references which target table
3. **Query source DB** — find the specific FK values that need to exist on the target
4. **Export target records** — use BPMSoft export utility to extract the missing FK target records
5. **Import in correct order** — FK targets first, then the dependent records
6. **Verify** — re-run the original package import and confirm FK errors are resolved

## Related Concepts

- [[concepts/data-driven-system-analysis]] — Diagnosing FK errors requires querying both source and target databases rather than guessing
- [[concepts/kestrel-service-restart]] — After successful import of new data/schemas, a Kestrel restart may be needed for the system to pick up changes
- [[concepts/dev-access-read-only-protocol]] — Export operations on prod require careful permission management

## Sources

- [[daily/2026-04-24.md]] — Session 22:13: Three EmailTemplate records in CTI package had PreviewImageId FK to SysImage; dev server missing those SysImage rows; import log showed only descriptor-level errors; plan: export EmailTemplate(3) + SysImage(3) from prod; SysImage confirmed self-contained (no outgoing FK); local DB copy diverged from prod (2 of 3 PreviewImageId already NULL in local copy but not on prod)
