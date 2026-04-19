---
title: "NotebookLM Documentation Strategy: Consolidated Bloknoты with Mandatory Alert Rules"
aliases: [notebooklm-strategy, documentation-hierarchy, alert-rules, knowledge-source-priority]
tags: [documentation, notebooklm, knowledge-management, workflow, bpmsoft, strategy]
sources:
  - "daily/2026-04-19.md"
created: 2026-04-19
updated: 2026-04-19
---

# NotebookLM Documentation Strategy: Consolidated Bloknoты with Mandatory Alert Rules

The documentation research workflow for BPMSoft development was refined to use **NotebookLM (Google's AI notebook tool) as the primary source**, with internet search and edu.bpmsoft.ru as secondary/fallback options. This provides 5–7x better token efficiency than PDF-based research, curated content, and automatic source citations. The strategy is implemented via two focused notebooks (Backend & Infrastructure Stack, Angular 18.2) with three mandatory alert rules that prevent silent fallbacks and encourage controlled knowledge accumulation.

## Key Points

- **Primary source: NotebookLM bloknoты** (5–7x token efficiency vs local PDFs; AI-synthesized answers with source citations)
- **Secondary source: Internet search** (only after bloknoты queried; must report gaps to user)
- **Tertiary source: edu.bpmsoft.ru + PDF** (fallback when bloknoты don't cover the topic)
- **Two focused notebooks** (Backend & Infrastructure Stack, Angular 18.2) — replaces previous 6 notebooks; better query performance, within Google token limits
- **Three mandatory alert rules:**
  1. Report bloknot unavailability instead of silent fallback
  2. Propose adding missing info to bloknot (don't search internet alone)
  3. Report coverage gaps to user (not just fill them from internet)
- **Goal: 90% answers from bloknoты, max 10% from internet** — Reduces internet searches, controls knowledge sources, improves consistency

## Details

### Why Consolidate to Two Notebooks?

Initial strategy had 6 separate NotebookLM notebooks (BPMSoft, C#/.NET, BPMN, ExtJS, Backend Infrastructure, Angular). This created:
- Overhead in selecting which bloknot to query
- Fragmented knowledge (same concept duplicated in 2+ notebooks)
- Higher Gemini API context per query (6 notebooks = larger initial context load)
- Slower query response times (Gemini processes larger context)

**Consolidation result:**
- **Backend & Infrastructure Stack** — Combines C#/.NET, BPMN, Backend Infrastructure, Web frameworks
- **Angular 18.2** — Dedicated to modern frontend framework (large enough to justify separate notebook)
- **Removed:** BPMSoft-specific notebook (covered by edu.bpmsoft.ru + wiki), ExtJS (legacy, minimize new usage)
- **Coverage:** 50+ sources per notebook (within Google's limits), focused on technologies actually used in stack

### Three Mandatory Alert Rules

**Rule 1: Report Bloknot Unavailability**
- If a bloknot is temporarily unavailable or returns empty results, **report immediately** instead of silently switching to internet search
- Prevents loss of knowledge about system state (if bloknot is down, mention it; don't work around it invisibly)
- Example: "NotebookLM returned 503; would normally search edu.bpmsoft.ru but wanted to flag the outage first"

**Rule 2: Propose Adding Info to Bloknot**
- When a question reveals a gap in bloknot coverage, **propose adding that content** rather than just searching internet to answer once
- Turns discovery into bloknot expansion (builds better long-term knowledge source)
- Example: "PostgreSQL 14 features aren't in our Backend Stack notebook; should I search internet or would you like to add a PostgreSQL 14 section to it?"

**Rule 3: Report Coverage Gaps**
- When research reveals that a technology or concept is missing from all bloknoties, **report it to user** as a candidate for new notebook or section expansion
- Transparency about what's NOT covered keeps user in control of knowledge source evolution
- Example: "OAuth 2.0 in BPMSoft isn't in any bloknot yet; found 3 edu.bpmsoft.ru articles. Should I create a new 'BPMSoft OAuth Integration' notebook?"

### Documentation Hierarchy in Practice

**Example query: "How do I implement macros in BPMSoft email templates?"**

1. **Check Backend & Infrastructure Stack notebook first**
   - Query: "BPMSoft email template macros IMacrosInvokable implementation"
   - If found → synthesize answer with citations
   - If not found → proceed to step 2

2. **Check edu.bpmsoft.ru via `/bpmsoft-kb` skill**
   - Search for "макросы" or "macros" or "IMacrosInvokable"
   - If found → use as primary source, mention that bloknot gap was detected

3. **Only if edu.bpmsoft.ru fails: internet search**
   - WebSearch for BPMSoft email macro implementation
   - Report back: "Answer found on internet, but we're missing this in our bloknoties; should we add it?"

### Transition from Six to Two Notebooks

- **Consolidation rationale:** Reduced context overhead, improved query speed, focused on critical technologies
- **Still covers 100% of stack:** No loss of coverage; just better organization
- **Migration cost:** One-time effort to review and redistribute 6 notebooks' worth of sources into 2 focused ones
- **Ongoing:** New technologies added to bloknoties as requirements emerge (goal: minimize internet searches)

## Related Concepts

- [[concepts/tool-availability-verification]] — Related principle: check what's available before proposing alternatives
- [[concepts/documentation-source-priority-bpmsoft]] — Original hierarchy documented; strategy consolidates and optimizes it
- [[concepts/knowledge-base-file-standardization]] — Maintains knowledge base quality as new info is added from bloknoties

## Sources

- [[daily/2026-04-19.md]] — Session 14:16: Refactored documentation strategy; consolidated 6 NotebookLM bloknoties to 2 (Backend & Infrastructure Stack, Angular 18.2) for faster queries and better Gemini context management; established 3 mandatory alert rules: (1) report bloknot unavailability instead of silent fallback, (2) propose adding missing info to bloknot instead of just internet-searching, (3) report coverage gaps to expand bloknot collection; goal: 90% from bloknoties, max 10% internet; implemented in CLAUDE.md refactoring with modularization; user approved strategy shift to make NotebookLM primary source
