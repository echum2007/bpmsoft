---
title: "Kestrel Restart Requirements by Change Type"
aliases: [kestrel-restart, restart-required, deployment-restart]
tags: [bpmsoft, deployment, kestrel, c-sharp, eventlistener]
sources:
  - "daily/2026-04-08.md"
created: 2026-04-16
updated: 2026-04-16
---

# Kestrel Restart Requirements by Change Type

Not all BPMSoft schema changes require a Kestrel (web server) restart. The rule is simple: C# code compiled server-side (especially `EntityEventListener` schemas) requires a restart; client-side JavaScript schemas do not.

## Key Points

- **Requires restart:** C# `EntityEventListener` schemas — they run in the Kestrel process and are loaded at startup
- **Requires restart:** Any C# "Source code" schema that registers services or hooks into the server lifecycle
- **No restart needed:** Client-side AMD JavaScript modules ("Client module" schemas) — loaded fresh per browser request
- **No restart needed:** UI-only changes: diff modifications, page layouts, CSS, labels
- Deploying a service-mode-indicator (pure client JS) to production required no Kestrel restart
- Documented in `CLAUDE.md` as a known nuance: "After publishing `EntityEventListener` — mandatory Kestrel restart"

## Details

The distinction stems from BPMSoft's architecture: JavaScript schemas are served as static AMD modules resolved by the browser on page load. A schema publish updates the file on disk; the next browser load picks up the new version automatically. No server process needs to reload.

C# schemas compiled into the server process behave differently. `EntityEventListener` classes are discovered via reflection at startup and registered into the event dispatch table. Publishing a new or modified `EntityEventListener` without restarting Kestrel leaves the old version (or no version) in the running process — the updated class is on disk but not loaded.

When planning a deployment checklist, categorize each schema change:
- JS client module → no restart step needed
- C# source code schema (EventListener, service, manager) → add Kestrel restart as the final step, after all schemas are published

For the service-mode-indicator project, all changes were in `CasePage.js` (a client module). The deployment checklist correctly omitted the Kestrel restart step, and this was verified against the implementation guide before production deployment.

## Related Concepts

- [[concepts/cti-archive-management]] — the CTI archive review that accompanied the service-mode-indicator deployment planning
- [[concepts/cc-address-normalization]] — CC EventListener changes that *did* require a Kestrel restart when originally deployed

## Sources

- [[daily/2026-04-08.md]] — Service-mode-indicator deployment confirmed as client-side JS only; Kestrel restart explicitly noted as not required; contrast with EventListener changes documented in `CLAUDE.md`
