---
title: "Development Access: Read-Only by Default, Change Only With Permission"
aliases: [read-only-access, dev-access-protocol, permission-based-changes]
tags: [bpmsoft, devops, development-workflow, constraints]
sources:
  - "daily/2026-04-18.md"
created: 2026-04-18
updated: 2026-04-18
---

# Development Access: Read-Only by Default, Change Only With Permission

When granted access to a BPMSoft development server or system for investigation or troubleshooting, operate under a **read-only access model by default**. Do not make active changes (INSERT, UPDATE, DELETE, schema modifications, service restarts) without explicit permission. This constraint protects the development environment and prevents unintended side effects during diagnosis.

## Key Points

- **Read-only is the default** — queries (SELECT) are always permitted; modifications require explicit ask-and-confirm
- **Active changes require approval** — before INSERT/UPDATE/DELETE/DDL/restart operations, ask user permission and explain why
- **Diagnosis happens via queries** — use SELECT statements to understand system state instead of modifying configuration during investigation
- **This applies to all systems** — databases, configuration files, service processes, schema changes
- **Escalate if unsure** — if unclear whether an operation is "read-only", ask before proceeding

## Details

The read-only-by-default model serves multiple purposes:
- **Safety:** Protects the development environment from accidental changes that could break testing or other work
- **Audit trail:** Explicit permission requests create a record of what changed and why
- **Shared responsibility:** User approval ensures the development team understands and consents to modifications
- **Discovery before action:** Encourages investigation and diagnosis before jumping to "fixes"

### Typical Investigation Pattern

When investigating "why doesn't this work?" in a BPMSoft system:

1. **Query the system** (read-only) — use SELECT to understand current state: process configs, database records, activation conditions
2. **Analyze findings** — form hypothesis based on data, not assumptions
3. **Present findings** (user reviews)
4. **Request permission** — if a change is needed, ask explicitly with justification
5. **Execute change** — once approved, make the change
6. **Verify** — query the system again to confirm the change took effect

This pattern prevents the common failure mode of guessing, making changes blindly, and having to undo them later.

### Applied to BPMSoft Development

Examples of operations that require explicit permission:
- Running SQL UPDATE to fix test data
- Modifying configuration in the BPMSoft UI
- Restarting services (e.g., Kestrel, PostgreSQL)
- Deploying code changes or schema updates
- Creating test records in production-adjacent systems

Examples of operations that are always allowed:
- SELECT queries to understand process metadata
- Reading configuration files
- Checking service status
- Exporting data for analysis
- Reviewing logs

## Related Concepts

- [[concepts/ssh-ed25519-dev-server-access]] — How to securely access dev servers; read-only is the operational constraint
- [[concepts/data-driven-system-analysis]] — Investigation methodology that relies on queries, not modifications
- [[concepts/tool-availability-verification]] — Before suggesting changes, check what's available and what's allowed

## Sources

- [[daily/2026-04-18.md]] — Session 09:42: User provided SSH access with strict constraint "read-only access, no active changes without permission"; reinforced that modifications require explicit ask-and-confirm protocol
