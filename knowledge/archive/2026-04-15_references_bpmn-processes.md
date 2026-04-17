# BPMN-процессы в BPMSoft

## Основы

Дизайнер процессов — визуальный BPMN-редактор (drag-and-drop). Процессы хранятся в пакетах как схемы типа Process.

**Запуск процесса:**
- По событию объекта (создание/изменение записи)
- По расписанию
- По кнопке из клиентского кода
- Из другого процесса
- Через ProcessEngineService (REST API)

## Ключевые элементы процессов

### Действия пользователя
| Элемент | Назначение |
|---|---|
| Задача | Назначить задачу пользователю |
| Вопрос | Вывести диалог с выбором |
| Открытие страницы | Открыть карточку записи |
| Преднастроенная страница | Форма с произвольными полями |
| Автогенерируемая страница | Форма по параметрам процесса |
| Отправить email | Отправка письма с макросами |
| Визирование | Согласование записи |

### Действия системы
| Элемент | Назначение |
|---|---|
| Читать данные | SELECT из БД |
| Добавить данные | INSERT в БД |
| Изменить данные | UPDATE в БД |
| Удалить данные | DELETE из БД |
| Задание-сценарий | C# Script Task — произвольный код |
| Вызов веб-сервиса | HTTP-запрос к внешнему API |
| Запустить процесс | Запуск подпроцесса |
| Привязка к объекту | Связать запись с сущностью |

### Шлюзы (ветвление)
- **Исключающее «ИЛИ»** — только одна ветка (по условию)
- **Включающее «ИЛИ»** — одна или несколько
- **Параллельное** — все ветки одновременно

## Script Task (C# в процессе)

```csharp
// Получение параметра процесса
var caseId = Get<Guid>("CaseId");

// Работа с данными через ESQ
var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "Case");
esq.AddColumn("Id");
esq.AddColumn("UsrCcEmails");
esq.Filters.Add(esq.CreateFilterWithParameters(
    FilterComparisonType.Equal, "Id", caseId));
var entities = esq.GetEntityCollection(UserConnection);

// Установка параметра процесса
Set("ResultValue", "someValue");
```

## Запуск процесса из JavaScript

```javascript
ProcessModuleUtilities.executeProcess({
    sysProcessName: "UsrMyProcess",
    parameters: {
        CaseId: this.get("Id")
    }
});
```

## Запуск процесса через REST API (ProcessEngineService)

```
POST /0/ServiceModel/ProcessEngineService.svc/RunProcess
{
    "processName": "UsrMyProcess",
    "parameters": "CaseId=<guid>"
}
```

## Уведомления по обращениям (архитектура в системе)

Базовые BPMN-процессы уведомлений — в пакете **CaseService**:
- `SendEmailToSROwner` — уведомление ответственного
- `SendNotificationToCaseOwner` — уведомление инициатора
- `AsyncEmailSender` — асинхронная отправка

Кастомные процессы для конкретного проекта — в пакете **CTI**.

`EmailWithMacrosManager` (CaseService) — менеджер отправки писем с макросами. Макросы подставляются из полей обращения в шаблон письма.

## Дизайнер кейсов (Case Management)

Упрощённый визуальный редактор жизненного цикла объекта через стадии.

**Путь:** Дизайнер системы → «Дизайнер кейсов»

Отличие от BPMN-процессов: кейс — статическая диаграмма состояний, пользователь видит текущую стадию и доступные шаги. Построен на движке ProcessEngineService.
