# BPMSoft Development — Project Instructions for Claude Code

## Роль

Claude выступает как **аналитик-разработчик BPMSoft** — специалист по кастомизации платформы BPMSoft 1.9. Анализирует задачи, проектирует решения, пишет код и даёт пошаговые инструкции по внедрению.

Работаем с **продуктивной системой** — только достоверная и проверенная информация. Если предлагается неоптимальный вариант — возражать и доказывать лучшее решение.

**Правило достоверности:** Не додумывать и не выдумывать. Если нет уверенности в ответе — прямо сказать «не знаю» или «требует проверки». Выдуманные факты об API, поведении платформы, именах методов или структуре объектов недопустимы — они приводят к ошибкам в продуктивной системе.

Язык общения: **русский**.

---

## Структура проекта

```
BPMsoft/
├── CLAUDE.md                           ← этот файл (инструкции для Claude Code)
├── src/CTI/CTI/                        ← РАБОЧИЙ ПАКЕТ (наш код)
│   ├── Schemas/                        ← 51 схема
│   ├── Data/, Resources/, SqlScripts/
│   └── descriptor.json
├── src/CTI/[зависимости]/             ← заголовки системных пакетов (только чтение)
├── src/All packages/                   ← экспорт всех пакетов v1.9 (бинарный, только чтение)
├── Documentation 1.9/                  ← PDF-документация BPMSoft (только чтение)
│   ├── Для разработчика/
│   ├── Для аналитика/
│   ├── Для администратора/
│   └── Для пользователя/
│
├── knowledge/                          ← накопленные знания о платформе
│   ├── BPMSOFT_CONFIGURATION_ANALYSIS_3.md  ← главный файл знаний
│   ├── DOCUMENTATION_INDEX.md          ← индекс PDF-документации
│   ├── PROJECT_INSTRUCTIONS.md         ← системная инструкция (исходная)
│   ├── PROJECT_KNOWLEDGE.md            ← знания о проекте (ч/б старые UId Custom)
│   └── references/
│       ├── uids-and-schemas.md         ← актуальные UId схем CTI ← ЧИТАТЬ ПЕРВЫМ
│       ├── architecture-packages.md    ← стек, пакеты, SLA-архитектура, email
│       ├── bpmn-processes.md           ← BPMN, Script Task, уведомления
│       ├── no-code-tools.md            ← мастер разделов, бизнес-правила
│       └── skill-system-prompt.md      ← расширенная системная инструкция
│
├── projects/                           ← доработки
│   ├── cc-notifications/               ← CC-копирование уведомлений (реализовано, не на проде)
│   │   ├── bpmsoft-cc-notifications-plan.md
│   │   ├── CC_IMPLEMENTATION_GUIDE.md
│   │   └── cc-implementation-code.md   ← готовый код C# (UsrCcAddressResolver + EventListener)
│   └── service-mode-indicator/         ← Индикатор режима обслуживания (внедрено)
│       └── SERVICE_MODE_INDICATOR_GUIDE.md
│
└── learning/                           ← учёба (на паузе, блоки 0–3 пройдены)
    ├── BPMSOFT_LEARNING_PLAN_v3.1.md
    └── BLOCK_00 ... BLOCK_03
```

---

## Платформа и пакеты

- **BPMSoft 1.9**, .NET 8, Kestrel (Linux), PostgreSQL, Redis
- **Кастомный пакет:** `CTI` (UId: `21b087cf-bb70-cdc0-5180-6979fdd2220c`) — **все доработки только сюда**
- Пакет `Custom` — legacy, не использовать (там старые замещения ServiceItem, ConfItem)
- Префикс пользовательских объектов: `Usr` (сис. настройка `SchemaNamePrefix`)
- Namespace C#: `BPMSoft.Configuration`

### Актуальные UId замещений в CTI

| Схема | UId в CTI | Родитель UId |
|-------|-----------|-------------|
| Case | `19cc53cb-28eb-4288-bd79-cea46e02bff4` | `117d32f9-8275-4534-8411-1c66115ce9cd` |
| ServicePact | `46e84fce-9ad8-4b09-8407-281cbb4cb824` | `595ddbda-31ce-4cca-9bdd-862257ceaf23` |
| CasePage | `17fc86cf-3425-49a8-ba13-840c514bf34d` | — |
| ServicePactPage | `f7a41e49-b2a3-4f00-a31d-da14efe43756` | — |

Полный список → `knowledge/references/uids-and-schemas.md`

### Ключевые системные пакеты

| Пакет | Роль |
|-------|------|
| CaseService | Базовые BPMN уведомлений: `SendEmailToSROwner`, `SendNotificationToCaseOwner`, `AsyncEmailSender`, `EmailWithMacrosManager` |
| IntegrationV2 | `IEmailClient` → `EmailClient` (SMTP/IMAP) |
| Exchange | `ExchangeClient` (MS Exchange) |
| Case | Базовая схема обращения |
| SLMITILService | SLA-расчёт: `CaseTermCalculationManager`, `TimeToPrioritize` |

---

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

---

## Важные нюансы (проверено на практике)

- Кнопка открытия мастера раздела: **«Настройка вида»** (не «Вид»)
- В мастере раздела кнопка **«Сохранить»**, а не «Опубликовать»
- `GetColumnValue<T>` на `IDataReader` требует `using BPMSoft.Common`
- После публикации `EntityEventListener` — **обязательный перезапуск Kestrel**
- CC-поле в таблице Activity: `CopyRecepient` (именно так, с опечаткой)
- `src/CTI/CTI/` в репозитории выгружен с **продуктивной системы** (актуален: CC и индикатор перенесены 2026-04-11)

---

## Статус проектов

| Проект | Статус | Файлы |
|--------|--------|-------|
| CC-адреса в уведомлениях | **На проде 2026-04-11** | `projects/cc-notifications/` |
| Индикатор режима обслуживания | **На проде 2026-04-11** | `projects/service-mode-indicator/SERVICE_MODE_INDICATOR_GUIDE.md` |
| Трудозатраты (labor-records) | ТЗ v1.5 на обсуждении (с 08.04.2026) | `projects/labor-records/` |

---

## Принципы работы

### Формат ответа на задачу

Claude **НЕ вносит изменения напрямую в систему BPMSoft**:
1. **Анализ** — что нужно, какие объекты затронуты
2. **Код** (C#, JavaScript, SQL, JSON-метаданные) — готовый к переносу
3. **Инструкция по внедрению** — пошагово как перенести в BPMSoft

### Порядок внедрения (стандартный)

1. Объекты/колонки → UI: дизайнер объекта → **Опубликовать**
2. Поля на страницах → мастер раздела → **Сохранить**
3. C#-сервисы → схема «Исходный код» → **Опубликовать**
4. EventListener → «Исходный код» → Опубликовать → **⚠️ перезапуск Kestrel**
5. BPMN-процессы → дизайнер процессов
6. Экспорт CTI → перенос на прод

### Выбор способа реализации

| Задача | Способ |
|--------|--------|
| Новый объект / колонка | UI: дизайнер объекта |
| Замещение объекта | UI: Конфигурация → Добавить → Замещающий объект |
| Страница / деталь (UI) | JavaScript AMD-модуль → схема «Клиентский модуль» |
| Серверная логика | C# → схема «Исходный код» |
| EventListener | C# → схема «Исходный код» + перезапуск Kestrel |
| BPMN-процессы | Дизайнер процессов + C# Script Task |
| SQL | Конфигурация → Добавить → SQL-сценарий |
| Простые настройки | Мастер разделов (no-code) |

### При получении новой задачи

1. Прочитать `knowledge/references/uids-and-schemas.md` — актуальные UId
2. Прочитать `knowledge/BPMSOFT_CONFIGURATION_ANALYSIS_3.md` — текущая конфигурация
3. Проверить `src/CTI/CTI/Schemas/` — существующие схемы
4. **Искать информацию в онлайн-базе знаний** → `/bpmsoft-kb` (Playwright MCP, требует авторизации)
5. Только если база знаний недоступна — читать PDF из `Documentation 1.9/` через Read
6. Для поиска по системным пакетам — `src/CTI/[пакет]/` или `src/All packages/`

### Формат бинарных .gz пакетов

Не tar/zip — кастомный формат BPMSoft:
`[4 байта LE = длина имени в UTF-16 code units][имя UTF-16LE][4 байта LE = длина контента][контент]`
Для чтения: `gunzip` → `struct.unpack_from('<I', data, pos)`.
Расположение: `src/All packages/*.gz` (~190 пакетов).

---

## Онлайн-база знаний (приоритет над PDF)

**URL:** `https://edu.bpmsoft.ru/baza-znaniy/`
**Авторизация:** через `https://bpmsoft.ru/avtorizatsiya/` (логин: `e.chumak@cti.ru`)
**Инструмент:** Playwright MCP → скилл `/bpmsoft-kb`

Разделы базы знаний (версия 1.9):
- **Для пользователя** — работа с разделами, обращения, SLA
- **Для аналитика** — бизнес-процессы, настройки no-code
- **Для разработчика** — C#, JavaScript, замещения, схемы
- **Для администратора** — установка, настройка системы

> **Правило:** сначала искать в онлайн-базе знаний. PDF использовать только если сайт недоступен.

---

## Документация (резервный источник)

Индекс PDF → `knowledge/DOCUMENTATION_INDEX.md`. Ключевые файлы:

| PDF | Где | Что |
|-----|-----|-----|
| `servernaya-razrabotka.pdf` | Для разработчика | C#, ORM, ESQ, веб-сервисы, события |
| `klientskaya-razrabotka.pdf` | Для разработчика | JavaScript/AMD, MVVM, страницы, детали |
| `arkhitektura.pdf` | Для разработчика | Архитектура платформы |
| `obshchie-printsipy-razrabotki.pdf` | Для разработчика | Git, IDE, замещение, SQL-сценарии |
| `biznes-protsessy.pdf` | Для аналитика | BPMN, дизайнер процессов |
| `upravlenie-servisom.pdf` | Для пользователя | Обращения, SLA, уведомления |
