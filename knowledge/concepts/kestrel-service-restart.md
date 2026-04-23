---
title: "Kestrel Service Restart After C# Deployment in BPMSoft"
aliases: [kestrel-restart, bpmsoft-restart, systemd-bpmsoft, service-restart]
tags: [bpmsoft, deployment, kestrel, systemd, troubleshooting, devops]
sources:
  - "daily/2026-04-21.md"
created: 2026-04-21
updated: 2026-04-21
---

# Kestrel Service Restart After C# Deployment in BPMSoft

When a new C# class or schema is published to BPMSoft but the server doesn't pick it up (errors like "class not found" persist after publishing), the root cause is that **Kestrel holds compiled assemblies in memory**. The fix is a full service restart, which forces the process to reload and recompile from the updated package files.

## Key Points

- **systemd service name:** `bpmsoft` — not `kestrel`, not `bpmsoft-kestrel`
- **Restart command:** `sudo systemctl restart bpmsoft` (on dev-server 192.168.102.46)
- **When needed:** After publishing new C# code (EventListener, Helper, macros, etc.) when errors persist despite successful publish
- **Root cause:** Kestrel keeps compiled .NET assemblies in memory; new class definitions are not hot-reloaded
- **Wait after restart:** Allow the system to fully start up before retrying the failing operation

## Details

BPMSoft 1.9 runs on Kestrel (.NET 8 HTTP server) managed by systemd on Linux. When schemas containing C# code are published via the BPMSoft UI, the platform writes the updated source files to disk but the running process still holds the old compiled assemblies in its in-memory cache.

This creates a frustrating failure mode: a schema publishes successfully, no UI errors are shown, but at runtime the system behaves as if the new code doesn't exist. Repeated attempts to publish or recompile from the UI don't help because the blocking is at the process level, not the file level.

The solution is a full service restart:

```bash
ssh gore@192.168.102.46
sudo systemctl restart bpmsoft
```

After the restart, wait for Kestrel to fully initialize (watch the log or test the UI responsiveness), then retry the failing operation. The new assemblies will be loaded from the updated files.

### When to Suspect Kestrel Caching

- Published a new C# class (EventListener, Helper, macro generator, etc.)
- UI publish shows "success" but errors persist at runtime
- Error messages reference a class or method that exists in the source but system can't find it
- Multiple retries from UI make no difference

### Checking Service Status

```bash
sudo systemctl status bpmsoft
```

Expected output when healthy:
```
● bpmsoft.service - BPMSoft Application
   Active: active (running)
```

If the service fails to restart, check logs:
```bash
sudo journalctl -u bpmsoft -n 50
```

## Related Concepts

- [[concepts/dev-access-read-only-protocol]] — Restarting a service is an active change; requires user permission in read-only access context
- [[concepts/exchangelistenerservice-microservice-prerequisite]] — Related infrastructure: ExchangeListenerService is a separate microservice, also managed via Docker but distinct from the main bpmsoft systemd service
- [[concepts/data-driven-system-analysis]] — Before restarting, verify the issue is actually a caching problem (check logs, confirm publish succeeded)

## Sources

- [[daily/2026-04-21.md]] — Session 16:56: User encountered persistent error after publishing new C# code; multiple retry attempts did not help; assistant recommended `sudo systemctl restart bpmsoft` on dev-server because Kestrel holds old compiled assemblies in memory; service name confirmed as `bpmsoft`
