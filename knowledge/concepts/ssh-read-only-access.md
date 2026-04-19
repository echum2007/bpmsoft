---
title: "SSH Access with Read-Only Permission Model"
aliases: [read-only-ssh, ssh-permissions, access-control, read-only-constraint]
tags: [security, ssh, access-control, permissions, deployment]
sources:
  - "daily/2026-04-18.md"
created: 2026-04-18
updated: 2026-04-18
---

# SSH Access with Read-Only Permission Model

When granting SSH access to a dev-server for investigation and diagnostics, a read-only permission model restricts the user to viewing configuration and logs without ability to make active changes. This approach allows safe exploration of system state while maintaining strict control over who can modify the system.

## Key Points

- **Read-only constraint:** User can execute `SELECT`/list commands, view logs and configuration, but cannot execute `INSERT`/`UPDATE`/`DELETE`/DDL or restart services
- **Explicit permission model:** Any active change requires explicit approval from the system owner (e.g., "only after you approve")
- **SSH shell limitations:** Can be enforced at the shell level (restricted shells like `rbash`) or at the application level (refusing write commands)
- **Audit trail:** All commands executed via SSH can be logged for security and compliance purposes
- **Dev-server context:** Safe way to allow investigation without risk of accidental or malicious data corruption

## Details

### Implementing Read-Only Access

Read-only SSH access can be implemented through several mechanisms:

**1. Shell-Level Restriction (rbash)**
```bash
# Set user's shell to restricted bash
chsh -s /bin/rbash username

# Create limited PATH with read-only commands
mkdir -p /home/username/bin
ln -s /bin/cat /home/username/bin/cat
ln -s /bin/grep /home/username/bin/grep
ln -s /bin/ls /home/username/bin/ls
ln -s /usr/bin/psql /home/username/bin/psql  # read-only mode: psql -c "SELECT ..."
```

**2. SSH Key Restrictions (authorized_keys)**
```
restrict,command="/usr/local/bin/readonly-shell" ssh-ed25519 AAAA... user@hostname
```
This forces any SSH connection using this key to execute a specific command (e.g., a readonly shell wrapper).

**3. Application-Level Enforcement**
- Database user with SELECT-only permissions (no INSERT/UPDATE/DELETE/DDL)
- File access restricted to read directories (no write to config files)
- Service restart commands denied or password-protected
- Monitoring and logging of all user actions

### Constraint: No Active Changes Without Permission

The key rule is explicit approval before any modifications:
- Investigation phase: "read all config, logs, and query database"
- Findings presented to system owner for approval
- Only after approval: "now I will modify X, deploy Y, restart Z"

This model prevents:
- Accidental modifications during investigation (typos in `rm` or `sed` commands)
- Unauthorized changes to production configuration
- Social engineering or privilege escalation

### Dev-Server Scenario (192.168.102.46)

For the Google Mail OAuth 2.0 investigation:
- User: `gore` (read-only)
- Capability: inspect current mail configuration, query database, review logs
- Restricted: modify configuration, restart services, change production settings
- Workflow: diagnose → report findings → request approval → apply changes (if approved)

## Related Concepts

- [[concepts/ed25519-ssh-authentication]] — Secure key type used to establish SSH connection with read-only constraints
- [[concepts/google-mail-oauth2-integration]] — Investigation of mail service requires read-only access to dev-server
- [[concepts/documentation-source-priority-bpmsoft]] — Related workflow: documentation source priority parallels read-only access hierarchy
- [[concepts/data-driven-system-analysis]] — Read-only investigation aligns with querying actual system state before making assumptions

## Sources

- [[daily/2026-04-18.md]] — Session 09:42: Read-only SSH access granted to dev-server 192.168.102.46 with explicit constraint: "no active changes without permission"; user must investigate before modifying production system
