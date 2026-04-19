# BPMSoft Wiki — Навигационный индекс

**Обновлено:** 2026-04-18  
**Последний Lint:** 2026-04-15

> Правила ведения вики → [WIKI_SCHEMA.md](WIKI_SCHEMA.md)

---

## Основные страницы знаний

- [platform.md](wiki/platform.md) — стек BPMSoft, пакеты, email-архитектура, SLA, порядок внедрения
- [cti-package.md](wiki/cti-package.md) — UId всех схем CTI, метаданные, архитектурные решения (**читать первым**)
- [notifications.md](wiki/notifications.md) — карта процессов уведомлений, email-архитектура, CC-решение
- [processes.md](wiki/processes.md) — BPMN, Script Task, EventListener, DCM, метаданные StartSignal
- [ui-customization.md](wiki/ui-customization.md) — мастер разделов, бизнес-правила, SysSettings, AMD-модули JS
- [data-model.md](wiki/data-model.md) — таблицы БД, ESQ, Select/Update, Entity, ключевые поля
- [troubleshooting.md](wiki/troubleshooting.md) — диагностика, известные проблемы, кейсы

---

## Проекты

- [projects/cc-notifications.md](wiki/projects/cc-notifications.md) — ✅ На проде 2026-04-11
- [projects/service-mode-indicator.md](wiki/projects/service-mode-indicator.md) — ✅ На проде 2026-04-11
- [projects/notifications-wave2.md](wiki/projects/notifications-wave2.md) — 🔧 В разработке (задача 2.3 — приоритет 1)
- [projects/labor-records.md](wiki/projects/labor-records.md) — 📋 ТЗ на обсуждении

---

## Концепции (Knowledge Base)

| Статья | Краткое описание | Источник | Обновлено |
|--------|-----------------|----------|----------|
| [[concepts/data-driven-system-analysis]] | Методология: запрашивать систему вместо гипотез; полный экспорт таблиц раскрывает скрытые процессы | daily/2026-04-17.md | 2026-04-18 |
| [[concepts/vwsysprocess-schema-and-notification-querying]] | VwSysProcess — авторитетный источник процессов; Enabled колонка; MetaData содержит логику | daily/2026-04-17.md | 2026-04-18 |
| [[concepts/startsignal-metadata-structure]] | StartSignal фильтры хранятся в VwSysProcess.MetaData; не в UI конфигурации | daily/2026-04-17.md | 2026-04-18 |
| [[concepts/google-mail-oauth2-integration]] | Google Mail OAuth 2.0 интеграция в BPMSoft 1.9; развертывание онсайт; диагностика на dev-server | daily/2026-04-18.md | 2026-04-18 |
| [[concepts/documentation-source-priority-bpmsoft]] | edu.bpmsoft.ru > PDF > локальная вики; `/bpmsoft-kb` скилл + Playwright MCP | daily/2026-04-18.md | 2026-04-18 |
| [[concepts/ed25519-ssh-authentication]] | ED25519 ключи для SSH доступа; безопаснее паролей; `ssh-keygen -t ed25519` | daily/2026-04-18.md | 2026-04-18 |
| [[concepts/ssh-read-only-access]] | Read-only constraint: SELECT OK, INSERT/UPDATE/DELETE требуют одобрения; safe diagnostics | daily/2026-04-18.md | 2026-04-18 |
| [[concepts/ssh-ed25519-dev-server-access]] | SSH Key Provisioning: ED25519 вместо паролей; безопаснее для доступа на dev-серверы | daily/2026-04-18.md | 2026-04-18 |
| [[concepts/dev-access-read-only-protocol]] | Разработка с read-only доступом; SELECT OK, INSERT/UPDATE/DELETE требуют явного одобрения | daily/2026-04-18.md | 2026-04-18 |
| [[concepts/tool-availability-verification]] | Проверяй доступные инструменты первым; edu.bpmsoft.ru > PDF > вики; не предлагай альтернативы без поиска | daily/2026-04-18.md | 2026-04-18 |
| [[concepts/bpmsoft-web-knowledge-base-navigation]] | Навигация в edu.bpmsoft.ru требует Playwright MCP; URL кодирование и сессии ломают прямые запросы | daily/2026-04-18.md | 2026-04-18 |
| [[concepts/google-mail-oauth2-bpmsoft-integration]] | Google Mail OAuth 2.0 в BPMSoft 1.9; исследование архитектуры почты; dev-server диагностика | daily/2026-04-18.md | 2026-04-18 |

---

## Связи между концепциями (Connections)

| Связь | Объединяет | Источник | Дата |
|-------|-----------|----------|------|
| [[connections/dev-server-investigation-workflow]] | ED25519 доступ, read-only протокол, проверка инструментов, Google Mail OAuth 2.0 | daily/2026-04-18.md | 2026-04-18 |
| [[connections/investigation-methodology-and-metadata-discovery]] | Data-driven анализ, VwSysProcess, StartSignal метаданные, BPMN диагностика | daily/2026-04-17.md | 2026-04-18 |

---

## Инструменты исследования

- [research-tools.md](research-tools.md) — приоритеты поиска документации (NotebookLM → edu.bpmsoft.ru → PDF → вики)

## Справочники

- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) — индекс PDF-документации BPMSoft 1.9 (резервный источник)

---

## Архив

- [2026-04-15_BPMSOFT_CONFIGURATION_ANALYSIS_3.md](archive/2026-04-15_BPMSOFT_CONFIGURATION_ANALYSIS_3.md) — монолитный анализ конфигурации (заменён wiki/)
- [2026-04-15_PROJECT_KNOWLEDGE.md](archive/2026-04-15_PROJECT_KNOWLEDGE.md) — старые знания о CC-проекте (заменён wiki/projects/)
- [2026-04-15_PROJECT_INSTRUCTIONS.md](archive/2026-04-15_PROJECT_INSTRUCTIONS.md) — дублировал CLAUDE.md
- [2026-04-15_skill-system-prompt.md](archive/2026-04-15_skill-system-prompt.md) — системный промпт скилла (не вики)
- [2026-04-15_references_architecture-packages.md](archive/2026-04-15_references_architecture-packages.md) — влит в wiki/platform.md
- [2026-04-15_references_bpmn-processes.md](archive/2026-04-15_references_bpmn-processes.md) — влит в wiki/processes.md
- [2026-04-15_references_no-code-tools.md](archive/2026-04-15_references_no-code-tools.md) — влит в wiki/ui-customization.md
- [2026-04-15_references_uids-and-schemas.md](archive/2026-04-15_references_uids-and-schemas.md) — влит в wiki/cti-package.md
- [2026-04-15_TROUBLESHOOTING.md](archive/2026-04-15_TROUBLESHOOTING.md) — влит в wiki/troubleshooting.md
