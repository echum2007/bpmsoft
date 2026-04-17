---
title: "Connection: BPMSoft diff rendering silent failures"
connects:
  - "concepts/diff-generator-property"
  - "concepts/profilecontainer-rendering"
  - "concepts/bpmsoft-visible-binding-gotchas"
  - "concepts/amd-css-loading"
sources:
  - "daily/2026-04-06.md"
  - "daily/2026-04-11.md"
created: 2026-04-16
updated: 2026-04-16
---

# Connection: BPMSoft diff rendering silent failures

Four distinct failure modes in BPMSoft's client-side diff/rendering pipeline share a common, dangerous property: they fail **silently** — the form loads, no JavaScript error is thrown in most cases, and the missing element (or missing styles) produces no visible feedback about why they are absent.

## The Connection

Three issues were encountered in the same debugging session (2026-04-06) while rendering a custom UI element inside `ProfileContainer`. A fourth was discovered during production deployment (2026-04-11):

1. **`generator` misuse** → AMD module load error (`Script error for "..."`) — the one case that *does* produce a console error, but only if DevTools is open
2. **ProfileContainer LABEL** → element created in ComponentManager, never inserted into DOM — zero errors
3. **`visible` binding on string** → element hidden permanently — zero errors, model changes ignored
4. **CSS dependency without `css!` prefix** → stylesheet never applied, `CSS rules found: []` — zero JS errors, class names are added to DOM but produce no visual effect

## Key Insight

The non-obvious relationship is that these four failure modes **stack**: you can fix one and still be blocked by another, and each one produces the same observable symptom (element not visible or unstyled). A developer fixing the `indexOf("Calendar")` bug (see [[concepts/time-unit-codes]]) might correctly populate `UsrServiceMode` but never see the result because a `visible` binding silently discards it, or because the container is in the wrong rendering path. Similarly, an element can render correctly in the DOM but appear completely unstyled if the CSS dependency is missing the `css!` prefix.

The correct debugging sequence is bottom-up:
1. Confirm the element exists at all: `Ext.ComponentManager` check (see [[concepts/extjs-component-querying]])
2. Confirm the element is in the DOM: `document.getElementById`
3. Confirm the render method is being called: `console.log` at method entry
4. Confirm the data is correct: log the attribute value before the visibility decision

## Evidence

- `LABEL` (itemType: 6) in ProfileContainer → in ComponentManager, not in DOM (2026-04-06 session b88d6a57)
- `generator: "renderServiceModeIndicator"` → `Script error for "renderServiceModeIndicator"` (2026-04-06 session b88d6a57)
- `visible: { bindTo: "UsrServiceMode" }` and `visible: { bindTo: "getServiceModeVisible" }` → element hidden despite non-empty attribute (2026-04-06 session 0e909dcb)
- `["UsrCasePageCSS"]` without `css!` prefix → `CSS rules found: []`, class names present in DOM but styles never applied (2026-04-11 session 1123f49c)

## Related Concepts

- [[concepts/diff-generator-property]]
- [[concepts/profilecontainer-rendering]]
- [[concepts/bpmsoft-visible-binding-gotchas]]
- [[concepts/extjs-component-querying]]
- [[concepts/time-unit-codes]]
- [[concepts/amd-css-loading]]
