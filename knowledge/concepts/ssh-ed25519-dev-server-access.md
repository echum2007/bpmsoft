---
title: "SSH Key Provisioning: ED25519 Instead of Password Auth"
aliases: [ssh-ed25519, dev-server-access, secure-dev-access]
tags: [bpmsoft, devops, security, ssh, development-workflow]
sources:
  - "daily/2026-04-18.md"
created: 2026-04-18
updated: 2026-04-18
---

# SSH Key Provisioning: ED25519 Instead of Password Auth

When provisioning SSH access to BPMSoft development servers, generate ED25519 keys instead of accepting password authentication. ED25519 provides stronger cryptographic security, is more resistant to brute-force attacks, and is the modern standard for SSH key exchange in infrastructure access.

## Key Points

- **Use ED25519 for new SSH keys** — stronger algorithm than RSA, more resistant to cryptanalysis
- **Avoid password-based auth** — password transmission and storage introduce risk; keys are more secure
- **Generate keys locally, not on server** — keys belong in your local `~/.ssh/` directory with restricted permissions (600)
- **Document the key provisioning process** — when granting dev-server access, provide key generation instructions, not password instructions
- **Read-only access by default** — restrict permissions until changes are explicitly approved (applies to all dev environments, not just SSH)

## Details

Password authentication to development servers creates several security liabilities:
- Passwords can be intercepted during transmission (even over SSH, they're just transmitted as regular data)
- Passwords are stored in history logs, shell RC files, and system logs
- Password-based systems encourage users to reuse passwords across systems

ED25519 key-based authentication eliminates these risks:
- The private key never leaves your machine (stays in `~/.ssh/id_ed25519`)
- Public key is uploaded to the server and cannot be reversed to recover the private key
- SSH protocol uses cryptographic proof of key possession, not password transmission

### Development Access Workflow

When granted access to a BPMSoft dev server (e.g., 192.168.102.46 for testing integration):
1. Generate ED25519 key: `ssh-keygen -t ed25519 -f ~/.ssh/id_bpmsoft_dev -C "your-identifier"`
2. Share the **public key only** (`id_bpmsoft_dev.pub`) with the infrastructure team
3. Confirm key-based access works before closing password-based access
4. Operate under **read-only access by default** — request permission before making changes

This applies to all development environments accessing BPMSoft systems, whether for mail service diagnosis, database queries, or infrastructure troubleshooting.

## Related Concepts

- [[concepts/dev-access-read-only-protocol]] — Always request permission before active changes
- [[concepts/google-mail-oauth2-bpmsoft-integration]] — Example of dev-server access for mail service investigation
- [[concepts/tool-availability-verification]] — Check available tools before proposing alternatives

## Sources

- [[daily/2026-04-18.md]] — Session 09:42: User provided SSH access (192.168.102.46) for mail service investigation; recommended ED25519 instead of password auth; reinforced read-only access constraint
