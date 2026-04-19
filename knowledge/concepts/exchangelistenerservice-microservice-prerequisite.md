---
title: "ExchangeListenerService: Microservice Prerequisite for Email Integration"
aliases: [exchangelistenerservice, email-listener, microservice-deployment, email-integration-prerequisite]
tags: [bpmsoft, email, microservice, deployment, infrastructure, docker]
sources:
  - "daily/2026-04-19.md"
created: 2026-04-19
updated: 2026-04-19
---

# ExchangeListenerService: Microservice Prerequisite for Email Integration

BPMSoft 1.9's email integration architecture uses a component-based deployment model where email synchronization and listener functionality is deployed as a **separate Docker microservice**, not as part of the main application. Before configuring any email provider (including Google Mail OAuth 2.0), the ExchangeListenerService microservice must be deployed and registered in the system setting `ExchangeListenerServiceUri`.

## Key Points

- **Separate microservice deployment** — ExchangeListenerService is not bundled with the main BPMSoft application; must be deployed independently via Docker
- **Infrastructure prerequisite** — Email provider configuration is blocked until the microservice is running and the system setting is configured
- **System setting registration** — After microservice deployment, `ExchangeListenerServiceUri` system setting must point to the microservice (e.g., http://localhost:8080)
- **Diagnostic interface available** — `/ClientApp/#/IntegrationDiagnostics/ExchangeListener` provides connectivity verification and status checking
- **Affects all email providers** — Google Mail OAuth 2.0, Exchange, IMAP — all require the listener service before configuration is possible
- **Component-based deployment methodology** — Aligns with BPMSoft 1.9's microservice architecture for email, notifications, and other subsystems

## Details

When attempting to configure email providers in BPMSoft 1.9 admin interface:
1. Navigate to email provider settings (e.g., Google Mail OAuth)
2. System checks: "Is ExchangeListenerService available?"
3. If microservice is not deployed → error message: "Email listener service not installed" or "No providers currently configured"
4. Configuration UI is blocked until prerequisite is satisfied

### Deployment Steps

To unblock email configuration:

1. **Locate microservice** — Find email listener service Docker image in BPMSoft 1.9 deployment package
   - Check deployment documentation for Docker Compose file reference
   - Microservice likely named `ExchangeListenerService` in Docker Compose config

2. **Deploy via Docker Compose** — Start the microservice:
   ```bash
   docker-compose up -d exchange-listener-service
   # or equivalent based on your Compose file structure
   ```

3. **Configure system setting** — In BPMSoft admin panel:
   - Navigate to System → Settings → Search for "ExchangeListenerServiceUri"
   - Set value to the microservice URI (e.g., `http://localhost:8080` for local Docker)
   - Save and apply

4. **Verify connectivity** — Use diagnostic interface:
   - Navigate to `/ClientApp/#/IntegrationDiagnostics/ExchangeListener`
   - Check connection status and service health
   - If green: microservice is reachable and operational

5. **Email provider configuration unlocked** — Once verified, email provider setup (OAuth, IMAP, Exchange) becomes available

### Architecture Implications

ExchangeListenerService handles:
- Email synchronization (polling mailboxes, downloading new emails)
- Mailbox state management
- Webhook/callback handling for email events (new message, reply, etc.)
- Integration with main BPMSoft application via REST API

The separation means:
- Main application doesn't directly access mailboxes — delegated to microservice
- Scalability: listener service can be deployed separately, multiple instances for high load
- Failure isolation: email sync issues don't crash main application
- Version independence: listener service may be versioned separately from main app

## Related Concepts

- [[concepts/google-mail-oauth2-integration]] — Google Mail OAuth configuration requires this microservice to be deployed first
- [[concepts/dev-access-read-only-protocol]] — Diagnosis of email integration issues may require read-only access to system configuration
- [[concepts/data-driven-system-analysis]] — Investigating email integration problems requires checking system setting values and microservice status

## Sources

- [[daily/2026-04-19.md]] — Session 14:15: User attempting Google Mail OAuth 2.0 setup discovered infrastructure blocker: email listener service not installed; investigation revealed BPMSoft 1.9 requires separate ExchangeListenerService microservice deployment; error message "no providers currently configured" indicates microservice unavailability; system setting `ExchangeListenerServiceUri` must point to deployed microservice; diagnostic interface available at `/ClientApp/#/IntegrationDiagnostics/ExchangeListener`
