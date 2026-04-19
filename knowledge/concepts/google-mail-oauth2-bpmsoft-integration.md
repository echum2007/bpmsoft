---
title: "Google Mail OAuth 2.0 Integration in BPMSoft 1.9: Investigation Starting Point"
aliases: [google-mail-oauth2, oauth2-integration, mail-service-setup, google-smtp]
tags: [bpmsoft, mail-service, oauth2, integration, investigation]
sources:
  - "daily/2026-04-18.md"
created: 2026-04-18
updated: 2026-04-18
---

# Google Mail OAuth 2.0 Integration in BPMSoft 1.9: Investigation Starting Point

Setting up Google Mail OAuth 2.0 authentication in BPMSoft 1.9 mail service is an area requiring investigation into official documentation. The task involves understanding how to configure SMTP/IMAP authentication using Google's OAuth 2.0 tokens instead of plain-text passwords, particularly for on-site (on-premises) deployments where security and credential management are critical.

## Key Points

- **Integration needed:** Configure BPMSoft mail service (SMTP/IMAP) to authenticate with Google Mail using OAuth 2.0 tokens
- **Deployment context:** On-site ("интеграция и развертывание онсайт") — understand how OAuth tokens work in private network or offline scenarios
- **Documentation location:** Official BPMSoft knowledge base (edu.bpmsoft.ru) has integration guides for mail service setup
- **Investigation methodology:** Use specialized web tools (`/bpmsoft-kb` skill) to find authoritative documentation before making configuration changes
- **Tool availability check:** Always verify what resources exist before proposing workarounds

## Details

Google Mail OAuth 2.0 integration in BPMSoft involves:

1. **Token generation** — Configure an OAuth 2.0 app in Google Cloud Console, obtain client ID/secret
2. **Token refresh flow** — BPMSoft mail service must handle token refresh (tokens expire after ~1 hour)
3. **SMTP/IMAP authentication** — Different from API authentication; SMTP uses "Authorization: Bearer" header, IMAP uses SASL XOAUTH2
4. **Deployment considerations:**
   - **Cloud:** Google OAuth works directly
   - **On-premises:** May require proxy/relay if internal network lacks outbound HTTPS to Google
   - **Offline/air-gapped:** May not be possible without a local token relay service

### Investigation Steps

To understand BPMSoft's mail service OAuth 2.0 support:

1. Search official BPMSoft knowledge base (edu.bpmsoft.ru) for:
   - "Google Mail OAuth" or "Google SMTP OAuth"
   - "Mail service integration" or "Email configuration"
   - "IntegrationV2" or "IEmailClient" (technical class names for mail subsystem)

2. Check system packages for mail service implementation:
   - `src/PKG_BPMSoft_Full_House_1.9.0.14114/IntegrationV2/` — email client interfaces
   - `src/PKG_BPMSoft_Full_House_1.9.0.14114/CaseService/` — notification processes (uses mail service)

3. Review documentation in BPMSoft for:
   - Mail service configuration UI path
   - Supported authentication types (Basic auth, OAuth 2.0, etc.)
   - Token handling and refresh logic

4. Verify with dev-server testing:
   - Connect to test BPMSoft instance
   - Attempt to configure Google Mail OAuth 2.0 mailbox
   - Observe error logs or configuration schema for hints

### Known Mail Service Architecture (v1.9)

From platform knowledge:
- Primary mail client interface: `IEmailClient` 
- Default implementation: `EmailClient` (SMTP/IMAP)
- Alternative: `ExchangeClient` (Microsoft Exchange)
- Integration layer: `IntegrationV2` package

OAuth 2.0 support status in v1.9: **Requires verification** — documentation or code review needed.

## Related Concepts

- [[concepts/ssh-ed25519-dev-server-access]] — How to securely connect to dev-server for mail service testing
- [[concepts/dev-access-read-only-protocol]] — Investigation should be read-only until configuration changes are approved
- [[concepts/tool-availability-verification]] — Use edu.bpmsoft.ru and `/bpmsoft-kb` skill instead of guessing from local files

## Sources

- [[daily/2026-04-18.md]] — Session 09:42: User initiated investigation into Google Mail OAuth 2.0 integration in BPMSoft 1.9 on-site deployments; provided dev-server access (192.168.102.46) for testing; task status: investigation starting point, documentation search needed
