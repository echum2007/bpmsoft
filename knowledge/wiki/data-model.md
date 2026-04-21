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

- `CopyRecepient` — **с опечаткой** (не CopyRecipient). Формат хранения в нашей системе: `"; "` (точка с запятой + пробел) — так пишет `UsrCcAddressResolver.MergeAddresses`; C# читает по `{ ' ', ';' }`. JS-валидатор на UI-странице при вводе пользователем принимает пробел, `;` и `,` — это отдельный слой, не формат хранения.
- `ServiceProcessed` (Boolean) — дивергенция: C#-путь устанавливает `true`, старые BPMN — `false`. Во всей новой логике принудительно устанавливать `true` для паритета с C#-путём.
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

## SysAdminUnit vs VwSysRole

`VwSysRole` — это PostgreSQL **VIEW** (представление), не таблица. Содержимое:

```sql
SELECT * FROM "SysAdminUnit" WHERE "SysAdminUnitTypeValue" NOT IN (4, 5)
```

**Следствия:**
- FK на `VwSysRole` в объектах BPMSoft **невозможен** — PostgreSQL выдаёт `42809: referenced relation is not a table`
- В Lookup-колонках объекта нужно ссылаться на **`SysAdminUnit`**, а не `VwSysRole`
- `SysAdminUnit` содержит роли, группы поддержки, организационные единицы и пользователей

**Пример:** колонка «Роль» в `UsrEmployeeNotificationRule` → тип Lookup → объект `SysAdminUnit`.

---

## Нюансы PostgreSQL

- **Функциональные роли:** всегда использовать представление **`VwSysFunctionalRole`** — прямой запрос к таблице `SysFunctionalRole` в PostgreSQL возвращает неполные данные из-за специфики архитектуры представлений платформы.
- **Feature Toggles:** состояние хранится в `AdminUnitFeatureState` (не `FeatureState` — такой таблицы не существует):
  ```sql
  SELECT * FROM "AdminUnitFeatureState"
  JOIN "Feature" ON "Feature"."Id" = "FeatureId"
  WHERE "Feature"."Code" = 'CodeName'
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

---

## Создание объектов через дизайнер — чеклист

### Справочник (BaseLookup)

Используется для небольших типовых списков (тип события, тип получателя и т.п.).

**Конфигурация → пакет CTI → Добавить → «Объект»:**

| Поле | Значение |
|------|---------|
| Заголовок | Русское название (например: «Тип уведомления сотрудника») |
| Код | Латинское имя с префиксом Usr (например: `UsrEmployeeNotificationEventType`) |
| Родительский объект | `BaseLookup` |
| Пакет | CTI |

- При выборе `BaseLookup` — подтвердить всплывающее окно («Да»)
- Колонки **Id, Name, Description** наследуются автоматически — не добавлять вручную
- Нажать «Сохранить» → «Опубликовать»

**Зарегистрировать как справочник:**  
Дизайнер системы → «Справочники» → «Добавить справочник»:
- Название: русское название объекта
- Объект: код объекта (`UsrEmployeeNotificationEventType`)
- Сохранить

**Заполнить данные:**  
Раздел «Справочники» → открыть созданный справочник → добавить записи через «Добавить».

> ⚠️ Поле **«Название»** справочника — это то, что пользователь видит в выпадающем списке. Для технических справочников где C# сравнивает по `Name` — вводить латинский код (`CustomerReply`, `Owner` и т.п.), это стандартная практика платформы (пример: `ActivityType` хранит `Email`, `Call`).

**Привязать данные к пакету CTI** (иначе при переносе пакета данные не перенесутся):  
Конфигурация → пакет CTI → Добавить → «Данные»:
1. Объект: код справочника
2. Тип установки: **Установка**
3. Вкладка «Настройка колонок» — выбрать: **Id**, **Name**, **Description** (Id обязательно!)
4. Вкладка «Привязанные данные» → «Добавить» → выбрать нужные записи
5. Сохранить

---

### Обычный объект (BaseEntity)

Используется для таблиц с несколькими колонками-связями (не справочник).

**Конфигурация → пакет CTI → Добавить → «Объект»:**

| Поле | Значение |
|------|---------|
| Заголовок | Русское название |
| Код | Латинское имя с префиксом Usr |
| Родительский объект | `BaseEntity` |
| Пакет | CTI |

**⚠️ Префикс `Usr` обязателен для всех колонок пользовательского объекта.** Платформа не позволяет создать колонку без префикса — форма сохранения выдаст ошибку. Это относится и к колонкам типа Boolean (`UsrIsActive`), и к Lookup (`UsrEventType`, `UsrCaseStatus`), и к строкам.

**Добавление колонок** — кнопка «+» в блоке «Колонки»:

| Тип колонки | Когда использовать | Настройка |
|-------------|-------------------|-----------|
| Справочник (Lookup) | Ссылка на другой объект | Блок «Источник данных» → поле «Справочник» → выбрать объект |
| Логическое (Boolean) | Флаги (IsActive и т.п.) | Признак «Обязательное» **недоступен** — вместо него: «Значение по умолчанию» = Да |
| Строка | Текстовые поля | Указать максимальную длину |

- Сохранить → Опубликовать

**Привязка данных** — аналогично справочнику (если в объекте есть предустановленные записи).

---

### Типы установки данных

| Тип | Поведение | Когда использовать |
|-----|-----------|-------------------|
| **Установка** | Добавляет при первой установке + обновляет при повторных | Стандартный выбор для справочников |
| **Слияние** | Обновляет только колонки с признаком «Обязательно для обновления» | Точечные hotfix-обновления |
| **Первичная установка** | Только один раз, никогда не обновляет | Не использовать |
