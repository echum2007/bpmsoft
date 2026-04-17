---
title: "BPMSoft visible Binding Gotchas"
aliases: [visible-binding, bindto-visible, binding-gotcha]
tags: [bpmsoft, frontend, diff, binding, gotcha]
sources:
  - "daily/2026-04-06.md"
created: 2026-04-16
updated: 2026-04-16
---

# BPMSoft visible Binding Gotchas

BPMSoft's diff element `visible` property supports both direct attribute binding and computed method binding, but both have known failure modes that produce silent non-rendering rather than errors.

## Key Points

- `visible: { bindTo: "StringAttribute" }` — a string attribute is **not** automatically coerced to boolean; an empty string evaluates as falsy even if the attribute exists
- `visible: { bindTo: "getComputedMethod" }` — a computed method binding may not re-evaluate when the underlying data attributes change, leaving the element permanently hidden
- Binding to a string attribute that holds a non-empty value like `"Hour"` may still evaluate as `false` if BPMSoft's binding layer expects a strict boolean
- An element that is hidden via `visible: false` still appears in `Ext.ComponentManager` — it is created but not in the DOM
- Forced `model.set(...)` on the bound attribute from the browser console does not necessarily trigger a visual re-render

## Details

During service-mode indicator debugging, two visible binding approaches were tried on the `UsrServiceMode` attribute (a string like `"Круглосуточно"` or empty):

1. `visible: { bindTo: "getServiceModeVisible" }` — a computed method that returned `true`/`false` based on `UsrServiceMode`. The element remained hidden even after `UsrServiceMode` was set, suggesting the binding did not track `UsrServiceMode` as a dependency and did not re-evaluate.

2. `visible: { bindTo: "UsrServiceMode" }` — direct binding to the string attribute. Also did not produce a visible element, likely because BPMSoft's binding layer does not treat a non-empty string as truthy.

The safest approach for controlling visibility is either: (a) use a dedicated **boolean** attribute (e.g., `UsrServiceModeVisible`) and set it explicitly alongside the string value, or (b) eliminate the `visible` binding entirely during initial development and verify the element renders at all before layering in conditional visibility.

Removing `visible` from the diff entirely (or setting `visible: true`) is the first debugging step when an element appears in the component manager but not the DOM.

## Related Concepts

- [[concepts/profilecontainer-rendering]] — ProfileContainer context where this issue was encountered
- [[concepts/diff-generator-property]] — other diff configuration pitfalls in the same debugging session

## Sources

- [[daily/2026-04-06.md]] — Both `bindTo: "getServiceModeVisible"` and `bindTo: "UsrServiceMode"` failed silently; `console` forced set also had no visual effect; element confirmed in ComponentManager but absent from DOM
