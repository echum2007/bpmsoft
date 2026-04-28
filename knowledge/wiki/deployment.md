# Деплой и импорт пакетов BPMSoft

**Обновлено:** 2026-04-27  
**Источники:** concepts/bpmsoft-import-fk-dependencies, concepts/lazy-property-pattern-service-initialization, daily/2026-04-24.md

---

## FK-зависимости при импорте пакета

При импорте пакета CTI на целевую среду нередко возникают ошибки FK-ограничений: записи в одной секции ссылаются на строки в другой таблице, которых ещё нет на целевом сервере.

**Типичный случай:** `EmailTemplate.PreviewImageId → SysImage.Id`

Три записи `EmailTemplate` в CTI ссылались на `SysImage`-записи, которые существовали на проде, но отсутствовали на dev.

### Как диагностировать и исправить

1. **Прочитать лог импорта** — в нём указан descriptor UId упавшей секции, но **не** конкретные записи
2. **Определить FK** — какая колонка упавшей таблицы ссылается на какую целевую таблицу
3. **Запросить источник** — найти конкретные FK-значения, которых не хватает на цели
4. **Экспортировать FK-цель** — выгрузить нужные записи из целевой таблицы с прода
5. **Порядок импорта** — сначала FK-цель, потом зависимая таблица (или в одном пакете — BPMSoft сам разберёт порядок)
6. **Повторить импорт** и убедиться что FK-ошибки ушли

### SysImage — безопасная цель для импорта

`SysImage` хранит бинарные данные (превью, иконки) и **не имеет исходящих FK**. Импорт SysImage-записей не создаёт каскадных зависимостей. Единственный риск — коллизия Id, которую BPMSoft обрабатывает через upsert.

### Ограничение лога импорта

Лог BPMSoft сообщает ошибку на уровне секции (descriptor), а не на уровне конкретных записей:

```
Error in data section descriptor: {some-guid}
FK constraint violation on table EmailTemplate
```

Чтобы найти виновную запись — нужно вручную сопоставить экспортированный набор с данными целевой БД.

---

## Паттерн Lazy Property для сервисов C#

Стандартный паттерн BPMSoft для доступа к сервисам — **ленивая инициализация в property getter**, а не в конструкторе.

```csharp
// ✅ Правильно: lazy property через ClassFactory
public class UsrSendEmailToCaseOwnerOnReply
{
    private EmailWithMacrosManager _emailManager;

    private EmailWithMacrosManager EmailManager {
        get {
            if (_emailManager == null) {
                _emailManager = ClassFactory.Get<EmailWithMacrosManager>("UsrEmailWithMacrosManager");
            }
            return _emailManager;
        }
    }
    // Или C# 6+: get => _emailManager ?? (_emailManager = ClassFactory.Get<...>(...));
}

// ❌ Не по-BPMSoft: в конструкторе
public UsrSendEmailToCaseOwnerOnReply() {
    _emailManager = ClassFactory.Get<EmailWithMacrosManager>(...); // плохо
}
```

**Почему так:**
- Сервис создаётся только когда действительно нужен
- Конструктор остаётся лёгким
- Соответствует соглашениям всей платформы (EmailWithMacrosManager, уведомления, задачи)

---

## SysSettings.GetValue — порядок параметров

`SysSettings.GetValue<T>()` принимает `UserConnection` **первым** параметром, ключ настройки — вторым. Обратный порядок компилируется без ошибок, но падает в рантайме.

```csharp
// ✅ Правильно
bool isEnabled = SysSettings.GetValue<bool>(UserConnection, "EmailMessageMultiLanguageV2");
string siteUrl  = SysSettings.GetValue<string>(UserConnection, "SiteUrl");

// ✅ Альтернатива для feature flags
bool isEnabled = FeatureUtilities.GetIsFeatureEnabled(UserConnection, "EmailMessageMultiLanguageV2");

// ❌ Неправильно — компилируется, но возвращает default(T) или бросает исключение
bool isEnabled = SysSettings.GetValue<bool>("EmailMessageMultiLanguageV2", UserConnection);
```

**Почему тихий сбой:** оба параметра — ссылочные типы, компилятор не предупреждает. Runtime не может найти настройку по `UserConnection`-объекту как ключу и возвращает `default(T)` (false/null/0).

---

## Смотри также

- [platform.md](platform.md) — Матрица перезапуска Kestrel после деплоя
- [troubleshooting.md](troubleshooting.md) — Диагностика проблем после деплоя
