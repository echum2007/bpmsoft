# Task 2.3 — План внедрения

**Дата:** 2026-04-20  
**Статус:** Готово к внедрению  
**Пакет:** CTI  
**Дизайн:** [TASK_2_3_DESIGN.md](TASK_2_3_DESIGN.md)

---

## Что делаем

Когда клиент отвечает на обращение → инженер получает email с текстом письма клиента.  
Работает при **любом статусе** обращения (не только «Получен ответ»).

---

## Готовые артефакты

| Файл | Статус |
|------|--------|
| [src/UsrLatestCustomerEmailGenerator.cs](src/UsrLatestCustomerEmailGenerator.cs) | ✅ Готов |
| [src/UsrSendEmailToCaseOwnerOnReply.cs](src/UsrSendEmailToCaseOwnerOnReply.cs) | ✅ Готов |
| BPMN ScriptTask (код ниже) | ✅ Готов |

---

## Шаги внедрения

### Шаг 1: Создать справочник `UsrEmployeeNotificationEventType`

Дизайнер → Новый объект → Справочник.

| Поле | Значение |
|------|---------|
| Название | UsrEmployeeNotificationEventType |
| Пакет | CTI |

Колонки (оставить стандартные: Id, Name, Description).

Данные (добавить через Data или вручную после публикации):

| Name | Description |
|------|-------------|
| CustomerReply | Ответ клиента |
| OwnerAssigned | Назначение ответственного |
| GroupAssigned | Назначение на группу |
| StatusChanged | Смена статуса |

---

### Шаг 2: Создать справочник `UsrEmployeeNotificationRecipientType`

Дизайнер → Новый объект → Справочник.

| Поле | Значение |
|------|---------|
| Название | UsrEmployeeNotificationRecipientType |
| Пакет | CTI |

Данные:

| Name | Description |
|------|-------------|
| Owner | Ответственный |
| Group | Группа |
| Role | Роль |

---

### Шаг 3: Создать объект `UsrEmployeeNotificationRule`

Дизайнер → Новый объект → Объект (не справочник).

| Поле | Значение |
|------|---------|
| Название | UsrEmployeeNotificationRule |
| Пакет | CTI |

Колонки:

| Название колонки | Тип | Обязательное | Ссылка на |
|-----------------|-----|-------------|-----------|
| CaseStatus | Lookup | нет | CaseStatus |
| CaseCategory | Lookup | нет | Case.Category (CaseCategory) |
| UsrEventType | Lookup | нет | UsrEmployeeNotificationEventType |
| EmailTemplate | Lookup | да | EmailTemplate |
| UsrRecipientType | Lookup | да | UsrEmployeeNotificationRecipientType |
| Role | Lookup | нет | SysRole |
| IsActive | Boolean | да | — |

Опубликовать объект.

---

### Шаг 4: Создать C# схему `UsrLatestCustomerEmailGenerator`

Дизайнер → Новая схема → Тип: **Исходный код** → Пакет: CTI.

- Название: `UsrLatestCustomerEmailGenerator`
- Вставить код из [src/UsrLatestCustomerEmailGenerator.cs](src/UsrLatestCustomerEmailGenerator.cs)
- Сохранить и опубликовать

**Зарегистрировать макрос** через **Data пакета CTI** (UI для этого не предусмотрен):

1. Раздел «Конфигурация» → пакет CTI → добавить элемент типа **«Данные»**
2. Объект: `EmailTemplateMacros`
3. Вкладка «Установка данных» → добавить запись:
   - `Name` = `UsrLatestCustomerEmailGenerator`
   - `ParentId` = запись с `Name = '@Invoke'` (выбрать из справочника)
   - `ColumnPath` = `BPMSoft.Configuration.UsrLatestCustomerEmailGenerator`
4. Сохранить — при установке пакета на любую среду регистрация выполнится автоматически

---

### Шаг 5: Создать C# схему `UsrSendEmailToCaseOwnerOnReply`

Дизайнер → Новая схема → Тип: **Исходный код** → Пакет: CTI.

- Название: `UsrSendEmailToCaseOwnerOnReply`
- Вставить код из [src/UsrSendEmailToCaseOwnerOnReply.cs](src/UsrSendEmailToCaseOwnerOnReply.cs)
- Сохранить и опубликовать

---

### Шаг 6: Клонировать шаблон email и добавить макрос

**Дизайнер системы → Справочники → «Шаблоны сообщений»** → найти шаблон с UId `18834f34`.

1. Выделить шаблон → меню **«Действия» → «Копировать»**
2. Открыть копию, задать название: «Уведомление инженеру — ответ клиента»
3. На детали «Шаблон письма» нажать **«Редактировать»** → откроется дизайнер контента
4. Поставить курсор в место вставки (конец тела письма)
5. Нажать кнопку вставки макросов → выбрать **«Пользовательский макрос»**
6. Выбрать `UsrLatestCustomerEmailGenerator` из списка
7. Сохранить шаблон. Запомнить UId новой записи.

> ⚠️ Шаг 6 выполнять **после** шага 4 (публикация C# класса и регистрация в EmailTemplateMacros) — иначе макрос не появится в списке.

---

### Шаг 7: Добавить данные в `UsrEmployeeNotificationRule`

По документации: сначала создать записи через UI, затем привязать к пакету через «Данные».

**7.1 Создать записи через UI**

Дизайнер системы → Справочники → найти `UsrEmployeeNotificationRule` → открыть → добавить записи:

**Правило 1 — Ответственному:**

| Поле | Значение |
|------|---------|
| UsrEventType | CustomerReply |
| EmailTemplate | UsrNotifyEngineerOnReply (UId из шага 6) |
| UsrRecipientType | Owner |
| IsActive | true |
| Остальные | пусто (NULL) |

**Правило 2 — Роли «1-я линия»:**

| Поле | Значение |
|------|---------|
| UsrEventType | CustomerReply |
| EmailTemplate | UsrNotifyEngineerOnReply |
| UsrRecipientType | Role |
| Role | «1-я линия» (найти в справочнике ролей) |
| IsActive | true |

> ⚠️ Правило 2 заменяет хардкод CC из `UsrProcess_0c71a12CTI5`. Добавить ДО шага 9.

**7.2 Привязать записи к пакету CTI**

Раздел «Конфигурация» → пакет CTI → «Добавить» → «Данные»:
1. Объект: `UsrEmployeeNotificationRule`
2. Тип установки: «Установка»
3. Вкладка «Настройка колонок» — выбрать все нужные колонки, **обязательно включая `Id`**
4. Вкладка «Привязанные данные» → «Добавить» → выбрать оба созданных правила
5. Сохранить

---

### Шаг 8: Создать BPMN `UsrSendEmailToCaseOwnerOnReplyProcess`

Дизайнер системы → Библиотека процессов → «Добавить процесс» → Пакет: CTI.

**StartSignal** — добавить начальное событие «Сигнал»:
- «Сигнал какого типа получен?» → **«Получен сигнал от объекта»**
- Объект: **Активность** (Activity)
- «Какое событие должно произойти?» → **«Добавление записи»**
- Блок «Добавленная запись должна соответствовать условиям» — добавить фильтры:
  - `Тип = Email` (ActivityType)
  - `Направление = Входящее`
  - `Обращение заполнено` (CaseId IS NOT NULL)
  - `ServiceProcessed = false`

> Код элемента сигнала (вкладка «Настройки» → «Расширенный режим») запомнить — он нужен в ScriptTask. Например: `StartSignal1`.

**ScriptTask** — добавить элемент «Задание-сценарий» после StartSignal:

```csharp
var notifier = new UsrSendEmailToCaseOwnerOnReply(UserConnection);
notifier.ActivityId = Get<Guid>("StartSignal1.RecordId");
notifier.Execute();
```

> `StartSignal1` — заменить на фактический код элемента сигнала из диаграммы.  
> `RecordId` — стандартный исходящий параметр StartSignal с Id добавленной записи.

**Завершающее событие** → сохранить → **опубликовать** (ScriptTask требует публикации).

> ⚠️ Не активировать до шага 9.

---

### Шаг 9: Переключение (деплой)

Выполнять последовательно, без паузы:

1. **Убедиться** что Правило 2 (роль «1-я линия») добавлено в UsrEmployeeNotificationRule
2. **Активировать** `UsrSendEmailToCaseOwnerOnReplyProcess` в дизайнере процессов
3. **Деактивировать** `UsrProcess_0c71a12CTI5` в дизайнере процессов

Перезапуск Kestrel **не нужен** — C# схемы (Исходный код) подхватываются после публикации. BPMN активируется мгновенно.

---

## Rollback

1. Реактивировать `UsrProcess_0c71a12CTI5`
2. Деактивировать `UsrSendEmailToCaseOwnerOnReplyProcess`
3. Время: ~1 минута, без деплоя пакета

---

## Проверка после внедрения

1. Отправить тестовое письмо на ящик обращений (с любым статусом: Новое, В работе, Получен ответ)
2. Убедиться что инженер получил email
3. Убедиться что в письме есть блок «Сообщение клиента» с текстом
4. Убедиться что роль «1-я линия» тоже получила уведомление
5. Проверить лог `CaseNotification` на ошибки

---

## Важные зависимости

- `UsrLatestCustomerEmailGenerator` получает тело письма по `ActivityId` конкретного входящего письма (не «последнего» — исключает race condition)
- `SendEmailFromTo` не читает GetCaseData → recipient передаётся явно через ESQ `Case.Owner.Email`
- `ServiceProcessed=false` в фильтре StartSignal корректен: INSERT Activity происходит до того как `ReopenCaseAndNotifyAssignee.Run()` ставит `true`
