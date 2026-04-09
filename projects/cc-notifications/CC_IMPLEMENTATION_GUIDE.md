# Инструкция по внедрению CC-адресов в email-уведомления по обращениям

**Проект:** BPMSoft 1.9, пакет CTI (`21b087cf-bb70-cdc0-5180-6979fdd2220c`)  
**Дата начала:** 2026-03-30  
**Статус:** ✅ Перенесено на продуктив, тестирование (2026-04-09)

---

## Суть задачи

Добавить поддержку CC-адресов в email-уведомлениях по обращениям (Case):

1. **Исходящие уведомления:** CC-адреса из обращения и/или сервисного договора автоматически подставляются в поле «Копия» при отправке любого исходящего email по обращению.
2. **Входящие письма:** CC-адреса из входящего письма автоматически сохраняются в обращение (дубли исключаются), чтобы все последующие уведомления шли на эти адреса.
3. **Валидация ввода:** при сохранении записи проверяется формат email-адресов в поле CC — некорректные адреса блокируют сохранение с информативным сообщением.

---

## Архитектурное решение

- **Хранение CC:** текстовые колонки `UsrCcEmails` (строка 500) в объектах `Case` и `ServicePact`. Формат: адреса через пробел (как стандартное поле `Activity.CopyRecepient`).
- **Точка интеграции:** `EntityEventListener` на объекте `Activity` — перехватывает событие `OnSaving`, обрабатывает оба направления (входящие и исходящие).
- **Почему EventListener, а не BPMN:** покрывает все пути отправки (старый BPMN через `ActivityEmailSender`, будущий мультиязычный путь, ручная отправка) одним компонентом.
- **Приоритет источников CC (исходящие):** адреса из `Case.UsrCcEmails` и `ServicePact.UsrCcEmails` объединяются, дубли исключаются.
- **Входящие:** CC из письма дописывается в `Case.UsrCcEmails` с дедупликацией.
- **Валидация:** клиентская, через механизм `setValidationConfig` + `addColumnValidator` на страницах CasePage и ServicePactPage.

### Guid констант (получены из БД тестовой системы)

| Константа | Guid |
|---|---|
| EmailActivityTypeId (ActivityType) | `e2831dec-cfc0-df11-b00f-001d60e938c6` |
| OutgoingMessageTypeId | `7f6d3f94-f36b-1410-068c-20cf30b39373` |
| Входящие письма | `MessageTypeId = NULL (Guid.Empty)` |

---

## Компоненты (8 шагов)

| # | Артефакт | Тип | Способ создания | Пакет | Статус |
|---|---|---|---|---|---|
| 1 | Колонка `UsrCcEmails` в `Case` | Колонка объекта | UI: дизайнер объекта | CTI | ✅ Выполнено |
| 2 | Колонка `UsrCcEmails` в `ServicePact` | Колонка объекта | UI: дизайнер объекта | CTI | ✅ Выполнено |
| 3 | Поле CC на `CasePage` | UI: мастер раздела | Настройка вида → Открыть мастер раздела | CTI | ✅ Выполнено |
| 4 | Поле CC на `ServicePactPage` | UI: мастер раздела | Настройка вида → Открыть мастер раздела | CTI | ✅ Выполнено |
| 5 | `UsrCcAddressResolver` | C# (Исходный код) | Конфигурация → Добавить → Исходный код | CTI | ✅ Выполнено |
| 6 | `UsrActivityCcEventListener` | C# (Исходный код) | Конфигурация → Добавить → Исходный код | CTI | ✅ Выполнено |
| 7 | Валидация CC на `CasePage` | JS (точечная правка) | Конфигурация → CTI → CasePage → Исходный код | CTI | ✅ Выполнено |
| 8 | Валидация CC на `ServicePactPage` | JS (точечная правка) | Конфигурация → CTI → ServicePactPage → Исходный код | CTI | ✅ Выполнено |

---

## Шаг 1. Колонка `UsrCcEmails` в объекте Case

**Статус:** ✅ Выполнено

### Что делаем
Добавляем текстовую колонку для хранения CC-адресов на уровне обращения.

### Инструкция
1. Открыть раздел **Конфигурация**
2. Найти схему **Case** в пакете **CTI** (UId замещения: `19cc53cb-28eb-4288-bd79-cea46e02bff4`)
3. Открыть схему → перейти в дизайнер объекта
4. Нажать **«Добавить колонку»** → тип **«Текст»**
5. Заполнить параметры:

| Параметр | Значение |
|---|---|
| Название | `UsrCcEmails` |
| Заголовок | `CC (дополнительные получатели)` |
| Тип | Текст |
| Размер | `500` |
| Обязательное | Нет |
| Мультиязычное | Нет |

6. Нажать **«Сохранить»** → **«Опубликовать»**

### Проверка
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'Case' AND column_name = 'UsrCcEmails';
```
Должна вернуться 1 строка.

---

## Шаг 2. Колонка `UsrCcEmails` в объекте ServicePact

**Статус:** ✅ Выполнено

### Что делаем
Добавляем аналогичную колонку в сервисный договор — для CC-адресов по умолчанию для всех обращений по договору.

### Инструкция
1. Открыть раздел **Конфигурация**
2. Найти схему **ServicePact** в пакете **CTI** (UId замещения: `46e84fce-9ad8-4b09-8407-281cbb4cb824`)
3. Открыть схему → перейти в дизайнер объекта
4. Нажать **«Добавить колонку»** → тип **«Текст»**
5. Заполнить параметры:

| Параметр | Значение |
|---|---|
| Название | `UsrCcEmails` |
| Заголовок | `CC (дополнительные получатели)` |
| Тип | Текст |
| Размер | `500` |
| Обязательное | Нет |
| Мультиязычное | Нет |

6. Нажать **«Сохранить»** → **«Опубликовать»**

### Проверка
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'ServicePact' AND column_name = 'UsrCcEmails';
```

---

## Шаг 3. Поле CC на странице обращения (CasePage)

**Статус:** ✅ Выполнено

> ⚠️ Выполнять после завершения Шага 1.

### Что делаем
Добавляем поле `UsrCcEmails` на страницу редактирования обращения. Замещение `CasePage` в CTI уже существует (UId: `17fc86cf-3425-49a8-ba13-840c514bf34d`).

### Инструкция
1. Открыть раздел **Обращения**
2. Открыть любую запись → кнопка **«Настройка вида»** → **«Открыть мастер раздела»**
3. Перейти на вкладку **Страница редактирования**
4. Добавить поле → выбрать колонку **`UsrCcEmails`**
5. Заголовок поля: `CC (дополнительные получатели)`
6. Нажать **«Сохранить»**

> ℹ️ В мастере раздела нет кнопки «Опубликовать» — кнопка называется «Сохранить», изменения применяются автоматически.

---

## Шаг 4. Поле CC на странице сервисного договора (ServicePactPage)

**Статус:** ✅ Выполнено

> ⚠️ Выполнять после завершения Шага 2.

### Что делаем
Добавляем поле `UsrCcEmails` на страницу сервисного договора. Замещение `ServicePactPage` в CTI уже существует (UId: `f7a41e49-b2a3-4f00-a31d-da14efe43756`).

### Инструкция
1. Открыть раздел **Сервисные договоры**
2. Открыть любую запись → кнопка **«Настройка вида»** → **«Открыть мастер раздела»**
3. Перейти на вкладку **Страница редактирования**
4. Добавить поле → выбрать колонку **`UsrCcEmails`**
5. Заголовок поля: `CC (дополнительные получатели)`
6. Нажать **«Сохранить»**

---

## Шаг 5. C#-класс `UsrCcAddressResolver`

**Статус:** ✅ Выполнено

> ⚠️ Выполнять после завершения Шагов 1 и 2.

### Что делаем
Вспомогательный C#-класс. Отвечает за:
- Чтение CC-адресов из обращения и связанного сервисного договора (метод `GetCcForCase`)
- Сохранение CC-адресов из входящего письма в обращение с дедупликацией (метод `MergeIncomingCcToCase`)
- Объединение строк адресов с исключением дублей (метод `MergeAddresses`)

### Инструкция по созданию схемы
1. Открыть раздел **Конфигурация**
2. Выбрать пакет **CTI**
3. Нажать **«Добавить»** → **«Исходный код»**
4. Название схемы: `UsrCcAddressResolver`
5. Вставить код (см. ниже)
6. **Сохранить** → **Опубликовать**

> ⚠️ Требуется `using BPMSoft.Common` для extension-метода `GetColumnValue` на `IDataReader`.

### Код

```csharp
namespace BPMSoft.Configuration
{
    using System;
    using System.Collections.Generic;
    using BPMSoft.Common;
    using BPMSoft.Core;
    using BPMSoft.Core.DB;

    public class UsrCcAddressResolver
    {
        private readonly UserConnection _userConnection;

        public UsrCcAddressResolver(UserConnection userConnection)
        {
            _userConnection = userConnection;
        }

        /// <summary>
        /// Возвращает объединённую строку CC-адресов для обращения.
        /// Адреса из Case.UsrCcEmails и ServicePact.UsrCcEmails объединяются,
        /// дубли исключаются.
        /// </summary>
        public string GetCcForCase(Guid caseId)
        {
            if (caseId == Guid.Empty)
                return string.Empty;

            string caseCc = string.Empty;
            string pactCc = string.Empty;

            var select = new Select(_userConnection)
                    .Column("Case", "UsrCcEmails")
                    .Column("ServicePact", "UsrCcEmails").As("PactCcEmails")
                .From("Case")
                .LeftOuterJoin("ServicePact")
                    .On("Case", "ServicePactId").IsEqual("ServicePact", "Id")
                .Where("Case", "Id").IsEqual(Column.Parameter(caseId))
                as Select;

            using (var dbExecutor = _userConnection.EnsureDBConnection())
            using (var reader = select.ExecuteReader(dbExecutor))
            {
                if (reader.Read())
                {
                    caseCc = reader.GetColumnValue<string>("UsrCcEmails") ?? string.Empty;
                    pactCc = reader.GetColumnValue<string>("PactCcEmails") ?? string.Empty;
                }
            }

            return MergeAddresses(caseCc, pactCc);
        }

        /// <summary>
        /// Дописывает новые CC-адреса в Case.UsrCcEmails.
        /// Дубли исключаются. Текущее значение поля читается из БД,
        /// мержится с новыми адресами и сохраняется обратно.
        /// </summary>
        public void MergeIncomingCcToCase(Guid caseId, string incomingCc)
        {
            if (caseId == Guid.Empty || string.IsNullOrEmpty(incomingCc))
                return;

            // Читаем текущее значение Case.UsrCcEmails
            string currentCaseCc = string.Empty;

            var select = new Select(_userConnection)
                    .Column("Case", "UsrCcEmails")
                .From("Case")
                .Where("Case", "Id").IsEqual(Column.Parameter(caseId))
                as Select;

            using (var dbExecutor = _userConnection.EnsureDBConnection())
            using (var reader = select.ExecuteReader(dbExecutor))
            {
                if (reader.Read())
                    currentCaseCc = reader.GetColumnValue<string>("UsrCcEmails") ?? string.Empty;
            }

            // Мержим и исключаем дубли
            var merged = MergeAddresses(currentCaseCc, incomingCc);

            // Если ничего не изменилось — не пишем в БД
            if (merged == currentCaseCc)
                return;

            // Сохраняем обратно
            var update = new Update(_userConnection, "Case")
                .Set("UsrCcEmails", Column.Parameter(merged))
                .Where("Id").IsEqual(Column.Parameter(caseId))
                as Update;

            update.Execute();
        }

        /// <summary>
        /// Объединяет две строки с адресами, исключает дубли (без учёта регистра).
        /// Поддерживает разделители: пробел и точка с запятой.
        /// Нормализует токены: убирает угловые скобки, пропускает части отображаемых имён.
        /// Пример входящего формата: "User Name <user@example.com>" → сохраняется "user@example.com"
        /// </summary>
        public string MergeAddresses(string first, string second)
        {
            var separators = new[] { ' ', ';' };
            var addresses = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var addr in first.Split(separators, StringSplitOptions.RemoveEmptyEntries))
            {
                var normalized = NormalizeEmailToken(addr.Trim());
                if (!string.IsNullOrEmpty(normalized))
                    addresses.Add(normalized);
            }

            foreach (var addr in second.Split(separators, StringSplitOptions.RemoveEmptyEntries))
            {
                var normalized = NormalizeEmailToken(addr.Trim());
                if (!string.IsNullOrEmpty(normalized))
                    addresses.Add(normalized);
            }

            return string.Join("; ", addresses);
        }

        /// <summary>
        /// Нормализует один токен из строки с адресами.
        /// Убирает угловые скобки: &lt;email@example.com&gt; → email@example.com.
        /// Возвращает null для токенов без «@» (это части отображаемого имени).
        /// </summary>
        private static string NormalizeEmailToken(string token)
        {
            if (string.IsNullOrEmpty(token))
                return null;

            // Убираем угловые скобки: <email@example.com> → email@example.com
            if (token.StartsWith("<") && token.EndsWith(">"))
                token = token.Substring(1, token.Length - 2).Trim();

            // Пропускаем токены без @ — это части отображаемого имени (Display Name)
            if (!token.Contains("@"))
                return null;

            return token;
        }
    }
}
```

---

## Шаг 6. C#-класс `UsrActivityCcEventListener`

**Статус:** ✅ Выполнено

> ⚠️ Выполнять после завершения Шага 5. После публикации требуется перезапуск Kestrel.

### Что делаем
`EntityEventListener` на объекте `Activity`. Обрабатывает два сценария:
1. **Исходящее письмо** — дописывает CC из обращения и сервисного договора в `Activity.CopyRecepient` перед сохранением.
2. **Входящее письмо** — сохраняет CC-адреса из письма в `Case.UsrCcEmails` через `UsrCcAddressResolver`.

### Инструкция по созданию схемы
1. Открыть раздел **Конфигурация**
2. Выбрать пакет **CTI**
3. Нажать **«Добавить»** → **«Исходный код»**
4. Название схемы: `UsrActivityCcEventListener`
5. Вставить код (см. ниже)
6. **Сохранить** → **Опубликовать**
7. **Перезапустить Kestrel** — EventListener регистрируется при старте приложения

### Код

```csharp
namespace BPMSoft.Configuration
{
    using System;
    using BPMSoft.Core.Entities;
    using BPMSoft.Core.Entities.Events;

    /// <summary>
    /// EntityEventListener на объекте Activity.
    /// Обрабатывает два сценария для email-активностей, связанных с обращением:
    /// 1. Исходящее письмо — дописывает CC из Case.UsrCcEmails и ServicePact.UsrCcEmails
    ///    в поле Activity.CopyRecepient перед отправкой.
    /// 2. Входящее письмо — сохраняет CC-адреса из письма в Case.UsrCcEmails
    ///    (дубли исключаются).
    /// </summary>
    [EntityEventListener(SchemaName = "Activity")]
    public class UsrActivityCcEventListener : BaseEntityEventListener
    {
        /// <summary>
        /// Тип активности "Email" — стандартный справочник ActivityType.
        /// Guid получен из таблицы ActivityType тестовой системы.
        /// </summary>
        private static readonly Guid EmailActivityTypeId =
            new Guid("e2831dec-cfc0-df11-b00f-001d60e938c6");

        /// <summary>
        /// Тип сообщения "Исходящее".
        /// Guid получен из таблицы Activity (DISTINCT MessageTypeId) тестовой системы.
        /// Входящие письма имеют MessageTypeId = NULL (Guid.Empty).
        /// </summary>
        private static readonly Guid OutgoingMessageTypeId =
            new Guid("7f6d3f94-f36b-1410-068c-20cf30b39373");

        /// <summary>
        /// Срабатывает перед сохранением любой Activity.
        /// Фильтрует по типу активности (Email) и наличию связи с обращением,
        /// затем выполняет логику в зависимости от направления письма.
        /// </summary>
        public override void OnSaving(object sender, EntityBeforeEventArgs e)
        {
            var activity = (Entity)sender;

            // Фильтр 1: обрабатываем только Email-активности
            var typeId = activity.GetTypedColumnValue<Guid>("TypeId");
            if (typeId != EmailActivityTypeId)
                return;

            // Фильтр 2: обрабатываем только активности связанные с обращением
            var caseId = activity.GetTypedColumnValue<Guid>("CaseId");
            if (caseId == Guid.Empty)
                return;

            var messageTypeId = activity.GetTypedColumnValue<Guid>("MessageTypeId");
            var userConnection = activity.UserConnection;
            var resolver = new UsrCcAddressResolver(userConnection);

            if (messageTypeId == OutgoingMessageTypeId)
            {
                // Исходящее письмо: дописываем CC из обращения и сервисного договора.
                // ActivityEmailSender читает CopyRecepient из БД при отправке —
                // поэтому достаточно записать адреса в поле до сохранения Activity.
                var additionalCc = resolver.GetCcForCase(caseId);
                if (string.IsNullOrEmpty(additionalCc))
                    return;

                var currentCc = activity.GetTypedColumnValue<string>("CopyRecepient")
                                ?? string.Empty;

                // Объединяем существующие CC с новыми через MergeAddresses (дедупликация)
                var resultCc = resolver.MergeAddresses(currentCc, additionalCc);

                activity.SetColumnValue("CopyRecepient", resultCc);
            }
            else if (messageTypeId == Guid.Empty)
            {
                // Входящее письмо (MessageTypeId = NULL у входящих в данной системе).
                // Сохраняем CC-адреса из письма в обращение, чтобы все последующие
                // исходящие уведомления по этому обращению автоматически шли на эти адреса.
                var incomingCc = activity.GetTypedColumnValue<string>("CopyRecepient")
                                 ?? string.Empty;
                if (string.IsNullOrEmpty(incomingCc))
                    return;

                resolver.MergeIncomingCcToCase(caseId, incomingCc);
            }
        }
    }
}
```

---

## Шаг 7. Валидация CC на странице обращения (CasePage)

**Статус:** ✅ Выполнено

> ⚠️ Выполнять после завершения Шага 3.

### Что делаем
Добавляем клиентскую валидацию формата email-адресов в поле `UsrCcEmails`. При сохранении записи платформа проверяет каждый адрес по формату — некорректные адреса блокируют сохранение.

### ⚠️ КРИТИЧНО: правила редактирования клиентских модулей

1. **Код валидаторов ОБЯЗАТЕЛЬНО должен быть внутри блока `methods: { ... }`**, а не снаружи. Платформа полностью игнорирует функции, объявленные за пределами `methods`.
2. **НЕ заменять весь код схемы** через Конфигурация → Исходный код — это сбрасывает ресурсы локализации (кнопки и надписи переключаются на английский). Вносить только точечные правки.
3. Если локализация всё же сбилась — открыть мастер раздела (Настройка вида), сделать любое косметическое изменение (сдвинуть поле) и сохранить — мастер пересоберёт ресурсы.

### Инструкция

1. Открыть **Конфигурация** → пакет **CTI** → схема **CasePage** → вкладка **Исходный код**
2. Найти блок `methods: {` — он содержит все существующие методы (`startBackgroundUpdater`, `onEntityInitialized`, `onAccountChanged` и т.д.)
3. Найти **последний метод** перед закрывающей `}` блока `methods` (сейчас это `onConfItemChanged`)
4. **После последнего метода, через запятую, вставить два новых метода** (см. код ниже)
5. Убедиться, что оба метода находятся **внутри** `methods: { ... }`, а не после закрывающей `}`
6. **Сохранить** → **Опубликовать**
7. Очистить кэш браузера (Ctrl+Shift+R)

### Код для вставки

Вставляется внутрь `methods: { ... }`, после последнего существующего метода, через запятую:

```javascript
			/**
			 * Переопределение базового метода инициализации валидаторов.
			 * Вызывается платформой автоматически при инициализации страницы.
			 */
			setValidationConfig: function() {
				this.callParent(arguments);
				this.addColumnValidator("UsrCcEmails", this.validateCcEmails);
			},
			/**
			 * Валидатор формата email-адресов в поле CC (UsrCcEmails).
			 * @param {String} value — текущее значение поля.
			 * @returns {Object} { invalidMessage: "" } — OK или текст ошибки.
			 */
			validateCcEmails: function(value) {
				var cc = value || this.get("UsrCcEmails");
				if (!cc || !cc.trim()) {
					return { invalidMessage: "" };
				}
				var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				// Разбиваем по пробелу, точке с запятой и запятой
				// (формат хранения — пробел; ввод вручную может использовать ; или ,)
				var parts = cc.split(/[\s;,]+/);
				var invalid = [];
				Ext.Array.each(parts, function(part) {
					var trimmed = part.trim();
					if (!trimmed) { return; }
					// Убираем угловые скобки на случай формата <email@example.com>
					if (trimmed.charAt(0) === "<" && trimmed.charAt(trimmed.length - 1) === ">") {
						trimmed = trimmed.substring(1, trimmed.length - 1);
					}
					// Токены без @ — это части отображаемого имени, пропускаем
					if (trimmed.indexOf("@") === -1) { return; }
					if (!emailRegex.test(trimmed)) {
						invalid.push(trimmed);
					}
				});
				if (invalid.length > 0) {
					return {
						invalidMessage: "Некорректный формат адресов в поле CC: " + invalid.join(", ")
					};
				}
				return { invalidMessage: "" };
			}
```

### Структура кода (куда именно вставлять)

```
define("CasePage", [], function() {
    return {
        entitySchemaName: "Case",
        attributes: { ... },
        details: /**SCHEMA_DETAILS*/{ ... }/**SCHEMA_DETAILS*/,
        ...
        diff: /**SCHEMA_DIFF*/[ ... ]/**SCHEMA_DIFF*/,
        methods: {                              // ← блок methods ОТКРЫВАЕТСЯ тут
            startBackgroundUpdater: function() { ... },
            runBackgroundUpdate: function() { ... },
            onEntityInitialized: function() { ... },
            onAccountChanged: function() { ... },
            onServicePactChanged: function() { ... },
            updServicePactsByAccount: function() { ... },
            updConfItemsByAccount: function() { ... },
            onConfItemChanged: function() { ... },  // ← запятая после последнего существующего метода
            setValidationConfig: function() { ... },  // ← СЮДА (внутри methods)
            validateCcEmails: function(value) { ... }  // ← СЮДА (внутри methods, последний — без запятой)
        },                                      // ← блок methods ЗАКРЫВАЕТСЯ тут
    };
});
```

### Проверка

В консоли браузера (F12) на странице обращения:
```javascript
BPMSoft.require(["CasePage"], function(schema) {
    console.log(Object.keys(schema.methods || {}));
});
```
В списке должны быть `setValidationConfig` и `validateCcEmails`.

Функциональная проверка: ввести в поле CC текст `test` → при сохранении должно появиться сообщение «Некорректный формат адресов в поле CC: test».

---

## Шаг 8. Валидация CC на странице сервисного договора (ServicePactPage)

**Статус:** ✅ Выполнено

> ⚠️ Выполнять после завершения Шага 4. Применяются те же правила, что в Шаге 7.

### Инструкция

1. Открыть **Конфигурация** → пакет **CTI** → схема **ServicePactPage** → вкладка **Исходный код**
2. Найти блок `methods: {` (в ServicePactPage он изначально пустой — `methods: {}`)
3. Вставить два метода **внутрь** `methods: { ... }`
4. **Сохранить** → **Опубликовать**
5. Очистить кэш браузера (Ctrl+Shift+R)

### Код для вставки

Заменить `methods: {}` на:

```javascript
		methods: {
			// Переопределение базового метода инициализации валидаторов.
			// Вызывается платформой автоматически при инициализации страницы.
			setValidationConfig: function() {
				// Обязательно вызываем родительский метод
				this.callParent(arguments);
				// Регистрируем валидатор для поля UsrCcEmails
				this.addColumnValidator("UsrCcEmails", this.validateCcEmails);
			},

			/**
			 * Валидатор формата email-адресов в поле CC (UsrCcEmails).
			 * Вызывается платформой при сохранении записи и смене статуса.
			 *
			 * @param {String} value — текущее значение поля (передаётся платформой).
			 * @returns {Object} { invalidMessage: "" } — ОК,
			 *                   { invalidMessage: "..." } — ошибка, сохранение заблокировано.
			 */
			validateCcEmails: function(value) {
				// Берём значение из параметра или читаем из модели напрямую
				var cc = value || this.get("UsrCcEmails");

				// Пустое поле — ошибки нет, CC не обязательно
				if (!cc || !cc.trim()) {
					return { invalidMessage: "" };
				}

				// Регулярное выражение для проверки формата email.
				// Намеренно упрощённое: полная RFC-валидация избыточна для UI.
				var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

				// Разбиваем по пробелу, точке с запятой и запятой
				// (формат хранения — пробел; ввод вручную может использовать ; или ,)
				var parts = cc.split(/[\s;,]+/);
				var invalid = [];

				Ext.Array.each(parts, function(part) {
					var trimmed = part.trim();
					if (!trimmed) { return; }
					// Убираем угловые скобки на случай формата <email@example.com>
					if (trimmed.charAt(0) === "<" && trimmed.charAt(trimmed.length - 1) === ">") {
						trimmed = trimmed.substring(1, trimmed.length - 1);
					}
					// Токены без @ — это части отображаемого имени, пропускаем
					if (trimmed.indexOf("@") === -1) { return; }
					if (!emailRegex.test(trimmed)) {
						invalid.push(trimmed);
					}
				});

				if (invalid.length > 0) {
					// Показываем конкретные невалидные адреса
					return {
						invalidMessage: "Некорректный формат адресов в поле CC: " + invalid.join(", ")
					};
				}

				return { invalidMessage: "" };
			},
		},
```

### Проверка

В консоли браузера на странице сервисного договора:
```javascript
BPMSoft.require(["ServicePactPage"], function(schema) {
    console.log(Object.keys(schema.methods || {}));
});
```

---

## Тестирование

### ✅ Полное тестирование выполнено (тестовая система)

- ✅ Поле CC заполнено в обращении и сервисном договоре
- ✅ При создании нового сообщения по обращению поле CC заполнилось двумя адресами (из обращения и из договора)
- ✅ Дедупликация работает корректно
- ✅ Валидация CasePage — некорректные адреса блокируют сохранение
- ✅ Валидация ServicePactPage — некорректные адреса блокируют сохранение
- ✅ Сценарий «Исходящие» — письмо ушло с заполненным полем CC
- ✅ Сценарий «Входящие» — `Case.UsrCcEmails` обновился адресами из CC входящего письма, дубли не накапливаются

### Проверка GUID-констант на продуктиве (выполнена перед переносом)

```sql
SELECT "Id" FROM "ActivityType" WHERE "Code" = 'Email';
-- e2831dec-cfc0-df11-b00f-001d60e938c6 ✅ совпадает с кодом

SELECT DISTINCT "MessageTypeId" FROM "Activity" WHERE "MessageTypeId" IS NOT NULL LIMIT 10;
-- 7f6d3f94-f36b-1410-068c-20cf30b39373 ✅ совпадает с кодом
```

**Проверка через SQL после тестов:**
```sql
SELECT "Id", "CopyRecepient", "CaseId", "MessageTypeId", "CreatedOn"
FROM "Activity"
WHERE "TypeId" = 'e2831dec-cfc0-df11-b00f-001d60e938c6'
AND "MessageTypeId" = '7f6d3f94-f36b-1410-068c-20cf30b39373'
ORDER BY "CreatedOn" DESC
LIMIT 10;
```

---

## Чеклист верификации после переноса на прод

После переноса C#-схем на продуктив **обязательно** сверить код с инструкцией:

### UsrCcAddressResolver
- [ ] Метод `MergeAddresses` вызывает `NormalizeEmailToken` для каждого токена (а не просто `addr.Trim()`)
- [ ] Метод `NormalizeEmailToken` присутствует — убирает `<>`, возвращает `null` для токенов без `@`
- [ ] Разделитель в `string.Join`: `"; "` (точка с запятой + пробел), **не** просто `" "` (пробел)

### UsrActivityCcEventListener
- [ ] Блок исходящего письма использует `resolver.MergeAddresses(currentCc, additionalCc)`, **не** `currentCc + " " + additionalCc`

### После публикации
- [ ] Kestrel перезапущен
- [ ] Тестовая отправка: в обращении указан CC-адрес → письмо уходит, адрес в CC ровно один раз
- [ ] Тестовая отправка: адрес с Display Name (`"Иванов Иван <ivanov@example.com>"`) — угловые скобки убраны, адрес нормализован

---

## Известные проблемы и решения

| Проблема | Причина | Решение |
|---|---|---|
| Валидатор не срабатывает | Методы `setValidationConfig` / `validateCcEmails` размещены вне блока `methods: {}` | Перенести оба метода **внутрь** `methods: { ... }` |
| Кнопки «Сохранить», «Действия» на английском | Замена всего кода схемы через Конфигурацию сбрасывает ресурсы локализации | Открыть мастер раздела → сделать косметическое изменение (сдвинуть поле) → Сохранить |
| Метод `validators` в `attributes` не работает | Механизм `validators` в `attributes` не поддерживается для пользовательских валидаторов | Использовать `setValidationConfig` + `addColumnValidator` внутри `methods` |
| CC из входящего письма сохраняется дважды: `email <email>` | `CopyRecepient` хранит адрес в формате `Display Name <email>`, `MergeAddresses` разбивал по пробелу и добавлял оба токена | Добавлен `NormalizeEmailToken`: убирает `<>`, пропускает токены без `@` |
| Валидатор ругается на адреса из входящих писем | JS `split(/[;,]/)` не разбивал по пробелу, а хранение использует `;` как разделитель | Разделитель изменён на `/[\s;,]+/`, добавлена обработка `<email>` и пропуск DisplayName-токенов |
| CC-адрес утраивается в исходящем письме: `email email email` | `OnSaving` срабатывает повторно, а конкатенация `currentCc + " " + additionalCc` не дедуплицирует | Заменена конкатенация на `resolver.MergeAddresses(currentCc, additionalCc)` — HashSet исключает дубли |
| На прод перенесён старый код `UsrCcAddressResolver` | При переносе использовался код из промежуточного состояния, а не финальный из инструкции | Переносить код **строго из инструкции** (шаг 5). Обязательно сверять по чеклисту верификации: наличие `NormalizeEmailToken`, разделитель `"; "` |

---

## Журнал изменений

| Дата | Изменение |
|---|---|
| 2026-03-30 | Документ создан. Шаги 1–6 описаны на уровне инструкций. |
| 2026-04-01 | Шаги 1–6 выполнены в тестовой системе. Добавлен финальный код шагов 5–6. Расширена функциональность: добавлена обработка входящих писем (CC из входящего сохраняется в обращение с дедупликацией). Получены и зафиксированы Guid констант из БД тестовой системы. |
| 2026-04-04 | Добавлены шаги 7–8: клиентская валидация формата email на CasePage и ServicePactPage. Документировано решение проблемы с размещением методов вне блока `methods`. Добавлен раздел «Известные проблемы и решения». |
| 2026-04-08 | Полное тестирование завершено (исходящие и входящие письма). GUID-константы проверены на продуктиве — совпадают. Статус обновлён: ожидает переноса на продуктив. |
| 2026-04-08 | Исправлено два бага: (1) `MergeAddresses` добавлял токен `<email>` как отдельный адрес — добавлен `NormalizeEmailToken`, убирающий `<>` и пропускающий части DisplayName; (2) JS-валидатор разбивал только по `;,`, не по пробелу — разделитель изменён на `/[\s;,]+/`, добавлена обработка `<email>` и токенов без `@`. Разделитель в `string.Join` изменён с пробела на `"; "`. Всё протестировано на тестовой системе — работает корректно. |
| 2026-04-09 | Исправлен баг на проде: CC-адрес утраивался в исходящем письме из-за конкатенации без дедупликации при повторном срабатывании `OnSaving`. Заменено `currentCc + " " + additionalCc` на `resolver.MergeAddresses(currentCc, additionalCc)`. |
| 2026-04-09 | Обнаружено: на прод был перенесён старый код `UsrCcAddressResolver` без `NormalizeEmailToken` и с разделителем `" "` вместо `"; "`. Код в инструкции был правильным — ошибка при переносе. Добавлен чеклист верификации после переноса на прод. |
| 2026-04-09 | Повторный перенос `UsrCcAddressResolver` на прод выполнен. Финальный код с `NormalizeEmailToken` и `MergeAddresses`. Тестирование сценариев в процессе. |
