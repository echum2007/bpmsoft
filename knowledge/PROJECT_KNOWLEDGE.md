# BPMSoft — Знания по проекту

**Дата сохранения:** 2026-03-28
**Статус проекта:** В планировании

---

## 1. Обзор проекта

**Цель:** Доработка CC-адресов в email-уведомлениях по обращениям (Case) в BPMSoft.

**Требования:**
1. Возможность добавлять дополнительные CC-адреса на уровне **сервисного контракта** (ServicePact) — для всех обращений по контракту
2. Возможность добавлять дополнительные CC-адреса на уровне **обращения** (Case) — вручную или автоматически из заголовка CC входящего email

---

## 2. Загруженные файлы

- **BPMSoft_Configuration.zip** — архив конфигурации BPMSoft (распакован)
- **bpmsoft-cc-notifications-plan.md** — детальный план реализации

---

## 3. Структура конфигурации

Путь: `BPMSoft.Configuration/Pkg/` — содержит ~30 пакетов, включая:

| Пакет | Размер | Назначение |
|---|---|---|
| **Custom** | 85K | Кастомный пакет (основной для разработки) |
| NUI | 14M | Основной UI |
| CampaignDesigner | 9.3M | Дизайнер кампаний |
| ubsgate | 9.2M | Интеграция |
| PivotTable | 8.6M | Сводные таблицы |
| DesignerTools | 5.9M | Инструменты дизайнера |
| и другие... | | |

---

## 4. Пакет Custom — текущее состояние

**UId пакета:** `a00051f4-cde3-4f3f-b08e-c5ad1a5c735a`
**Версия BPMSoft:** 1.9.0
**Maintainer:** Customer

### 4.1 Существующие схемы

#### ServiceItem (замещение)
- **UId:** `28a81597-c657-455e-9435-ef9205d41978`
- **Caption:** Сервис
- **Тип:** EntitySchema (ExtendParent = true)
- **Родитель:** `c6c44f0a-193e-4b5c-b35e-220a60c06898` (ServiceItem)
- **Свойства:** AdministratedByOperations=True, остальное False

#### ConfItem (замещение)
- **UId:** `c17ff71a-16e5-461e-b32f-744e604f2b8d`
- **Caption:** Конфигурационная единица
- **Тип:** EntitySchema (ExtendParent = true)
- **Родитель:** `ad707075-cf25-40bf-85c1-f5da38cf0d5d` (ConfItem)
- **Свойства:** AdministratedByOperations=True, AdministratedByRecords=True, IsTrackChangesInDB=True
- **Дополнительные колонки включены (E16=true):** `e80190a5`, `ebf6bb93`, `9928edec`, `4ea61b17`, `527ad368`, `e2f4f7d7`, `f6afc6ee`, `c45e1755`, `4a483263`
- **Новая колонка добавлена:** `bd2e6371-d86a-46e1-8cf8-877882b6c43a` (E16=false)
- **IsSSPAvailable:** False, **D24:** true (маркер замещения с добавлением колонок)

#### ServicePact (замещение)
- **UId:** `5862134f-e2b6-42a5-a751-d99f32994117`
- **Caption:** Сервисный договор
- **Тип:** EntitySchema (ExtendParent = true)
- **Родитель:** `595ddbda-31ce-4cca-9bdd-862257ceaf23` (ServicePact)
- **Свойства:** AdministratedByOperations=True, остальное False
- **Новая колонка:** `8475b5cb-ebcd-46af-bcbb-86d0e7614b14` (E16=true)

#### UsrConfIteminService (замещение)
- **UId:** `64368e91-8b4b-452e-9918-3506e77e2dcf`
- **Caption:** Конфигурационная единица в сервисном договоре
- **Тип:** EntitySchema (ExtendParent = true)
- **Родитель:** `38f6f236-32b5-4739-985c-fcac7bfac87e` (UsrConfIteminService)
- **D8 (связанная схема):** `38f6f236-32b5-4739-985c-fcac7bfac87e`
- **Новые колонки:** `0b6c7abe`, `85982768`, `a0febae1` (все E16=false)

### 4.2 Зависимости пакета Custom

Пакет зависит от ~160 пакетов, включая ключевые:
- **Base**, **Core**, **NUI**, **Platform**
- **CaseService**, **CaseITIL**, **Case** — обращения
- **ServiceModel**, **ServiceDesigner**, **ServiceDefSettings** — сервисы
- **SLM**, **SLMITILService** — SLM
- **CMDB** — конфигурационные единицы
- **IntegrationV2**, **Exchange** — email-интеграция
- **CoreContracts**, **SalesContracts** — контракты
- **OmnichannelMessaging** — омниканальные сообщения
- **ubsgate** — интеграция
- **UIv2**, **DesignerTools**, **AngularDesigner** — UI

---

## 5. Технологический стек

| Слой | Технология |
|---|---|
| Backend | C# / .NET Framework 4.7.2 / .NET Standard 2.0 |
| ORM / Query Builder | BPMSoft.Core.DB (`Select`, `DBExecutor`) |
| DI / IoC | `ClassFactory`, `[DefaultBinding]`, `ConstructorArgument` |
| Entity Events | `[EntityEventListener(SchemaName = "...")]` |
| Email отправка | `IEmailClient` → `EmailClient` / `ExchangeClient` |
| Frontend | Angular + Angular Elements, Webpack, RequireJS |

---

## 6. Архитектура решения (план)

### 6.1 Новые сущности

**UsrCaseCcAddress** — CC-адреса на уровне обращения:
- Id (Guid PK), CaseId (FK→Case), EmailAddress (Text 250), Name (Text 250)
- + стандартные: CreatedOn, ModifiedOn, CreatedById, ModifiedById

**UsrServicePactCcAddress** — CC-адреса на уровне сервисного контракта:
- Id (Guid PK), ServicePactId (FK→ServicePact), EmailAddress (Text 250), Name (Text 250)
- + стандартные поля

### 6.2 Новые компоненты

| Компонент | Тип | Описание |
|---|---|---|
| `UsrCcAddressResolver` | C# класс | Получение CC-адресов (обращение + контракт), дедупликация |
| `UsrCaseEmailCcEventListener` | EntityEventListener | Парсинг CC из входящего email при создании обращения |
| `UsrCaseCcAddressDetail` | UI деталь | Управление CC на карточке обращения |
| `UsrServicePactCcAddressDetail` | UI деталь | Управление CC на карточке контракта |
| `CasePageV2` (замещение) | UI страница | Добавление детали CC на карточку обращения |
| `ServicePactPage` (замещение) | UI страница | Добавление детали CC на карточку контракта |

### 6.3 Поток данных при отправке уведомления

```
Событие (регистрация/ответ/статус)
  → Бизнес-процесс уведомления
  → UsrCcAddressResolver.GetCcAddresses(caseId)
    → CC из UsrCaseCcAddress
    → CC из UsrServicePactCcAddress (через Case.ServicePactId)
    → Объединение + дедупликация (HashSet)
  → EmailMessage.Cc = merged list
  → EmailClient.Send()
```

---

## 7. Порядок реализации (10 шагов)

1. **⚠️ КРИТИЧНО** — Исследование механизма уведомлений (BPMN или C#?)
2. Создание схемы `UsrCaseCcAddress`
3. Создание схемы `UsrServicePactCcAddress`
4. UI: Деталь CC на карточке обращения
5. UI: Деталь CC на карточке сервисного контракта
6. C#-сервис `UsrCcAddressResolver`
7. Интеграция CC в механизм уведомлений (зависит от шага 1)
8. Парсинг CC из входящего email (`UsrCaseEmailCcEventListener`)
9. Unit-тесты
10. Регистрация в пакете Custom, обновление descriptor.json

---

## 8. Риски и открытые вопросы

### Риски
1. Механизм уведомлений может быть через BPMN, а не C# (вероятность высокая)
2. CC входящего email может храниться в нестандартном месте (средняя)
3. FK-конфликты из-за замещения ServicePact (низкая)
4. Дублирование CC при повторных уведомлениях (низкая, митигация через HashSet)

### Открытые вопросы
1. Как реализованы уведомления — BPMN-процессы или C#-код?
2. В каком поле/таблице хранится CC входящего email? (`Activity`, `ActivityParticipant`?)
3. Нужно ли поддерживать удаление CC-адресов из обращения?
4. Нужна ли валидация формата email?
5. Приоритеты CC из контракта vs обращения (или просто объединение)?

---

## 9. Файловая структура новых артефактов

```
Pkg/Custom/
├── descriptor.json                          (обновить зависимости)
└── Schemas/
    ├── UsrCaseCcAddress/                    (новая сущность)
    ├── UsrServicePactCcAddress/             (новая сущность)
    ├── UsrCcAddressResolver/                (C# сервис)
    ├── UsrCaseEmailCcEventListener/         (C# event listener)
    ├── UsrCaseCcAddressDetail/              (UI деталь для Case)
    ├── UsrServicePactCcAddressDetail/       (UI деталь для ServicePact)
    ├── CasePageV2/                          (замещение страницы обращения)
    └── ServicePactPage/                     (замещение страницы контракта)
```

---

## 10. Ключевые UId для справки

| Сущность | UId |
|---|---|
| Пакет Custom | `a00051f4-cde3-4f3f-b08e-c5ad1a5c735a` |
| ServiceItem (Custom) | `28a81597-c657-455e-9435-ef9205d41978` |
| ConfItem (Custom) | `c17ff71a-16e5-461e-b32f-744e604f2b8d` |
| ServicePact (Custom) | `5862134f-e2b6-42a5-a751-d99f32994117` |
| UsrConfIteminService (Custom) | `64368e91-8b4b-452e-9918-3506e77e2dcf` |
| ServiceItem (родитель) | `c6c44f0a-193e-4b5c-b35e-220a60c06898` |
| ConfItem (родитель) | `ad707075-cf25-40bf-85c1-f5da38cf0d5d` |
| ServicePact (родитель) | `595ddbda-31ce-4cca-9bdd-862257ceaf23` |
| UsrConfIteminService (родитель) | `38f6f236-32b5-4739-985c-fcac7bfac87e` |
