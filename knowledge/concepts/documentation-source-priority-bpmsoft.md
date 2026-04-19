---
title: "Documentation Source Priority in BPMSoft Workflow: Web KB > PDF > Local Wiki"
aliases: [doc-source-priority, knowledge-base-hierarchy, source-selection]
tags: [bpmsoft, methodology, documentation, best-practices, workflow]
sources:
  - "daily/2026-04-18.md"
created: 2026-04-18
updated: 2026-04-18
---

# Documentation Source Priority in BPMSoft Workflow: Web KB > PDF > Local Wiki

When researching BPMSoft platform behavior, API details, configuration procedures, or troubleshooting steps, the source of documentation matters significantly. There is a clear priority hierarchy: **web-based knowledge base first, local PDFs second, local wiki third**. Inverting this hierarchy (defaulting to local files because they're faster to access) leads to stale information, missed deprecations, and incomplete solutions.

## Key Points

- **Primary source:** `edu.bpmsoft.ru` — web-based BPMSoft knowledge base, maintained by BPMSoft, most current
- **Secondary source:** Local PDF files in `Documentation 1.9/` directory — static snapshots, lag behind web updates
- **Tertiary source:** Local wiki (`knowledge/concepts/`) — personal synthesis and notes, not authoritative for platform behavior
- **Tool for web KB:** `/bpmsoft-kb` skill using Playwright MCP for browser automation and navigation
- **Common mistake:** Defaulting to local PDFs first because they're immediately available — this causes research against outdated documentation
- **Navigation quirk:** URL construction via string concatenation fails; must use `browser_evaluate` for dynamic navigation on edu.bpmsoft.ru

## Details

### Why the Web KB is Authoritative

The web-based knowledge base at `edu.bpmsoft.ru` is maintained by BPMSoft and reflects the current, supported version of the platform (1.9). It includes:
- Current API documentation
- Deployment procedures that may have been updated since the PDF release
- Integration guides for new or changing third-party services (like OAuth 2.0)
- Community feedback and clarifications
- Known issues and workarounds from current deployments

Local PDFs are snapshots taken at a point in time. While they're useful as a fallback (especially if the web KB is unavailable), they will always lag behind the live documentation. A feature may be deprecated, a procedure may change, or a security issue may require a new deployment step — and the PDF won't reflect it.

### When to Use Each Source

**Use web KB first when:**
- Researching a new feature or integration
- Looking for deployment procedures (these change most frequently)
- Checking for known issues or limitations
- Finding step-by-step configuration guides
- Need current, authoritative behavior specifications

**Use local PDF when:**
- Web KB is unavailable or network is offline
- Looking for architectural background (rarely changes)
- Cross-referencing a specific version number mentioned in the web KB

**Use local wiki when:**
- Synthesizing personal observations or patterns
- Documenting lessons learned from your own experience
- Cross-referencing other BPMSoft projects or investigations
- Looking for previous decision rationale

### The Cost of Inverting the Hierarchy

In the 2026-04-18 session, the mistake was reaching for local PDFs immediately instead of checking the web KB. The consequence: potentially researching against outdated integration documentation when the current procedure might be simpler or different. The correction took explicit reminder: "always check available tools first before proposing alternatives."

At scale, this becomes expensive: hours of research time against stale documentation, implementation against a deprecated API, or missing a critical new security requirement that the live KB flagged.

### Navigation Implementation

The `/bpmsoft-kb` skill provides automated browser navigation to edu.bpmsoft.ru. However, the site has URL encoding quirks: direct string concatenation of URLs often fails. The solution: use `browser_evaluate` JavaScript execution to navigate dynamically. This is documented in [[feedback_bpmsoft_kb_url]].

## Related Concepts

- [[concepts/data-driven-system-analysis]] — Broader methodology: query the actual system and authoritative sources before building assumptions
- [[feedback_bpmsoft_kb_url]] — Technical implementation: URL encoding quirks and navigation via browser_evaluate
- [[reference_knowledge_base]] — Basic reference info: URL, login credentials, available sections
- [[concepts/google-mail-oauth2-integration]] — Example investigation where documentation source priority applies

## Sources

- [[daily/2026-04-18.md]] — Session 09:42: User reminded that web knowledge base is available and preferred source; mistakenly attempted PDF/local wiki instead of querying edu.bpmsoft.ru via `/bpmsoft-kb`; emphasis on tool selection: always check available tools first before proposing alternatives

