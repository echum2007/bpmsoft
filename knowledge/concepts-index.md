# Knowledge Base Index

| Article | Summary | Compiled From | Updated |
|---------|---------|---------------|---------|
| [[concepts/time-unit-codes]] | Real SolutionTimeUnit codes in TimeToPrioritize: `Hour`, `Day`, `Minute` — not "Calendar*" prefixed | 2026-04-06.md | 2026-04-16 |
| [[concepts/esq-timetoprioritize-filter-chain]] | Three-filter ESQ chain to uniquely query TimeToPrioritize: Priority + ServiceInServicePact.ServicePact + ServiceInServicePact.ServiceItem | 2026-04-06.md | 2026-04-16 |
| [[concepts/diff-generator-property]] | `generator` in diff config is an AMD RequireJS loader, not a ViewModel method reference — causes `Script error` if misused | 2026-04-06.md | 2026-04-16 |
| [[concepts/profilecontainer-rendering]] | ProfileContainer has its own ViewGenerator that silently drops standalone LABEL (itemType: 6); workaround is Container + innerHTML | 2026-04-06.md | 2026-04-16 |
| [[concepts/bpmsoft-visible-binding-gotchas]] | `visible: {bindTo: "StringAttr"}` is unreliable; computed method bindings may not re-evaluate; use explicit boolean attributes | 2026-04-06.md | 2026-04-16 |
| [[concepts/extjs-component-querying]] | `Ext.ComponentQuery.query()` broken in BPMSoft; use `Ext.Object.getKeys(Ext.ComponentManager.all.map)` + `Ext.Array.each` instead | 2026-04-06.md | 2026-04-16 |
| [[connections/diff-rendering-silent-failures]] | Four diff rendering failure modes that all produce the same silent symptom (element not visible), and the bottom-up debug sequence | 2026-04-06.md | 2026-04-16 |
| [[concepts/claude-code-bypass-with-deny-rules]] | `bypassPermissions` + ~40 deny rules pattern: automation speed without losing safety on destructive commands | 2026-04-07.md | 2026-04-16 |
| [[concepts/labor-records-design-decisions]] | Labor records project: popup per message (not per day), 0h allowed, overtime flag informational-only, EV-Time is separate external system | 2026-04-07.md | 2026-04-16 |
| [[concepts/cc-address-normalization]] | `MergeAddresses` must strip `<>` tokens and skip non-`@` fragments; separator is `"; "`; JS validator splits on `[\s;,]+` | 2026-04-08.md | 2026-04-16 |
| [[concepts/cc-field-duality]] | Two CC fields in Case: reply-level (one-time, not persisted) vs case-level (`CopyRecepient`, permanent); no sync between them by design | 2026-04-08.md | 2026-04-16 |
| [[concepts/cti-archive-management]] | `src/CTI/CTI/` can diverge from prod with ghost schemas; always use fresh production export; re-export after every deployment | 2026-04-08.md | 2026-04-16 |
| [[concepts/kestrel-restart-requirements]] | C# EventListener → restart required; client-side JS modules → no restart needed | 2026-04-08.md | 2026-04-16 |
| [[concepts/amd-css-loading]] | AMD CSS dependency requires `css!` prefix — without it the stylesheet is silently ignored, `CSS rules found: []` | 2026-04-11.md | 2026-04-16 |
| [[concepts/bpmn-signal-filter-diagnostics]] | Check start signal filter conditions before assuming technical failure; `RunSendEmailToCaseGroupV2` requires `Group NOT NULL AND Owner NULL` | 2026-04-11.md | 2026-04-16 |
| [[concepts/custom-invokable-macro-pattern]] | Create custom invokable macro (e.g. `UsrLatestCustomerEmailGenerator`) modelled on `SymptomsGenerator` to inject case data into email notifications | 2026-04-11.md | 2026-04-16 |
| [[concepts/casecategory-sla-independence]] | CaseCategory is ITIL classification, doesn't affect SLA; using it as notification criterion creates a control gap for mis-categorized critical cases | 2026-04-12.md | 2026-04-16 |
| [[concepts/bpmsoft-feature-flags-storage]] | Feature state in `AdminUnitFeatureState` (not `FeatureState` table); `EmailMessageMultiLanguageV2=1` on prod; `SiteUrl=bpm.cti.ru`; read via `SysSettings.GetValue` | 2026-04-12.md | 2026-04-16 |
| [[concepts/run-reopen-case-notify-assignee]] | `RunReopenCaseAndNotifyAssigneeClass=1` on prod bypasses BPMN entirely; `ReopenCaseAndNotifyAssignee` creates only Reminding — no engineer email exists | 2026-04-12.md, 2026-04-13.md | 2026-04-16 |
| [[concepts/reopen-case-predicate-and-status-flags]] | `ReopeningCondition` predicate: `!IsReopenStatus && !IsFinalStatus && (IsResolved\|\|IsPaused)`; 14 IsPaused + 2 IsResolved + 2 IsFinal of 22 statuses | 2026-04-13.md | 2026-04-16 |
| [[concepts/case-status-received-answer-reopened]] | «Получен ответ» and «Переоткрыто» are the same status record (UId `f063ebbe-fdc6-4982-8431-d8cfa52fedcf`); «Переоткрыто» is an obsolete name | 2026-04-13.md | 2026-04-16 |
| [[concepts/activity-service-processed]] | `Activity.ServiceProcessed`: C# path sets `true`, BPMN path sets `false`; field purpose unknown — requires BPMSoft support clarification before Wave 2 implementation | 2026-04-13.md | 2026-04-16 |
| [[concepts/wave2-task23-consolidation-design]] | Task 2.3 Variant 2 selected: toggle=0, consolidate into BPMN `UsrSendNotificationToCaseOwnerCustom1`, add engineer email, deactivate indirect chain `UsrProcess_0c71a12CTI5` | 2026-04-13.md, 2026-04-14.md | 2026-04-16 |
| [[concepts/bpmsoft-notification-recipient-types]] | Initiator ≠ Service User in BPMSoft notifications; separate templates for each; 15 templates total; `CaseNotificationRule` links Category+Status to templates per recipient type | 2026-04-14.md | 2026-04-16 |
| [[concepts/usrprocess-indirect-chain-hardcoded]] | `UsrProcess_0c71a12CTI5` hardcodes sender `servicedesk@cti.ru` and CC to entire "1-я линия" role; deactivating removes role-wide CC — stakeholder decision needed | 2026-04-14.md | 2026-04-16 |
