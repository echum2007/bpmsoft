# Validation Issue — Валидация поля UsrCcEmails на CasePage и ServicePactPage

## Задача
Добавить клиентскую валидацию формата email-адресов в поле `UsrCcEmails` на страницах:
- `CasePage` (обращения) — пакет CTI
- `ServicePactPage` (сервисные договоры) — пакет CTI

Валидация должна срабатывать при сохранении записи, смене статуса и других действиях через `validate()`.

---

## Правильный механизм валидации (из документации BPMSoft)

Согласно `klientskaya-razrabotka.pdf` раздел «Добавление валидации» (стр. ~409):

```javascript
methods: {
    // Переопределение базового метода — вызывается платформой при инициализации
    setValidationConfig: function() {
        this.callParent(arguments);
        this.addColumnValidator("UsrCcEmails", this.validateCcEmails);
    },

    validateCcEmails: function(value) {
        var cc = value || this.get("UsrCcEmails");
        if (!cc || !cc.trim()) {
            return { invalidMessage: "" };
        }
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        var parts = cc.split(/[;,]/);
        var invalid = [];
        Ext.Array.each(parts, function(part) {
            var trimmed = part.trim();
            if (trimmed && !emailRegex.test(trimmed)) {
                invalid.push(trimmed);
            }
        });
        if (invalid.length > 0) {
            return {
                invalidMessage: "Некорректный формат адресов в поле CC: " + invalid.join(", ")
            };
        }
        return { invalidMessage: "" };
    },
}
```

Механизм `validators` в блоке `attributes` — **НЕ работает** в BPMSoft. Это тупиковый путь.

---

## Текущее состояние кода

Код `setValidationConfig` и `validateCcEmails` добавлен в схемы в системе:
- Виден в Конфигурации → CTI → CasePage → вкладка «Исходный код»
- Виден в Мастере раздела → форма обращения → вкладка «Исходный код»
- В БД присутствует (проверено через SQL `LIKE '%setValidationConfig%'`)

Но в браузере методы **не загружаются**. Проверка через консоль:
```javascript
BPMSoft.require(["CasePage"], function(schema) {
    console.log(Object.keys(schema.methods || {}));
});
// Результат: ['startBackgroundUpdater', 'runBackgroundUpdate', 'onEntityInitialized',
//             'onAccountChanged', 'onServicePactChanged', 'updServicePactsByAccount',
//             'updConfItemsByAccount', 'onConfItemChanged']
// setValidationConfig и validateCcEmails ОТСУТСТВУЮТ
```

---

## Что было проверено и не помогло

### Гипотеза 1 — Неверный механизм (`validators` в `attributes`)
**Попытка:** Объявить атрибут `UsrCcEmails` с `validators: { validateCcEmails: { type: BPMSoft.ValidationType.CUSTOM, method: "validateCcEmails" } }`

**Результат:** Не работает. `type` не резолвится (BPMSoft недоступен в момент парсинга атрибутов). Даже с `type: "custom"` — валидатор не регистрируется.

**Вывод:** Механизм `validators` в `attributes` не поддерживается для пользовательских валидаторов в BPMSoft.

---

### Гипотеза 2 — Кэш браузера
**Попытка:** Ctrl+Shift+R, очистка через F12 → Application → Clear site data

**Результат:** Не помогло. Браузер продолжает загружать старую версию схемы.

---

### Гипотеза 3 — Кэш Redis на сервере
**Попытка:** Дизайнер системы → «Очистить кэш Redis»

**Результат:** Не помогло.

---

### Гипотеза 4 — Схема CasePage заблокирована
**Наблюдение:** В свойствах схемы CasePage в Конфигурации стоит галочка «Заблокированный».

**Попытка:** SQL запрос:
```sql
UPDATE "SysSchema"
SET "Locked" = false
WHERE "Name" = 'CasePage'
  AND "SysPackageId" = (SELECT "Id" FROM "SysPackage" WHERE "Name" = 'CTI');
```

**Результат:** Не помогло. Методы по-прежнему не появляются в браузере.

---

### Гипотеза 5 — Неверная схема (CasePage vs CasePageV2)
**Наблюдение:** В Конфигурации существует 9 замещений `CasePage` и 5 замещений `CasePageV2` в разных пакетах (Case, SLM, SLMITILService, CaseService, ServiceEnterpriseDefSettings).

**Проверка:** Мастер раздела формы обращений показывает название схемы `CasePage` (не V2). Значит реальная страница работает через `CasePage`.

**Попытка:** Создать замещение `CasePageV2` — отвергнуто после проверки мастера раздела.

**Вывод:** Схема правильная — `CasePage`, не `CasePageV2`.

---

### Гипотеза 6 — all-combined.js / режим отладки
**Наблюдение:** Из документации — клиентские скрипты минифицируются и собираются в `all-combined.js`. Без режима отладки браузер загружает именно его.

**Попытка:** Включить `isDebug`:
```javascript
BPMSoft.SysSettings.postPersonalSysSettingsValue("IsDebug", true)
```
Перезагрузка страницы (F5).

**Результат:** Не помогло. Методы по-прежнему отсутствуют.

---

### Гипотеза 7 — require.undef (принудительная перезагрузка модуля)
**Попытка:**
```javascript
require.undef("CasePage");
BPMSoft.require(["CasePage"], function(schema) {
    console.log(Object.keys(schema.methods || {}));
});
```

**Результат:** Не помогло. Те же старые методы.

---

## Что ещё не проверено

- Полная пересборка через WorkspaceConsole (`BuildWorkspace` / `ReBuildWorkspace`)
- Проверить содержимое `all-combined.js` напрямую — есть ли там `setValidationConfig`
- Проверить нет ли ошибки компиляции схемы (возможно код не компилируется из-за синтаксической ошибки в комментариях с кириллицей или символами — и молча игнорируется)
- Попробовать минимальный тест: добавить `console.log("CasePage loaded")` в `onEntityInitialized` чтобы убедиться что наше замещение вообще загружается
- Проверить `IsChanged` в `SysSchema` — помечена ли схема как изменённая после редактирования

---

## Ключевые SQL запросы для диагностики

```sql
-- Проверить содержимое схемы в БД
SELECT "ModifiedOn",
       CASE WHEN "Body" LIKE '%setValidationConfig%' THEN 'ДА' ELSE 'НЕТ' END AS "HasSetValidationConfig",
       CASE WHEN "Body" LIKE '%validateCcEmails%' THEN 'ДА' ELSE 'НЕТ' END AS "HasValidateCcEmails",
       "Locked",
       "IsChanged"
FROM "SysSchema"
WHERE "Name" = 'CasePage'
  AND "SysPackageId" = (SELECT "Id" FROM "SysPackage" WHERE "Name" = 'CTI');

-- Посмотреть все замещения CasePage
SELECT s."Name", p."Name" AS "Package", s."ModifiedOn", s."Locked", s."IsChanged"
FROM "SysSchema" s
JOIN "SysPackage" p ON s."SysPackageId" = p."Id"
WHERE s."Name" = 'CasePage'
ORDER BY s."ModifiedOn" DESC;
```

---

## Контекст проекта

- **Платформа:** BPMSoft 1.9, .NET 8, Linux/Kestrel
- **Пакет:** CTI (UId: `21b087cf-bb70-cdc0-5180-6979fdd2220c`)
- **Схема CasePage в CTI:** UId `17fc86cf-3425-49a8-ba13-840c514bf34d`, родитель `CasePage` (UId `73c75b87-44f4-4ab1-9ebb-6373a1f3903d`), `ExtendParent: true`
- **Поле:** `UsrCcEmails` (строка 500) — добавлено через мастер раздела, физически существует в БД
- **Разделитель адресов в Activity.CopyRecepient:** ` ; ` (пробел, точка с запятой, пробел) — стандарт платформы
