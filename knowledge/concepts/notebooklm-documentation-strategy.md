---
title: NotebookLM as Primary Documentation Source
slug: notebooklm-documentation-strategy
tags:
  - documentation
  - knowledge-base
  - search-strategy
  - bloknot
sources:
  - daily/2026-04-19.md
created: 2026-04-19
updated: 2026-04-19
---

## Key Points

- NotebookLM bloknoты are **5–7x more token-efficient** than reading PDF documentation directly
- Consolidated from 6 separate bloknoты to **2 focused notebooks** to improve query speed while maintaining full coverage
- Three **mandatory alert rules** prevent silent fallback and keep documentation strategy user-controlled
- Bloknoты contain 50+ sources per notebook without degradation; reduce cognitive overhead in queries
- Goal: **90% of answers from bloknoты, max 10% from internet** searches

## Details

NotebookLM is a Google Gemini-powered system for synthesizing information from multiple source documents. In the BPMSoft development workflow, NotebookLM has become the primary documentation interface because it dramatically reduces token consumption while providing cited answers with source context.

The consolidated notebook setup includes:

1. **Backend & Infrastructure Stack** — Contains 50+ sources covering OAuth 2.0, Email (SMTP/IMAP), REST API, Redis, PostgreSQL, Kestrel, .NET 8, async/await patterns, and DI containers
2. **Angular 18.2 Modern Frontend** — Complete framework reference for component architecture, dependency injection, routing, and form handling

Each bloknoту is used for its domain rather than having one specialty bloknoту per technology, which reduces context switching and improves query performance.

### Three Mandatory Alert Rules

1. **Report unavailability instead of silent fallback** — If a bloknoту is inaccessible or returns empty results, report the issue immediately rather than silently switching to internet search
2. **Propose adding missing info rather than internet-searching alone** — When a question reveals a coverage gap (e.g., new framework version, new integration), propose adding that source to the bloknoту instead of searching the web without mentioning it
3. **Report coverage gaps to expand collection** — Flag technologies or topics that appear frequently but aren't in bloknoты, allowing deliberate decisions about adding new notebooks

These rules keep the user in control of the documentation strategy and prevent degradation into default "search the internet" behavior.

## Related Concepts

- [[concepts/knowledge-base-file-standardization]] — Markdown format standards that enable consistent parsing
- [[concepts/memory-compiler-scheduling-task-scheduler]] — Automated knowledge base compilation and updates
- [[connections/documentation-and-research-workflow]] — How bloknoту searches fit into the overall knowledge-gathering flow

## Implementation Notes

- Query time for NotebookLM is typically 8–15 seconds per question
- Token efficiency improvement: PDF read (2–3K tokens per page) vs. NotebookLM synthesis (200–400 tokens per question with citations)
- No changes to bloknoту sources require user approval; Claude proposes, user decides
- If a bloknoту reaches ~100 sources, split into two specialized notebooks to maintain query speed

## Sources

- daily/2026-04-19.md: Session refactoring CLAUDE.md and consolidating NotebookLM strategy; user specified three mandatory alert rules for documentation search behavior
