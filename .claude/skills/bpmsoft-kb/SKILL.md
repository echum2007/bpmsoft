# BPMSoft Knowledge Base

Ищет информацию в онлайн-базе знаний BPMSoft через Playwright MCP.

## Использование

`/bpmsoft-kb [запрос]`

Например:
- `/bpmsoft-kb уведомления по обращениям`
- `/bpmsoft-kb как добавить поле на страницу`
- `/bpmsoft-kb EntityEventListener`

## Алгоритм

### Шаг 1 — Найти точный URL статьи через WebSearch (СНАЧАЛА ВСЕГДА ЭТО)

**Не угадывай URL вручную.** Используй WebSearch с фильтром домена:

```
WebSearch: "<тема запроса> BPMSoft"
allowed_domains: ["edu.bpmsoft.ru", "bpmsoft.ru"]
```

Из результатов берёшь точный URL статьи вида `https://edu.bpmsoft.ru/baza-znaniy/.../?version=1.9`.
Это надёжнее, чем навигация вслепую по разделам.

### Шаг 2 — Проверить сессию и авторизоваться при необходимости

Признак того, что сессия сброшена: `edu.bpmsoft.ru/...` редиректит на `bpmsoft.ru/...` с ошибкой 404.

Порядок авторизации:
1. Перейти на `https://bpmsoft.ru/avtorizatsiya/`
2. Дождаться диалога авторизации (он открывается автоматически)
3. Заполнить: Email `e.chumak@cti.ru`, Пароль `Chum!004`
4. Нажать «Войти» — редирект на `bpmsoft.ru/`

После этого `edu.bpmsoft.ru` становится доступным.

### Шаг 3 — Навигация по базе знаний

⚠️ **НИКОГДА не использовать `browser_navigate` с URL содержащим путь к базе знаний.**
Модель систематически генерирует неправильный вариант `baza-zaniy` (5 букв: z-a-n-i-y) вместо корректного (6 букв: z-n-a-n-i-y). Это происходит на уровне токенизации и не поддаётся самоконтролю.

**Всегда** навигировать через `browser_evaluate` с конкатенацией строк:
```js
() => {
  const url = 'https://edu.bpmsoft.ru/baza-' + 'z' + 'n' + 'a' + 'n' + 'i' + 'y' + '/ПУТЬ/?version=1.9';
  window.location.href = url;
  return url;
}
```

Признак успеха: `Page URL` начинается с `edu.bpmsoft.ru`.
Признак ошибки/редиректа: URL начинается с `bpmsoft.ru` — сессия сброшена или путь неверный.

Чтобы найти ссылки на подстатьи, использовать `browser_evaluate`:
```js
() => {
  const links = Array.from(document.querySelectorAll('a'));
  return links
    .filter(a => a.href.includes('edu.bpmsoft.ru') && a.href.includes('КЛЮЧЕВОЕ_СЛОВО'))
    .map(a => ({href: a.href, text: a.textContent.trim().substring(0, 100)}));
}
```

### Шаг 4 — Прочитать статью

```js
() => document.querySelector('main')?.innerText || document.body.innerText
```

### Шаг 5 — Если статья недоступна через браузер

Попробовать получить через PDF-экспорт (работает без авторизации):
`https://bpmsoft.ru/docs/export?iblock=169&type=article&id=ID`
(ID из URL статьи, iblock зависит от версии: 165=v1.7, 169=v1.8)

Или использовать `WebFetch` напрямую по URL статьи.

## Карта разделов базы знаний (edu.bpmsoft.ru/baza-znaniy/)

| Раздел | URL | Что внутри |
|--------|-----|-----------|
| Серверная разработка | `servernaya-razrabotka/` | Back-end C#, ORM, кэш, отладка |
| Данные (клиент) | `dannye/` | EntitySchemaQuery, DataManager, примеры |
| Клиентская разработка | `klientskaya-razrabotka/` | JS, AMD, страницы |
| Событийный слой | `sobytiynyy-sloy/` | EntityEventListener |
| Веб-сервисы | `veb-servisy-servernaya-razrabotka/` | REST-сервисы |
| Кастомизация no-code | `kastomizatsiya-no-code-1.0/` | Мастер разделов, правила |
| Бизнес-процессы | `biznes-protsessy/` | BPMN, дизайнер процессов |
| Управление сервисом | `upravlenie-servisom/` | Обращения, SLA |
| Диагностика | `diagnostika/` | Принципы, проблемы развёртывания |
| Утилиты | `utility/` | UBS, утилита диагностики |
| Магазин приложений | `magazin-prilozheniy/` | Доп. приложения (может требовать auth) |
| Начало разработки | `start-razrabotki/` | Настройка IDE, git |
| Общие принципы | `obshchie-printsipy-razrabotki/` | Замещение, SQL-сценарии |

**Карта сайта:** `https://edu.bpmsoft.ru/sitemap/`

## Правила

- **Сначала WebSearch** — находи URL, потом иди по нему, не угадывай
- Всегда добавлять `?version=1.9` к URL статьи
- Если редирект на `bpmsoft.ru` — сессия сброшена, нужна повторная авторизация
- При поиске ссылок на странице — использовать `browser_evaluate` с фильтрацией, не `browser_snapshot` (snapshot слишком большой)
- Возвращать конкретные инструкции из статей, а не пересказ
