---
title: "Connection: Secure Dev-Server Investigation Workflow"
connects:
  - "concepts/ssh-ed25519-dev-server-access"
  - "concepts/dev-access-read-only-protocol"
  - "concepts/tool-availability-verification"
  - "concepts/google-mail-oauth2-bpmsoft-integration"
sources:
  - "daily/2026-04-18.md"
created: 2026-04-18
updated: 2026-04-18
---

# Connection: Secure Dev-Server Investigation Workflow

These four concepts together form a **secure workflow for investigating BPMSoft features on development servers**. Understanding the relationship between them prevents common mistakes: insecure access, unauthorized modifications, missed opportunities to use better tools, and inefficient investigation.

## The Connection

When investigating a feature like Google Mail OAuth 2.0 integration on a dev-server:

1. **Access** [[concepts/ssh-ed25519-dev-server-access]] — Use ED25519 keys, not passwords
2. **Constraint** [[concepts/dev-access-read-only-protocol]] — Operate read-only, ask before changes
3. **Planning** [[concepts/tool-availability-verification]] — Check what tools exist before proposing alternatives (e.g., use edu.bpmsoft.ru documentation, not local guessing)
4. **Investigation** [[concepts/google-mail-oauth2-bpmsoft-integration]] — Actual task: research and test

## Key Insight

The non-obvious relationship is that **security and efficiency are linked**:
- Secure access (ED25519 keys, read-only mode) forces disciplined investigation
- Tool availability verification prevents wasted effort on inferior approaches
- Together, they create a workflow where investigation is thorough, efficient, and safe

Without this structure, common failures occur:
- Using password auth → credentials exposed in logs
- Skipping permission checks → unintended changes break the environment
- Defaulting to local PDF docs → missing web-based official sources
- Guessing about features → no systematic verification

## Evidence

2026-04-18 session: User provided dev-server access with three explicit constraints/tools:
1. Use ED25519 for secure SSH (not password)
2. Read-only access only ("no active changes without permission")
3. Available tools: edu.bpmsoft.ru knowledge base + `/bpmsoft-kb` skill

These three constraints/tools shaped the investigation approach for Google Mail OAuth 2.0 integration.

## Related Concepts

- [[concepts/data-driven-system-analysis]] — Investigation methodology that complements this workflow
- [[concepts/dev-access-read-only-protocol]] — Details on why read-only is the default

## Sources

- [[daily/2026-04-18.md]] — Session 09:42: User set up dev-server access with security constraints (ED25519, read-only) and provided investigation task (Google Mail OAuth 2.0); workflow demonstrates how security, constraints, and available tools interact in practice
