---
title: "BPMSoft Feature Flag Storage: AdminUnitFeatureState"
aliases: [feature-flags, featurestate, adminunitfeaturestate, feature-toggle-query]
tags: [bpmsoft, database, postgresql, feature-flags, gotcha]
sources:
  - "daily/2026-04-12.md"
created: 2026-04-16
updated: 2026-04-16
---

# BPMSoft Feature Flag Storage: AdminUnitFeatureState

BPMSoft does not have a `FeatureState` table. Feature flag state is stored in `AdminUnitFeatureState` via a JOIN with the `Feature` table. Querying feature state requires knowing this schema — `Feature.State` also does not exist as a direct column.

## Key Points

- `FeatureState` table does **not exist** in BPMSoft's PostgreSQL schema
- Feature state is in `AdminUnitFeatureState` table, column `FeatureState integer`, linked to `Feature` via `FeatureId`
- `Feature.State` is not a valid column — state must be read via JOIN: `Feature JOIN AdminUnitFeatureState ON Feature.Id = AdminUnitFeatureState.FeatureId`
- `EmailMessageMultiLanguageV2` feature: confirmed **enabled (= 1)** on production — the `EmailWithMacrosManager` pipeline is active (corrects earlier assumption that it might be off)
- `SiteUrl` system setting value on prod: `bpm.cti.ru` — case URL format: `https://bpm.cti.ru/Shell/Case/{CaseId}`
- Read system settings at runtime via `Terrasoft.Core.Configuration.SysSettings.GetValue("SiteUrl")`, never hardcode

## Details

When extracting production database settings for Wave 2 design validation, a query against `FeatureState` failed because the table does not exist. The correct schema for querying feature state:

```sql
SELECT f."Name", f."Code", aufs."FeatureState"
FROM "Feature" f
JOIN "AdminUnitFeatureState" aufs ON f."Id" = aufs."FeatureId"
```

The `AdminUnitFeatureState` table stores per-unit (global or per-role) feature state as an integer. A value of `1` means enabled.

A significant finding from this query: `EmailMessageMultiLanguageV2 = 1` on production. Earlier analysis had assumed this feature might be disabled. Its activation means the full `EmailWithMacrosManager` macro expansion pipeline is active for email notifications, which is the prerequisite for the custom invokable macro approach documented in [[concepts/custom-invokable-macro-pattern]].

The `SiteUrl` system setting resolved to `bpm.cti.ru`. For generating case deep-links in notification emails, the correct runtime approach is `SysSettings.GetValue<string>(userConnection, "SiteUrl")`. The resulting link format is `https://{SiteUrl}/Shell/Case/{CaseId}`. This value must not be hardcoded — it differs between dev and production environments.

## Related Concepts

- [[concepts/run-reopen-case-notify-assignee]] — feature toggle `RunReopenCaseAndNotifyAssigneeClass` discovered in the same DB query session
- [[concepts/custom-invokable-macro-pattern]] — `EmailMessageMultiLanguageV2 = 1` confirms the macro approach is viable on production
- [[concepts/kestrel-restart-requirements]] — context: feature toggles affect server-side behavior; toggling them does not itself require restart, but related C# changes do

## Sources

- [[daily/2026-04-12.md]] — Session f1fa9f17: `FeatureState` table confirmed non-existent; `AdminUnitFeatureState` identified as correct schema; `EmailMessageMultiLanguageV2 = 1` confirmed on prod (corrects earlier assumption); `SiteUrl = bpm.cti.ru` confirmed
