# Инструменты и рабочие процессы

**Обновлено:** 2026-04-27  
**Источники:** concepts/documentation-source-priority-bpmsoft, concepts/bpmsoft-web-knowledge-base-navigation, concepts/memory-compiler-scheduling-task-scheduler

---

## Иерархия источников документации

| Приоритет | Источник | Когда использовать |
|---|---|---|
| 1 | **NotebookLM блокноты** | Всегда первым — 5–7× экономия токенов, AI-синтез, цитаты |
| 2 | **edu.bpmsoft.ru** | Если в блокнотах нет ответа; официальная актуальная база |
| 3 | **Локальный PDF** (`Documentation 1.9/`) | Если нет сети или блокнот недоступен |
| 4 | **Локальная wiki** (`knowledge/`) | Проектные заметки и решения; не авторитетный источник платформы |

### Блокноты NotebookLM (актуальный состав)

Инструмент: `mcp__notebooklm-mcp__notebook_query`

| Блокнот | UUID | Охватывает |
|---------|------|-----------|
| BPMSoft Documentation | `eb410184-caa8-42fe-92b4-6f1971f4425f` | BPMSoft 1.9, платформа, C#, JS |
| Backend & Infrastructure Stack | `0c1bba11-acba-4eda-a893-a5964378147c` | OAuth 2.0, Email, Redis, PostgreSQL, Kestrel |
| Angular 18.2 Modern Frontend | `d545f7f8-575b-400d-9ca0-ce6e8da0e43e` | Angular 18.2, DI, routing |
| Sencha ExtJS 4 Complete Guide | `5a51c51e-ae09-4265-a42f-127c6a9c6ce9` | ExtJS 4.2, компоненты, классы |
| BPMN 2.0 Specification and Guide | `ae040e01-cddd-4441-a79b-14d0bb249f94` | BPMN 2.0 спецификация |
| Modern .NET and C# Development | `ceb5a347-06e6-4115-bd82-d7feec387716` | C# 12, .NET 8, async, DI |

### Четыре обязательных правила при работе с NotebookLM

1. **Блокнот недоступен** → сообщить сразу, не переключаться молча на интернет
2. **Пробел в блокноте** → предложить добавить источник, а не искать в интернете
3. **Тема не покрыта ни одним блокнотом** → сообщить пользователю
4. **NotebookLM вернул конкретный API/класс/метод** → **верифицировать по реальному коду** перед использованием (риск смешивания BPMSoft 1.9 и Creatio)

---

## Навигация в edu.bpmsoft.ru

Доступ через Playwright MCP + `/bpmsoft-kb` скилл. Прямые URL не работают стабильно из-за URL-кодирования и управления сессиями.

**Проблема с URL:** адреса вида `baza-zaniy` содержат кириллицу — строить через `browser_evaluate` конкатенацией, не вставлять вручную.

```javascript
// Правильно: через browser_evaluate
window.location.href = "https://edu.bpmsoft.ru/" + "baza-zaniy/";
```

Логин: `e.chumak@cti.ru` (пароль в памяти `reference_knowledge_base.md`).

---

## Memory Compiler — автоматическая компиляция знаний

**Расположение:** `BPMSoft/memory-compiler/`  
**Запуск:** `uv run python scripts/compile.py`  
**Lint:** `uv run python scripts/lint.py`

Компилятор читает `daily/*.md` логи и извлекает атомарные концепты в `knowledge/concepts/`.  
Настроен на Windows Task Scheduler для ежедневного автозапуска (команда: `StartWhenAvailable` — выполняется при следующем включении ПК если окно пропущено).

**Конфигурация:** `memory-compiler/scripts/config.py`  
`KNOWLEDGE_DIR = ROOT_DIR.parent / "knowledge"` — пишет в основную базу знаний, не в свою локальную копию.

### Lint отчёты

Сохраняются в `memory-compiler/reports/lint-YYYY-MM-DD.md`. Проверяет:
- Broken wikilinks `[[...]]`
- Orphan pages (никто не ссылается)
- Stale articles (давно не обновлялись)
- Contradictions (LLM-проверка)

> ⚠️ Gotcha: `lint.py` парсит `[[wikilinks]]` даже внутри backtick-спанов. Примеры wikilink-синтаксиса в тексте документации нужно писать через `«concepts/slug»`, а не через двойные скобки.

---

## Смотри также

- [WIKI_SCHEMA.md](../WIKI_SCHEMA.md) — Правила ведения базы знаний, операции Ingest/Lint
- [INDEX.md](../INDEX.md) — Навигационный индекс всех концептов
