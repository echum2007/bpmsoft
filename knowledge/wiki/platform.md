# Платформа BPMSoft — Стек и архитектура

**Обновлено:** 2026-04-15  
**Источники:** BPMSOFT_CONFIGURATION_ANALYSIS_3.md, architecture-packages.md, документация 1.9

---

## Технологический стек

| Слой | Технология |
|---|---|
| Backend | C# / .NET 8, Kestrel (Linux) |
| ORM | `EntitySchemaQuery`, `Entity`, `Select/Insert/Update/Delete` |
| DI/IoC | `ClassFactory`, `[DefaultBinding]`, `ConstructorArgument` |
| Entity Events | `[EntityEventListener(SchemaName = "...")]` |
| Email | `IEmailClient` → `EmailClient` (SMTP) / `ExchangeClient` (Exchange) |
| Frontend | ExtJS + AMD/RequireJS (классика), Angular + Angular Elements (с 1.9) |
| Процессы | BPMN через `ProcessEngineService` |
| БД | PostgreSQL |
| Кэш | Redis |
| Namespace C# | `BPMSoft.Configuration` |
| Prefix новых схем | `Usr` (сис. настройка `SchemaNamePrefix`) |

---

## Пакеты системы

### Кастомные пакеты проекта

| Пакет | UId | Роль |
|---|---|---|
| **CTI** | `21b087cf-bb70-cdc0-5180-6979fdd2220c` | **Основной** — все доработки только сюда |
| Custom | `a00051f4-cde3-4f3f-b08e-c5ad1a5c735a` | Legacy, не использовать |

**Иерархия:** Базовые пакеты → ... → Custom → CTI (CTI наследует всё через зависимости)

Custom содержит несколько записей по ошибке системы. В нормальных условиях не должен использоваться.

### Ключевые системные пакеты (только чтение)

| Пакет | Роль |
|---|---|
| **CaseService** | Базовые BPMN уведомлений (`SendEmailToSROwner`, `SendNotificationToCaseOwner`, `AsyncEmailSender`), `EmailWithMacrosManager` |
| **IntegrationV2** | `IEmailClient` → `EmailClient` (SMTP/IMAP), `EmailRepository`, `EmailService` |
| **Exchange** | `ExchangeClient` (MS Exchange), `ExchangeEmailMessage` |
| **Case** | Базовая схема обращения |
| **SLM** | SLA-архитектура |
| **SLMITILService** | `CaseTermCalculationManager`, `TimeToPrioritize` |
| **ServiceModel** | Angular-компонент сервисной модели |
| **NUI** | Основной UI |

### Остальные пакеты (для справки)

UIv2, DesignerTools, PivotTable, OmnichannelMessaging, ubsgate, CampaignDesigner, Base, Platform, HomePage, MobileWebView, OpenIdAuth, SspWorkplace, Workplace, Deduplication, RelationshipDesigner, Tracking, ServiceDesigner, AnalyticsDashboard, CoreForecast, ContentBuilder, MarketingCampaign.

---

## Архитектура расчёта SLA

```
CaseTermCalculationManager
  → ITILCaseCalculationParameterReader
    → CaseTermCalculateEntryPoint
      → CaseTermIntervalSelector
        → CaseTermStrategyQueue (справочник DeadlineCalcSchemas)
          → каскад стратегий:
              PriorityServiceSLA → PriorityAndSLA → ServiceInServicePact → PriorityInSupportLevel
```

**Каскад выбора календаря:** ServiceInServicePact → ServicePact → ServiceItem → сис.настройка

**Текущий сервис в системе:** один — «Техподдержка». Консультации всегда 8×5.

---

## Архитектура Email

### Цепочка отправки

```
BPMN-процесс
  → AddDataUserTask (создаёт Activity с полями To/Cc/Bcc)
  → ScriptTask (вызывает ActivityEmailSender.Send(activityId))
    → ActivityEmailSender читает Activity из БД
    → EmailClientFactory → IEmailClient
      → EmailClient.Send(emailMessage)  /  ExchangeClient.Send()
```

### Ключевые нюансы Email

- Поле CC в таблице Activity: `CopyRecepient` (именно так, с опечаткой — без 'i')
- `ActivityEmailSender` — платформенная сборка (dll), исходников нет. Читает `CopyRecepient` из БД
- `EmailWithMacrosManager.FillActivityWithCaseData()` — виртуальный метод, точка переопределения CC
- Системная настройка `AutoNotifyOnlyContact = false` — CC не обнуляется ✅
- Feature-toggles `EmailMessageMultiLanguage` / `EmailMessageMultiLanguageV2` — **оба выключены**, мультиязычный путь не активен

### Два пути отправки (важно для задач)

| Путь | Когда активен | CC |
|---|---|---|
| Старый BPMN: `ScriptTask → ActivityEmailSender` | Всегда (feature-toggle выключен) | CC из `Activity.CopyRecepient` |
| Новый мультиязычный: `SendMultiLanguageNotification → EmailWithMacrosManager` | Если `EmailMessageMultiLanguage` включён | CC из `ParentActivity.CopyRecepient` |

---

## Рекомендуемый порядок внедрения

| Шаг | Артефакт | Действие |
|---|---|---|
| 1 | Объекты/колонки | UI: дизайнер объекта → **Опубликовать** |
| 2 | Поля на страницах | Мастер раздела → **Сохранить** |
| 3 | C# сервисы | Конфигурация → Исходный код → **Опубликовать** |
| 4 | EventListener | Исходный код → Опубликовать → **⚠️ перезапуск Kestrel** |
| 5 | BPMN-процессы | Дизайнер процессов |
| 6 | Экспорт CTI | Перенос на прод |

---

## Формат бинарных пакетов BPMSoft (.gz)

Формат (не tar/zip — кастомный):
```
[4 байта LE = длина имени в UTF-16 code units]
[имя UTF-16LE]
[4 байта LE = длина контента]
[контент]
```
Парсер: см. CLAUDE.md раздел «Чтение бинарного архива CTI».

---

## Структура пакета (файловая система)

```
Pkg/CTI/
├── descriptor.json
├── Schemas/
│   ├── MyEntity/
│   │   ├── descriptor.json
│   │   ├── metadata.json
│   │   └── properties.json
│   ├── MyService/
│   │   ├── descriptor.json
│   │   └── MyService.cs
│   └── MyPageV2/
│       ├── descriptor.json
│       └── MyPageV2.js
├── SqlScripts/
├── Data/
└── Resources/
```
