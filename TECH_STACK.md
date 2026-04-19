# BPMSoft 1.9 Technology Stack

## Платформа

- **BPMSoft 1.9**, .NET 8, Kestrel (Linux), PostgreSQL, Redis
- **Кастомный пакет:** `CTI` (UId: `21b087cf-bb70-cdc0-5180-6979fdd2220c`) — **все доработки только сюда**
- Пакет `Custom` — legacy, не использовать (там старые замещения ServiceItem, ConfItem)
- Префикс пользовательских объектов: `Usr` (сис. настройка `SchemaNamePrefix`)
- Namespace C#: `BPMSoft.Configuration`

## Актуальные UId замещений в CTI

| Схема | UId в CTI | Родитель UId |
|-------|-----------|-------------|
| Case | `19cc53cb-28eb-4288-bd79-cea46e02bff4` | `117d32f9-8275-4534-8411-1c66115ce9cd` |
| ServicePact | `46e84fce-9ad8-4b09-8407-281cbb4cb824` | `595ddbda-31ce-4cca-9bdd-862257ceaf23` |
| CasePage | `17fc86cf-3425-49a8-ba13-840c514bf34d` | — |
| ServicePactPage | `f7a41e49-b2a3-4f00-a31d-da14efe43756` | — |

Полный список → `knowledge/references/uids-and-schemas.md`

## Ключевые системные пакеты

| Пакет | Роль |
|-------|------|
| CaseService | Базовые BPMN уведомлений: `SendEmailToSROwner`, `SendNotificationToCaseOwner`, `AsyncEmailSender`, `EmailWithMacrosManager` |
| IntegrationV2 | `IEmailClient` → `EmailClient` (SMTP/IMAP) |
| Exchange | `ExchangeClient` (MS Exchange) |
| Case | Базовая схема обращения |
| SLMITILService | SLA-расчёт: `CaseTermCalculationManager`, `TimeToPrioritize` |

## Технологический стек

| Слой | Технология |
|------|-----------|
| Backend | C# / .NET 8 |
| ORM | `EntitySchemaQuery`, `Entity`, `Select/Insert/Update/Delete` |
| DI/IoC | `ClassFactory`, `[DefaultBinding]`, `ConstructorArgument` |
| Entity Events | `[EntityEventListener(SchemaName = "...")]` |
| Email | `IEmailClient` → `EmailClient` / `ExchangeClient`. Поле CC в Activity: `CopyRecepient` (с опечаткой) |
| Frontend | ExtJS + AMD/RequireJS, Angular + Angular Elements (с 1.9) |
| Процессы | BPMN через `ProcessEngineService` |
| БД | PostgreSQL |
