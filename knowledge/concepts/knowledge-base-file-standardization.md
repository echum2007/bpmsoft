---
title: "Knowledge Base File Format Standardization"
aliases: [kb-standardization, markdown-consistency, file-format, wiki-maintenance]
tags: [knowledge-management, documentation, markdown, wiki, maintenance, obsidian]
sources:
  - "daily/2026-04-19.md"
created: 2026-04-19
updated: 2026-04-19
---

# Knowledge Base File Format Standardization

Knowledge base files in `knowledge/concepts/` and other wiki directories accumulate formatting inconsistencies over time: escape sequences, non-standard table syntax, mixed markdown styles, and missing frontmatter metadata. Standardizing these files to proper Markdown format with consistent YAML frontmatter ensures compatibility with both Claude tooling and Obsidian, improves parseability, and reduces friction in knowledge management workflows.

## Key Points

- **YAML frontmatter required** — Every article must include name, description, type, sources, created, updated metadata
- **Standard Markdown tables** — Use ` --- ` separators (3 hyphens with spaces), not bare `---` or other syntax
- **No escape sequences in content** — Remove backslashes, entity encodings, or non-standard escaping
- **Plain text in tables** — Replace inline HTML with plain Markdown; clean, simple structure preferred over rich formatting
- **Hierarchical heading structure** — h1 (title) → h2 (sections) → h3 (subsections); no skipping levels
- **Consistent link format** — Use `[[concepts/slug]]` wikilinks for internal references; absolute URLs for external links
- **Regular audits** — Periodically scan knowledge/concepts/ for formatting drift; normalize files before ingesting into wiki/

## Details

Knowledge base files are read by multiple systems:
1. **Claude tools** — Requires valid Markdown and YAML frontmatter for parsing metadata and extracting links
2. **Obsidian** — Depends on consistent link format (`[[wikilinks]]`) and proper structure for graph visualization and backlink discovery
3. **Memory Compiler** — Parses metadata to understand article type and sources for automated compilation workflow
4. **grep/search tools** — Benefit from consistent structure for faster, more accurate full-text searching

When files have mixed formatting (escape sequences, non-standard table syntax, malformed frontmatter), the impact cascades:
- Claude tools fail to extract metadata → article not indexed properly
- Obsidian cannot parse wikilinks → graph relationships lost
- Grep searches produce false positives or miss matches
- Future maintenance becomes harder: contributors don't know which style is "correct"

### Standardization Checklist

When normalizing a knowledge base file:

1. **Frontmatter**
   - [ ] Has YAML block at top (between `---` and `---`)
   - [ ] Includes: title, aliases (optional), tags, sources, created, updated
   - [ ] All required fields present

2. **Links**
   - [ ] Internal links use `[[concepts/slug]]` format (no .md extension)
   - [ ] External links use `[text](URL)` Markdown format
   - [ ] No bare URLs in text (wrap in `[](URL)` or `[[slug]]`)

3. **Tables**
   - [ ] Header row followed by separator row (` --- `)
   - [ ] Column separators are `|` pipes
   - [ ] No inline HTML (`<tr>`, `<td>`, etc.)
   - [ ] Plain text content in cells (Markdown formatting OK: `**bold**`, `_italic_`)

4. **Headings**
   - [ ] h1 used once for article title
   - [ ] h2 for main sections (Key Points, Details, Related Concepts, Sources)
   - [ ] h3 for subsections within details
   - [ ] No skipped heading levels (e.g., h2 directly to h4)

5. **Content**
   - [ ] No escape sequences (backslashes before special chars unless truly needed)
   - [ ] No entity codes (`&nbsp;`, `&quot;`, etc.) unless necessary for code blocks
   - [ ] Clear, concise writing in encyclopedia style
   - [ ] Related Concepts section with [[wikilinks]]
   - [ ] Sources section with [[daily/YYYY-MM-DD.md]] references

### File Drift Detection

Files drift from standard format when:
- Manually edited in text editors without validation
- Copied from external sources (PDFs, blog posts, etc.)
- Updated by multiple contributors with different styles
- System changes (e.g., Obsidian settings changes file format)

Recommendation: audit knowledge/concepts/ quarterly or after significant bulk editing. Use this as a scheduled maintenance task.

## Related Concepts

- [[concepts/memory-compiler-scheduling-task-scheduler]] — Automated compilation writes new articles; standardization prevents format drift during bulk operations
- [[concepts/notebooklm-documentation-strategy-alert-rules]] — Related workflow: managing knowledge base growth and quality control

## Sources

- [[daily/2026-04-19.md]] — Session 14:15: User standardized malformed `knowledge/concepts/summary.md` file; corrected escape sequences, fixed table syntax, added Obsidian-compatible frontmatter; identified that knowledge base files accumulate formatting drift over time; standardization improves parseability for both Claude and Obsidian; recommend periodic audits of concepts/ directory for consistency
