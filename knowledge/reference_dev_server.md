# Dev-сервер BPMSoft — подключение и версии

**Обновлено:** 2026-04-19  
**Проверено:** SSH подключение успешно, версии ПО проверены  

---

## 🔌 Координаты подключения

| Параметр | Значение |
|---|---|
| **Host** | 192.168.102.46 |
| **User** | gore |
| **SSH Port** | 22 (default) |
| **SSH Key** | ~/.ssh/id_bpmsoft_dev (ed25519) |
| **OS** | Debian 6.1.0-32-amd64 |

---

## 🔑 SSH-ключ

**Локальный путь:** ~/.ssh/id_bpmsoft_dev  
**Тип:** ed25519  
**Публичный ключ:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJvGpKrnLKcewM7+aV2nCeHSgWRPzkAa38xYw68799eX claude-code-bpmsoft
```

**Known hosts:** 192.168.102.46 зарегистрирован в ~/.ssh/known_hosts

---

## 📝 Команды подключения

### Интерактивная сессия

```bash
ssh -i ~/.ssh/id_bpmsoft_dev gore@192.168.102.46
```

### Выполнение команды

```bash
ssh -i ~/.ssh/id_bpmsoft_dev gore@192.168.102.46 "команда"
```

### Примеры

```bash
# Проверить всё сразу
ssh -i ~/.ssh/id_bpmsoft_dev gore@192.168.102.46 \
  "echo '=== OS ===' && uname -a && \
   echo '=== PostgreSQL ===' && psql --version && \
   echo '=== Redis ===' && redis-cli --version && \
   echo '=== .NET ===' && dotnet --version"

# Проверить PostgreSQL версию
ssh -i ~/.ssh/id_bpmsoft_dev gore@192.168.102.46 "psql --version"

# Подключиться к PostgreSQL БД
ssh -i ~/.ssh/id_bpmsoft_dev gore@192.168.102.46 "psql -h localhost -U postgres -d имя_БД"

# Проверить Redis версию
ssh -i ~/.ssh/id_bpmsoft_dev gore@192.168.102.46 "redis-cli --version"

# Проверить .NET версию
ssh -i ~/.ssh/id_bpmsoft_dev gore@192.168.102.46 "dotnet --version && dotnet --list-runtimes"
```

---

## 📊 Версии ПО на dev

**Проверено:** 2026-04-19 21:40 UTC+3

| Компонент | Версия | Статус |
|---|---|---|
| **OS** | Debian 6.1.0-32-amd64 | ✅ |
| **.NET SDK** | 8.0.420 | ✅ Совпадает требованиям |
| **.NET Runtime** | 8.0.26 (AspNetCore + Core) | ✅ |
| **PostgreSQL** | 12.22 (Debian 12.22-3.pgdg12+1) | ⚠️ Старше чем в NOTEBOOKLM_SOURCES (14-17) |
| **Redis** | 7.0.15 | ✅ Соответствует "latest" |

---

## ⚠️ Важные замечания

### PostgreSQL версия несовпадает

- **На dev:** PostgreSQL 12.22
- **В NOTEBOOKLM_SOURCES.md:** PostgreSQL 14–17
- **Проблема:** версия 12 старше требуемого диапазона
- **Решение:** необходимо обновить NOTEBOOKLM_SOURCES.md с актуальной версией или уточнить совместимость

### Redis версия в порядке

Redis 7.0.15 соответствует требованиям и может использоваться как "latest" для документации.

### .NET версия совпадает идеально

.NET 8.0.420 на dev точно совпадает с требованиями BPMSoft 1.9 по NOTEBOOKLM_SOURCES.md и CLAUDE.md.

---

## 🔗 Связанные материалы

- `CLAUDE.md` — требования платформы (.NET 8, Linux/Kestrel)
- `NOTEBOOKLM_SOURCES.md` — источники для NotebookLM блокнотов (версии зависимостей)
- `knowledge/wiki/platform.md` — архитектура и стек технологий
- `memory/reference_dev_server.md` — дополнительные детали в личной памяти Claude

---

## 📌 Как использовать

1. **Для проверки версий:** используй SSH-команды из раздела "Примеры"
2. **Для отладки:** подключись через интерактивную сессию
3. **Для скриптов:** используй `ssh -i ~/.ssh/id_bpmsoft_dev gore@192.168.102.46 "скрипт"`
4. **Для синхронизации:** всегда проверяй версии на dev перед обновлением документации

---

**Автор:** Claude Code (заполнено автоматически из SSH session)  
**Last verified:** 2026-04-19 21:40 UTC+3
