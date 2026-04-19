---
title: "IMacrosInvokable Pattern: Email Macro Generator Implementation in BPMSoft"
aliases: [imacrosinvokable, macro-generator, email-macros, bpmsoft-pattern, c-sharp-pattern]
tags: [bpmsoft, c-sharp, email, macros, pattern, notifications]
sources:
  - "daily/2026-04-19.md"
created: 2026-04-19
updated: 2026-04-19
---

# IMacrosInvokable Pattern: Email Macro Generator Implementation in BPMSoft

When implementing custom email macros in BPMSoft (e.g., inserting dynamic content like "latest customer reply" or "case status") the correct pattern is to implement the `IMacrosInvokable` interface. The implementation requires a specific method signature: `GetMacrosValue(object arguments)` that receives and unpacks a `KeyValuePair<string, Guid>` argument, not a tuple or string. Registration happens via `EmailTemplateMacros` table, linking the C# class to the email template system.

## Key Points

- **Interface:** `IMacrosInvokable` with single method `GetMacrosValue(object arguments)`
- **Argument type:** `KeyValuePair<string, Guid>` — must be exactly this type, not a tuple or string
- **Unpacking pattern:** Cast `arguments` to `KeyValuePair<string, Guid>`, then extract `Value` (the Guid) for business logic
- **Registration:** Create entry in `EmailTemplateMacros` table with `ColumnPath` pointing to C# class namespace
- **Return type:** String (HTML or plain text) — the macro's expanded value
- **Example class:** `UsrLatestCustomerEmailGenerator` implements this pattern to return the latest incoming email from a case

## Details

### Correct Implementation Signature

```csharp
public class UsrLatestCustomerEmailGenerator : IMacrosInvokable
{
    public string GetMacrosValue(object arguments)
    {
        // Unpack KeyValuePair<string, Guid>
        var pair = (KeyValuePair<string, Guid>)arguments;
        Guid caseId = pair.Value;  // Extract the Guid (case ID)
        string macroName = pair.Key;  // Extract the name (macro identifier)
        
        // Business logic: fetch latest customer email for this case
        // Return the email body as HTML string
        return emailBodyHtml;
    }
}
```

### Common Mistake: Wrong Argument Type

Developers sometimes attempt:
```csharp
// ❌ WRONG: Expecting string argument
public string GetMacrosValue(object arguments)
{
    string caseId = (string)arguments;  // Cast fails at runtime
    // ...
}

// ❌ WRONG: Expecting Tuple
public string GetMacrosValue(object arguments)
{
    var (key, value) = ((string, Guid))arguments;  // Cast fails
    // ...
}
```

These attempts fail because the BPMSoft macro invocation system always passes a `KeyValuePair<string, Guid>`. If the cast fails, the macro returns null or throws an exception, and the email template field remains empty.

### Registration in EmailTemplateMacros

After implementing `IMacrosInvokable`, register the macro:

1. **In database:** Create entry in `EmailTemplateMacros` table
   - `ParentId` — reference to the email template (e.g., `16339f82`)
   - `ColumnPath` — fully qualified C# class name (e.g., `BPMSoft.Configuration.UsrLatestCustomerEmailGenerator`)
   - `Name` — macro identifier used in template (e.g., `[#LatestCustomerEmail#]`)

2. **In email template:** Use the macro identifier
   - Template text: `"Customer Reply: [#LatestCustomerEmail#]"`
   - When template is rendered, macro invocation system:
     1. Finds `LatestCustomerEmail` in `EmailTemplateMacros`
     2. Gets `ColumnPath` → `UsrLatestCustomerEmailGenerator`
     3. Instantiates class via `ClassFactory.Get<IMacrosInvokable>("BPMSoft.Configuration.UsrLatestCustomerEmailGenerator")`
     4. Calls `GetMacrosValue(new KeyValuePair<string, Guid>("LatestCustomerEmail", caseId))`
     5. Replaces `[#LatestCustomerEmail#]` with returned string in email body

### Example: UsrLatestCustomerEmailGenerator

For Wave 2 notification task (include customer reply in email to engineer):

```csharp
public class UsrLatestCustomerEmailGenerator : IMacrosInvokable
{
    public string GetMacrosValue(object arguments)
    {
        var pair = (KeyValuePair<string, Guid>)arguments;
        Guid caseId = pair.Value;
        
        // Query for latest incoming email activity
        var query = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "Activity");
        query.AddColumn("Body");
        query.AddFilter("CaseId", FilterComparisonType.Equal, caseId);
        query.AddFilter("Type", FilterComparisonType.Equal, new Guid("19c33b60-..."));  // Email type
        query.AddFilter("Direction", FilterComparisonType.Equal, 1);  // Incoming
        query.OrderByColumn("CreatedOn", OrderDirection.Descending);
        query.RowCount = 1;
        
        var result = query.GetEntityCollection(UserConnection);
        if (result.Count == 0) {
            return string.Empty;
        }
        
        Entity activity = result[0];
        string emailBody = activity.GetBytesValue("Body").ToString(Encoding.UTF8);
        return emailBody;  // Return as HTML or plain text
    }
}
```

## Related Concepts

- [[concepts/lazy-property-pattern-service-initialization]] — Service initialization pattern that often accompanies macro generators (e.g., lazy-loading `EmailWithMacrosManager`)
- [[concepts/data-driven-system-analysis]] — Finding correct patterns requires querying system: `EmailTemplateMacros` table, existing macro implementations
- [[concepts/feature-toggle-subprocess-execution]] — Macros are often combined with conditional process logic (when to invoke macro generator)

## Sources

- [[daily/2026-04-19.md]] — Session 14:16: Implemented Wave 2 task 2.3 email macro generator `UsrLatestCustomerEmailGenerator` using `IMacrosInvokable` pattern; confirmed correct signature is `GetMacrosValue(object arguments)` where `arguments` is `KeyValuePair<string, Guid>` (not tuple or string); registration via `EmailTemplateMacros` table with `ColumnPath` pointing to class namespace; pattern discovered from examining existing macro implementations in BPMSoft; mistake of wrong argument type leads to silent macro failure (field remains empty in rendered email)
