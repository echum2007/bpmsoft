---
title: "BPMSoft diff config: generator property is an AMD loader"
aliases: [diff-generator, viewmodel-generator, amd-generator]
tags: [bpmsoft, frontend, diff, amd, gotcha]
sources:
  - "daily/2026-04-06.md"
created: 2026-04-16
updated: 2026-04-16
---

# BPMSoft diff config: generator property is an AMD loader

In BPMSoft's client-side diff configuration arrays, the `generator` property on an element does **not** reference a method on the current ViewModel. It is an AMD/RequireJS module loader directive.

## Key Points

- `generator: "SomeMethod"` causes BPMSoft to `require()` an AMD module named `"SomeMethod"` — it is **not** a call to `viewModel.SomeMethod()`
- Attempting to use a ViewModel method name as `generator` throws: `Script error for "<methodName>"`
- The correct format when a generator module is genuinely needed: `"ModuleName.methodName"` (AMD module + exported function)
- To render dynamic content in diff, use a `Container` (itemType: 7) and manipulate its DOM via a render method instead
- `labelClass` is also not a valid diff element property; dynamic CSS classes via diff for LABEL are unsupported

## Details

During an attempt to render a custom service-mode indicator label inside `ProfileContainer`, a diff entry was written with `generator: "renderServiceModeIndicator"` expecting the ViewModel method to be called. Instead, BPMSoft's rendering pipeline treated the string as an AMD module identifier and tried to `require()` it, producing a `Script error for "renderServiceModeIndicator"` in the console. The form continued to load but the element was never rendered.

The lesson is that `generator` in diff is part of BPMSoft's ViewGenerator pipeline and expects a fully qualified AMD module reference. ViewModel method names live in a different namespace entirely. For custom rendering logic tied to ViewModel state, the recommended pattern is a `Container` element whose DOM is populated by a dedicated render method (e.g., `renderServiceModeIndicator`) called at the right lifecycle point.

## Related Concepts

- [[concepts/profilecontainer-rendering]] — why the Container-with-innerHTML approach was ultimately chosen
- [[concepts/bpmsoft-visible-binding-gotchas]] — other diff binding pitfalls

## Sources

- [[daily/2026-04-06.md]] — Discovered via `Script error for "generateServiceModeIndicator"` when attempting to use ViewModel method as diff generator
