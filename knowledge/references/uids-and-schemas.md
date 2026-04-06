# UId схем и объектов BPMSoft

## Пакеты

| Пакет | UId | Назначение |
|---|---|---|
| CTI | `21b087cf-bb70-cdc0-5180-6979fdd2220c` | Основной кастомный пакет |
| Custom | `a00051f4-cde3-4f3f-b08e-c5ad1a5c735a` | Устаревший, не использовать |

## Замещения объектов в CTI

| Схема | UId замещения CTI | Родитель UId |
|---|---|---|
| Case | `19cc53cb-28eb-4288-bd79-cea46e02bff4` | `117d32f9-8275-4534-8411-1c66115ce9cd` |
| ServicePact | `46e84fce-9ad8-4b09-8407-281cbb4cb824` | `595ddbda-31ce-4cca-9bdd-862257ceaf23` |

## Замещения UI-схем в CTI

| Схема | UId замещения CTI |
|---|---|
| CasePage | `17fc86cf-3425-49a8-ba13-840c514bf34d` |
| ServicePactPage | `f7a41e49-b2a3-4f00-a31d-da14efe43756` |

## Замещения в пакете Custom (legacy — не трогать без необходимости)

| Схема | UId (Custom) | Родитель UId |
|---|---|---|
| ServiceItem | `28a81597-c657-455e-9435-ef9205d41978` | `c6c44f0a-193e-4b5c-b35e-220a60c06898` |
| ConfItem | `c17ff71a-16e5-461e-b32f-744e604f2b8d` | `ad707075-cf25-40bf-85c1-f5da38cf0d5d` |
| ServicePact (Custom) | `5862134f-e2b6-42a5-a751-d99f32994117` | `595ddbda-31ce-4cca-9bdd-862257ceaf23` |
| UsrConfIteminService | `64368e91-8b4b-452e-9918-3506e77e2dcf` | `38f6f236-32b5-4739-985c-fcac7bfac87e` |

## Guid из базы данных тестовой системы

| Константа | Guid | Источник |
|---|---|---|
| ActivityType "Email" | `e2831dec-cfc0-df11-b00f-001d60e938c6` | Таблица ActivityType |
| MessageType "Исходящее" | `7f6d3f94-f36b-1410-068c-20cf30b39373` | Таблица Activity (DISTINCT MessageTypeId) |
| Входящие письма | `Guid.Empty` (NULL) | MessageTypeId = NULL у входящих |

## Ключевые пакеты системы (только чтение)

| Пакет | Роль |
|---|---|
| CaseService | Базовые BPMN-процессы уведомлений, EmailWithMacrosManager, AsyncEmailSender |
| IntegrationV2 | IEmailClient → EmailClient (SMTP/IMAP) |
| Exchange | ExchangeClient (MS Exchange) |
| NUI | Основной UI |
| Case | Базовая схема обращения |
| ServiceModel | Angular-компонент сервисной модели |
