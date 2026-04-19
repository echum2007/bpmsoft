---
title: "Lazy Property Pattern: Service Initialization in BPMSoft C#"
aliases: [lazy-property, lazy-initialization, service-pattern, classFactory, dependency-injection, bpmsoft-pattern]
tags: [bpmsoft, c-sharp, design-pattern, services, dependency-injection, performance]
sources:
  - "daily/2026-04-19.md"
created: 2026-04-19
updated: 2026-04-19
---

# Lazy Property Pattern: Service Initialization in BPMSoft C#

In BPMSoft's C# codebase, the standard pattern for accessing services (like `EmailWithMacrosManager`) is to use **lazy property initialization**: fetch the service in a property getter using `ClassFactory.Get<T>()` rather than instantiating in the constructor or as a class field. This pattern delays service creation until first use, avoids constructor coupling, and aligns with BPMSoft's dependency injection container architecture.

## Key Points

- **Service fetching goes in property getter** — Not in constructor, not as class field
- **Pattern:** `private T _service; public T Service { get { return _service ?? (_service = ClassFactory.Get<T>(...)); } }`
- **Or modern syntax:** `private T _service => _service ?? (_service = ClassFactory.Get<T>(...));` (C# 6+)
- **ClassFactory.Get<T>()** — BPMSoft's DI container; resolves service implementations from registered types
- **Avoids constructor coupling** — Services are resolved on-demand, not required at construction time
- **Matches BPMSoft conventions** — Used consistently across platform for features like notifications, email, tasks
- **Example:** `EmailWithMacrosManager` lazy property for notification processes

## Details

### Why Lazy Initialization?

In traditional OOP, services are fetched in constructor:

```csharp
// ❌ Not the BPMSoft pattern
public class UsrSendEmailToCaseOwnerOnReply
{
    private EmailWithMacrosManager _emailManager;
    
    public UsrSendEmailToCaseOwnerOnReply()
    {
        // Constructor coupling: service MUST be resolved at construction time
        _emailManager = ClassFactory.Get<EmailWithMacrosManager>(...);
    }
}
```

Problems with constructor injection:
- If `ClassFactory` is unavailable during construction, the entire class fails to instantiate
- Tests must mock `ClassFactory` early in test setup
- Service is created even if never used in this execution path
- Constructor becomes a bottleneck for dependency resolution

### Lazy Property Pattern

Instead, defer service resolution to first use:

```csharp
// ✅ BPMSoft pattern: lazy property
public class UsrSendEmailToCaseOwnerOnReply
{
    private EmailWithMacrosManager _emailManager;
    
    private EmailWithMacrosManager EmailManager
    {
        get
        {
            if (_emailManager == null)
            {
                _emailManager = ClassFactory.Get<EmailWithMacrosManager>("UsrEmailWithMacrosManager");
            }
            return _emailManager;
        }
    }
    
    public void SendEmail(Guid caseId)
    {
        // EmailManager fetched here on first use
        string emailBody = EmailManager.GetEmailText(caseId);
    }
}
```

Or in modern C# (6+) with expression-bodied members:

```csharp
// ✅ Modern syntax (C# 6+)
public class UsrSendEmailToCaseOwnerOnReply
{
    private EmailWithMacrosManager _emailManager;
    
    private EmailWithMacrosManager EmailManager
    {
        get => _emailManager ?? (_emailManager = ClassFactory.Get<EmailWithMacrosManager>(...));
    }
}
```

### Benefits

1. **Delayed instantiation** — Service is only created if actually used in this execution path
2. **Constructor simplicity** — Class constructor remains lightweight; no dependency resolution happening there
3. **Testability** — Tests can bypass lazy property and inject a mock directly; no constructor stubbing required
4. **Alignment with BPMSoft architecture** — All platform services follow this pattern; consistency across codebase
5. **Performance** — Unnecessary service instantiation is avoided; resources freed for frequently-unused services

### When NOT to Use Lazy Property

Use lazy properties for:
- Heavy services (database connections, HTTP clients, large managers)
- Services that are conditionally used
- Services that require complex initialization
- Services in libraries (reduce coupling)

Use constructor injection for:
- Small, lightweight services
- Core dependencies always used
- When you want to fail fast if dependencies missing

For BPMSoft notification classes (`UsrSendEmailToCaseOwnerOnReply`, email macro generators, etc.), lazy property is the convention.

## Related Concepts

- [[concepts/imacrosinvokable-pattern-bpmsoft]] — Macro generators often pair with lazy-initialized `EmailWithMacrosManager`
- [[concepts/data-driven-system-analysis]] — Understanding patterns requires examining existing implementations; `ClassFactory` usage is a reliable indicator of lazy property pattern
- [[concepts/feature-toggle-subprocess-execution]] — Services may be conditionally called based on toggles; lazy initialization suits conditional execution paths

## Sources

- [[daily/2026-04-19.md]] — Session 14:16: Implemented `UsrSendEmailToCaseOwnerOnReply` class for Wave 2 task 2.3; confirmed BPMSoft pattern for service initialization is lazy property (ClassFactory.Get in property getter, not in constructor); pattern mirrors `SendEmailToCaseOnStatusChange` existing implementation; aligns with platform conventions for email and notification services
