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
├── src/CTI_2026-04-11_15.14.44/CTI/CTI ← АКТУАЛЬНЫЙ ПАКЕТ (бинарный архив с прода 2026-04-11)
│   (кастомный формат BPMSoft — читать Python-скриптом из раздела ниже)
├── src/PKG_BPMSoft_Full_House_1.9.0.14114/  ← все системные пакеты v1.9 (распакованные)
│   └── <PackageName>/Schemas/, Data/, ...    (только чтение)
├── Documentation 1.9/                  ← PDF-документация BPMSoft (только чтение)
│   ├── Для разработчика/
│   ├── Для аналитика/
│   ├── Для администратора/
│   └── Для пользователя/
│
├── knowledge/                          ← LLM Wiki (накопленные знания о платформе)
│   ├── INDEX.md                        ← навигационный индекс вики ← ЧИТАТЬ ПЕРВЫМ
│   ├── WIKI_SCHEMA.md                  ← правила ведения вики, операции Ingest/Lint
│   ├── DOCUMENTATION_INDEX.md          ← индекс PDF-документации
│   ├── wiki/                           ← основные страницы знаний
│   │   ├── platform.md                 ← стек, пакеты, email-архитектура, SLA
│   │   ├── cti-package.md              ← UId схем CTI, метаданные ← ЧИТАТЬ ВТОРЫМ
│   │   ├── notifications.md            ← процессы уведомлений, email-архитектура
│   │   ├── processes.md                ← BPMN, Script Task, EventListener, DCM
│   │   ├── ui-customization.md         ← мастер разделов, бизнес-правила, JS AMD
│   │   ├── data-model.md               ← таблицы БД, ESQ, ORM-примеры
│   │   ├── troubleshooting.md          ← диагностика, известные проблемы
│   │   └── projects/                   ← страницы по активным проектам
│   │       ├── cc-notifications.md
│   │       ├── service-mode-indicator.md
│   │       ├── notifications-wave2.md
│   │       └── labor-records.md
│   └── archive/                        ← устаревшие файлы (с датой)
│
├── projects/                           ← доработки
│   ├── cc-notifications/               ← CC-копирование уведомлений (на проде 2026-04-11)
│   │   ├── CC_IMPLEMENTATION_GUIDE.md
│   │   └── CC_USER_GUIDE.md
│   ├── service-mode-indicator/         ← Индикатор режима обслуживания (на проде 2026-04-11)
│   │   └── SERVICE_MODE_INDICATOR_GUIDE.md
│   ├── notifications-wave2/            ← Уведомления волна 2 (в разработке)
│   │   ├── ANALYSIS.md                 ← GAP-анализ, архитектура, рекомендации по задачам
│   │   ├── TASK_2_3_DESIGN.md          ← задача 2.3: текст письма клиента в уведомлении
│   │   ├── TASK_2_3_DEPLOY.md
│   │   └── TASK_2_3_INVESTIGATION.md
│   └── labor-records/                  ← Трудозатраты (ТЗ v1.5 на обсуждении)
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
- `src/CTI_2026-04-11_15.14.44/CTI/CTI` — бинарный архив пакета CTI с прода (2026-04-11). Читать Python-скриптом (см. раздел ниже). Папка `src/CTI/CTI/` удалена — она устарела

---

## Статус проектов

| Проект | Статус | Файлы |
|--------|--------|-------|
| CC-адреса в уведомлениях | **На проде 2026-04-11** | `projects/cc-notifications/` |
| Индикатор режима обслуживания | **На проде 2026-04-11** | `projects/service-mode-indicator/` |
| Уведомления волна 2 | **В разработке** (задача 2.3 — приоритет 1) | `projects/notifications-wave2/` |
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

1. Прочитать `knowledge/INDEX.md` — найти релевантные страницы вики
2. Прочитать `knowledge/wiki/cti-package.md` — актуальные UId и метаданные CTI
3. Прочитать релевантные страницы вики (`wiki/notifications.md`, `wiki/platform.md` и др.)
4. При необходимости — прочитать актуальный код CTI из `src/CTI_2026-04-11_15.14.44/CTI/CTI` (Python-скрипт, раздел ниже)
5. **🔴 ПРИОРИТЕТ: Искать в NotebookLM** → `mcp__notebooklm__ask_question` (ID: `bpmsoft-documentation`) — 5-7x эффективнее по токенам, с цитатами
6. Fallback: онлайн-база знаний → `/bpmsoft-kb` (Playwright MCP, требует авторизации) — если NotebookLM недоступен
7. Fallback: локальные PDF из `Documentation 1.9/` через Read — только если сеть недоступна
8. Для поиска по системным пакетам — `src/PKG_BPMSoft_Full_House_1.9.0.14114/<PackageName>/`

### Чтение бинарного архива CTI

`src/CTI_2026-04-11_15.14.44/CTI/CTI` — кастомный формат BPMSoft (уже gunzip'ed):
`[4 байта LE = длина имени в UTF-16 code units][имя UTF-16LE][4 байта LE = длина контента][контент]`

```python
import struct, os
data = open('src/CTI_2026-04-11_15.14.44/CTI/CTI', 'rb').read()
pos = 0
while pos < len(data):
    name_len = struct.unpack_from('<I', data, pos)[0]; pos += 4
    name = data[pos:pos + name_len * 2].decode('utf-16-le'); pos += name_len * 2
    content_len = struct.unpack_from('<I', data, pos)[0]; pos += 4
    content = data[pos:pos + content_len]; pos += content_len
    # name = относительный путь файла, content = байты
```

**Системные пакеты** уже распакованы: `src/PKG_BPMSoft_Full_House_1.9.0.14114/<PackageName>/Schemas/`

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
