# Индикатор режима обслуживания — история подходов

## История подходов

| # | Подход | Результат | Причина |
| --- | --- | --- | --- |
| 1 | `itemType: 6` (LABEL) в `ProfileContainer` | DOM-элемент есть, но пустой | `ProfileContainer` рендерит только модельные элементы, standalone LABEL не проходит через его pipeline |
| 2 | `"generator": "method"` в diff | Ошибка RequireJS | `generator` загружает AMD-модуль, а не метод viewModel |
| 3 | Container `itemType: 7` + `innerHTML` | Контейнер не создаётся в DOM | `ProfileContainer` не поддерживает произвольные контейнеры |
| 4 | **`contentType: BPMSoft.ContentType.LABEL`** | **Работает** | Модельный элемент с типом отображения LABEL. Найден в документации (`klientskaya-razrabotka.pdf`, стр. 972) |

## Ключевой урок: itemType vs contentType

В BPMSoft **`itemType`** и **`contentType`** — разные свойства:

- `itemType: BPMSoft.ViewItemType.LABEL` (= 6) — standalone виджет Label, не поддерживается ProfileContainer
- `contentType: BPMSoft.ContentType.LABEL` — модельный элемент, отображаемый как текстовая надпись. Работает в ProfileContainer

## Ключевой урок: CSS-селекторы

Платформа генерирует `<label>` без вложенных элементов:

```html
<label class="t-label usr-service-mode-label usr-service-mode-calendar">24×7 (календарное время)</label>
```

Поэтому CSS-селекторы должны быть `.class1.class2` (оба класса на одном элементе), а НЕ `.class1 .class2` (вложенность).

## Ключевой урок: подключение CSS-модуля через `css!`

Чтобы LESS-стили из `UsrCasePageCSS` загружались в страницу, модуль должен быть подключён через AMD-зависимость с префиксом `css!`:

```javascript
define("CasePage", ["css!UsrCasePageCSS"], function() {
```

Без префикса `css!` — BPMSoft загружает модуль как обычный JS-AMD, LESS не применяется. Симптом: индикатор появляется (текст виден), но без цвета и фона.

## Журнал изменений

| Дата | Изменение |
| --- | --- |
| 2026-04-05 | Документ создан. |
| 2026-04-06 | Внедрено на тесте. CSS-схема как «Модуль», стили LESS. Подходы 1-3 не сработали. |
| 2026-04-07 | Подход 4 (`contentType: LABEL`) — индикатор работает. |
| 2026-04-07 | Исправлены CSS-селекторы: `.class1.class2` вместо `.class1 .class2`. |
| 2026-04-07 | Восстановлена потерянная подписка `onServicePactChanged` в dependencies ServicePact. |
| 2026-04-11 | Перенесено на прод. Добавлен урок про `css!UsrCasePageCSS` в define. |
