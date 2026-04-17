# Модель данных BPMSoft

**Обновлено:** 2026-04-15  
**Источники:** BPMSOFT_CONFIGURATION_ANALYSIS_3.md, документация 1.9

---

## Ключевые таблицы БД

| Таблица | Описание | Важные поля |
|---|---|---|
| **Activity** | Активности (email, задачи) | Id, Sender, **Recepient**, **CopyRecepient**, **BlindCopyRecepient**, Body, Subject, TypeId, MessageTypeId, SendDate, OwnerId, MailHash, ServiceProcessed |
| **Case** | Обращения | Id, Number, OwnerId, ModifiedById, ServicePactId, StatusId, **UsrCcEmails** |
| **ServicePact** | Сервисные договоры | Id, Name, **UsrCcEmails** |
| **Contact** | Контакты | Id, Name, Email |
| **Reminding** | Push-уведомления | AuthorId, ContactId, SourceId, SubjectCaption, SubjectId, SysEntitySchemaId |
| **ActivityParticipant** | Участники активности | ActivityId, ParticipantId, RoleId |
| **EmailMessageData** | Метаданные email | ActivityId, MessageId, InReplyTo, References |

### Нюансы полей Activity

- `CopyRecepient` — **с опечаткой** (не CopyRecipient). Строка адресов через пробел
- `TypeId` для Email: `e2831dec-cfc0-df11-b00f-001d60e938c6` (константа ActivityType)
- `MessageTypeId` для исходящих: `7f6d3f94-f36b-1410-068c-20cf30b39373`
- `MessageTypeId` для входящих: `NULL` (Guid.Empty)

---

## ORM: EntitySchemaQuery (ESQ)

```csharp
// Простой ESQ-запрос
var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "Case");
var idCol = esq.AddColumn("Id");
var ccCol = esq.AddColumn("UsrCcEmails");

esq.Filters.Add(esq.CreateFilterWithParameters(
    FilterComparisonType.Equal, "Id", caseId));

var entities = esq.GetEntityCollection(UserConnection);
foreach (var entity in entities) {
    var cc = entity.GetTypedColumnValue<string>("UsrCcEmails");
}
```

```csharp
// ESQ с JOIN (через путь через колонку)
var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "Case");
esq.AddColumn("Id");
esq.AddColumn("ServicePact.UsrCcEmails");  // JOIN через навигационную колонку
```

---

## ORM: Select / Update (SQL-стиль)

```csharp
// SELECT
var select = new Select(UserConnection).Top(1)
    .Column("Case", "OwnerId")
    .Column("Contact", "Email")
    .From("Case")
    .InnerJoin("Contact").On("Case", "OwnerId").IsEqual("Contact", "Id")
    .Where("Case", "Id").IsEqual(Column.Parameter(caseId)) as Select;

using (DBExecutor dbExecutor = UserConnection.EnsureDBConnection())
using (IDataReader reader = select.ExecuteReader(dbExecutor)) {
    while (reader.Read()) {
        var email = reader.GetColumnValue<string>("Email");  // using BPMSoft.Common
    }
}
```

```csharp
// UPDATE
var update = new Update(UserConnection, "Activity")
    .Set("ServiceProcessed", Column.Parameter(false))
    .Where("Id").IsEqual(Column.Parameter(activityId)) as Update;
update.Execute();
```

> ⚠️ `GetColumnValue<T>` на `IDataReader` требует `using BPMSoft.Common`

---

## ORM: Entity (работа с одной записью)

```csharp
// Создание новой записи
Entity reminding = UserConnection.EntitySchemaManager
    .GetInstanceByName("Reminding").CreateEntity(UserConnection);
reminding.SetDefColumnValues();
reminding.SetColumnValue("ContactId", ownerId);
reminding.SetColumnValue("SubjectCaption", "Текст уведомления");
reminding.Save();

// Чтение существующей записи
var entity = (Entity)sender;  // в EventListener
var typeId = entity.GetTypedColumnValue<Guid>("TypeId");
var cc = entity.GetTypedColumnValue<string>("CopyRecepient");
entity.SetColumnValue("CopyRecepient", newValue);
```

---

## DI/IoC: ClassFactory

```csharp
// Получение реализации по интерфейсу
var emailClientFactory = ClassFactory.Get<EmailClientFactory>(
    new ConstructorArgument("userConnection", UserConnection));

// Регистрация своей реализации (в атрибуте)
[DefaultBinding(typeof(IMyService), Name = "MyImpl")]
public class MyServiceImpl : IMyService { }
```

---

## Пользовательские объекты в CTI

| Объект | Описание | Ключевые кастомные поля |
|---|---|---|
| Case (замещение) | Обращение | `UsrCcEmails` (varchar 500) |
| ServicePact (замещение) | Сервисный договор | `UsrCcEmails` (varchar 500) |
| UsrLaborRecords | Трудозатраты | — (в разработке) |
| UsrConfItemCatalog | Каталог КЕ | — |
| UsrContractType | Тип контракта | — |
| UsrVendorList | Список вендоров | — |
