---
title: NotebookLM — актуальный состав блокнотов (после аудита 2026-04-20)
slug: notebooklm-notebooks-curated
tags:
  - notebooklm
  - documentation
  - knowledge-base
sources:
  - session/2026-04-20-night
created: 2026-04-20
updated: 2026-04-20
---

## Key Points

- Все 7 блокнотов приведены в порядок: мусор удалён, добавлены правильные источники под конкретные версии стека
- learn.microsoft.com **загружается** в NotebookLM (проверено 2026-04-20)
- BPMN спецификация загружена как PDF файл (`bpmn20-formal-13-12-09.pdf`) — единственный надёжный способ
- PostgreSQL: только версия **12** (соответствует dev-серверу), 14/17/18 удалены

## Актуальный состав блокнотов

| Блокнот | UUID | Источников | Что внутри |
|---------|------|-----------|------------|
| BPMSoft Documentation | `eb410184-caa8-42fe-92b4-6f1971f4425f` | 30 | PDF документация BPMSoft 1.9 — не трогать |
| Backend & Infrastructure Stack | `0c1bba11-acba-4eda-a893-a5964378147c` | 19 | OAuth 2.0, SMTP RFC 5321, IMAP RFC 3501, Redis 7, PostgreSQL 12, Kestrel, REST, OpenAPI |
| Data-Driven System Analysis & OAuth | `841311ac-1245-4b76-a1f2-352ed8c3539c` | 12 | Наши .md файлы по системному анализу — не трогать |
| Angular 18.2 Modern Frontend | `d545f7f8-575b-400d-9ca0-ce6e8da0e43e` | 7 | Angular docs, Angular Elements, Components, DI, Routing |
| Sencha ExtJS 4 Complete Guide | `5a51c51e-ae09-4265-a42f-127c6a9c6ce9` | 7 | API docs, Getting Started, Class System, Components, Data, MVC |
| BPMN 2.0 Specification and Guide | `ae040e01-cddd-4441-a79b-14d0bb249f94` | 1 | Полная спецификация BPMN 2.0 (PDF, formal-13-12-09) |
| Modern .NET and C# Development | `ceb5a347-06e6-4115-bd82-d7feec387716` | 5 | C# Language Reference, DI, Async, .NET 8 API, ASP.NET Core |

## Стек и версии (зафиксированы)

| Технология | Версия | Источник данных |
|-----------|--------|----------------|
| .NET | 8.0.420 | dev-сервер 2026-04-19 |
| PostgreSQL | 12.22 | dev-сервер 2026-04-19 |
| Redis | 7.0.15 | dev-сервер 2026-04-19 |
| ExtJS | 4.2 | платформа BPMSoft |
| Angular | 18.2 | платформа BPMSoft 1.9 |
| BPMN | 2.0 | платформа BPMSoft |
| OS | Debian 6.1.0-32-amd64 | dev-сервер |

## Что было удалено

- Backend: `404 - Content not found`, PostgreSQL 17/18, linux.die.net/man, RFC 5321 дубль, json-api.org
- Angular: 3 дубля "Introduction to Angular docs", "Setting up local environment"
- Modern .NET: "Реестр ссылок" (пустой текстовый файл)
- BPMN: 3 страницы "About" (только оглавления без контента)

## Related Concepts

- [[concepts/notebooklm-documentation-strategy-alert-rules]] — правила алертов при недоступности
- [[concepts/notebooklm-documentation-strategy]] — стратегия использования
