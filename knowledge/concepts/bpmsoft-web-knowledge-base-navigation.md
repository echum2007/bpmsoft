---
title: "BPMSoft Web Knowledge Base Navigation: Using Playwright MCP"
aliases: [edu-bpmsoft-kb, knowledge-base-navigation, playwright-mcp, web-kb-gotchas]
tags: [bpmsoft, web-knowledge-base, navigation, playwright, mcp, tools]
sources:
  - "daily/2026-04-18.md"
created: 2026-04-18
updated: 2026-04-18
---

# BPMSoft Web Knowledge Base Navigation: Using Playwright MCP

The BPMSoft web knowledge base at `https://edu.bpmsoft.ru/baza-znaniy/` is the authoritative source for platform documentation. However, direct URL navigation and HTML scraping fail due to session management and URL encoding quirks. The solution is to use the `/bpmsoft-kb` skill with Playwright MCP for automated, reliable navigation.

## Key Points

- **URL:** `https://edu.bpmsoft.ru/baza-znaniy/` (requires HTTPS)
- **Authentication:** Login via `https://bpmsoft.ru/avtorizatsiya/` (user: `e.chumak@cti.ru`, password stored in memory)
- **Navigation challenge:** Direct URL construction fails due to URL encoding and session state; must use browser automation
- **Tool:** `/bpmsoft-kb` skill leverages Playwright MCP to automate browser navigation
- **Browser automation required:** Emulate human navigation: login → search → parse results → read article
- **Session management:** Maintain authenticated session across multiple page visits

## Details

### Why Direct URL Navigation Fails

The BPMSoft knowledge base uses dynamic URL routing and session cookies:
- Search results are not directly URL-addressable (e.g., `/baza-znaniy/?q=oauth2` might not work as expected)
- Some article URLs contain encoded parameters or session IDs
- URL encoding inconsistencies between what the browser sends and what the server expects
- Session token may expire between requests if not managed properly

Example failure modes:
- `https://edu.bpmsoft.ru/baza-znaniy/oauth2` → redirects or 404
- Direct query string: `?q=oauth2` → session lost or not recognized
- Copy-pasting URL from browser address bar → works in browser but fails in curl due to cookie/session mismatch

### Using Playwright MCP with /bpmsoft-kb Skill

The `/bpmsoft-kb` skill automates the navigation flow:

```
User: "Find documentation on Google Mail OAuth 2.0"
↓
Skill /bpmsoft-kb invokes Playwright MCP
↓
1. Navigate to https://bpmsoft.ru/avtorizatsiya/
2. Fill login form (user: e.chumak@cti.ru)
3. Submit and wait for session token
4. Navigate to https://edu.bpmsoft.ru/baza-znaniy/
5. Search for "oauth2" or "gmail" or "email integration"
6. Parse search results
7. Click on relevant article
8. Extract and return content
↓
Claude reads the article content and synthesizes answer
```

### Navigation Workflow

**Step 1: Authenticate**
- Go to `https://bpmsoft.ru/avtorizatsiya/`
- Fill email and password (stored in [[reference_knowledge_base]] memory)
- Wait for redirect to `edu.bpmsoft.ru` or confirmation of login

**Step 2: Search**
- Navigate to knowledge base home: `https://edu.bpmsoft.ru/baza-znaniy/`
- Search for keywords: "oauth2", "gmail", "email integration", "интеграция", etc.
- Results page shows article list with snippets

**Step 3: Open Article**
- Click on article title or link
- Wait for article page to load
- Extract content (heading, sections, code blocks, etc.)

**Step 4: Return Result**
- Parse article text and structure
- Return to Claude for synthesis

### Common Gotchas

1. **Session expiry:** If the session times out between step 1 and step 2, re-authenticate
2. **Search result pagination:** May need to click "next" or "load more" for additional results
3. **Language switching:** KB interface may switch languages; verify content language (Russian or English)
4. **Article structure:** Articles may have nested sections, code blocks, or embedded images; extract all relevant content
5. **Version-specific content:** Some articles are version-specific (v1.9, v2.x, etc.); note the version in results

### When to Use /bpmsoft-kb

- **Starting point for any research:** Always ask `/bpmsoft-kb` before consulting PDF or local files
- **Specific features:** "Find how to configure OAuth 2.0 for email"
- **Integration procedures:** "How do I integrate with Google Mail?"
- **Architecture questions:** "What's the email system architecture in 1.9?"

### Fallback: If /bpmsoft-kb Fails

If the skill or Playwright MCP is unavailable:
1. Check `knowledge/DOCUMENTATION_INDEX.md` for relevant PDF file names
2. Read PDF from `Documentation 1.9/` directory
3. Fall back to local wiki in `knowledge/wiki/`

But always try `/bpmsoft-kb` first.

## Related Concepts

- [[concepts/documentation-source-priority-bpmsoft]] — Why edu.bpmsoft.ru is the primary source; this article explains how to access it
- [[concepts/google-mail-oauth2-integration]] — Investigation that uses this skill to find integration docs
- [[concepts/bpmsoft-feature-flags-storage]] — Example: discovered via web KB that feature state is in AdminUnitFeatureState, not FeatureState table

## Sources

- [[daily/2026-04-18.md]] — Session 09:42: User corrected Claude to use `/bpmsoft-kb` skill with Playwright MCP for web KB navigation; direct PDF reading was wrong approach; web KB has URL encoding and session management gotchas requiring browser automation
