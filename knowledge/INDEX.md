# BPMSoft Wiki — Навигационный индекс

**Обновлено:** 2026-04-28  
**Последний Lint:** 2026-04-27

> Правила ведения вики → [WIKI_SCHEMA.md](WIKI_SCHEMA.md)

---

## Основные страницы знаний

- [platform.md](wiki/platform.md) — стек BPMSoft, пакеты, email-архитектура, SLA, двухслойная архитектура кода, Calendar API
- [cti-package.md](wiki/cti-package.md) — UId всех схем CTI, метаданные, архитектурные решения (**читать первым**)
- [notifications.md](wiki/notifications.md) — карта процессов уведомлений, email-архитектура, CC-решение
- [processes.md](wiki/processes.md) — BPMN, Script Task, EventListener, DCM, метаданные StartSignal, data-driven диагностика
- [ui-customization.md](wiki/ui-customization.md) — мастер разделов, бизнес-правила, SysSettings, AMD-модули JS, diff gotchas
- [data-model.md](wiki/data-model.md) — таблицы БД, ESQ, Select/Update, Entity, ключевые поля
- [troubleshooting.md](wiki/troubleshooting.md) — диагностика, известные проблемы, кейсы
- [deployment.md](wiki/deployment.md) — FK-зависимости при импорте, lazy property паттерн C#, SysSettings.GetValue
- [methodology.md](wiki/methodology.md) — data-driven диагностика, read-only протокол, иерархия инструментов
- [tools-and-workflows.md](wiki/tools-and-workflows.md) — NotebookLM блокноты, edu.bpmsoft.ru, memory compiler

---

## Проекты

- [projects/cc-notifications.md](wiki/projects/cc-notifications.md) — ✅ На проде 2026-04-11
- [projects/service-mode-indicator.md](wiki/projects/service-mode-indicator.md) — ✅ На проде 2026-04-11
- [projects/notifications-wave2.md](wiki/projects/notifications-wave2.md) — 🔧 В разработке (задача 2.3 — приоритет 1)
- [projects/labor-records.md](wiki/projects/labor-records.md) — 📋 ТЗ на обсуждении
- [projects/mailserver-setup.md](wiki/projects/mailserver-setup.md) — 🔧 В процессе: Docker Mailserver для тестирования нотификаций

---

## Инструменты исследования

- [research-tools.md](research-tools.md) — приоритеты поиска документации (NotebookLM → edu.bpmsoft.ru → PDF → вики)

## Справочники

- [reference_dev_server.md](reference_dev_server.md) — SSH подключение к dev-серверу (192.168.102.46), версии ПО, команды
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) — индекс PDF-документации BPMSoft 1.9 (резервный источник)

---

## Архив

Все файлы перемещены в [archive/](archive/). Знания из концептов влиты в wiki/ страницы выше.

**Концепты (перемещены 2026-04-28, влиты в wiki/):**

| Файл | Влит в |
|------|--------|
| [amd-css-loading.md](archive/amd-css-loading.md) | wiki/ui-customization.md |
| [bpmn-signal-filter-diagnostics.md](archive/bpmn-signal-filter-diagnostics.md) | wiki/processes.md |
| [bpmsoft-calendar-api-v19.md](archive/bpmsoft-calendar-api-v19.md) | wiki/platform.md |
| [bpmsoft-configuration-schema-vs-core-dll.md](archive/bpmsoft-configuration-schema-vs-core-dll.md) | wiki/platform.md |
| [bpmsoft-feature-flags-storage.md](archive/bpmsoft-feature-flags-storage.md) | wiki/platform.md |
| [bpmsoft-import-fk-dependencies.md](archive/bpmsoft-import-fk-dependencies.md) | wiki/deployment.md |
| [bpmsoft-parallel-project-conflict-analysis.md](archive/bpmsoft-parallel-project-conflict-analysis.md) | wiki/methodology.md |
| [bpmsoft-syssettings-getvalue-api.md](archive/bpmsoft-syssettings-getvalue-api.md) | wiki/deployment.md |
| [bpmsoft-syssettings-getvalue-signature.md](archive/bpmsoft-syssettings-getvalue-signature.md) | wiki/deployment.md |
| [bpmsoft-visible-binding-gotchas.md](archive/bpmsoft-visible-binding-gotchas.md) | wiki/ui-customization.md |
| [bpmsoft-web-knowledge-base-navigation.md](archive/bpmsoft-web-knowledge-base-navigation.md) | wiki/tools-and-workflows.md |
| [data-driven-system-analysis.md](archive/data-driven-system-analysis.md) | wiki/methodology.md |
| [dev-access-read-only-protocol.md](archive/dev-access-read-only-protocol.md) | wiki/methodology.md |
| [diff-generator-property.md](archive/diff-generator-property.md) | wiki/ui-customization.md |
| [documentation-source-priority-bpmsoft.md](archive/documentation-source-priority-bpmsoft.md) | wiki/tools-and-workflows.md |
| [ed25519-ssh-authentication.md](archive/ed25519-ssh-authentication.md) | wiki/tools-and-workflows.md |
| [exchangelistenerservice-microservice-prerequisite.md](archive/exchangelistenerservice-microservice-prerequisite.md) | wiki/platform.md |
| [extjs-component-querying.md](archive/extjs-component-querying.md) | wiki/ui-customization.md |
| [feature-toggle-subprocess-execution.md](archive/feature-toggle-subprocess-execution.md) | wiki/processes.md |
| [google-mail-oauth2-bpmsoft-integration.md](archive/google-mail-oauth2-bpmsoft-integration.md) | wiki/platform.md |
| [google-mail-oauth2-integration.md](archive/google-mail-oauth2-integration.md) | wiki/platform.md |
| [imacrosinvokable-pattern-bpmsoft.md](archive/imacrosinvokable-pattern-bpmsoft.md) | wiki/processes.md |
| [kestrel-service-restart.md](archive/kestrel-service-restart.md) | wiki/deployment.md |
| [knowledge-base-audit-contradictions-duplicates.md](archive/knowledge-base-audit-contradictions-duplicates.md) | wiki/tools-and-workflows.md |
| [knowledge-base-file-standardization.md](archive/knowledge-base-file-standardization.md) | wiki/tools-and-workflows.md |
| [knowledge-base-ingest-workflow.md](archive/knowledge-base-ingest-workflow.md) | wiki/tools-and-workflows.md |
| [lazy-property-pattern-service-initialization.md](archive/lazy-property-pattern-service-initialization.md) | wiki/deployment.md |
| [lint-kb-wikilink-false-positives.md](archive/lint-kb-wikilink-false-positives.md) | wiki/tools-and-workflows.md |
| [memory-compiler-scheduling-task-scheduler.md](archive/memory-compiler-scheduling-task-scheduler.md) | wiki/tools-and-workflows.md |
| [notebooklm-cross-version-api-contamination.md](archive/notebooklm-cross-version-api-contamination.md) | wiki/tools-and-workflows.md |
| [notebooklm-documentation-strategy-alert-rules.md](archive/notebooklm-documentation-strategy-alert-rules.md) | wiki/tools-and-workflows.md |
| [notebooklm-documentation-strategy.md](archive/notebooklm-documentation-strategy.md) | wiki/tools-and-workflows.md |
| [notebooklm-notebooks-curated.md](archive/notebooklm-notebooks-curated.md) | wiki/tools-and-workflows.md |
| [profilecontainer-rendering.md](archive/profilecontainer-rendering.md) | wiki/ui-customization.md |
| [software-adoption-documentation-check.md](archive/software-adoption-documentation-check.md) | wiki/methodology.md |
| [ssh-ed25519-dev-server-access.md](archive/ssh-ed25519-dev-server-access.md) | wiki/tools-and-workflows.md |
| [ssh-read-only-access.md](archive/ssh-read-only-access.md) | wiki/methodology.md |
| [stalwart-v016-breaking-api-change.md](archive/stalwart-v016-breaking-api-change.md) | wiki/projects/mailserver-setup.md |
| [startsignal-metadata-structure.md](archive/startsignal-metadata-structure.md) | wiki/processes.md |
| [time-unit-codes.md](archive/time-unit-codes.md) | wiki/data-model.md |
| [tool-availability-verification.md](archive/tool-availability-verification.md) | wiki/tools-and-workflows.md |
| [usrprocess-indirect-chain-hardcoded.md](archive/usrprocess-indirect-chain-hardcoded.md) | wiki/processes.md |
| [vwsysprocess-schema-and-notification-querying.md](archive/vwsysprocess-schema-and-notification-querying.md) | wiki/processes.md |

**Connections (перемещены 2026-04-28, влиты в wiki/):**

| Файл | Влит в |
|------|--------|
| [dev-server-investigation-workflow.md](archive/dev-server-investigation-workflow.md) | wiki/tools-and-workflows.md |
| [diff-rendering-silent-failures.md](archive/diff-rendering-silent-failures.md) | wiki/ui-customization.md |
| [infrastructure-and-architecture-prerequisites.md](archive/infrastructure-and-architecture-prerequisites.md) | wiki/platform.md |
| [investigation-methodology-and-metadata-discovery.md](archive/investigation-methodology-and-metadata-discovery.md) | wiki/methodology.md |
| [notebooklm-verification-and-codebase-search.md](archive/notebooklm-verification-and-codebase-search.md) | wiki/tools-and-workflows.md |

**Ранние архивы (2026-04-15):**

- [2026-04-15_BPMSOFT_CONFIGURATION_ANALYSIS_3.md](archive/2026-04-15_BPMSOFT_CONFIGURATION_ANALYSIS_3.md) — монолитный анализ конфигурации (заменён wiki/)
- [2026-04-15_PROJECT_KNOWLEDGE.md](archive/2026-04-15_PROJECT_KNOWLEDGE.md) — старые знания о CC-проекте (заменён wiki/projects/)
- [2026-04-15_PROJECT_INSTRUCTIONS.md](archive/2026-04-15_PROJECT_INSTRUCTIONS.md) — дублировал CLAUDE.md
- [2026-04-15_skill-system-prompt.md](archive/2026-04-15_skill-system-prompt.md) — системный промпт скилла (не вики)
- [2026-04-15_references_architecture-packages.md](archive/2026-04-15_references_architecture-packages.md) — влит в wiki/platform.md
- [2026-04-15_references_bpmn-processes.md](archive/2026-04-15_references_bpmn-processes.md) — влит в wiki/processes.md
- [2026-04-15_references_no-code-tools.md](archive/2026-04-15_references_no-code-tools.md) — влит в wiki/ui-customization.md
- [2026-04-15_references_uids-and-schemas.md](archive/2026-04-15_references_uids-and-schemas.md) — влит в wiki/cti-package.md
- [2026-04-15_TROUBLESHOOTING.md](archive/2026-04-15_TROUBLESHOOTING.md) — влит в wiki/troubleshooting.md
