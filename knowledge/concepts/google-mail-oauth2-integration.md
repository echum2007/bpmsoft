---
title: "Google Mail OAuth 2.0 Integration in BPMSoft 1.9"
aliases: [gmail-oauth2, gmail-integration, mail-integration, google-mail-setup]
tags: [bpmsoft, email, integration, oauth2, mail-service, deployment]
sources:
  - "daily/2026-04-18.md"
created: 2026-04-18
updated: 2026-04-18
---

# Google Mail OAuth 2.0 Integration in BPMSoft 1.9

Setting up Google Mail OAuth 2.0 integration with BPMSoft 1.9 mail system requires understanding both the BPMSoft mail service architecture and the OAuth 2.0 configuration requirements. This investigation started on 2026-04-18 with a focus on on-site deployment ("интеграция и развертывание онсайт") procedures from the official documentation.

## Key Points

- **Investigation scope:** Configure Google Mail OAuth 2.0 for BPMSoft 1.9 mail service on on-site deployment
- **Documentation priority:** Use web knowledge base (edu.bpmsoft.ru) as primary source for integration guides, then fallback to PDF documentation
- **Dev environment:** dev-server at 192.168.102.46 available for read-only diagnostics and testing
- **Deployment approach:** Read-only investigation first, then deploy changes only with explicit approval
- **Knowledge base sections:** Consult "Для разработчика" (For Developer) and "Для администратора" (For Administrator) sections on edu.bpmsoft.ru

## Details

### Investigation Approach

Rather than assuming how Gmail OAuth 2.0 integration works in BPMSoft, the investigation starts by querying the official documentation and examining the actual system configuration on dev-server. This follows the data-driven methodology: check documentation first, query actual system state second, then verify against test data.

The scope includes:
1. Finding integration documentation on edu.bpmsoft.ru (primary source)
2. Checking mail service architecture in BPMSoft 1.9 (see [[concepts/platform-mail-architecture]] if available)
3. Connecting to dev-server to inspect current mail configuration
4. Mapping the deployment procedure for on-site systems

### BPMSoft Mail Service Context

BPMSoft 1.9 uses an `IEmailClient` abstraction with two main implementations:
- `EmailClient` — SMTP/IMAP client (used for standard email configuration)
- `ExchangeClient` — MS Exchange-specific client

OAuth 2.0 integration for Gmail requires understanding:
- Which email client implementation handles OAuth 2.0
- Configuration schema and metadata for OAuth 2.0 parameters
- Deployment procedure for on-site systems (production migration steps)

### Dev-Server Access Model

Access is read-only (`192.168.102.46`, user: `gore`). This constraint means:
- Can inspect current configuration and logs
- Cannot make active changes without explicit permission
- Can test against current system state
- Can prepare deployment scripts for approval

## Related Concepts

- [[concepts/data-driven-system-analysis]] — Methodology: query documentation and system state before building assumptions
- [[concepts/documentation-source-priority-bpmsoft]] — Why edu.bpmsoft.ru is the primary source over local PDFs
- [[concepts/ed25519-ssh-authentication]] — Secure access to dev-server via ED25519 keys
- [[concepts/ssh-read-only-access]] — Implementation of read-only permission constraints
- [[feedback_bpmsoft_kb_url]] — Technical navigation: URL encoding quirks in edu.bpmsoft.ru

## Sources

- [[daily/2026-04-18.md]] — Session 09:42: Investigation initiated into Google Mail OAuth 2.0 setup in BPMSoft 1.9; scope includes on-site deployment procedures; dev-server access provided for read-only diagnostics
