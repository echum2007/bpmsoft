---
title: "Software Adoption: Verify Documentation Maturity Before Investing in a New Version"
aliases: [documentation-check, software-version-check, pre-adoption-checklist, docs-before-upgrade]
tags: [methodology, documentation, software-adoption, best-practices, risk-management]
sources:
  - "daily/2026-04-23.md"
created: 2026-04-23
updated: 2026-04-23
---

# Software Adoption: Verify Documentation Maturity Before Investing in a New Version

When evaluating a new tool, library, or a major version upgrade, checking the software's functionality is not sufficient — the documentation must also be verified to be current, complete, and matching the target version. A tool that works but lacks documentation for its management API is effectively unusable in a production or testing context. Skipping this check is a common way to lose significant time to a dead end.

## Key Points

- **Check docs version match** — Verify that official documentation covers the **exact version** you intend to deploy, not a previous version
- **Verify documentation completeness** — Check that the management/admin API (not just core functionality) is documented
- **New releases often lag on docs** — Major version bumps frequently ship without updated documentation ("docs always come at the end")
- **Verify at time of adoption decision** — Not after deployment; the check takes minutes, discovering the gap after hours of debugging costs much more
- **If no docs: treat as not ready** — A tool without documentation for its primary management interface is not production-ready, regardless of how the changelog describes it

## Details

### The Pattern: Working Core, Missing Management Docs

A common failure mode in software adoption is that the core functionality of a new version works (data flows, services start, connections succeed), but the management/administration layer has changed incompatibly and lacks documentation. This leads to a false sense of progress:

- Tests pass: "the service is running"
- Connections work: "SMTP/IMAP on ports 25/143/587 respond"
- But: you cannot create mailboxes, configure users, or manage the system

At this point, the true cost of missing documentation becomes apparent. Workarounds like reverse-engineering API endpoints, reading source code, or searching for community examples are time-consuming and fragile.

### Incident: Stalwart v0.16

The [[concepts/stalwart-v016-breaking-api-change]] incident is a clear example:
- Stalwart v0.16 changed the management API from REST to JMAP
- The stalw.art/docs website still covers the old REST API (pre-0.16)
- No documentation exists for JMAP management API in v0.16
- The web admin panel was also broken (PKCE bug)
- **Time lost**: Several hours debugging endpoints that no longer exist
- **Correct action**: Check docs version match before starting; if docs don't cover v0.16 management, don't deploy v0.16

### Pre-Adoption Checklist

Before deploying a new software version:

1. **Identify the official documentation URL**
2. **Verify documentation version** — Does the docs site show the same version you're deploying? (Look for version selectors, changelogs, or explicit version tags)
3. **Check management/admin API coverage** — Is the administrative interface (mailbox creation, user management, API authentication) documented?
4. **Check for known breaking changes** — Read the changelog between current version and new version; flag any "removed" or "changed" API entries
5. **Check issue tracker/community** — Search for reports of broken documentation or major API changes in the target version
6. **Verify UI functionality** — If there's an admin web panel, verify it works in the target version before committing to the upgrade

If any of these checks fails: **treat the version as not ready** and fall back to the last documented, stable version.

### When to Apply This Check

- Upgrading to a major or minor version bump of infrastructure software (mail servers, databases, reverse proxies)
- Adopting a new open-source tool for the first time (especially recently-released versions)
- Migrating to a new release that has "significant refactoring" or "architecture changes" in its changelog

This is especially important for infrastructure components (mail servers, authentication systems, logging pipelines) where the management interface is the primary interaction point.

## Related Concepts

- [[concepts/stalwart-v016-breaking-api-change]] — The incident that generated this lesson; detailed technical breakdown of what broke and why
- [[concepts/tool-availability-verification]] — Related principle: check what tools are available and functional before proposing solutions
- [[concepts/documentation-source-priority-bpmsoft]] — Parallel principle: documentation source priority matters; for infrastructure tools as much as for BPMSoft platform

## Sources

- [[daily/2026-04-23.md]] — Session 11:52: Lesson explicitly drawn: "Перед использованием нового ПО проверять не только версию, но и наличие актуальной документации" (Before using new software, check not only the version but also the availability of up-to-date documentation); derived from Stalwart v0.16 incident where REST Management API was removed and JMAP replacement had no documentation
