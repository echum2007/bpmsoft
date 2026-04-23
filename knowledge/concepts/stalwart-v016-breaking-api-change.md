---
title: "Stalwart v0.16 Breaking Change: Management REST API Removed, Replaced by Undocumented JMAP"
aliases: [stalwart-v016, stalwart-api-migration, jmap-management-api, stalwart-breaking-change]
tags: [mail-server, stalwart, jmap, api, breaking-change, docker, infrastructure]
sources:
  - "daily/2026-04-23.md"
created: 2026-04-23
updated: 2026-04-23
---

# Stalwart v0.16 Breaking Change: Management REST API Removed, Replaced by Undocumented JMAP

Stalwart Mail Server v0.16 introduced a silent breaking change: the entire Management REST API (previously accessible via `/api/principal` and similar endpoints) was removed and replaced by a JMAP-based management protocol. At the time of this writing, no official documentation exists for the new JMAP management API. Additionally, the web administration panel is broken in v0.16 due to a PKCE authentication bug. This combination makes v0.16 effectively unusable for production or testing setups that require programmatic mailbox management.

## Key Points

- **Management REST API removed** — Endpoints like `/api/principal` return 404 in v0.16; no migration path or docs provided
- **JMAP is the replacement** — JMAP protocol is used for management in v0.16, but only POST requests work; GET returns 404
- **No documentation** — stalw.art/docs covers pre-0.16 versions; JMAP management API has no official docs ("docs always come at the end")
- **Web panel broken** — Admin web interface fails due to a PKCE authentication bug in v0.16
- **SMTP/IMAP still work** — Ports 25, 143, 587 are functional; only the management layer is broken
- **Recovery token found but insufficient** — `accountId: "p333333333333"` discoverable via JMAP session endpoint, but doesn't unlock management functions

## Details

### What Broke in v0.16

The Management REST API was a stable interface in pre-0.16 versions, used to create mailboxes, manage users, and configure the mail server programmatically. This API was completely removed in v0.16 as part of a migration to JMAP (JSON Meta Application Protocol) for all management operations.

The immediate symptoms:
- All `/api/` endpoints return 404
- `stalwart-cli` cannot connect to management endpoint
- RECOVERY_ADMIN token grants no additional access
- Web panel login fails (PKCE bug in the OAuth 2.0 flow used by the admin interface)
- The JMAP session endpoint at `/jmap/` works only via POST, not GET

### JMAP as Management Protocol

JMAP (RFC 8620) was designed as an email synchronization protocol, not a management protocol. In v0.16, Stalwart extended JMAP for administrative operations, but this is entirely custom territory without published documentation. Key findings:

- JMAP session discovery: POST to `/jmap/` returns session info including `accountId: "p333333333333"`
- JMAP method calls presumably work for some operations, but the method names and parameters are undocumented
- The official Stalwart documentation (stalw.art/docs) covers the REST Management API that no longer exists in v0.16

### Decision: Abandon Stalwart v0.16

After spending significant time trying to make v0.16 work, the decision was made to abandon it:
- No documentation exists for the new management API
- Web panel is unusable
- Time cost of reverse-engineering JMAP management is prohibitive
- Better alternatives exist (docker-mailserver uses proven Postfix+Dovecot stack with CLI management)

**Alternative chosen: docker-mailserver** (Postfix + Dovecot)
- Proven, widely-used stack
- SMTP + IMAP working
- Management via CLI commands (no web panel dependency)
- Full setup instructions ready in `knowledge/wiki/projects/mailserver-setup.md` (Вариант 1)

### Cleanup Before Switching

Before deploying docker-mailserver:
```bash
# Remove Stalwart installation
docker compose down -v  # run in ~/stalwart-mail directory
```

## Related Concepts

- [[concepts/software-adoption-documentation-check]] — Lesson from this incident: verify documentation maturity before adopting new software versions
- [[concepts/tool-availability-verification]] — Related principle: check available tools and their documentation before investing time in a solution
- [[concepts/dev-access-read-only-protocol]] — Investigation was conducted on dev-server with read-only constraints

## Sources

- [[daily/2026-04-23.md]] — Session 11:52: Spent significant time debugging Stalwart v0.16 management API; discovered REST API was removed and replaced by undocumented JMAP; web panel broken due to PKCE bug; SMTP/IMAP ports (25, 143, 587) functional but management layer unusable; decided to abandon Stalwart v0.16 and switch to docker-mailserver
