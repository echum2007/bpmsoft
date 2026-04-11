# Email Notification System Architecture — Research Results

**Date:** 2026-04-11  
**Source:** Automated code analysis of `src/PKG_BPMSoft_Full_House_1.9.0.14114/` (system packages v1.9)

---

## 1. Notification Flow: Trigger → Template → Macros → Send

```
Case status change (BPMN signal or EntityEventListener)
   ↓
BPMN Process (SendNotificationToCaseOwner / SendEmailToSROwner / SendEmailToCaseStatusChangedProcess)
   ↓
CaseNotificationRule → selects EmailTemplate by status
   ↓
EmailWithMacrosManager.SendEmail(caseId, templateId)
   ↓
BaseEmailWithMacrosManager.GetTemplateBody() → reads EmailTemplate from DB
   ↓
MacrosProcessor.GetTextTemplate() → resolves [#Case.Number#], [#Case.Subject#], etc.
   ↓
Creates Activity (Type=Email) → EventListeners can modify (e.g., CC injection)
   ↓
AsyncEmailSender → IEmailClient → SMTP/Exchange
```

---

## 2. Core Classes

### BaseEmailWithMacrosManager

**File:** `src/PKG_BPMSoft_Full_House_1.9.0.14114/CaseService/Schemas/BaseEmailWithMacrosManager/BaseEmailWithMacrosManager.cs`

Abstract base class. Key methods:

- `GetTemplate(Guid id)` — loads EmailTemplate entity by ID (with caching)
- `GetTemplateByRecordId(templateId, recordId, schemaName)` — multi-language template loading via `MLangContentFactory`
- `GetTemplateBody(schemaName, recordId, tplId)` — reads template Body, applies `CaseTimeZoneMacrosConverter`, runs `ApplyReplacements()`, then resolves macros via `MacrosProcessor.GetTextTemplate()`
- `GetTemplateSubject(schemaName, recordId, tplId)` — same for Subject
- `CreateActivity()` — creates Activity entity with defaults: Type=Email, MessageType=Outgoing, Status=InProgress, adds `Auto-Submitted: auto-replied` header
- `SendActivity(Guid id)` — sends via `EmailClientFactory` → `ActivityEmailSender`
- `ApplyReplacements(string source)` — applies `ReplacementMap` for backward compatibility

Template entity schema name depends on feature flag:
- `EmailMessageMultiLanguage` OFF → `"EmailTemplate"`
- `EmailMessageMultiLanguage` ON → `"EmailTemplateLang"`

### EmailWithMacrosManager (extends BaseEmailWithMacrosManager\<InvokableMacrosHelper\>)

**File:** `src/PKG_BPMSoft_Full_House_1.9.0.14114/CaseService/Schemas/EmailWithMacrosManager/EmailWithMacrosManager.cs`

Works specifically with Case entity (`SchemaName = "Case"`).

**CaseData struct** — container for case notification data:
- `ContactId`, `InitiatorId`, `CategoryId`
- `ContactEmail`, `InitiatorEmail`
- `Recipient`, `CC`, `BCC`
- `Title` (from ParentActivity)
- `ParentActivityId`, `ParentActivitySender`, `ParentActivityRecipient`
- `ParentActivityInReplyTo` (for email threading)

**ReplacementMap initialization:**
```csharp
ReplacementMap = new Dictionary<string, string> {
    { "#EstimatePic#", "[#@Invoke.EstimateLinksGenerator#]" },
    { "[#Symptoms#]",  "[#@Invoke.SymptomsGenerator#]" }
};
```

**Key methods:**

- `GetCaseData(caseId, isSendInitiator)` — ESQ query loading Case with:
  - `Contact.Id`, `Contact.Email`, `Initiator.Id`, `Initiator.Email`
  - `Category.Id`
  - `ParentActivity.Id`, `.Title`, `.Sender`, `.Recepient`, `.CopyRecepient`, `.BlindCopyRecepient`
  - `IsNotifyContact`, `IsNotifyInitiator`
  - Respects `AutoNotifyOnlyContact` system setting
  - Respects `SendOnlyToContactEmail` feature flag
  - Respects `CasesOnlyRespondToSender` feature flag

- `FillActivityWithCaseData(activity, data)` — sets Title, Recepient, CopyRecepient, BlindCopyRecepient, In-Reply-To header

- `PreProcess(activity, caseId, tplId)` — sets `activity.Body` from template, binds to case

- `SendEmail(caseId, tplId, isSendInitiator)` — main orchestrator:
  1. `CreateActivity()`
  2. `PreProcess()` — template body
  3. `GetCaseData()` — recipients
  4. `GetSender()` — via `EmailSenderObtainerWrapper`
  5. `FillActivityWithCaseData()` — fill fields
  6. `FillTitle()` — subject from template or RE: prefix
  7. `activity.Save()`
  8. `SendActivity()`

- Also has: `SendEmailFrom()`, `SendEmailTo()`, `SendEmailFromTo()` — variants with explicit sender/recipient

### ExtendedEmailWithMacrosManager (extends EmailWithMacrosManager)

**File:** `src/PKG_BPMSoft_Full_House_1.9.0.14114/CaseService/Schemas/ExtendedEmailWithMacrosManager/ExtendedEmailWithMacrosManager.cs`

**KEY FINDING:** This class adds parent activity body as a quoted reply footer.

```csharp
public class ExtendedEmailWithMacrosManager : EmailWithMacrosManager
{
    public EmailFooterSupplier EmailFooterSupplier { get; set; }

    protected override void FillActivityWithCaseData(Activity activity, CaseData data) {
        base.FillActivityWithCaseData(activity, data);
        var replyPart = GetReplyPartFromParentActivity(data.ParentActivityId);
        activity.Body = activity.Body + replyPart;  // ← APPENDS PARENT EMAIL BODY
    }

    protected virtual string GetReplyPartFromParentActivity(Guid activityId) {
        return EmailFooterSupplier.GetFooter(activityId);
    }
}
```

### EmailFooterSupplier

**File:** `src/PKG_BPMSoft_Full_House_1.9.0.14114/CaseService/Schemas/EmailFooterSupplier/EmailFooterSupplier.cs`

Formats parent Activity as a quoted reply with HR separator:

```html
<br><div><hr>
<span style='font-weight: bold;'>From:</span><span>{sender}</span><br>
<span style='font-weight: bold;'>Sent on:</span><span>{date}</span><br>
<span style='font-weight: bold;'>To:</span><span>{recipient}</span><br>
<span style='font-weight: bold;'>Cc:</span><span>{cc}</span><br>
<span style='font-weight: bold;'>Subject:</span><span>{subject}</span><br>
<div>{body}
```

Methods:
- `GetFooter(activityId)` — loads Activity by ID, formats as reply
- `GetActivityData(activityId)` — ESQ: Body, Sender, StartDate, Recepient, CopyRecepient, Title, IsHtmlBody
- `GenerateReply(activity)` — picks HTML/PlainText template, calls `GenerateReplyBody()`

**Note:** Captions are hardcoded in English ("From", "Sent on", "To", "Cc", "Subject"). Not localized.

### AsyncEmailSender

**File:** `src/PKG_BPMSoft_Full_House_1.9.0.14114/CaseService/Schemas/AsyncEmailSender/AsyncEmailSender.cs`

Used when feature `UseAsyncEmailSender` is enabled. Wraps actual SMTP/Exchange sending.

---

## 3. Email Template System

### Storage

Templates stored in DB table `EmailTemplate` (or `EmailTemplateLang` for multi-language).

Template entity columns:
- `Name` — template name
- `Subject` — email subject with macros
- `Body` — HTML email body with macros
- `IsHtmlBody` — boolean
- `Object` — linked entity schema (typically Case)
- `Recipient` — recipient type lookup
- `SaveAsActivity` — whether to save as activity
- `ShowBeforeSending` — UI flag
- `LanguageId`, `LanguageCode` — for multi-language

### Template Data Examples

Found in: `src/PKG_BPMSoft_Full_House_1.9.0.14114/CaseService/Data/EmailTemplate_*/`

Example templates:
- `EmailTemplate_CaseRegistrationForInitiator` — sent to initiator on case registration
- `EmailTemplate_CaseNotification` — generic case notification
- Various status-specific templates

### CaseNotificationRule

Entity (lookup table) mapping Case status → EmailTemplate:
- `CaseStatus` (Guid) — which status triggers
- `EmailTemplate` (Guid) — which template to use
- `IsEnabled` — on/off flag

This is configured through BPMSoft UI: lookup "Case notification rules".

---

## 4. Macros System

### Macro Syntax

- **Column path macros:** `[#ColumnName#]` or `[#Entity.Column.SubColumn#]`
- **Invokable macros:** `[#@Invoke.ClassName#]` — calls a C# class implementing `IMacrosInvokable`

### Macro Processing Chain

```
InvokableMacrosHelper (extends GlobalMacrosHelper, extends MacrosHelperV2)
   ↓
GetTextTemplate(body, schemaName, recordId)
   ↓
For each [#...#] in template:
  - Regular macros → ESQ query to get column value from entity
  - @Invoke macros → InvokeMethodMacrosWorker → reflection → IMacrosInvokable.GetMacrosValue()
```

### InvokableMacrosHelper

**File:** `src/PKG_BPMSoft_Full_House_1.9.0.14114/CaseService/Schemas/InvokableMacrosHelper/InvokableMacrosHelper.cs`

Extends `GlobalMacrosHelper`. Detects invokable macros by checking `macrosInfo.ParentId == _macrosWorkerId` (GUID `16339F82-6FF0-4C75-B20D-13F07A79F854`).

### InvokeMethodMacrosWorker

**File:** `src/PKG_BPMSoft_Full_House_1.9.0.14114/CaseService/Schemas/InvokeMethodMacrosWorker/InvokeMethodMacrosWorker.cs`

Uses reflection to instantiate handler class. Handler must implement `IMacrosInvokable`.
Arguments: `KeyValuePair<string, Guid>(entityName, recordId)`.

### Existing Invokable Macros

**SymptomsGenerator:**
- **File:** `src/PKG_BPMSoft_Full_House_1.9.0.14114/CaseService/Schemas/SymptomsGenerator/SymptomsGenerator.cs`
- Implements `IMacrosInvokable`
- Retrieves `Case.Symptoms`, converts newlines to `<br/>`, returns formatted text
- Used in templates as `[#Symptoms#]` (mapped via ReplacementMap to `[#@Invoke.SymptomsGenerator#]`)

**EstimateLinksGenerator:**
- **File:** `src/PKG_BPMSoft_Full_House_1.9.0.14114/CaseService/Schemas/EstimateLinksGenerator/EstimateLinksGenerator.cs`
- Generates satisfaction estimate links with icons
- Used as `#EstimatePic#` (mapped to `[#@Invoke.EstimateLinksGenerator#]`)

### Available Macros in Case Templates

Direct field macros:
- `[#Number#]` — Case number
- `[#Subject#]` — Case subject
- `[#Description#]` — Case description
- `[#RegisteredOn#]` — Registration date (timezone-aware)
- `[#SolutionDate#]` — Planned solution date
- `[#ResponseDate#]` — Planned response date

Related entity macros:
- `[#Initiator.Name#]`, `[#Initiator.Email#]`
- `[#Contact.Name#]`, `[#Contact.Email#]`
- `[#Owner.Name#]`, `[#Owner.Email#]`
- `[#Category.Name#]`
- `[#Status.Name#]`
- `[#Priority.Name#]`
- `[#ServicePact.Name#]`
- `[#Contact.Account.Name#]`

Invokable macros:
- `[#@Invoke.SymptomsGenerator#]` (aliased as `[#Symptoms#]`)
- `[#@Invoke.EstimateLinksGenerator#]` (aliased as `#EstimatePic#`)

Date/time macros processed by `CaseTimeZoneMacrosConverter`.

---

## 5. Case ↔ Activity (Email) Relationship

### Case Entity Key Fields

- `ParentActivity` (Guid) — link to the root email activity that created the case
- `Contact` (Guid) — customer contact
- `Initiator` (Guid) — user who initiated
- `Owner` (Guid) — current assignee
- `Group` (Guid) — assignee group
- `IsNotifyContact` (bool) — notify customer flag
- `IsNotifyInitiator` (bool) — notify initiator flag

### Activity Entity Key Fields

- `Body` — email content (HTML/plain text)
- `Title` — email subject
- `Sender` — From address
- `Recepient` — To address
- `CopyRecepient` — CC addresses (note typo: "Recepient")
- `BlindCopyRecepient` — BCC addresses
- `CaseId` (Guid) — FK back to Case
- `Type` — Activity type (Email = `E2831DEC-CFC0-DF11-B00F-001D60E938C6`)
- `MessageType` — Incoming/Outgoing (`7f6d3f94-f36b-1410-068c-20cf30b39373` = Outgoing)
- `IsHtmlBody` — boolean
- `HeaderProperties` — email headers including In-Reply-To for threading
- `IsAutoSubmitted` — flag for auto-generated notifications (hidden if feature `HideAutoEmailNotifications` is on)

### EmailMessageData Entity

Links emails to Activities with threading info:
- `Activity` (Guid)
- `MessageId` — email Message-ID header
- `InReplyTo` — In-Reply-To header
- `Headers` — full email headers
- `ParentMessage` — reference to parent EmailMessageData
- `SendDate`, `Owner`
- `ConversationId` — for conversation grouping

### Incoming Email Linking

**CaseMessageListener:**
- **File:** `src/PKG_BPMSoft_Full_House_1.9.0.14114/CaseService/Schemas/CaseMessageListener/CaseMessageListener.cs`
- Listens for new messages on Cases
- When customer replies via email, system creates Activity with CaseId
- Triggers `CasePortalMessageMultiLanguageProcess`
- `CaseMessageHistory` tracks all messages per case

### How to Query Latest Customer Email for a Case

```csharp
var esq = new EntitySchemaQuery(userConnection.EntitySchemaManager, "Activity");
esq.AddColumn("Body");
esq.AddColumn("Sender");
esq.AddColumn("StartDate");
esq.AddColumn("Title");
esq.Filters.Add(esq.CreateFilterWithParameters(
    FilterComparisonType.Equal, "Case", caseId));
esq.Filters.Add(esq.CreateFilterWithParameters(
    FilterComparisonType.Equal, "Type", EmailActivityTypeId));
// Incoming emails: MessageType != Outgoing or check Sender != support mailbox
var orderColumn = esq.AddColumn("StartDate");
orderColumn.OrderByDesc();
var collection = esq.GetEntityCollection(userConnection);
if (collection.Count > 0) {
    var latestEmail = collection[0];
    string body = latestEmail.GetTypedColumnValue<string>("Body");
    // ... use body
}
```

---

## 6. BPMN Notification Processes

### SendNotificationToCaseOwner

**File:** `src/PKG_BPMSoft_Full_House_1.9.0.14114/CaseService/Schemas/SendNotificationToCaseOwner/`
- Manager: `ProcessSchemaManager` (BPMN process, no .cs file — logic in metadata JSON)
- UId: `53d09a3b-5a42-48cd-bd0c-f36c9a389625`
- Parameters include `ActivityId`
- Uses `BPMSoft.Configuration` namespace
- Likely contains Script Task elements that call `EmailWithMacrosManager`

### SendEmailToCaseStatusChangedProcess

**File:** `src/PKG_BPMSoft_Full_House_1.9.0.14114/CaseService/Schemas/SendEmailToCaseStatusChangedProcess/`
- UId: `22405112-0a8c-4444-870f-deb07a0f7277`
- Uses `BPMSoft.Core.Factories` and `BPMSoft.Configuration`
- Likely orchestrates status-change-triggered notifications

### CTI Custom Processes

**UsrSendNotificationToCaseOwnerCustom1:**
- UId: `2769a020-a622-498f-a15d-a9449e30dd16`
- Package: CTI (`B6 = 21b087cf-bb70-cdc0-5180-6979fdd2220c`)
- Caption: "Переоткрытие обращения и отправка email сообщения ответственному о новом комментарии"
- Same structure as parent: ProcessSchemaManager, same usings

**UsrSendEmailToSROwnerCustom1:**
- Located in CTI package
- Custom email sending helper

---

## 7. Important System Settings & Feature Flags

| Setting/Feature | Effect on Notifications |
|----------------|------------------------|
| `AutoNotifyOnlyContact` | If true, sends only to Contact email, clears CC/BCC |
| `SendOnlyToContactEmail` | If true, sends only to Contact/Initiator, ignores other recipients |
| `CasesOnlyRespondToSender` | If true, clears CC/BCC from parent activity |
| `UseAsyncEmailSender` | If true, uses `AsyncEmailSender` instead of synchronous send |
| `HideAutoEmailNotifications` | If true, auto-submitted emails are hidden in UI |
| `EmailMessageMultiLanguage` | Switches template table from `EmailTemplate` to `EmailTemplateLang` |
| `EmailMessageMultiLanguageV2` | Uses `MLangContentFactory` for language-aware templates |
| `UseMacrosAdditionalParameters` | Enables additional macro parameters (LanguageId) |

---

## 8. File Paths Reference

### Core Email Management
```
CaseService/Schemas/BaseEmailWithMacrosManager/BaseEmailWithMacrosManager.cs
CaseService/Schemas/EmailWithMacrosManager/EmailWithMacrosManager.cs
CaseService/Schemas/ExtendedEmailWithMacrosManager/ExtendedEmailWithMacrosManager.cs
CaseService/Schemas/EmailFooterSupplier/EmailFooterSupplier.cs
CaseService/Schemas/AsyncEmailSender/AsyncEmailSender.cs
CaseService/Schemas/EmailSenderObtainerWrapper/ (support mailbox resolution)
CaseService/Schemas/IncindentRegistrationMailboxFilter/ (incident mailbox filtering)
```

### Macro System
```
CaseService/Schemas/InvokableMacrosHelper/InvokableMacrosHelper.cs
CaseService/Schemas/InvokeMethodMacrosWorker/InvokeMethodMacrosWorker.cs
CaseService/Schemas/SymptomsGenerator/SymptomsGenerator.cs
CaseService/Schemas/EstimateLinksGenerator/EstimateLinksGenerator.cs
Base/Schemas/MacrosHelper/ (base macro processing)
```

### Notification Processes
```
CaseService/Schemas/SendNotificationToCaseOwner/ (BPMN)
CaseService/Schemas/SendEmailToSROwner/ (BPMN)
CaseService/Schemas/SendEmailToCaseStatusChangedProcess/ (BPMN)
CaseService/Schemas/CaseNotificationRule/ (status → template mapping entity)
CaseService/Schemas/CaseNotificationRuleEditPage/ (UI for editing rules)
```

### Message History
```
CaseService/Schemas/CaseMessageListener/CaseMessageListener.cs
CaseService/Schemas/CaseMessageHistory/ (message feed on case page)
Base/Resources/EmailMessageData.Entity/ (email threading metadata)
```

### Template Data
```
CaseService/Data/EmailTemplate_CaseRegistrationForInitiator/
CaseService/Data/EmailTemplate_*/ (various template definitions)
Base/Resources/EmailTemplateMacros.Entity/ (macro registry)
```

All paths relative to `src/PKG_BPMSoft_Full_House_1.9.0.14114/`.
