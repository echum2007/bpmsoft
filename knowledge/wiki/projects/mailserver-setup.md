# Локальный почтовый сервер для тестирования BPMSoft

Инструкция по установке Docker Mailserver на dev-сервере (192.168.102.46) для тестирования нотификаций BPMSoft.

**Дата:** 2026-04-22 → обновлено 2026-04-27  
**Статус:** ✅ docker-mailserver установлен и работает на 192.168.102.46 (порты 25/143). Все 5 ящиков созданы, доставка проверена.

---

## ⚠️ Урок: Stalwart v0.16 — проверяй документацию перед деплоем

Stalwart v0.16 тихо удалил Management REST API (`/api/principal` → 404) и заменил его на JMAP без документации. Веб-панель не работает из-за бага PKCE. SMTP/IMAP функционируют, но создавать ящики невозможно.

**Потрачено:** несколько часов отладки несуществующих endpoint'ов.  
**Вывод:** перед деплоем новой версии ПО проверять, покрывает ли официальная документация **именно ту версию** и её management API. Если нет — версия не готова.

Подробнее: `concepts/stalwart-v016-breaking-api-change.md`, `concepts/software-adoption-documentation-check.md`

---

**Итог по Stalwart:** SMTP/IMAP работает, но создать ящики невозможно — Management API в v0.16 переехал на JMAP без документации, веб-панель не логинится (баг PKCE). Stalwart снести перед установкой docker-mailserver: `docker compose stop stalwart && docker run --rm -v ~/el/docker-compose/docker-data/stalwart:/mnt alpine rm -rf /mnt`.

---

## Архитектура решения

- **Docker Mailserver** (Postfix + Dovecot) — SMTP + IMAP
- **Roundcube** — webmail для ручной проверки ящиков (порт 8025)
- **Mailpit** — не используем (нет IMAP, не подходит для группового ящика BPMSoft)
- Домен: `cti.test` (полностью локальный, наружу не уходит)

### Роли ящиков

| Ящик | Роль |
|------|------|
| `support@cti.test` | Групповой — BPMSoft мониторит по IMAP, создаёт обращения |
| `engineer1@cti.test` | Инженер 1 — получает нотификации |
| `engineer2@cti.test` | Инженер 2 — получает нотификации |
| `customer1@cti.test` | Заказчик 1 — получает нотификации |
| `customer2@cti.test` | Заказчик 2 — получает нотификации |

Пароль всех ящиков: `password123`

---

## Шаг 1: Добавить в docker-compose.yaml

Файл: `~/el/docker-compose/docker-compose.yaml`

Добавить секцию `mailserver` в `services:`:

```yaml
  mailserver:
    image: ghcr.io/docker-mailserver/docker-mailserver:latest
    container_name: mailserver
    hostname: mail.cti.test
    environment:
      - SSL_TYPE=               # TLS отключён — для тестов не нужен
      - ENABLE_IMAP=1
      - POSTFIX_INET_PROTOCOLS=ipv4
      - DOVECOT_INET_PROTOCOLS=ipv4
    ports:
      - "25:25"    # SMTP
      - "143:143"  # IMAP
    volumes:
      - ./docker-data/dms/mail-data/:/var/mail/
      - ./docker-data/dms/mail-state/:/var/mail-state/
      - ./docker-data/dms/mail-logs/:/var/log/mail/
      - ./docker-data/dms/config/:/tmp/docker-mailserver/
      - /etc/localtime:/etc/localtime:ro
    restart: unless-stopped
    stop_grace_period: 1m
```

---

## Шаг 2: Поднять контейнер

```bash
cd ~/el/docker-compose
docker compose up -d mailserver
docker ps | grep mailserver
```

---

## Шаг 3: Создать ящики

```bash
docker exec mailserver setup email add support@cti.test password123
docker exec mailserver setup email add engineer1@cti.test password123
docker exec mailserver setup email add engineer2@cti.test password123
docker exec mailserver setup email add customer1@cti.test password123
docker exec mailserver setup email add customer2@cti.test password123
```

---

## Шаг 4: Проверить список ящиков

```bash
docker exec mailserver setup email list
```

---

## Шаг 5: Настроить BPMSoft

В системных настройках BPMSoft указать групповой ящик:
- SMTP: `192.168.102.46:25`, без TLS
- IMAP: `192.168.102.46:143`, без TLS
- Логин: `support@cti.test`, пароль: `password123`

---

## Шаг 6: Roundcube (webmail)

Добавить в `~/el/docker-compose/docker-compose.yaml`:

```yaml
  roundcube:
    image: roundcube/roundcubemail:latest
    container_name: roundcube
    environment:
      - ROUNDCUBEMAIL_DEFAULT_HOST=192.168.102.46
      - ROUNDCUBEMAIL_DEFAULT_PORT=143
      - ROUNDCUBEMAIL_SMTP_SERVER=192.168.102.46
      - ROUNDCUBEMAIL_SMTP_PORT=587
    ports:
      - "8025:80"
    restart: unless-stopped
```

```bash
docker compose up -d roundcube
```

Открыть: **http://192.168.102.46:8025**
Логин: `engineer1@cti.test` / `password123`

---

## Проверка нотификаций

Через Roundcube (http://192.168.102.46:8025) — войти под нужным ящиком и проверить входящие.

Через CLI (для Claude):
```bash
docker exec mailserver bash -c "doveadm fetch -u engineer1@cti.test 'hdr.Subject' mailbox INBOX all"
```

---

## Источники

- Официальный docker-compose: https://github.com/docker-mailserver/docker-mailserver
- ExchangeListener инструкция: `knowledge/wiki/projects/exchangelistener-gmail-setup.md`

---

## Вариант 2: Stalwart (приоритетный, УСТАНОВЛЕН 2026-04-22)

**Статус:** Stalwart v0.16.0 запущен и работает в production mode. Ящики ещё не созданы.

**Почему Stalwart лучше для нашей задачи:**

- SMTP + IMAP в одном контейнере
- Веб-панель администратора для управления ящиками
- Нет webmail для пользователей — это отдельный продукт

### Актуальная docker-compose секция (~/el/docker-compose/docker-compose.yaml)

```yaml
  stalwart:
    image: stalwartlabs/stalwart:latest       # ← правильное имя образа (не mail-server!)
    container_name: stalwart
    command: ["-c", "/etc/stalwart/config.json"]  # ← ОБЯЗАТЕЛЬНО, без этого bootstrap mode
    ports:
      - "25:25"      # SMTP
      - "143:143"    # IMAP
      - "587:587"    # SMTP submission
      - "8080:8080"  # Веб-панель администратора
    volumes:
      - ./docker-data/stalwart/config:/etc/stalwart   # ← два раздельных volume!
      - ./docker-data/stalwart/data:/var/lib/stalwart
      - /etc/localtime:/etc/localtime:ro
    environment:
      - STALWART_RECOVERY_ADMIN=admin:Admin123!!!
    restart: unless-stopped
```

**Важные нюансы v0.16:**
- Образ: `stalwartlabs/stalwart:latest` (НЕ `stalwartlabs/mail-server`)
- Два отдельных volume: `/etc/stalwart` (config.json) и `/var/lib/stalwart` (RocksDB)
- Без `command: ["-c", "/etc/stalwart/config.json"]` — всегда стартует в bootstrap mode
- Директории должны принадлежать uid=2000: `docker run alpine chown -R 2000:2000 /etc/stalwart /var/lib/stalwart`

### Начальная настройка (wizard, однократно)

```bash
cd ~/el/docker-compose
# Убедиться что директории с правильными правами:
docker run --rm -v ./docker-data/stalwart/config:/etc/stalwart -v ./docker-data/stalwart/data:/var/lib/stalwart alpine chown -R 2000:2000 /etc/stalwart /var/lib/stalwart

# Запустить БЕЗ command override (для bootstrap):
# Временно убрать command из docker-compose, запустить, пройти wizard
docker compose up -d stalwart
# Открыть http://192.168.102.46:8080/admin/ → войти admin/Admin123!!! → пройти wizard:
# - Hostname: 192.168.102.46
# - Email Domain: cti.test
# - TLS: выключить
# - Storage: RocksDB, path /var/lib/stalwart/ (по умолчанию)
# - Directory: Internal
# - DNS: Manual
# После wizard — ДОБАВИТЬ command в docker-compose и перезапустить:
docker compose up -d stalwart
```

**Admin credentials (созданы wizard 2026-04-22):**
- Email: `admin@cti.test`
- Password: `qNfsIR4nkrzUwgGR`

### Получение Bearer токена для API

В Stalwart 0.16 Management API требует Bearer токен (Basic Auth не работает для управления):

```bash
# Шаг 1: получить device code
DEVICE=$(curl -s -X POST http://localhost:8080/auth/device \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=webadmin")
DEVICE_CODE=$(echo $DEVICE | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['device_code'])")
USER_CODE=$(echo $DEVICE | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['user_code'])")

# Шаг 2: авторизовать через /api/auth
curl -s -X POST http://localhost:8080/api/auth \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"authDevice\",\"accountName\":\"admin@cti.test\",\"accountSecret\":\"qNfsIR4nkrzUwgGR\",\"code\":\"$USER_CODE\"}"

# Шаг 3: получить токен
sleep 1
TOKEN=$(curl -s -X POST http://localhost:8080/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=$DEVICE_CODE&client_id=webadmin" | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "TOKEN: $TOKEN"
```

### Создание ящиков (TODO — endpoint не найден для v0.16)

В v0.16 API endpoint для создания аккаунтов изменился. `/api/principal` возвращает 404.
Проверенные варианты которые НЕ работают: `/api/principal`, `/api/principals`, `/api/settings/account`.
`/api/account` с Bearer токеном возвращает 200 но это GET текущего аккаунта.

**Следующий шаг:** найти правильный endpoint через веб-панель (Network tab в DevTools браузера при создании аккаунта вручную).

Целевые ящики (пароль всех: `password123`):
- `support@cti.test` — групповой для BPMSoft
- `engineer1@cti.test`
- `engineer2@cti.test`
- `customer1@cti.test`
- `customer2@cti.test`

### Настройка BPMSoft (после создания ящиков)

- SMTP: `192.168.102.46:25` или `587`, без TLS
- IMAP: `192.168.102.46:143`, без TLS
- Логин: `support@cti.test`, пароль: `password123`

### Проблема с логином в веб-панель

При открытии `http://192.168.102.46:8080/admin/` браузер показывает HTTP Basic Auth диалог.
Нажать **Cancel** — после этого должна открыться страница входа Stalwart.
Если после Cancel появляется "Temporary error" — это значит браузер отправил пустой Basic Auth запрос.
Войти через прямую ссылку: `http://192.168.102.46:8080/admin/` и ввести `admin@cti.test` / `qNfsIR4nkrzUwgGR`.

### Источники

- [GitHub stalwartlabs/stalwart](https://github.com/stalwartlabs/stalwart)
- [Docker Hub](https://hub.docker.com/r/stalwartlabs/stalwart)
