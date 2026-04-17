---
title: "Claude Code: bypassPermissions + Deny Rules Security Pattern"
aliases: [bypass-permissions, deny-rules, claude-code-settings]
tags: [claude-code, configuration, security, settings]
sources:
  - "daily/2026-04-07.md"
created: 2026-04-16
updated: 2026-04-16
---

# Claude Code: bypassPermissions + Deny Rules Security Pattern

Setting `defaultMode: "bypassPermissions"` in `.claude/settings.json` removes per-tool confirmation prompts for every operation, but by itself provides no safety net. The recommended pattern pairs it with an explicit deny list covering destructive operations — giving automation speed without losing protection.

## Key Points

- `defaultMode: "bypassPermissions"` — all tools run without confirmation dialogs; requires explicit deny rules to remain safe
- Deny rules are defined under `permissions.deny` in `settings.json` as Bash command patterns
- ~40 deny rules were established for the BPMSoft project, grouped into categories: file deletion, destructive git ops, database ops, system commands, system directory writes
- Settings take effect only after Claude Code is restarted — changes to `settings.json` do not apply mid-session
- This pattern is especially appropriate for projects where Claude operates autonomously on local dev environments

## Details

In the BPMSoft project, `defaultMode: "bypassPermissions"` was configured to eliminate approval friction during development. Without deny rules, this mode allows Claude Code to run any command without restriction — including destructive ones like `rm -rf`, `git push --force`, or `DROP DATABASE`.

The protection layer consists of approximately 40 deny patterns covering:
- **File deletion:** `rm -rf`, disk format commands
- **Git destructive ops:** `git push --force`, `git reset --hard`, `git clean -fd`
- **Database ops:** `DROP DATABASE`, `TRUNCATE` (without WHERE)
- **System commands:** `shutdown`, `kill -9`, `chmod 777`
- **System directory writes:** paths under `/etc/`, `C:/Windows/`

The result is a configuration where routine dev operations (read, edit, compile, test) run without interruption, while high-blast-radius commands are blocked regardless of what prompt is issued.

One operational caveat: after updating `settings.json`, Claude Code must be restarted for the new settings to take effect. Confirming the deny rules are active is easiest by attempting a blocked command in the following session.

## Related Concepts

- [[connections/diff-rendering-silent-failures]] — example session where auto-approved tool execution was iterative and benefited from no-confirmation mode

## Sources

- [[daily/2026-04-07.md]] — Configuration established: `bypassPermissions` + 40 deny rules across 5 categories; noted that settings require restart to take effect
