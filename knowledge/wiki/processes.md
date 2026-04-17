# BPMN-процессы и EventListener

**Обновлено:** 2026-04-15  
**Источники:** bpmn-processes.md, документация 1.9

---

## Дизайнер процессов

Визуальный BPMN-редактор (drag-and-drop). Процессы хранятся в пакетах как схемы типа Process.

**Способы запуска процесса:**
- По событию объекта (создание/изменение записи) — StartSignal
- По расписанию
- По кнопке из клиентского кода
- Из другого процесса
- Через `ProcessEngineService` (REST API)

---

## Ключевые элементы BPMN

### Действия системы

| Элемент | Назначение |
|---|---|
| Читать данные | SELECT из БД |
| Добавить данные | INSERT в БД |
| Изменить данные | UPDATE в БД |
| Удалить данные | DELETE из БД |
| **Задание-сценарий** | C# Script Task — произвольный код |
| Вызов веб-сервиса | HTTP-запрос к внешнему API |
| Запустить процесс | Запуск подпроцесса |
| Отправить email | Отправка письма с макросами |

### Шлюзы

- **Исключающее «ИЛИ»** — только одна ветка (по условию)
- **Включающее «ИЛИ»** — одна или несколько
- **Параллельное** — все ветки одновременно

---

## Script Task (C# в процессе)

```csharp
// Получение параметра процесса
var caseId = Get<Guid>("CaseId");

// ESQ-запрос
var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "Case");
esq.AddColumn("Id");
esq.AddColumn("UsrCcEmails");
esq.Filters.Add(esq.CreateFilterWithParameters(
    FilterComparisonType.Equal, "Id", caseId));
var entities = esq.GetEntityCollection(UserConnection);

// Установка параметра процесса
Set("ResultValue", "someValue");
```

**Доступные объекты в ScriptTask:** `UserConnection`, параметры процесса по имени, `ReadDataUserTask1.ResultEntity` и т.д.

---

## Метаданные StartSignal (metadata.json)

| Поле | Значение | Смысл |
|---|---|---|
| `DZ5` | `1` | Событие INSERT (создание) |
| `DZ5` | `2` | Событие UPDATE (изменение) |
| `DZ12` | массив UId | Отслеживаемые колонки (для UPDATE) |
| `DZ13` | JSON | Фильтр условий срабатывания |
| `FC2` | EntitySchemaUId | Объект, к которому привязан сигнал |

**Важно:** замещения объектов (ExtendParent=true) не ломают стартовые сигналы — сигналы привязаны к базовому UId.

---

## EntityEventListener (C#)

```csharp
[EntityEventListener(SchemaName = "Activity")]
public class UsrActivityCcEventListener : BaseEntityEventListener
{
    public override void OnSaving(object sender, EntityAfterEventArgs e) {
        var activity = (Entity)sender;
        // логика ...
    }
    
    public override void OnInserted(object sender, EntityAfterEventArgs e) { }
    public override void OnUpdated(object sender, EntityAfterEventArgs e) { }
    public override void OnDeleting(object sender, EntityBeforeEventArgs e) { }
}
```

**⚠️ После публикации EventListener — обязательный перезапуск Kestrel!**

Тип схемы в конфигурации: «Исходный код» (SourceCode).

---

## Запуск процесса из JavaScript

```javascript
ProcessModuleUtilities.executeProcess({
    sysProcessName: "UsrMyProcess",
    parameters: {
        CaseId: this.get("Id")
    }
});
```

## Запуск через REST API

```
POST /0/ServiceModel/ProcessEngineService.svc/RunProcess
{
    "processName": "UsrMyProcess",
    "parameters": "CaseId=<guid>"
}
```

---

## DCM (Dynamic Case Management)

Дизайнер кейсов — упрощённый визуальный редактор жизненного цикла через стадии.

**Путь:** Дизайнер системы → «Дизайнер кейсов»

Отличие от BPMN: кейс — статическая диаграмма состояний, пользователь видит текущую стадию и доступные шаги.

**Важно:** «Изменить процесс» в контекстном меню объекта — относится к DCM, а **не** к BPMN-сигналам.

**Системные процессы** нельзя пересохранить напрямую — только «Сохранить новую версию» (создаёт замещение в CTI).

---

## Пространства имён для ScriptTask

```csharp
using BPMSoft.Mail;
using BPMSoft.Mail.Sender;
using BPMSoft.Core.Factories;
using BPMSoft.Configuration;
using BPMSoft.Core.Scheduler;
using BPMSoft.Common;          // для GetColumnValue<T> на IDataReader
```
