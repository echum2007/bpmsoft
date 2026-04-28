# Платформа BPMSoft — Стек и архитектура

**Обновлено:** 2026-04-18  
**Источники:** BPMSOFT_CONFIGURATION_ANALYSIS_3.md, architecture-packages.md, документация 1.9, выгрузка из БД mordor 2026-04-17

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
| Custom | `a00051f4-cde3-4f3f-b08e-c5ad1a5c735a` | Legacy, новые доработки не вносить |

**Иерархия:** Базовые пакеты → ... → Custom → CTI (CTI наследует всё через зависимости)

Custom содержит несколько схем-дублей (ServiceItem, ConfItem, ServicePact, UsrConfIteminService), попавших туда по ошибке — они применяются ПОВЕРХ CTI. Чистка запланирована, не срочно. Подробнее: `wiki/cti-package.md`, раздел «UId пакета Custom».

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

> **Принцип SLA vs Категория:** строгость контроля определяется SLA, а не категорией обращения. Категория (`CaseCategory`: Инцидент/Запрос) влияет на шаблоны и маршрутизацию, но не на расчёт сроков. Не использовать категорию как фильтр для уведомлений о просрочке — ошибочная классификация при регистрации создаёт слепую зону. Все эскалации привязываются строго к расчётным показателям SLA.

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
- Feature-toggle `EmailMessageMultiLanguageV2` — **включён (=1)** на проде; `UsrSendEmailToSROwnerCustom1` использует путь B (`SendMultiLanguageNotification`). Данные из БД mordor 2026-04-17.

### Два пути отправки (важно для задач)

| Путь | Когда активен | CC |
|---|---|---|
| Старый BPMN: `ScriptTask → ActivityEmailSender` | Для процессов без мультиязычного пути (`RunSendEmailToCaseGroupV2`, `UsrProcess_0c71a12CTI5`) | CC из `Activity.CopyRecepient` |
| Новый мультиязычный: `SendMultiLanguageNotification → EmailWithMacrosManager` | **Активен** (`EmailMessageMultiLanguageV2=1` на проде). Использует `UsrSendEmailToSROwnerCustom1` | CC из `ParentActivity.CopyRecepient` |

---

## Двухслойная архитектура кода

BPMSoft 1.9 имеет два отдельных слоя кода:

| Слой | Расположение | Содержимое | Как искать |
|---|---|---|---|
| **Core framework** | `/opt/bpmsoft/*.dll` | .NET runtime, HTTP pipeline, ORM-инфраструктура, ClassFactory | `grep -a` по `.dll` |
| **Configuration** | `PKG_BPMSoft_Full_House/*/Schemas/` | Бизнес-логика: SLA, уведомления, календари, обработчики событий | `grep -r` по `.cs` |

**Практическое следствие:** поиск API только в DLL недостаточен — большинство бизнес-API живёт в схемах конфигурационных пакетов. Отсутствие в DLL ≠ отсутствие в платформе.

```bash
# Пример: IsTimeInWorkingInterval не найдена в 457 DLL → нашлась в схеме
grep -ra "IsTimeInWorkingInterval" /opt/bpmsoft/*.dll   # 0 результатов
grep -r  "IsTimeInWorkingInterval" PKG_BPMSoft_Full_House_1.9.0.14114/
# → SLM/Schemas/TermCalculatorActions/TermCalculatorActions.cs:109
```

### API рабочего времени / календаря

Правильный API в BPMSoft 1.9 — `TermCalculatorActions` в пакете **SLM** (не в core DLL):

| | |
|---|---|
| **Метод** | `IsTimeInWorkingInterval(DateTime) → bool` |
| **Файл** | `SLM/Schemas/TermCalculatorActions/TermCalculatorActions.cs` |
| **Цепочка CalendarId** | `ServiceInServicePact.CalendarId → ServicePact.CalendarId → base.GetCalendarId()` |

> ⚠️ **Не существуют в BPMSoft 1.9:** `ICalendarRepository`, `IsWorkTime()`, `ClassFactory.Get<ICalendarRepository>()` — эти API есть в Creatio, но отсутствуют в 1.9. NotebookLM может вернуть их по ошибке — всегда верифицировать в коде.

---

## Матрица перезапуска Kestrel

| Тип изменений | Перезапуск | Примечание |
|---|---|---|
| Схемы «Исходный код» (C#) | **Да** | Компиляция сборок и загрузка в домен приложения |
| EntityEventListener | **Да** | Регистрация слушателей событий происходит строго при старте |
| Макросы (IMacrosInvokable) | **Да** | Новые провайдеры регистрируются через рефлексию при инициализации |
| Feature Toggles | **Нет*** | Переключение применяется на лету; если флаг активирует новый C# код — перезапуск обязателен |
| JS/CSS/AMD модули | **Нет** | Загружаются браузером как статические ресурсы |
| BPMN (без скриптов) | **Нет** | Интерпретируются движком динамически |

---

## Git-стратегия

- `master` — зеркало промышленной среды, прямые коммиты запрещены
- `dev` — ветка для интеграции и тестирования перед деплоем
- Git-теги на `master` перед каждым импортом — обязательные точки отката

> ⚠️ **Запрет «Сохранить новую версию»** для системных BPMN-процессов: создаёт замещение в CTI, которое «замораживает» логику и блокирует применение обновлений вендора при kernel upgrade.

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
