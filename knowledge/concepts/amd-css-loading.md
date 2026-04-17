---
title: "AMD CSS Loading: css! Prefix Requirement in BPMSoft"
aliases: [css-prefix, amd-css, usrcasepagecss, css-dependency]
tags: [bpmsoft, frontend, amd, css, gotcha]
sources:
  - "daily/2026-04-11.md"
created: 2026-04-16
updated: 2026-04-16
---

# AMD CSS Loading: css! Prefix Requirement in BPMSoft

In BPMSoft's AMD/RequireJS module system, loading a CSS schema as a dependency requires the `css!` prefix in the dependency array. Without it, the CSS module is silently ignored — styles are never applied even though the JavaScript module loads without errors.

## Key Points

- `define("CasePage", ["css!UsrCasePageCSS"], function() {...})` — correct; CSS module is loaded and applied
- `define("CasePage", ["UsrCasePageCSS"], function() {...})` — incorrect; AMD treats the entry as a JS module, silently ignores it when it fails or resolves to nothing
- Symptom: JavaScript adds CSS class names to DOM elements correctly, but no styles apply — `CSS rules found: []` in DevTools confirms the stylesheet never loaded
- The `css!` plugin is part of RequireJS's loader plugin mechanism; it routes the dependency through a CSS-specific loader rather than the default JS evaluator
- This applies to all AMD modules in BPMSoft, not just CasePage — any client module that depends on a CSS schema must use the prefix

## Details

During service-mode-indicator deployment, the custom stylesheet `UsrCasePageCSS` was published with colour and layout rules for the `.usr-service-mode-wrap` container. The `CasePage.js` module included `"UsrCasePageCSS"` in its `define()` dependency array without the prefix. JavaScript execution proceeded normally — the module's factory function ran, class names were added to DOM elements via `container.el.dom.innerHTML` — but DevTools' CSS panel showed zero rules applied from `UsrCasePageCSS`.

Diagnosis with `CSS rules found: []` in the browser console confirmed the stylesheet was absent from the page's CSSOM. The fix was a one-character prefix change: `"UsrCasePageCSS"` → `"css!UsrCasePageCSS"`. After the change, styles applied immediately on page reload with no other modifications.

This is a silent failure: AMD does not throw an error when a CSS schema is listed without the `css!` prefix. The dependency is either resolved as an empty JS module or skipped entirely. There is no console warning. The correct mental model is: AMD `define()` dependencies fall into two kinds — `css!Name` for stylesheets and plain `Name` for JavaScript modules — and mixing them up produces no feedback.

## Related Concepts

- [[concepts/diff-generator-property]] — another AMD-specific failure where the string type determines behavior, not value
- [[connections/diff-rendering-silent-failures]] — this CSS issue is documented there as the fourth silent failure mode
- [[concepts/profilecontainer-rendering]] — the service-mode-indicator container whose styling required the `css!` fix

## Sources

- [[daily/2026-04-11.md]] — Session 1123f49c: `CSS rules found: []` in DevTools confirmed stylesheet not loaded; fix was adding `css!` prefix to AMD dependency array; styles applied immediately after change
