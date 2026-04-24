---
title: "Connection: NotebookLM Cross-Version Risk Requires Two-Layer Codebase Verification"
connects:
  - "concepts/notebooklm-cross-version-api-contamination"
  - "concepts/bpmsoft-configuration-schema-vs-core-dll"
  - "concepts/data-driven-system-analysis"
  - "concepts/bpmsoft-calendar-api-v19"
sources:
  - "daily/2026-04-24.md"
created: 2026-04-24
updated: 2026-04-24
---

# Connection: NotebookLM Cross-Version Risk Requires Two-Layer Codebase Verification

These four concepts together form a **verification chain** that was discovered through a single debugging incident: NotebookLM suggested an API that doesn't exist in BPMSoft 1.9, and finding the real API required understanding that BPMSoft has two distinct code layers (DLLs vs configuration schemas).

## The Connection

1. **NotebookLM cross-version contamination** [[concepts/notebooklm-cross-version-api-contamination]] — the AI documentation tool returned `ICalendarRepository.IsWorkTime` from BPMSoft 8/Creatio
2. **Data-driven verification** [[concepts/data-driven-system-analysis]] — the methodology that said "don't trust the answer, search the actual system"
3. **Two-layer code architecture** [[concepts/bpmsoft-configuration-schema-vs-core-dll]] — searching DLLs (layer 1) found nothing; the real API was in configuration schemas (layer 2)
4. **Real API discovery** [[concepts/bpmsoft-calendar-api-v19]] — `TermCalculatorActions.IsTimeInWorkingInterval` in the SLM package

## Key Insight

The non-obvious relationship is that **NotebookLM's cross-version contamination risk is amplified by the two-layer architecture**. A developer who receives a wrong API name from NotebookLM might:

1. Search DLLs → not found → conclude "API doesn't exist in 1.9" → **correct conclusion, but incomplete investigation**
2. Stop searching → miss the real API that exists in configuration schemas → **design the feature without the platform's built-in capability**

The correct chain is:
1. NotebookLM says X → verify X in DLLs → not found
2. Search configuration schemas for the *concept* (not the exact name) → find the real API (Y)
3. Use Y in the design, document that X was a false lead

Without understanding both the cross-version risk AND the two-layer architecture, the developer either trusts the wrong API or fails to find the right one.

## Evidence

2026-04-24 session:
- NotebookLM returned `ICalendarRepository.IsWorkTime` → searched 457 DLLs → zero matches
- Broadened search to configuration schemas → found `TermCalculatorActions.IsTimeInWorkingInterval` in SLM package
- Total time from wrong API to correct API: significant investigation effort that would have been avoided if the two-layer search was the default pattern
- R3 risk for labor-records project was fully resolved only after completing the full verification chain

## Related Concepts

- [[concepts/notebooklm-documentation-strategy-alert-rules]] — Alert rules should include version contamination warnings
- [[concepts/tool-availability-verification]] — Check real tools/APIs before committing to a design based on documentation

## Sources

- [[daily/2026-04-24.md]] — Session 22:13: Full chain demonstrated: NotebookLM → wrong API → DLL search (fail) → schema search (success) → correct API found; two-layer search pattern established as mandatory verification for any NotebookLM API suggestion
