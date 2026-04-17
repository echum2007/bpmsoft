# BPMSoft Configuration — Полный анализ исходников

**Дата анализа:** 2026-03-28, обновлено 2026-03-29
**Источник:** BPMSoft_Configuration.zip + базовые пакеты (Case, CaseService, SLM, SLMITILService, CaseMobile, EmailMessage)
**Платформа:** BPMSoft 1.9, .NET 8, Linux/Kestrel
**Цель:** Справочный документ для всех задач по доработке функциональности BPMSoft

---

## 1. Общая структура конфигурации

**Путь:** `BPMSoft.Configuration/Pkg/` — 30 пакетов

### Статус выгрузки пакетов

**Первая выгрузка** (через «Выгрузить в файловую систему»): 30 пакетов, но базовые пакеты неполные — содержат только фрагменты (Angular-компоненты, отдельные JS-файлы).

**Вторая выгрузка** (через UI «Экспортировать выделенные»): получены полные базовые пакеты **Case** (3532 файла), **CaseService** (2617 файлов), **SLM** (1914 файлов), **SLMITILService** (2081 файл), **CaseMobile** (739 файлов), **CaseITIL** (1 файл — пустой пакет-заглушка), **EmailMessage** (190 файлов).

**Формат .gz пакетов BPMSoft:** бинарный формат (не tar/zip). Структура: `[4 байта длина имени в UTF-16 code units][имя файла UTF-16LE][4 байта длина контента][контент]` — повторяется для каждого файла в пакете.

### Архитектура пакетов (из документации BPMSoft)

Пакеты делятся на:
- **Предустановленные** (Base, NUI, Platform и др.) — недоступны для изменения, содержат базовую функциональность
- **Custom** — предустановленный пакет для мелких кастомизаций, НЕ переносится между средами, НЕ выгружается через WorkspaceConsole. Рекомендуется использовать только при небольшом объёме изменений
- **Пользовательские** (CTI в данном проекте) — создаются для кастомизаций, переносимы между средами

**CTI** — основной кастомный пакет проекта. Все замещённые объекты (процессы, страницы, сущности) сохраняются сюда при кастомизации. Custom содержит несколько записей, попавших туда по ошибке системы — в нормальных условиях он не должен использоваться.

Иерархия: Базовые пакеты → ... → Custom → CTI (CTI наследует всё через зависимости)

### Ключевые пакеты для задачи CC-уведомлений

| Пакет | Размер | Файлов | Роль в задаче |
|---|---|---|---|
| **CTI** | 3.5M | 807 | **⚠️ КРИТИЧНЫЙ** — содержит ВСЕ кастомные BPMN-процессы уведомлений, замещения Case, CasePage, ServicePactPage |
| **Custom** | 85K | 17 | Замещения ServiceItem, ConfItem, ServicePact, UsrConfIteminService |
| **IntegrationV2** | 854K | 73 | Email-клиент (IEmailClient→EmailClient), EmailRepository, EmailService |
| **Exchange** | 1.2M | 50 | Exchange-клиент (ExchangeClient), синхронизация email (ExchangeEmailMessage) |
| **CaseService** | 6.7M | 2617 | **⚠️ КРИТИЧНЫЙ** — содержит ВСЕ базовые BPMN-процессы уведомлений (SendEmailToSROwner, SendNotificationToCaseOwner и др.), EmailWithMacrosManager, AsyncEmailSender |
| **ServiceModel** | 1.7M | 3 | Angular-компонент сервисной модели (service-model-network-component.js) |
| **NUI** | 14M | 9 | Основной UI (schema-view-component, nav-menu и др.) |

### Остальные пакеты (для справки)

UIv2, DesignerTools, PivotTable, OmnichannelMessaging, ubsgate, CampaignDesigner, Base, Platform, HomePage, MobileWebView, OpenIdAuth, SspWorkplace, Workplace, Deduplication, RelationshipDesigner, Tracking, ServiceDesigner, AnalyticsDashboard, CoreForecast, ContentBuilder, MarketingCampaign.

---

## 2. Пакет CTI — Главный для задачи

**UId:** `21b087cf-bb70-cdc0-5180-6979fdd2220c`
**Maintainer:** Customer
**BPMSoftVersion:** 1.9.0

### 2.1 Схемы сущностей (замещения)

| Схема | UId | Родитель | Тип |
|---|---|---|---|
| Case | `19cc53cb-28eb-4288-bd79-cea46e02bff4` | `117d32f9-8275-4534-8411-1c66115ce9cd` (Case) | EntitySchema (ExtendParent) |
| ServicePact | `46e84fce-9ad8-4b09-8407-281cbb4cb824` | `595ddbda-31ce-4cca-9bdd-862257ceaf23` (ServicePact) | EntitySchema (ExtendParent) |
| ServiceItem | есть | — | EntitySchema (ExtendParent) |
| ConfItem | есть | — | EntitySchema (ExtendParent) |
| CaseCategory | есть | — | EntitySchema |
| CaseInFolder | есть | — | EntitySchema |
| ServiceInServicePact | есть | — | EntitySchema |
| UsrConfIteminService | есть | — | EntitySchema |
| UsrConfItemCatalog | есть | — | Новая сущность (каталог КЕ) |
| UsrLaborRecords | есть | — | Новая сущность (трудозатраты) |
| UsrContractType | есть | — | Новая сущность (тип контракта) |
| UsrVendorList | есть | — | Новая сущность (список вендоров) |

### 2.2 UI-схемы (страницы и детали)

| Схема | UId | Тип | Описание |
|---|---|---|---|
| **CasePage** | `17fc86cf-3425-49a8-ba13-840c514bf34d` | ClientUnitSchema (ExtendParent) | Замещение страницы обращения |
| **ServicePactPage** | `f7a41e49-b2a3-4f00-a31d-da14efe43756` | ClientUnitSchema (ExtendParent) | Замещение страницы сервисного договора |
| CaseSection | есть | ClientUnitSchema (ExtendParent) | Замещение раздела обращений |
| PortalCasePage | есть | ClientUnitSchema (ExtendParent) | Портальная страница обращения |
| PortalCaseSection | есть | ClientUnitSchema (ExtendParent) | Портальный раздел обращений |
| ServiceItemPage | есть | ClientUnitSchema (ExtendParent) | Страница сервиса |
| ServicePactSection | есть | ClientUnitSchema (ExtendParent) | Раздел сервисных договоров |
| ServiceItemSection | есть | ClientUnitSchema (ExtendParent) | Раздел сервисов |
| ConfItemPage | есть | ClientUnitSchema (ExtendParent) | Страница КЕ |
| ConfItemSection | есть | ClientUnitSchema (ExtendParent) | Раздел КЕ |
| ServiceInServicePactDetail | есть | ClientUnitSchema | Деталь сервисов в договоре |
| ServiceInServicePactDetailPage | есть | ClientUnitSchema | Страница детали |
| UsrSchema021c2f40Detail | есть | ClientUnitSchema | Кастомная деталь (на CasePage) |
| UsrSchema1fd268acDetail | есть | ClientUnitSchema | Кастомная деталь |
| UsrSchema32d8c8f7Detail | есть | ClientUnitSchema | Кастомная деталь |
| UsrSchema50be5dfeDetail | есть | ClientUnitSchema | Кастомная деталь |
| UsrSchemae38421ddDetail | есть | ClientUnitSchema | Кастомная деталь |
| UsrSchemae6a15b0cPage | есть | ClientUnitSchema | Кастомная страница |
| UsrConfItemCatalog1Page | есть | ClientUnitSchema | Страница каталога КЕ |
| UsrConfItemCatalogf32db843Section | есть | ClientUnitSchema | Раздел каталога КЕ |
| UsrUsrConfIteminService86fa81daPage | есть | ClientUnitSchema | Страница КЕ в сервисе |
| UsrUsrLaborRecords6e6369a6Page | есть | ClientUnitSchema | Страница трудозатрат |

### 2.3 ⚠️ BPMN-процессы уведомлений (КРИТИЧНО для задачи)

#### 2.3.1 UsrSendEmailToSROwnerCustom1
- **UId:** `7477f83b-2d61-4541-843d-2d6444bbcd42`
- **Caption:** "Отправка email сообщения ответственному о назначении обращения"
- **Родитель:** `77b64dfc-5e59-42e8-baa6-a231f1fdd698` (SendEmailToSROwner — базовый процесс)
- **Тип:** ProcessSchemaManager (BPMN-процесс)
- **Использует пространства имён:** BPMSoft.Mail, BPMSoft.Mail.Sender, BPMSoft.Core.Factories, BPMSoft.Configuration, BPMSoft.Core.Scheduler

**Параметры процесса:**
- `EmailTemplateId` — шаблон письма (Lookup)
- `SenderEmail` — адрес отправителя (из SysSettings "SupportServiceEmail")
- `Subject` — тема письма
- `CaseRecordId` — ID обращения
- `IsCloseAndExit` — флаг завершения

**Элементы процесса:**
- StartSignal1, StartSignal2 — сигналы начала
- ReadDataUserTask1..4 — чтение данных (Case, Contact и др.)
- ScriptTask1 — **отправка email**
- ScriptTask2 — **подготовка мультиязычного уведомления**
- AddDataUserTask1 — создание Activity (email)
- ExclusiveGateway1 — ветвление

**ScriptTask1 — Код отправки email:**
```csharp
var activityId = AddDataUserTask1.RecordId;
if (UserConnection.GetIsFeatureEnabled("UseAsyncEmailSender")) {
    AsyncEmailSender emailSender = new AsyncEmailSender(UserConnection);
    emailSender.SendAsync(activityId);
} else {
    var emailClientFactory = ClassFactory.Get<EmailClientFactory>(
        new ConstructorArgument("userConnection", UserConnection));
    var activityEmailSender = new ActivityEmailSender(emailClientFactory, UserConnection);
    activityEmailSender.Send(activityId);
}
return true;
```

**ScriptTask2 — Код мультиязычного уведомления:**
```csharp
SenderEmail = BPMSoft.Core.Configuration.SysSettings.GetValue<string>(
    UserConnection, "SupportServiceEmail", string.Empty);
if (UserConnection.GetIsFeatureEnabled("EmailMessageMultiLanguage") 
    || UserConnection.GetIsFeatureEnabled("EmailMessageMultiLanguageV2")) {
    IsCloseAndExit = true;
    var caseRecordId = (StartSignal1.RecordId != Guid.Empty)
        ? StartSignal1.RecordId 
        : StartSignal2.RecordId;
    using (DBExecutor dbExecutor = UserConnection.EnsureDBConnection()) {
        var caseOwnerSelectQuery =
            new Select(UserConnection).Top(1)
                .Column("Case", "OwnerId")
                .Column("Case", "ModifiedById")
                .Column("Contact", "Email")
            .From("Case")
                .InnerJoin("Contact")
                    .On("Case", "OwnerId").IsEqual("Contact", "Id")
            .Where("Case", "Id").IsEqual(Column.Parameter(caseRecordId)) as Select;
        using (IDataReader reader = caseOwnerSelectQuery.ExecuteReader(dbExecutor)) {
            while (reader.Read()) {
                var owner = reader.GetColumnValue<Guid>("OwnerId");
                var modifiedBy = reader.GetColumnValue<Guid>("ModifiedById");
                var assignee = reader.GetColumnValue<string>("Email");
                var isModifiedByOwner = owner == modifiedBy;
                if (!isModifiedByOwner) {
                    var parameters = new Dictionary<string, object>() {
                        { "CaseRecordId", caseRecordId },
                        { "EmailTemplateId", CaseConsts.AssigneeTemplateId },
                        { "Recipient", assignee }
                    };
                    AppScheduler.TriggerJob<SendMultiLanguageNotification>(
                        string.Concat("SendMultiLanguageNotificationExecutorGroup", "_", caseRecordId),
                        UserConnection.Workspace.Name, UserConnection.CurrentUser.Name, 
                        parameters, true);
                }
            }
        }
    }
}
return true;
```

**⚠️ ВАЖНЫЙ ВЫВОД:** Уведомление отправляется через `ActivityEmailSender.Send(activityId)` или `AsyncEmailSender.SendAsync(activityId)`. CC-адреса берутся из Activity (поля Recepient, CopyRecepient, BlindCopyRecepient). Чтобы добавить CC, нужно модифицировать Activity перед отправкой или перехватить процесс отправки.

#### 2.3.2 UsrSendNotificationToCaseOwnerCustom1
- **UId:** `2769a020-a622-498f-a15d-a9449e30dd16`
- **Caption:** "Переоткрытие обращения и отправка email сообщения ответственному о новом комментарии"
- **Родитель:** `53d09a3b-5a42-48cd-bd0c-f36c9a389625` (SendNotificationToCaseOwner)
- **Тип:** ProcessSchemaManager

**ScriptTask Code — Создание Reminding (уведомления в системе):**
```csharp
Entity remindingEntity = UserConnection.EntitySchemaManager
    .GetInstanceByName("Reminding").CreateEntity(UserConnection);
var caseId = ReadCaseData.ResultEntity.PrimaryColumnValue; 
var ownerId = ReadCaseData.ResultEntity.GetTypedColumnValue<Guid>("OwnerId");
var number = ReadCaseData.ResultEntity.GetTypedColumnValue<string>("Number");
// ... создаёт Reminding запись, НЕ email
remindingEntity.SetColumnValue("SubjectCaption", subjectCaption);
remindingEntity.Save();
```

**ScriptTask Code — Обновление Activity:**
```csharp
var activityUpdate = new Update(UserConnection, "Activity")
    .Set("ServiceProcessed", Column.Parameter(false))
    .Where("Id").IsEqual(Column.Parameter(ActivityId)) as Update;
activityUpdate.Execute();
```

#### 2.3.3 UsrProcess_send_reg_mail
- **UId:** `265d4466-a887-461c-906f-79f16ce9f059`
- **Caption:** "Отправка уведомлений заказчику о регистрации обращения"
- **Тип:** ProcessSchemaManager (чистый BPMN без ScriptTask)
- **Элементы:** StartSignal1 → ReadDataUserTask1 → ReadDataUserTask2 → EmailTemplateUserTask1 → TerminateEvent1
- **Ключевые параметры:** EmailTemplateId, Sender, Recipient1, Subject, Body, SendEmailType

**⚠️ ВАЖНО:** Этот процесс использует `EmailTemplateUserTask1` — стандартный элемент BPMSoft для отправки email по шаблону. CC-адреса не заложены в стандартном элементе.

#### 2.3.4 UsrProcess_0c71a12 (и варианты CTI1-CTI5)
- Серия кастомных процессов (предположительно расширения основного процесса обработки обращений)
- 6 вариантов: UsrProcess_0c71a12, UsrProcess_0c71a12CTI1 .. CTI5

#### 2.3.5 UsrProcess_a5f980e
- Ещё один кастомный процесс

#### 2.3.6 UsrService_Send_Telegram_Notification
- **UId:** `be4fc0b9-10e3-4371-a09d-979d7513f94a`
- **Тип:** ServiceSchemaManager (веб-сервис, НЕ процесс)
- **Endpoint:** `https://api.telegram.org/`
- **Метод:** UsrMethod_Send_Telegram (POST)
- **Параметры:** UsrReqIdTg, UsrChatIdTg
- **Назначение:** Интеграция с Telegram для уведомлений

---

## 3. Пакет Custom — НЕ используется (артефакт системы)

**UId:** `a00051f4-cde3-4f3f-b08e-c5ad1a5c735a`
**Maintainer:** Customer
**Зависимости:** ~160 пакетов

> **Примечание:** Пакет Custom НЕ используется в проекте. По документации BPMSoft, Custom — предустановленный пакет для мелких изменений, который нельзя переносить между средами и нельзя выгрузить через WorkspaceConsole. Основной кастомный пакет — **CTI**. Несколько записей попали в Custom по ошибке системы.

### 3.1 Схемы

| Схема | UId | Родитель UId | Изменения |
|---|---|---|---|
| ServiceItem | `28a81597-c657-455e-9435-ef9205d41978` | `c6c44f0a-193e-4b5c-b35e-220a60c06898` | AdministratedByOperations=True, без новых колонок |
| ConfItem | `c17ff71a-16e5-461e-b32f-744e604f2b8d` | `ad707075-cf25-40bf-85c1-f5da38cf0d5d` | AdministratedByOperations=True, AdministratedByRecords=True, IsTrackChangesInDB=True, +1 новая колонка (`bd2e6371`) |
| ServicePact | `5862134f-e2b6-42a5-a751-d99f32994117` | `595ddbda-31ce-4cca-9bdd-862257ceaf23` | AdministratedByOperations=True, +1 новая колонка (`8475b5cb`, E16=true) |
| UsrConfIteminService | `64368e91-8b4b-452e-9918-3506e77e2dcf` | `38f6f236-32b5-4739-985c-fcac7bfac87e` | +3 новых колонки (`0b6c7abe`, `85982768`, `a0febae1`) |

**Важно:** Все .cs файлы в Custom пустые — только метаданные (колонки, свойства).

---

## 4. Архитектура отправки Email

### 4.1 Цепочка отправки

```
BPMN-процесс (например UsrSendEmailToSROwnerCustom1)
  → AddDataUserTask (создаёт Activity с полями To/Cc/Bcc)
  → ScriptTask (вызывает ActivityEmailSender.Send(activityId))
    → ActivityEmailSender читает Activity из БД
    → Формирует EmailMessage (To, Cc, Bcc из Activity)
    → EmailClientFactory → IEmailClient (EmailClient или ExchangeClient)
      → EmailClient.Send(emailMessage)
        → IEmailService.Send(email, credentials)
          → IEmailProvider.Send(email, attachments, credentials)
```

### 4.2 Класс EmailClient (IntegrationV2)

**Binding:** `[DefaultBinding(typeof(IEmailClient), Name = "EmailClient")]`

Метод `Send`:
```csharp
public void Send(EmailMessage emailMessage, bool ignoreRights = false) {
    var emailDto = GetEmail(emailMessage, ignoreRights);
    var credentials = GetCredentials(emailMessage.From, ignoreRights, false);
    var sendResult = _emailService.Send(emailDto, credentials);
    if (sendResult.IsNotNullOrEmpty()) {
        throw new EmailException("ErrorOnSend", sendResult);
    }
}
```

Метод `SetEmailRecipients`:
```csharp
private void SetEmailRecipients(Email email, EmailMessage emailMessage) {
    FillMessageRecipientsCollection(email.Recepients, emailMessage.To);
    FillMessageRecipientsCollection(email.CopyRecepients, emailMessage.Cc);
    FillMessageRecipientsCollection(email.BlindCopyRecepients, emailMessage.Bcc);
}
```

### 4.3 Класс ExchangeClient

Метод `SetRecipients`:
```csharp
private Exchange.EmailMessage SetRecipients(Exchange.EmailMessage exchangeEmailMessage, 
    EmailMessage bpmEmailMessage) {
    foreach (var recipient in bpmEmailMessage.To) {
        exchangeEmailMessage.ToRecipients.Add(recipient.ExtractEmailAddress());
    }
    foreach (var recipient in bpmEmailMessage.Cc) {
        exchangeEmailMessage.CcRecipients.Add(recipient.ExtractEmailAddress());
    }
    foreach (var recipient in bpmEmailMessage.Bcc) {
        exchangeEmailMessage.BccRecipients.Add(recipient.ExtractEmailAddress());
    }
    return exchangeEmailMessage;
}
```

### 4.4 Хранение CC входящих email

В `EmailRepository.CreateActivity()`:
```csharp
activity.SetColumnValue("CopyRecepient", string.Join(" ", email.Copy));
```

В `ExchangeEmailMessage.FillActivity()`:
```csharp
activity.SetColumnValue("CopyRecepient", EmailMessage.CcRecipients.ToEmailAddressString());
```

**Вывод:** CC входящего email сохраняется в поле `Activity.CopyRecepient` (текстовое, через пробел).

### 4.5 Модель EmailModel

```csharp
public class EmailModel : EmailModelHeader {
    public string Subject { get; set; }
    public string Body { get; set; }
    public string From { get; set; }
    public List<string> To { get; set; }
    public List<string> Copy { get; set; }       // ← CC
    public List<string> BlindCopy { get; set; }   // ← BCC
    public DateTime SendDate { get; set; }
    public bool IsHtmlBody { get; set; }
    public Guid OwnerId { get; set; }
    public EmailImportance Importance { get; set; }
    public List<string> Headers { get; set; }
    public List<AttachmentModel> Attachments { get; set; }
}
```

### 4.6 Мультиязычные уведомления

Процесс `UsrSendEmailToSROwnerCustom1` проверяет feature-флаги:
- `EmailMessageMultiLanguage`
- `EmailMessageMultiLanguageV2`

Если включены — используется `SendMultiLanguageNotification` через `AppScheduler.TriggerJob`, с параметрами: CaseRecordId, EmailTemplateId, Recipient. **CC не передаётся** в параметрах.

---

## 5. Ключевые таблицы БД (из анализа кода)

| Таблица | Описание | Релевантные поля |
|---|---|---|
| **Activity** | Активности (включая email) | Id, Sender, Recepient, CopyRecepient, BlindCopyRecepient, Body, Subject, TypeId, SendDate, OwnerId, MailHash |
| **EmailMessageData** | Метаданные email | ActivityId, MessageId, InReplyTo, References |
| **Case** | Обращения | Id, Number, OwnerId, ModifiedById, ServicePactId, StatusId |
| **ServicePact** | Сервисные договоры | Id, Name |
| **Contact** | Контакты | Id, Name, Email |
| **Reminding** | Напоминания/уведомления | AuthorId, ContactId, SourceId, SubjectCaption, SubjectId, SysEntitySchemaId |
| **ActivityParticipant** | Участники активности | Activity, Participant, RoleId |

---

## 6. Замещения в двух пакетах (CTI и Custom)

⚠️ **Обе пакета замещают одни и те же сущности** (Custom содержит записи по ошибке):

| Сущность | Пакет Custom UId | Пакет CTI UId | Примечание |
|---|---|---|---|
| ServicePact | `5862134f-...` | `46e84fce-...` | Оба ExtendParent. Custom не используется |
| ServiceItem | `28a81597-...` | есть | Оба ExtendParent |
| ConfItem | `c17ff71a-...` | есть | Оба ExtendParent |

Custom зависит от CTI (через цепочку зависимостей), поэтому замещения Custom применяются ПОВЕРХ CTI. Рекомендация: перенести изменения из Custom в CTI и очистить Custom.

---

## 7. Уточнённый план реализации CC-адресов

### 7.1 Архитектура отправки email-уведомлений (из анализа базовых пакетов)

В BPMSoft 1.9 существуют **два параллельных механизма** отправки email по обращениям:

**Путь A — старый BPMN (ScriptTask1 → ActivityEmailSender):**
```
SendEmailToSROwner (BPMN):
  StartSignal1/2 (Case.OwnerId changed / Case.GroupId changed)
  → ReadDataUserTask1 (читает Case)
  → ReadDataUserTask2 (проверяет условия)
  → ExclusiveGateway1 (проверка)
  → ReadDataUserTask3 (читает шаблон)
  → AddDataUserTask1 (создаёт Activity — email)
  → FillEmailUserTask (заполняет Subject/Body из шаблона)
  → ScriptTask1:
      var activityId = AddDataUserTask1.RecordId;
      if (UserConnection.GetIsFeatureEnabled("UseAsyncEmailSender")) {
          AsyncEmailSender emailSender = new AsyncEmailSender(UserConnection);
          emailSender.SendAsync(activityId);
      } else {
          var emailClientFactory = ClassFactory.Get<EmailClientFactory>(...);
          var activityEmailSender = new ActivityEmailSender(emailClientFactory, UserConnection);
          activityEmailSender.Send(activityId);
      }
```
CC **не передаётся** в этом пути — Activity создаётся AddDataUserTask1 без CopyRecepient.

**Путь B — новый мультиязычный (ScriptTask2 → SendMultiLanguageNotification → EmailWithMacrosManager):**
```
SendEmailToSROwner (BPMN), ScriptTask2:
  Проверяет feature-toggle EmailMessageMultiLanguage/V2
  Если включён:
    → Читает Case.OwnerId, Contact.Email
    → Проверяет: изменил ли владелец сам (isModifiedByOwner)
    → Если нет — запускает Job:
        AppScheduler.TriggerJob<SendMultiLanguageNotification>(
            parameters: { CaseRecordId, EmailTemplateId, Recipient }
        )
  
SendMultiLanguageNotification:
  → Вызывает EmailWithMacrosManager
  
EmailWithMacrosManager.GetCaseData(caseId):
  → esq.AddColumn("ParentActivity.CopyRecepient")   // CC из входящего email
  → esq.AddColumn("ParentActivity.BlindCopyRecepient") // BCC из входящего email
  → data.CC = @case.GetTypedColumnValue<string>(ccColumnName)
  → data.BCC = @case.GetTypedColumnValue<string>(bccColumnName)

EmailWithMacrosManager.FillActivityWithCaseData(activity, data):  // ВИРТУАЛЬНЫЙ метод!
  → activity.Recepient = data.Recipient
  → activity.CopyRecepient = data.CC
  → activity.BlindCopyRecepient = data.BCC
```
CC/BCC **передаётся** из ParentActivity обращения. Метод `FillActivityWithCaseData` — **виртуальный**, можно переопределить.

**Важно:** Если `AutoNotifyOnlyContact = true`, CC и BCC обнуляются:
```csharp
if (SysSettings.GetValue(UserConnection, "AutoNotifyOnlyContact", false)) {
    data.CC = data.BCC = default(string);
}
```
**Текущее значение:** `AutoNotifyOnlyContact = false` (чекбокс не отмечен) — CC/BCC **не обнуляются**. ✅

### 7.2 Процесс SendNotificationToCaseOwner (уведомление владельцу)

Этот процесс **НЕ отправляет email** — он создаёт **системное push-уведомление** (Reminding):
```
Start1 (входной параметр ActivityId)
  → ReadCaseData (читает Case по ActivityId)
  → ExclusiveGateway1 (проверка)
  → CreateNotificationScriptTask:
      // Создаёт Reminding (push-уведомление в интерфейсе BPMSoft)
      Entity remindingEntity = ...GetInstanceByName("Reminding").CreateEntity();
      remindingEntity.SetColumnValue("ContactId", ownerId);
      remindingEntity.SetColumnValue("SubjectCaption", "New email received regarding case No.{0}");
      remindingEntity.Save();
  → SetActivityServiceProcessed:
      // Обновляет Activity.ServiceProcessed = false
      var activityUpdate = new Update(UserConnection, "Activity")
          .Set("ServiceProcessed", Column.Parameter(false))
          .Where("Id").IsEqual(Column.Parameter(ActivityId));
      activityUpdate.Execute();
```
CC здесь **не применяется**, т.к. это не email-отправка.

### 7.3 Все процессы уведомлений (пакет CaseService)

| Процесс | Назначение | Тип | CC применим |
|---|---|---|---|
| **SendEmailToSROwner** | Email ответственному при назначении | BPMN + C# | ✅ Да |
| **SendNotificationToCaseOwner** | Push-уведомление владельцу | Reminding | ❌ Нет |
| **SendEmailToCaseGroup** | Email группе поддержки | BPMN | ✅ Да |
| **RunSendEmailToCaseGroupV2** | Email группе (v2) | BPMN | ✅ Да |
| **SendEmailToCaseContactPersonsProcess** | Email контактным лицам | BPMN | ✅ Да |
| **SendEmailToCaseContactProcessMultiLanguage** | Email контактным (мультиязычный) | BPMN | ✅ Да |
| **SendEmailToCaseStatusChanged** | Email при смене статуса | C# class | ✅ Да |
| **SendEmailToCaseStatusChangedProcess** | Процесс смены статуса | BPMN | ✅ Да |
| **SendResolution** | Отправка решения | BPMN | ✅ Да |
| **SendMultiLanguageNotification** | Мультиязычная отправка (Job) | C# + EmailWithMacrosManager | ✅ Уже есть CC |

### 7.4 Ключевые C# компоненты email-отправки (пакет CaseService)

| Класс | Файл | Роль |
|---|---|---|
| **EmailWithMacrosManager** | EmailWithMacrosManager.cs (486 строк) | Центральный менеджер email для Case. Поддерживает CC/BCC из ParentActivity. Виртуальный метод `FillActivityWithCaseData` |
| **BaseEmailWithMacrosManager<T>** | BaseEmailWithMacrosManager.cs | Базовый класс для EmailWithMacrosManager |
| **ExtendedEmailWithMacrosManager** | ExtendedEmailWithMacrosManager.cs | Расширенная версия менеджера |
| **AsyncEmailSender** | AsyncEmailSender.cs | Асинхронная отправка через AppScheduler.ScheduleImmediateJob |
| **SendMultiLanguageNotification** | SendMultiLanguageNotification.cs | Job для мультиязычной отправки. Принимает CaseRecordId, EmailTemplateId, Recipient |
| **EmailSenderObtainer** | EmailSenderObtainer.cs | Определение email-адреса отправителя |
| **CaseEmailTemplateExtractor** | CaseEmailTemplateExtractor.cs | Извлечение шаблона email |
| **EmailMacrosManagerFactory** | EmailMacrosManagerFactory.cs | Фабрика для создания EmailWithMacrosManager |
| **SenderObtainingService** | SenderObtainingService.cs | Сервис получения отправителя |
| **DelayedNotificationManagement** | DelayedNotificationManagement.cs | Управление отложенными уведомлениями |

### 7.5 РЕКОМЕНДУЕМЫЙ ВАРИАНТ реализации CC (обновлено 2026-03-30)

**⚠️ Feature-toggles EmailMessageMultiLanguage / V2 ВЫКЛЮЧЕНЫ.** `EmailWithMacrosManager` не вызывается. Активен старый BPMN-путь: ScriptTask1 → `ActivityEmailSender.Send()`.

#### Хранение CC-адресов — текстовые поля (упрощённый подход)

Вместо создания отдельных таблиц-деталей (`UsrCaseCcAddress`, `UsrServicePactCcAddress`) используем **текстовые колонки** в существующих объектах:

- `Case.UsrCcEmails` (строка 500) — CC-адреса на уровне обращения
- `ServicePact.UsrCcEmails` (строка 500) — CC-адреса на уровне сервисного договора

**Обоснование:** поле `Activity.CopyRecepient`, в которое мы дописываем CC — это текстовая строка с адресами через пробел. Создавать отдельные таблицы для того, чтобы на выходе получить текстовую строку — избыточная сложность. Текстовое поле проще внедрять, читать и сопровождать.

Формат: адреса через `;` или пробел (как в стандартном `Activity.CopyRecepient`).

#### Точка интеграции — EntityEventListener на Activity

Перехватывать `OnSaving` для Activity типа Email, связанной с Case, и дописывать CC-адреса. Покроет ВСЕ процессы отправки.

```csharp
[EntityEventListener(SchemaName = "Activity")]
public class UsrActivityCcEventListener : BaseEntityEventListener
{
    public override void OnSaving(object sender, EntityAfterEventArgs e) {
        var activity = (Entity)sender;
        var userConnection = activity.UserConnection;
        // Проверяем: это исходящий email
        var typeId = activity.GetTypedColumnValue<Guid>("TypeId");
        var messageTypeId = activity.GetTypedColumnValue<Guid>("MessageTypeId");
        if (typeId != ActivityConsts.EmailTypeUId || 
            messageTypeId != ActivityConsts.OutgoingEmailTypeId) {
            return;
        }
        // Получаем CaseId через связь Activity → Case
        var caseId = GetCaseIdForActivity(activity, userConnection);
        if (caseId == Guid.Empty) return;
        // Дописываем CC из Case и ServicePact
        var resolver = new UsrCcAddressResolver(userConnection);
        string additionalCc = resolver.GetCcForCase(caseId);
        if (!string.IsNullOrEmpty(additionalCc)) {
            string currentCc = activity.GetTypedColumnValue<string>("CopyRecepient");
            activity.SetColumnValue("CopyRecepient", 
                string.IsNullOrEmpty(currentCc) ? additionalCc : currentCc + " " + additionalCc);
        }
    }
}
```

**Плюсы:**
- Покрывает ВСЕ процессы отправки (старый BPMN, мультиязычный если включат, ручная отправка)
- Один компонент вместо модификации каждого BPMN-процесса отдельно
- Будет работать и при включении мультиязычности в будущем

**Минусы:**
- Срабатывает на каждое сохранение Activity — нужна аккуратная фильтрация
- Нужен надёжный способ определения связи Activity → Case

### 7.6 Порядок реализации (финальный, обновлён 2026-03-30)

| # | Артефакт | Способ создания | Пакет |
|---|---|---|---|
| 1 | Колонка `UsrCcEmails` в Case | UI: дизайнер объекта Case (замещение уже есть в CTI) | CTI |
| 2 | Колонка `UsrCcEmails` в ServicePact | UI: дизайнер объекта ServicePact (замещение уже есть в CTI) | CTI |
| 3 | Поле CC на CasePage | JS: замещение CasePage (уже есть в CTI) | CTI |
| 4 | Поле CC на ServicePactPage | JS: замещение ServicePactPage (уже есть в CTI) | CTI |
| 5 | UsrCcAddressResolver (C#) | Конфигурация → Добавить → Исходный код | CTI |
| 6 | UsrActivityCcEventListener (C#) | Конфигурация → Добавить → Исходный код | CTI |

### 7.7 Что ещё нужно проверить

1. ~~**Feature-toggle `EmailMessageMultiLanguage` / `EmailMessageMultiLanguageV2`**~~ — ✅ **ПРОВЕРЕНО: оба выключены.** Мультиязычный путь не активен.
2. **Связь Activity → Case** — нужно определить надёжный способ получения CaseId из Activity для EntityEventListener (через колонку `Activity.CaseId` или через таблицу связей)

### 7.8 Системные настройки email-уведомлений

| Настройка | Код | Значение | Влияние на CC |
|---|---|---|---|
| Отправлять уведомления только контакту | `AutoNotifyOnlyContact` | **false** ✅ | При false CC не обнуляется |
| Email службы поддержки | `SupportServiceEmail` | ? | Адрес отправителя |
| Feature: мультиязычные email | `EmailMessageMultiLanguage` | **false** (не создан) ❌ | Мультиязычный путь НЕ активен |
| Feature: мультиязычные email v2 | `EmailMessageMultiLanguageV2` | **false** (выключен) ❌ | Мультиязычный путь НЕ активен |

**⚠️ ВЫВОД:** Оба feature-toggle выключены. `EmailWithMacrosManager` **не вызывается**. Активен **старый путь**: BPMN ScriptTask1 → `ActivityEmailSender.Send()`. Стратегия CC должна быть ориентирована на модификацию BPMN-процессов и/или EntityEventListener на Activity.

### 7.9 ActivityEmailSender — платформенный класс

`ActivityEmailSender` находится в пространстве имён `BPMSoft.Mail.Sender` — это **платформенная сборка** (dll), а не конфигурационный пакет. Исходников в пакетах нет.

**Как он работает (восстановлено из использований):**
- `new ActivityEmailSender(emailClientFactory, userConnection)` — конструктор
- `sender.Send(activityId)` — читает Activity из БД по Id и отправляет email
- Читает из Activity: `Recepient`, `CopyRecepient`, `BlindCopyRecepient`, `Sender`, `Body`, `Title` и др.
- Использует `EmailClientFactory` → `IEmailClient` для фактической отправки

**Где создаётся:**
1. `BaseEmailWithMacrosManager.SendActivity()` (строка 280): `new ActivityEmailSender(emailClientFactory, UserConnection).Send(id)`
2. `AsyncEmailSenderExecutor.Execute()`: `new ActivityEmailSender(emailClientFactory, userConnection).Send(activityId)` (или `SecureActivityEmailSender` при feature `SecureEstimation`)
3. BPMN ScriptTask1 в `SendEmailToSROwner`: аналогично

**Вывод для задачи CC:** `ActivityEmailSender` читает `Activity.CopyRecepient` из БД. Если мы запишем CC-адреса в это поле **до** вызова `Send()`, они будут отправлены. Не требуется замещение самого `ActivityEmailSender`.

### 7.10 Итоговый статус готовности к реализации CC

| Компонент | Статус | Комментарий |
|---|---|---|
| Архитектура email-отправки | ✅ Полностью разобрана | Два пути: старый BPMN и новый мультиязычный |
| EmailWithMacrosManager | ✅ Исходники есть | Виртуальный `FillActivityWithCaseData` — точка вставки CC |
| ActivityEmailSender | ✅ Поведение понятно | Платформенный класс, читает CC из Activity |
| Базовые BPMN-процессы | ✅ Исходники есть | SendEmailToSROwner, SendNotificationToCaseOwner |
| Кастомные BPMN (CTI) | ⚠️ Нужны исходники ScriptTask | UsrSendEmailToSROwnerCustom1 |
| AutoNotifyOnlyContact | ✅ = false | CC не обнуляется |
| Feature-toggles MultiLanguage | ✅ Оба выключены | Активен старый BPMN-путь, стратегия — EntityEventListener |
| Объекты ServicePact, Case | ✅ Исходники есть | Базовые + замещения в CTI |
| План реализации | ✅ Готов | 6 шагов, см. раздел 7.6 |

---

## 8. Все UId для справки

### Пакеты
| Сущность | UId |
|---|---|
| Custom | `a00051f4-cde3-4f3f-b08e-c5ad1a5c735a` |
| CTI | `21b087cf-bb70-cdc0-5180-6979fdd2220c` |
| Case (базовый пакет) | `10cb6199-40c6-4b6d-9d0e-500310d45f57` |
| CaseService (базовый пакет) | см. descriptor.json |
| SLM (базовый пакет) | см. descriptor.json |
| SLMITILService (базовый пакет) | см. descriptor.json |

### Схемы в Custom
| Сущность | UId |
|---|---|
| ServiceItem (Custom) | `28a81597-c657-455e-9435-ef9205d41978` |
| ConfItem (Custom) | `c17ff71a-16e5-461e-b32f-744e604f2b8d` |
| ServicePact (Custom) | `5862134f-e2b6-42a5-a751-d99f32994117` |
| UsrConfIteminService (Custom) | `64368e91-8b4b-452e-9918-3506e77e2dcf` |

### Схемы в CTI
| Сущность | UId |
|---|---|
| Case (CTI) | `19cc53cb-28eb-4288-bd79-cea46e02bff4` |
| ServicePact (CTI) | `46e84fce-9ad8-4b09-8407-281cbb4cb824` |
| CasePage (CTI) | `17fc86cf-3425-49a8-ba13-840c514bf34d` |
| ServicePactPage (CTI) | `f7a41e49-b2a3-4f00-a31d-da14efe43756` |

### BPMN-процессы
| Процесс | UId | Пакет |
|---|---|---|
| SendEmailToSROwner (базовый) | `77b64dfc-5e59-42e8-baa6-a231f1fdd698` | CaseService |
| SendNotificationToCaseOwner (базовый) | см. metadata.json | CaseService |
| SendEmailToCaseGroup (базовый) | см. metadata.json | CaseService |
| RunSendEmailToCaseGroupV2 (базовый) | см. metadata.json | CaseService |
| SendEmailToCaseContactPersonsProcess | см. metadata.json | CaseService |
| SendEmailToCaseStatusChanged | см. metadata.json | CaseService |
| UsrSendEmailToSROwnerCustom1 | `7477f83b-2d61-4541-843d-2d6444bbcd42` | CTI |
| UsrSendNotificationToCaseOwnerCustom1 | `2769a020-a622-498f-a15d-a9449e30dd16` | CTI |
| UsrProcess_send_reg_mail | `265d4466-a887-461c-906f-79f16ce9f059` | CTI |
| UsrService_Send_Telegram_Notification | `be4fc0b9-10e3-4371-a09d-979d7513f94a` | CTI |

### Родительские схемы
| Сущность | UId |
|---|---|
| ServiceItem (родитель) | `c6c44f0a-193e-4b5c-b35e-220a60c06898` |
| ConfItem (родитель) | `ad707075-cf25-40bf-85c1-f5da38cf0d5d` |
| ServicePact (родитель) | `595ddbda-31ce-4cca-9bdd-862257ceaf23` |
| UsrConfIteminService (родитель) | `38f6f236-32b5-4739-985c-fcac7bfac87e` |
| Case (CTI родитель) | `117d32f9-8275-4534-8411-1c66115ce9cd` |

---

## 9. Технологический стек (подтверждено из кода)

| Слой | Технология | Подтверждение из кода |
|---|---|---|
| Backend | C# / .NET 8 | Все .cs файлы |
| ORM / Query | `Select`, `Update`, `Entity`, `EntitySchemaQuery` | EmailRepository, ScriptTask2 |
| DI/IoC | `ClassFactory.Get<T>()`, `[DefaultBinding]`, `ConstructorArgument` | EmailClient, EmailService |
| Email отправка | `IEmailClient` → `EmailClient` (IntegrationV2) / `ExchangeClient` (Exchange) | Два варианта реализации |
| Email отправка (процессы) | `ActivityEmailSender`, `AsyncEmailSender` | ScriptTask1 в BPMN |
| Мультиязычность | `SendMultiLanguageNotification` через `AppScheduler` | ScriptTask2 |
| Email шаблоны | `EmailTemplateUserTask` (BPMN элемент) | UsrProcess_send_reg_mail |
| Entity Events | `[EntityEventListener(SchemaName = "...")]` | ParticipantEventListener, SynchronizationEntityEventListener |
| Frontend | Angular + RequireJS + Webpack | bootstrap.js, term-calculation-component.js |
| UI Framework | BPMSoft ClientUnitSchema (ExtendParent) | CasePage, ServicePactPage |
| Внешние интеграции | REST (Telegram API) | UsrService_Send_Telegram_Notification |

---

## 10. Файловая структура конфигурации

```
BPMSoft.Configuration/Pkg/
├── CTI/                          ← ⚠️ Основной кастомный пакет (807 файлов)
│   ├── descriptor.json
│   └── Schemas/
│       ├── Case/                 ← Замещение сущности Case
│       ├── CasePage/             ← Замещение страницы обращения
│       ├── ServicePact/          ← Замещение сущности ServicePact
│       ├── ServicePactPage/      ← Замещение страницы сервисного договора
│       ├── UsrSendEmailToSROwnerCustom1/       ← BPMN: email ответственному
│       ├── UsrSendNotificationToCaseOwnerCustom1/ ← BPMN: уведомление о комментарии
│       ├── UsrProcess_send_reg_mail/            ← BPMN: email о регистрации
│       ├── UsrService_Send_Telegram_Notification/ ← REST: Telegram
│       ├── UsrProcess_0c71a12[CTI1-5]/          ← Серия кастомных процессов
│       ├── UsrConfItemCatalog/                  ← Каталог КЕ
│       ├── UsrLaborRecords/                     ← Трудозатраты
│       ├── UsrContractType/                     ← Тип контракта
│       ├── UsrVendorList/                       ← Список вендоров
│       └── ... (50+ схем)
│
├── Custom/                       ← Пакет замещений (17 файлов)
│   ├── descriptor.json           ← ~160 зависимостей
│   └── Schemas/
│       ├── ConfItem/             ← Замещение (+1 колонка)
│       ├── ServiceItem/          ← Замещение (AdministratedByOperations)
│       ├── ServicePact/          ← Замещение (+1 колонка)
│       └── UsrConfIteminService/ ← Замещение (+3 колонки)
│
├── IntegrationV2/                ← Email-клиент и синхронизация
│   └── Files/cs/
│       ├── EmailClient.cs        ← IEmailClient implementation
│       ├── EmailProvider.cs
│       └── Domains/EmailDomain/
│           ├── EmailRepository.cs ← Сохранение email в Activity
│           ├── EmailService.cs    ← Отправка через IEmailProvider
│           └── Model/
│               ├── EmailModel.cs  ← To, Copy, BlindCopy
│               └── EmailModelHeader.cs
│
├── Exchange/                     ← Exchange-интеграция
│   └── Files/cs/
│       ├── EmailSend/
│       │   ├── ExchangeClient.cs  ← IEmailClient для Exchange
│       │   └── ExchangeEmailClientFactory.cs
│       └── EmailSync/
│           └── ExchangeEmailMessage.cs ← Синхронизация email, CC → Activity.CopyRecepient
│
└── ... (26 других пакетов)
```
