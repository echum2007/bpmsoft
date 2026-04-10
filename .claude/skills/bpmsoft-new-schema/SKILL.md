---
name: bpmsoft-new-schema
description: Генерирует C# и JS бойлерплейт для новых схем BPMSoft строго по официальной документации v1.9. Типы: EventListener, Helper, WebService, ESQ-запрос, AMD-модуль JS.
---

# bpmsoft-new-schema

Генерирую бойлерплейт для BPMSoft 1.9 **строго по официальной документации платформы**.

## Как использовать

Укажи тип схемы и имя:
- `/bpmsoft-new-schema EventListener UsrMyListener Case` — слушатель событий для схемы Case
- `/bpmsoft-new-schema Helper UsrEmailHelper` — C#-хелпер
- `/bpmsoft-new-schema WebService UsrMyService` — веб-сервис (.NET 8)
- `/bpmsoft-new-schema WebServiceAnon UsrMyAnonService` — анонимный веб-сервис
- `/bpmsoft-new-schema ESQ Activity` — пример ESQ-запроса к схеме
- `/bpmsoft-new-schema AMD ModuleName` — JavaScript AMD-модуль

Если тип или имя не указаны — спрошу.

---

## Шаблоны (из официальной документации v1.9)

### EventListener
```csharp
namespace BPMSoft.Configuration
{
    using System;
    using BPMSoft.Core;
    using BPMSoft.Core.Entities;
    using BPMSoft.Core.Entities.Events;

    /// <summary>
    /// Слушатель событий схемы {SchemaName}.
    /// Пакет: CTI
    /// ⚠️ После публикации — обязательный перезапуск Kestrel.
    /// ⚠️ Запускается ПОСЛЕ завершения событийных подпроцессов объекта.
    /// </summary>
    [EntityEventListener(SchemaName = "{SchemaName}")]
    public class {ClassName} : BaseEntityEventListener
    {
        // Порядок при создании:  OnSaving → OnInserting → OnInserted → OnSaved
        // Порядок при изменении: OnSaving → OnUpdating  → OnUpdated  → OnSaved
        // Порядок при удалении:  OnDeleting → OnDeleted

        public override void OnSaving(object sender, EntityBeforeEventArgs e) {
            base.OnSaving(sender, e);
            var entity = (Entity)sender;
            var userConnection = entity.UserConnection;
            // e.IsCanceled = true; — отменить сохранение
            // e.KeyValue — Id записи
        }

        public override void OnSaved(object sender, EntityAfterEventArgs e) {
            base.OnSaved(sender, e);
            var entity = (Entity)sender;
            var userConnection = entity.UserConnection;
            // e.PrimaryColumnValue — Id сохранённой записи (Guid)
            // e.ModifiedColumnValues — коллекция изменённых колонок
        }

        public override void OnInserting(object sender, EntityBeforeEventArgs e) {
            base.OnInserting(sender, e);
        }

        public override void OnInserted(object sender, EntityAfterEventArgs e) {
            base.OnInserted(sender, e);
        }

        public override void OnUpdating(object sender, EntityBeforeEventArgs e) {
            base.OnUpdating(sender, e);
        }

        public override void OnUpdated(object sender, EntityAfterEventArgs e) {
            base.OnUpdated(sender, e);
        }

        public override void OnDeleting(object sender, EntityBeforeEventArgs e) {
            base.OnDeleting(sender, e);
        }

        public override void OnDeleted(object sender, EntityAfterEventArgs e) {
            base.OnDeleted(sender, e);
        }
    }
}
```

**Асинхронный вызов из EventListener** (если нужна тяжёлая операция):
```csharp
// В методе-обработчике:
var asyncExecutor = ClassFactory.Get<IEntityEventAsyncExecutor>(
    new ConstructorArgument("userConnection", ((Entity)sender).UserConnection));
var operationArgs = new EntityEventAsyncOperationArgs((Entity)sender, e);
asyncExecutor.ExecuteAsync<{AsyncOperationClassName}>(operationArgs);

// Отдельный класс асинхронной операции:
public class {AsyncOperationClassName} : IEntityEventAsyncOperation
{
    public void Execute(UserConnection userConnection, EntityEventAsyncOperationArgs arguments) {
        var entityId = arguments.EntityId;
        var schemaName = arguments.EntitySchemaName;
        // ❌ НЕ изменять основную сущность внутри — приведёт к некорректным данным
    }
}
```

---

### Helper / Service class
```csharp
namespace BPMSoft.Configuration
{
    using System;
    using BPMSoft.Core;
    using BPMSoft.Core.DB;
    using BPMSoft.Core.Entities;
    using BPMSoft.Common;

    /// <summary>
    /// {Description}
    /// Пакет: CTI
    /// </summary>
    public class {ClassName}
    {
        private readonly UserConnection _userConnection;

        public {ClassName}(UserConnection userConnection) {
            _userConnection = userConnection;
        }
    }
}
```

---

### WebService (.NET 8, с аутентификацией через cookies)

**По документации BPMSoft v1.9 для .NET 8 — ASP.NET, не WCF:**
```csharp
namespace BPMSoft.Configuration
{
    using BPMSoft.Web.Common;
    using BPMSoft.Web.Http.Abstractions;
    using System.ServiceModel;
    using System.ServiceModel.Activation;
    using System.ServiceModel.Web;

    [ServiceContract]
    [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
    public class {ClassName} : BaseService
    {
        [OperationContract]
        [WebInvoke(Method = "POST", BodyStyle = WebMessageBodyStyle.Wrapped,
            RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        public string {MethodName}(string param) {
            // UserConnection доступен через BaseService
            return "OK";
        }
    }
}
```

> ❌ `UriTemplate` в `WebInvoke` — не используется в .NET 8 (это WCF-паттерн старых версий)

**Если нужны сложные данные** — отдельные классы с атрибутами:
```csharp
[DataContract]
public class MyRequest {
    [DataMember]
    public string Name { get; set; }
}
```

---

### WebServiceAnon (анонимный, без аутентификации)

```csharp
namespace BPMSoft.Configuration
{
    using BPMSoft.Web.Common;
    using BPMSoft.Web.Http.Abstractions;
    using System.ServiceModel;
    using System.ServiceModel.Activation;
    using System.ServiceModel.Web;

    [ServiceContract]
    [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
    public class {ClassName} : BaseService
    {
        private SystemUserConnection _systemUserConnection;
        private SystemUserConnection SystemUserConnection {
            get {
                return _systemUserConnection ?? 
                    (_systemUserConnection = (SystemUserConnection)AppConnection.SystemUserConnection);
            }
        }

        [OperationContract]
        [WebInvoke(Method = "POST", BodyStyle = WebMessageBodyStyle.Wrapped,
            RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        public void {MethodName}() {
            BPMSoft.Web.Common.SessionHelper.SpecifyWebOperationIdentity(
                HttpContextAccessor.GetInstance(), SystemUserConnection.CurrentUser);
            // реализация
        }
    }
}
```

После создания схемы нужно добавить в `appsettings.json` (для .NET 8):
```json
"BPMSoft.Configuration.{ClassName}": [
    "/ServiceModel/{ClassName}.svc"
]
```
(В блок `AnonymousRoutes`)

---

### ESQ — запрос к базе данных (C# back-end, по документации v1.9)

```csharp
using BPMSoft.Core;
using BPMSoft.Core.Entities;
using BPMSoft.Common;

// Создание запроса
var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "{SchemaName}");

// Добавление колонок корневой схемы
esq.AddColumn("Id");
esq.AddColumn("Name");

// Колонки связанных схем (прямая связь — LEFT OUTER JOIN по умолчанию)
esq.AddColumn("Contact.Name");       // LEFT OUTER JOIN (по умолчанию)
esq.AddColumn("=Contact.Name");      // INNER JOIN
esq.AddColumn(">Contact.Name");      // LEFT OUTER JOIN (явно)
esq.AddColumn("<Contact.Name");      // RIGHT OUTER JOIN
esq.AddColumn("<>Contact.Name");     // FULL OUTER JOIN

// Обратная связь: [ПрисоединяемаяСхема:КолонкаСвязиПрис:КолонкаСвязиОсн].Колонка
esq.AddColumn("[Activity:Contact:Id].Name");
// Если основная колонка связи — Id, можно короче:
esq.AddColumn("[Activity:Contact].Name");

// Фильтр
esq.Filters.Add(esq.CreateFilterWithParameters(
    FilterComparisonType.Equal, "Status.Code", "Active"));

// Получение результатов
var collection = esq.GetEntityCollection(UserConnection);
foreach (var entity in collection) {
    var id = entity.GetTypedColumnValue<Guid>("Id");
    var name = entity.GetTypedColumnValue<string>("Name");
    // GetTypedColumnValue требует using BPMSoft.Common
}
```

> ❌ **КРИТИЧНО**: Колонки с символом `_` в имени вызывают ошибку в ESQ (документация v1.9)
> По умолчанию тип JOIN — **LEFT OUTER JOIN**, не INNER!

---

### AMD — JavaScript клиентский модуль (по документации v1.9)

```javascript
// Структура: define(имя, [зависимости], function-фабрика)
define("{ModuleName}", ["BPMSoft", "sandbox"], function(BPMSoft, sandbox) {
    "use strict";

    // Приватные переменные и функции
    var privateHelper = function() { ... };

    // Публичный интерфейс модуля
    return {
        init: function() { ... },
        publicMethod: function(param) {
            return privateHelper();
        }
    };
});
```

**Замещение (расширение) существующего клиентского модуля:**
```javascript
define("{ModuleName}", ["BPMSoft", "sandbox"], function(BPMSoft, sandbox) {
    return {
        methods: {
            // Переопределение метода с вызовом родительской реализации
            existingMethod: function() {
                this.callParent(arguments);
                // дополнительная логика
            }
        }
    };
});
```

---

## Правило достоверности

Не додумывать и не выдумывать. Если поведение API или платформы неизвестно — сначала проверить в `/bpmsoft-kb` или PDF-документации. Если информация не найдена — прямо сказать «неизвестно, требует проверки». Выдуманный C# или JS код, который не соответствует реальному API BPMSoft, приведёт к ошибкам в продуктивной системе.

## Правила генерации

- Namespace: всегда `BPMSoft.Configuration`
- Поле CC в Activity: `CopyRecepient` (с опечаткой — так в BPMSoft)
- `GetTypedColumnValue<T>` и `GetColumnValue<T>` требуют `using BPMSoft.Common`
- Все схемы публикуются в пакет **CTI**
- EventListener → после публикации → **перезапуск Kestrel**
- При любых сомнениях — сначала проверять в `/bpmsoft-kb`, потом писать код

После генерации кода — напоминать шаги публикации в BPMSoft.
