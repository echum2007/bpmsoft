---
title: "Kestrel Restart Required After C# Class Deployment in BPMSoft"
aliases: [kestrel-restart, bpmsoft-restart, assembly-reload, class-deployment-restart]
tags: [bpmsoft, deployment, kestrel, dotnet, troubleshooting, infrastructure]
sources:
  - "daily/2026-04-21.md"
created: 2026-04-21
updated: 2026-04-21
---

# Kestrel Restart Required After C# Class Deployment in BPMSoft

When a new C# class or schema is published in BPMSoft 1.9, the Kestrel web server holds the **old compiled .NET assemblies in memory** and will not pick up the new class until the process is restarted. Symptoms include repeated publish failures and "class not found" errors even though the schema was saved successfully in the designer.

## Key Points

- **Root cause:** Kestrel (.NET 8 process) caches compiled assemblies in memory; publishing a new class does not force a reload
- **Restart command:** `sudo systemctl restart bpmsoft` on the Linux server (192.168.102.46)
- **When to apply:** Any time a new C# class is introduced (not just schema changes to existing classes)
- **Wait for startup:** After restart, wait for the system to fully initialize before attempting to publish or test the process
- **Symptom pattern:** Multiple publish attempts all fail with the same error → signals stale assembly cache, not a code bug

## Details

BPMSoft 1.9 runs on Kestrel (ASP.NET Core web server on .NET 8, Linux). When you publish a schema containing C# code in the BPMSoft designer, the platform compiles that code into a .NET assembly. However, if Kestrel is already running, it may hold a reference to the old version of that assembly in memory.

The result is that subsequent operations (e.g., running a BPMN process that calls the new C# class) fail because the runtime still resolves the old version — or cannot find the new class at all if it was just added. No amount of re-publishing or cache clearing in the BPMSoft UI resolves this; only a full service restart causes the .NET runtime to reload assemblies from disk.

### Diagnostic Signal

The tell-tale pattern: the same error repeats across multiple publish/test cycles without any change in behavior. If you have verified that the C# code is correct and the schema is properly saved, but the error persists across retries, a Kestrel restart is the next step before any further debugging.

### Restart Procedure

```bash
# SSH into dev server
ssh gore@192.168.102.46

# Restart BPMSoft (Kestrel)
sudo systemctl restart bpmsoft

# Optional: watch startup logs
sudo journalctl -u bpmsoft -f
```

After the service comes back up (typically 30–60 seconds), return to the BPMSoft UI and retry the operation. If the operation was a process publication, re-publish the process after the server is fully available.

### Scope: When Restart Is Needed vs. Not Needed

| Change type | Restart needed? |
|-------------|----------------|
| New C# class added to a schema | Yes |
| Existing C# method modified | Usually yes |
| BPMN process flow changes only (no C#) | No |
| System settings changes | No |
| JS AMD module changes | No |
| Data migration scripts | No |

## Related Concepts

- [[concepts/exchangelistenerservice-microservice-prerequisite]] — Another infrastructure service restart scenario; email listener microservice also requires explicit restart after configuration
- [[concepts/data-driven-system-analysis]] — When retrying fails repeatedly, query the system state rather than assuming it's a code issue; restart is a diagnostic step, not a blind fix
- [[concepts/feature-toggle-subprocess-execution]] — After restart, verify that toggles and process states are still as expected; restart clears in-memory state

## Sources

- [[daily/2026-04-21.md]] — Session 16:56: User repeatedly attempted to publish a process with a new C# class; same error persisted across retries; assistant identified root cause as Kestrel holding old compiled assemblies in memory; recommended `sudo systemctl restart bpmsoft` to force assembly reload
