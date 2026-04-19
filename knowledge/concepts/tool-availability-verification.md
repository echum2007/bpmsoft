---
title: "Tool Availability Verification: Check What's Available Before Proposing Alternatives"
aliases: [tool-availability, resource-checking, available-tools-first]
tags: [bpmsoft, methodology, workflow-efficiency, best-practices]
sources:
  - "daily/2026-04-18.md"
created: 2026-04-18
updated: 2026-04-18
---

# Tool Availability Verification: Check What's Available Before Proposing Alternatives

When approaching a task that requires looking up information, solving a problem, or accessing resources, **always verify what tools and resources are already available before suggesting workarounds or alternatives**. In many cases, the optimal tool is already in place but overlooked; proposing inferior substitutes wastes time and context.

## Key Points

- **Inventory available tools first** — web resources, local documentation, APIs, specialized search tools, live access
- **Avoid defaults based on habit** — don't default to "read the local file" if a web API or specialized tool exists
- **Match tool to task** — the best tool for finding BPMSoft documentation is the official knowledge base (edu.bpmsoft.ru), not local PDF or generic search
- **Ask before proposing alternatives** — if a primary tool isn't available, ask user before jumping to secondary options
- **Specialize tools outperform generalists** — `/bpmsoft-kb` skill and Playwright MCP navigation are more effective than "read this PDF" for BPMSoft documentation discovery

## Details

A common failure mode in knowledge work is defaulting to familiar tools when better-suited tools exist:

**Example:** When asked to find BPMSoft documentation on mail service setup ("интеграция и развертывание онсайт"), the instinct is:
1. Check local PDF files → read through `servernaya-razrabotka.pdf`
2. Check local wiki → search `knowledge/` for relevant pages
3. (Only later) Try the web knowledge base

**Better approach:**
1. Check if specialized web resource exists → yes: edu.bpmsoft.ru
2. Check if specialized tool for that resource exists → yes: `/bpmsoft-kb` skill with Playwright MCP
3. (Only if web resource is unavailable) Fall back to local PDF
4. (Only if documentation is not found) Check local wiki

The cost of using the wrong tool:
- PDF scanning is slow and may miss cross-references
- Local wiki may be outdated or incomplete
- Web knowledge base is curated, up-to-date, and searchable
- Specialized tools (Playwright MCP for edu.bpmsoft.ru) handle authentication, navigation, session management automatically

### Applied to BPMSoft Development

For BPMSoft-specific questions, the tool hierarchy is:
1. **NotebookLM + BPMSoft documentation** — 5-7x more efficient by tokens (AI-synthesized from official docs)
2. **edu.bpmsoft.ru (web knowledge base)** — authoritative, up-to-date, official BPMSoft source
3. **Local PDF documentation** — offline-accessible, but slower to search and may be dated
4. **Local wiki (knowledge/)** — useful for project-specific notes, not authoritative for platform features
5. **Guessing / mental models** — last resort; verify with #1-3 before acting

The same principle applies to other tools:
- Use web APIs instead of `curl` if an MCP tool exists
- Use specialized skills (compile, deploy, lint) instead of manual CLI commands
- Use available Playwright MCP instead of assuming you need a different browser tool

## Related Concepts

- [[concepts/ssh-ed25519-dev-server-access]] — Example: checking what access mechanisms are available (ED25519 keys vs. password) before choosing one
- [[concepts/dev-access-read-only-protocol]] — Before making changes, check what's permitted by the access model
- [[concepts/data-driven-system-analysis]] — Querying the live system is a "tool" that outperforms assumptions

## Sources

- [[daily/2026-04-18.md]] — Session 09:42: User corrected Claude for not checking available tools first (edu.bpmsoft.ru web KB exists); reinforced: "always check available tools before proposing alternatives"; this is a high-value workflow principle
