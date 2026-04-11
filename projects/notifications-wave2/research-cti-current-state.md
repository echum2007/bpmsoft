# CTI Package — Current Notification Customizations

**Date:** 2026-04-11  
**Source:** Analysis of `src/CTI/CTI/Schemas/` and `projects/cc-notifications/`

---

## 1. All Schemas in CTI Package (51 total)

### Notification-Related Schemas

| Schema | Type | Purpose |
|--------|------|---------|
| `UsrCcAddressResolver` | Source Code (C#) | Resolves CC email addresses for case notifications |
| `UsrCaseEmailNotificationEventListener` | Source Code (C#) | EventListener on Activity — injects CC addresses |
| `UsrSendNotificationToCaseOwnerCustom1` | BPMN Process | Custom: reopens case + sends email to assignee about new comment |
| `UsrSendEmailToSROwnerCustom1` | BPMN Process | Custom email sending helper for SR owner |
| `UsrService_Send_Telegram_Notification` | BPMN Process | Telegram notification (prepared, status unclear) |

### Case-Related Schemas

| Schema | Type | UId |
|--------|------|-----|
| `Case` | Replacement entity | `19cc53cb-28eb-4288-bd79-cea46e02bff4` |
| `CasePage` | Client module (JS) | `17fc86cf-3425-49a8-ba13-840c514bf34d` |
| `CaseSection` | Client module (JS) | — |
| `CaseCategory` | Entity | — |
| `CaseInFolder` | Entity | — |
| `UsrCaseCaseCustom1` | Case customization | — |

### Service-Related Schemas

| Schema | Type | UId |
|--------|------|-----|
| `ServicePact` | Replacement entity | `46e84fce-9ad8-4b09-8407-281cbb4cb824` |
| `ServicePactPage` | Client module (JS) | `f7a41e49-b2a3-4f00-a31d-da14efe43756` |
| `ServicePactSection` | Client module (JS) | — |
| `ServiceItem` | Entity | — |
| `ServiceItemPage` | Client module (JS) | — |
| `ServiceInServicePact` | Entity | — |
| `ConfItem` | Entity | — |
| `ConfItemPage` | Client module (JS) | — |

### Asset Catalog & Custom Schemas

- `UsrConfItemCatalog`, `UsrConfItemCatalogFile`, `UsrConfItemCatalogFolder`, `UsrConfItemCatalogInFolder`, `UsrConfItemCatalogInTag`, `UsrConfItemCatalogTag`
- `UsrAssetCategory`, `UsrAssetModel`
- `UsrContractType`
- `UsrLaborRecords`
- `UsrVendorList`

### Portal Schemas

- `PortalCasePage`, `PortalCaseSection`

---

## 2. CC Notifications Implementation (Deployed to Prod 2026-04-11)

### Architecture

```
Incoming/Outgoing email Activity linked to Case
   ↓
UsrCaseEmailNotificationEventListener.OnInserting()
   ↓
Check: Type = Email? CaseId != Empty? EmailSendStatus set (outgoing)?
   ↓
UsrCcAddressResolver.GetCcAddresses(caseId)
   ↓
Sources:
  1. ServicePact.UsrCCEmailAddresses (custom 500-char field)
  2. Case.Contact.Account → AccountCommunication (email type)
   ↓
Merge with existing Activity.CopyRecepient (deduplicate)
   ↓
Set Activity.CopyRecepient = merged CC list
```

### UsrCcAddressResolver

**File:** `src/CTI/CTI/Schemas/UsrCcAddressResolver/UsrCcAddressResolver.cs`

```csharp
public class UsrCcAddressResolver
{
    public List<string> GetCcAddresses(Guid caseId)
    {
        // 1. Read ServicePact.UsrCCEmailAddresses via Case
        // 2. Read Account email communications via Case.Contact.Account
        // 3. Split by ;/,  filter by @ sign
        // 4. Return distinct list
    }
}
```

CC Sources:
1. `ServicePact.UsrCCEmailAddresses` — semicolon-separated emails on service contract
2. `AccountCommunication` — email-type communications linked to the case contact's account (CommunicationType = `EE1C85C3-CFCB-DF11-9B2A-001D60E938C6`)

### UsrCaseEmailNotificationEventListener

**File:** `src/CTI/CTI/Schemas/UsrCaseEmailNotificationEventListener/UsrCaseEmailNotificationEventListener.cs`

```csharp
[EntityEventListener(SchemaName = "Activity")]
public class UsrCaseEmailNotificationEventListener : BaseEntityEventListener
{
    public override void OnInserting(object sender, EntityBeforeEventArgs e)
    {
        // Filters: Type=Email, CaseId not empty, EmailSendStatus set (outgoing only)
        // Resolves CC via UsrCcAddressResolver
        // Merges with existing CopyRecepient (deduplication, case-insensitive)
        // Sets Activity.CopyRecepient
        // Error handling: logs but doesn't prevent email sending
    }
}
```

Key constants:
- `EmailActivityTypeId = E2831DEC-CFC0-DF11-B00F-001D60E938C6`
- Log category: `"UsrCaseEmailNotification"`

### Custom DB Columns (deployed via UI, not in filesystem)

| Object | Column | Type | Purpose |
|--------|--------|------|---------|
| `Case` | `UsrCcEmails` | Text (500) | CC addresses on case |
| `ServicePact` | `UsrCCEmailAddresses` | Text (500) | Default CC for contract |

### JavaScript Validation (in production, may not be in filesystem)

CasePage and ServicePactPage have email validation methods:
- `setValidationConfig()` — registers CC field validator
- `validateCcEmails()` — regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, handles `<email>` format, splits by space/semicolon/comma

---

## 3. Custom BPMN Processes

### UsrSendNotificationToCaseOwnerCustom1

- **UId:** `2769a020-a622-498f-a15d-a9449e30dd16`
- **Package:** CTI (`21b087cf-bb70-cdc0-5180-6979fdd2220c`)
- **Purpose:** "Переоткрытие обращения и отправка email сообщения ответственному о новом комментарии"
- **Type:** ProcessSchemaManager (BPMN visual process)
- **Parameters:** includes `ActivityId`
- **Usings:** BPMSoft.Core.Entities, BPMSoft.Core.DB, System.Text, BPMSoft.Configuration
- **Note:** Logic is in BPMN metadata (visual designer), not in .cs file

### UsrSendEmailToSROwnerCustom1

- **Type:** ProcessSchemaManager (BPMN visual process)
- **Purpose:** Custom email sending to SR owner

### UsrService_Send_Telegram_Notification

- **Type:** ProcessSchemaManager (BPMN visual process)
- **Purpose:** Telegram notification channel (prepared/prototype)

---

## 4. Known Issues & Fixes (from CC implementation)

1. **CC triplication bug** — Fixed by using `MergeAddresses()` with deduplication instead of simple concatenation
2. **Email format handling** — Added `NormalizeEmailToken()` to handle `<email@domain.com>` and Display Names
3. **Validation split characters** — Changed regex from `/[;,]/` to `/[\s;,]+/` to handle space-delimited addresses
4. **Merge separator** — Changed from space to `"; "` (semicolon + space) for storage format
5. **JS method placement** — Methods MUST be inside `methods: { ... }` block, not outside
6. **Localization issue** — Full code replacement through Configuration resets button labels to English; use section master instead

---

## 5. What Notification Customizations Are NOT Yet Done

- No email body/text of customer reply included in notifications
- No SLA threshold notifications
- No "observer/watcher" subscription mechanism
- No "stale case" reminders for long-waiting cases
- No status change notifications beyond the custom "reopened + new comment" process
- Telegram notification schema exists but unclear if functional
- Email templates are in DB only, not version-controlled in CTI package
