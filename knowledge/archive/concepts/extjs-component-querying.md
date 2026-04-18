---
title: "ExtJS Component Querying in BPMSoft"
aliases: [extjs-query, componentmanager, component-query]
tags: [bpmsoft, frontend, extjs, debugging]
sources:
  - "daily/2026-04-06.md"
created: 2026-04-16
updated: 2026-04-16
---

# ExtJS Component Querying in BPMSoft

BPMSoft's ExtJS environment disables or does not support the standard `Ext.ComponentQuery.query()` API and the `.items.map` collection traversal. A different approach using `Ext.ComponentManager` is required for browser-console debugging.

## Key Points

- `Ext.ComponentQuery.query("selector")` — **does not work** in BPMSoft's ExtJS build
- `someComponent.items.map(fn)` — **does not work**; `.map` is not a standard Array on ExtJS MixedCollection
- Working approach: `Ext.Object.getKeys(Ext.ComponentManager.all.map)` to list all registered component IDs
- Then iterate with `Ext.Array.each(ids, fn)` or filter manually
- `document.getElementById("elementId")` only finds elements actually in the DOM — useful as a negative test (returns `null` → element not rendered)
- An element in `Ext.ComponentManager` but absent from `document.getElementById` means: created but not rendered to DOM (often due to `visible: false` binding)

## Details

During debugging of the service-mode indicator, standard ExtJS querying methods failed. The working workflow to locate a component by partial name is:

```javascript
var ids = Ext.Object.getKeys(Ext.ComponentManager.all.map);
Ext.Array.each(ids, function(id) {
    if (id.indexOf("ServiceMode") >= 0) {
        console.log(id, Ext.ComponentManager.get(id));
    }
});
```

This revealed `CasePageUsrServiceModeLabelLabel` at index 0 inside `ProfileContainer` — confirming the component existed in the registry. A parallel check with `document.getElementById("UsrServiceModeLabel")` returned `null`, confirming the element was not in the DOM despite being in the component manager.

This combination — ComponentManager present, getElementById absent — is a reliable diagnostic signature for a `visible: false` binding issue or a ViewGenerator that created the component object but never called `render()`.

## Related Concepts

- [[concepts/profilecontainer-rendering]] — context where this technique identified the hidden element
- [[concepts/bpmsoft-visible-binding-gotchas]] — the root cause revealed by this diagnostic technique

## Sources

- [[daily/2026-04-06.md]] — `Ext.ComponentQuery.query()` and `.items.map` confirmed non-functional; `Ext.Object.getKeys(Ext.ComponentManager.all.map)` + `Ext.Array.each` confirmed working; located `CasePageUsrServiceModeLabelLabel` via this method
