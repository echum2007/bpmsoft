# Проект: CC-адреса в уведомлениях

**Обновлено:** 2026-04-15  
**Статус:** ✅ На проде с 2026-04-11  
**Детальная документация:** `projects/cc-notifications/`

---

## Цель

Добавить CC-адреса к email-уведомлениям по обращениям:
- На уровне **сервисного договора** (ServicePact) — для всех обращений по договору
- На уровне **обращения** (Case) — вручную или из заголовка CC входящего email

## Реализованные компоненты

| Компонент | Тип | Пакет |
|---|---|---|
| `Case.UsrCcEmails` | Колонка (varchar 500) | CTI |
| `ServicePact.UsrCcEmails` | Колонка (varchar 500) | CTI |
| Поле CC на CasePage | JS ExtendParent | CTI |
| Поле CC на ServicePactPage | JS ExtendParent | CTI |
| `UsrCcAddressResolver` | C# SourceCode | CTI |
| `UsrActivityCcEventListener` | C# EntityEventListener | CTI |

## Ключевое решение

`UsrActivityCcEventListener` перехватывает `OnSaving` для Activity:
- Проверяет: TypeId = Email, MessageTypeId = Исходящее, связь с Case
- Дочитывает CC из `Case.UsrCcEmails` + `ServicePact.UsrCcEmails`
- Дописывает в `Activity.CopyRecepient` (строка через пробел)

Охватывает все пути отправки (старый BPMN, мультиязычный, ручная отправка).
