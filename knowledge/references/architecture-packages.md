# Архитектура и пакеты BPMSoft 1.9

## Технологический стек

| Слой | Технология |
|---|---|
| Backend | C# / .NET 8, Kestrel (Linux) |
| ORM | EntitySchemaQuery, Entity, Select/Insert/Update/Delete |
| DI/IoC | ClassFactory, [DefaultBinding], ConstructorArgument |
| Entity Events | [EntityEventListener(SchemaName = "...")] |
| Email | IEmailClient → EmailClient (SMTP) / ExchangeClient (Exchange) |
| Frontend | ExtJS, AMD/RequireJS, Angular (с версии 1.9) |
| Процессы | BPMN (ProcessEngineService) |
| БД | PostgreSQL (основная в проекте) |
| Кэш | Redis |

## Ключевые пакеты для задач Service Desk

| Пакет | Роль |
|---|---|
| **CTI** | Все кастомные BPMN-процессы уведомлений, замещения Case/CasePage/ServicePactPage |
| **Custom** | Legacy-замещения ServiceItem, ConfItem, ServicePact — не трогать без необходимости |
| **CaseService** | Базовые BPMN уведомлений (SendEmailToSROwner и др.), EmailWithMacrosManager, AsyncEmailSender |
| **IntegrationV2** | IEmailClient → EmailClient (SMTP/IMAP), EmailRepository, EmailService |
| **Exchange** | ExchangeClient (MS Exchange), ExchangeEmailMessage |
| **Case** | Базовая схема обращения |
| **ServiceModel** | Angular-компонент сервисной модели |
| **NUI** | Основной UI |

## Структура пакета (файловая система)

```
Pkg/CTI/
├── descriptor.json       # Метаданные пакета
├── Schemas/             # Все схемы
│   ├── MyEntity/        # Объект
│   │   ├── descriptor.json
│   │   ├── metadata.json
│   │   └── properties.json
│   ├── MyService/       # C# код
│   │   ├── descriptor.json
│   │   └── MyService.cs
│   └── MyPageV2/        # JS модуль
│       ├── descriptor.json
│       └── MyPageV2.js
├── SqlScripts/          # SQL сценарии
├── Data/                # Привязанные данные
└── Resources/           # Локализация
```

## Форматы бинарных .gz пакетов BPMSoft

Формат: `[4 байта длина имени UTF-16][имя UTF-16LE][4 байта длина контента][контент]`  
Не tar/zip — нужен специальный парсер (`gunzip` → `struct.unpack_from('<I', data, pos)`, UTF-16LE имена файлов).

**Расположение исходников:** `C:\Users\echum\Documents\BPMsoft\src\*.gz` (~190 файлов)  
⚠️ CTI.gz в src выгружен с продуктивной системы — **не содержит** CC-изменений (тестовая среда).

---

## Архитектура расчёта SLA

Разобранная цепочка (пакеты SLM, SLMITILService, Calendar):

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

**Текущий сервис в системе:** один — «Техподдержка». Консультации всегда 8x5.

## Email-архитектура

`EmailClient` (SMTP/IMAP) и `ExchangeClient` (MS Exchange) — оба принимают `EmailMessage` с коллекцией `Cc`. Метод `SetRecipients()` в `ExchangeClient` поддерживает `CcRecipients`.

Поле в таблице Activity: `CopyRecepient` (именно так, с опечаткой) — строка адресов через пробел.

## BPMN-процессы уведомлений (ключевые)

Находятся в пакете CTI и CaseService. Для кастомизации — Script Task с C#-кодом. Триггеры: события по обращению (создание, изменение статуса, ответ).

## Рекомендуемый порядок внедрения новых функций

1. Объекты/колонки → UI (дизайнер объекта → Опубликовать)
2. Поля на страницах (мастер раздела → Сохранить)
3. C# сервисы (Исходный код → Опубликовать)
4. EventListener (Исходный код → Опубликовать → **перезапуск Kestrel**)
5. BPMN-процессы (дизайнер процессов)
6. Привязка данных к пакету (если нужны справочники)
7. Экспорт и перенос на боевую среду
