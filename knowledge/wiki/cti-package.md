# Пакет CTI — Метаданные и схемы

**Обновлено:** 2026-04-15  
**Источники:** BPMSOFT_CONFIGURATION_ANALYSIS_3.md, uids-and-schemas.md, архив CTI с прода 2026-04-11

> ⚠️ Этот файл — метаданные о CTI, не код. Актуальный код — в архиве `src/CTI_2026-04-11_15.14.44/CTI/CTI`.

---

## Идентификация пакета

| Параметр | Значение |
|---|---|
| UId | `21b087cf-bb70-cdc0-5180-6979fdd2220c` |
| Maintainer | Customer |
| BPMSoftVersion | 1.9.0 |
| Актуальный экспорт с прода | `src/CTI_2026-04-11_15.14.44/CTI/CTI` (2026-04-11) |

---

## UId замещений объектов

### Сущности (EntitySchema)

| Схема | UId в CTI | Родитель UId | Тип |
|---|---|---|---|
| Case | `19cc53cb-28eb-4288-bd79-cea46e02bff4` | `117d32f9-8275-4534-8411-1c66115ce9cd` | ExtendParent |
| ServicePact | `46e84fce-9ad8-4b09-8407-281cbb4cb824` | `595ddbda-31ce-4cca-9bdd-862257ceaf23` | ExtendParent |
| ServiceItem | есть | `c6c44f0a-193e-4b5c-b35e-220a60c06898` | ExtendParent |
| ConfItem | есть | `ad707075-cf25-40bf-85c1-f5da38cf0d5d` | ExtendParent |
| CaseCategory | есть | — | EntitySchema |
| CaseInFolder | есть | — | EntitySchema |
| ServiceInServicePact | есть | — | EntitySchema |
| UsrConfIteminService | есть | `38f6f236-32b5-4739-985c-fcac7bfac87e` | EntitySchema |

### Новые сущности в CTI

| Схема | Назначение |
|---|---|
| UsrConfItemCatalog | Каталог конфигурационных единиц |
| UsrLaborRecords | Трудозатраты |
| UsrContractType | Тип контракта |
| UsrVendorList | Список вендоров |

### UI-схемы (ClientUnitSchema)

| Схема | UId в CTI | Описание |
|---|---|---|
| **CasePage** | `17fc86cf-3425-49a8-ba13-840c514bf34d` | Замещение страницы обращения |
| **ServicePactPage** | `f7a41e49-b2a3-4f00-a31d-da14efe43756` | Замещение страницы сервисного договора |
| CaseSection | есть | Замещение раздела обращений |
| PortalCasePage | есть | Портальная страница обращения |
| PortalCaseSection | есть | Портальный раздел обращений |
| ServiceItemPage | есть | Страница сервиса |
| ServicePactSection | есть | Раздел сервисных договоров |
| ServiceItemSection | есть | Раздел сервисов |
| ConfItemPage | есть | Страница КЕ |
| ConfItemSection | есть | Раздел КЕ |
| ServiceInServicePactDetail | есть | Деталь сервисов в договоре |
| UsrLaborRecords...Page | есть | Страница трудозатрат |
| UsrConfItemCatalog...Page/Section | есть | Страница и раздел каталога КЕ |

---

## BPMN-процессы уведомлений в CTI

| Процесс | UId | Назначение | Родитель |
|---|---|---|---|
| UsrSendEmailToSROwnerCustom1 | `7477f83b-2d61-4541-843d-2d6444bbcd42` | Email ответственному при назначении | `77b64dfc-...` (SendEmailToSROwner) |
| UsrSendNotificationToCaseOwnerCustom1 | `2769a020-a622-498f-a15d-a9449e30dd16` | Push-уведомление + перестановка Activity | `53d09a3b-...` (SendNotificationToCaseOwner) |
| UsrProcess_send_reg_mail | `265d4466-a887-461c-906f-79f16ce9f059` | Email о регистрации обращения | — |
| UsrProcess_0c71a12 | есть | Кастомный процесс (серия CTI1-CTI5) | — |
| UsrProcess_a5f980e | есть | Кастомный процесс | — |

### Базовые процессы уведомлений (пакет CaseService)

| Процесс | UId | CC применим |
|---|---|---|
| SendEmailToSROwner | `77b64dfc-5e59-42e8-baa6-a231f1fdd698` | ✅ |
| SendEmailToCaseGroup | есть | ✅ |
| RunSendEmailToCaseGroupV2 | есть | ✅ |
| SendEmailToCaseContactPersonsProcess | есть | ✅ |
| SendEmailToCaseStatusChangedProcess | есть | ✅ |
| SendResolution | есть | ✅ |
| SendNotificationToCaseOwner | есть | ❌ (это push, не email) |

---

## Другие схемы в CTI

| Схема | Тип | Назначение |
|---|---|---|
| UsrService_Send_Telegram_Notification | ServiceSchemaManager | REST-интеграция с Telegram API |
| UsrEmployeeNotificationManager | SourceCode (C#) | Менеджер уведомлений инженерам (волна 2) |
| UsrActivityCcEventListener | SourceCode (C#) | EventListener: CC-адреса в email (на проде 2026-04-11) |
| UsrCcAddressResolver | SourceCode (C#) | Резолвер CC-адресов (на проде 2026-04-11) |

---

## UId пакета Custom (legacy — не трогать)

| Схема | UId (Custom) | Примечание |
|---|---|---|
| ServiceItem | `28a81597-c657-455e-9435-ef9205d41978` | Дублирует CTI по ошибке |
| ConfItem | `c17ff71a-16e5-461e-b32f-744e604f2b8d` | Дублирует CTI по ошибке |
| ServicePact | `5862134f-e2b6-42a5-a751-d99f32994117` | Дублирует CTI по ошибке |
| UsrConfIteminService | `64368e91-8b4b-452e-9918-3506e77e2dcf` | Дублирует CTI по ошибке |

Custom зависит от CTI → его замещения применяются ПОВЕРХ CTI. Рекомендация: перенести в CTI и очистить Custom.

---

## Архитектурные решения

### CC-адреса в уведомлениях (реализовано 2026-04-11)

**Решение:** EntityEventListener на Activity (`UsrActivityCcEventListener`) перехватывает `OnSaving` для исходящих email-активностей и дописывает CC из полей `Case.UsrCcEmails` и `ServicePact.UsrCcEmails`.

**Обоснование:** Покрывает все пути отправки (старый BPMN + мультиязычный если включат). Один компонент вместо модификации каждого BPMN отдельно.

**Поля для хранения CC:** текстовые (`varchar 500`), адреса через пробел — как стандартное `Activity.CopyRecepient`.

### Индикатор режима обслуживания (реализовано 2026-04-11)

Детали: `wiki/projects/service-mode-indicator.md`

### UsrEmployeeNotificationManager (в разработке, волна 2)

Детали: `wiki/projects/notifications-wave2.md`
