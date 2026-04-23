# ExchangeListener + Gmail на dev-сервере BPMSoft

Практическая инструкция по установке и настройке ExchangeListener микросервиса с Gmail интеграцией на dev-сервере (192.168.102.46).

**Дата:** 2026-04-20  
**Тестировано на:** ExchangeListener 0.9, BPMSoft 1.9, Debian Linux

---

## Предварительные условия

- SSH доступ к dev-серверу (192.168.102.46, user: `gore`, ключ: `~/.ssh/id_bpmsoft_dev`)
- Права sudo на dev-сервере (для добавления gore в группу docker)
- Архив ExchangeListener (`el-docker-compose-0.9.tar` в домашней директории gore)
- Тестовый Gmail-аккаунт с App Password (16-значный пароль приложения)

---

## Шаг 1: Добавить gore в группу docker

ExchangeListener требует docker доступ. Подключись с root-доступом и выполни:

```bash
sudo usermod -aG docker gore
# Переподключиться по SSH для применения изменений
```

Проверить:
```bash
groups  # должна быть строка: gore cdrom ... docker
```

---

## Шаг 2: Распаковать архив ExchangeListener

Архив имеет расширение `.tar` но на самом деле это ZIP. Распаковываем:

```bash
cd ~
mkdir el
unzip el-docker-compose-0.9.tar -d el
cd el/docker-compose
ls -la
# Должны быть: docker-compose.yaml, appsettings.json, rabbitmq.config, definitions.json, rmqsecret.json
```

---

## Шаг 3: Исправить конфликт портов Redis

На dev уже работает Redis на порту 6379 (для BPMSoft). ExchangeListener требует отдельный изолированный Redis, но нужно избежать конфликта портов.

**Проблема:** в `docker-compose.yaml` указано `"6379:6379"`, но этот порт занят.

**Решение:** меняем внешний порт на 6380 (внутри Docker-сети EL всё равно использует порт 6379):

```bash
sed -i 's/"6379:6379"/"6380:6379"/' docker-compose.yaml

# Проверить:
grep -A1 'redisOfficial:' docker-compose.yaml | grep ports
# Должно быть: - "6380:6379"
```

---

## Шаг 4: Обновить образы Redis и RabbitMQ

Образы bitnami в архиве устарели и недоступны в registry. Заменяем на официальные:

```bash
# bitnami/redis:7.0.12-debian-11-r2 → redis:7.0
sed -i "s|image: 'docker.io/bitnami/redis:7.0.12-debian-11-r2'|image: 'redis:7.0'|" docker-compose.yaml

# bitnami/rabbitmq:3.12.2-debian-11-r0 → rabbitmq:3.12-management
sed -i "s|image: 'docker.io/bitnami/rabbitmq:3.12.2-debian-11-r0'|image: 'rabbitmq:3.12-management'|" docker-compose.yaml

# Проверить:
grep 'image:' docker-compose.yaml
```

---

## Шаг 5: Запустить ExchangeListener через Docker Compose

```bash
# Все контейнеры поднимаются одной командой
docker compose up -d

# Проверить статус (должны быть все в Up):
docker ps

# Проверить API сервиса:
curl http://localhost:10000/api/listeners/status
# Ожидается: {"ServiceStatus":"Started","version":"0.9.1","connections":{}}
```

---

## Шаг 6: Настроить системные настройки в BPMSoft

В интерфейсе BPMSoft → **Администрирование** → **Системные настройки**:

Найти и отредактировать:

### 1. `ExchangeListenerServiceUri`
- **Значение:** `http://192.168.102.46:10000/api/listeners`

### 2. `BpmCrmExchangeEventsEndpointUrl`
- **Значение:** `https://localhost:5002/ServiceModel/ExchangeListenerService.svc/NewEmail`
- (localhost работает потому что BPMSoft и EL на одном хосте)

Сохранить изменения.

---

## Шаг 7: Добавить Gmail-ящик в BPMSoft

### Создание App Password в Google

1. Зайти на [myaccount.google.com](https://myaccount.google.com)
2. **Security** → **2-Step Verification** (должна быть включена)
3. Прокрутить вниз → **App passwords** (или "Пароли приложений" на русском)
4. Выбрать Device: Phone, App: Mail → **Generate**
5. Скопировать 16-значный пароль (без пробелов!)

### Добавление в BPMSoft

1. Иконка пользователя (верхний правый угол) → **Ваш профиль**
2. Вкладка **Учетные записи почты** → **Добавить почтовый сервис +**
3. Email: `<тестовый>@gmail.com`
4. Пароль: **App Password** (16 символов из Google, не пароль от аккаунта!)
5. Система автоматически определит провайдер **GMail** и протокол **IMAP**
6. Сохранить

---

## Шаг 8: Проверка диагностики

Откроить страницу диагностики: `https://192.168.102.46:5002/ClientApp/#/IntegrationDiagnostics/ExchangeListener`

Все зелёные галочки означают что всё работает:
- ✅ Старая синхронизация почты (OldEmailIntegrationFeature, выключена)
- ✅ Кеш настроек почты (IsMailboxSyncSettingsCached)
- ✅ Сервис ExchangeListener доступен (Status: Started, Version: 0.9.1)
- ✅ Подписка на ящик (Subscribers: ctibpmtst@gmail.com Status: exists)
- ✅ Правильность заполнения BpmCrmExchangeEventsEndpointUrl

Если красный крест на последнем пункте — проверить что URL содержит **localhost** или **192.168.102.46**, но **не оба вместе**.

---

## Шаг 9: Регистрация ящика для создания обращений

Групповой ящик `ctibpmtst@gmail.com` должен автоматически создавать Обращения из входящих писем.

1. Главное меню → **Справочники** → **Список почтовых ящиков для регистрации обращений**
2. Добавить строку:
   - **Email-адрес:** `ctibpmtst@gmail.com`
   - **Категория обращения:** (выбрать нужную: Инцидент / Запрос на обслуживание)
   - **Описание:** "Групповой ящик поддержки (тестирование ExchangeListener v0.9)"

Сохранить.

---

## Проверка end-to-end

1. Отправить письмо на `ctibpmtst@gmail.com` с любого внешнего ящика
2. Дождаться синхронизации (обычно 1-2 минуты)
3. Проверить что в BPMSoft создалось новое Обращение
4. Проверить что в письме указан номер обращения (в Response Email)

---

## Диагностика проблем

### Письма не синхронизируются

1. Проверить что контейнеры работают: `docker ps | grep -i listener`
2. Посмотреть логи: `docker logs ListenerAPI` (последние 50 строк)
3. Проверить диагностику в BPMSoft: `IntegrationDiagnostics/ExchangeListener`

### Неверно введён App Password

Ошибка при добавлении ящика: "Указан неправильный email или пароль"

**Решение:**
- Убедиться что вводишь **16-значный App Password**, не пароль от Google-аккаунта
- Убедиться что нет пробелов (скопировалось с пробелами из Google)
- Пересоздать App Password в Google

### ExchangeListener не доступен

Ошибка на диагностике: "Недостижимый URL сервиса обработки событий Exchange в BPMSoft"

**Решение:**
- Проверить что оба параметра заполнены правильно
- Проверить что используется **одинаковый** хост — либо `localhost`, либо `192.168.102.46`, но не микс

---

## Файлы на сервере

```
/home/gore/el/
├── docker-compose/
│   ├── docker-compose.yaml (исправлено: Redis 6380, образы обновлены)
│   ├── appsettings.json
│   ├── rabbitmq.config
│   ├── definitions.json
│   └── rmqsecret.json
└── el-docker-compose-0.9.tar (исходный архив)
```

Docker контейнеры:
```
ListenerAPI        (порт 10000)
ListenerWorker
redisOfficial      (порт 6380 снаружи, 6379 внутри Docker)
rabbitmqOfficial   (порты 5672, 15672)
```

---

## Версии компонентов

| Компонент | Версия | Статус |
|-----------|--------|--------|
| ExchangeListener | 0.9.1 | ✅ Работает |
| Redis | 7.0 | ✅ Изолирован, порт 6380 |
| RabbitMQ | 3.12-management | ✅ VirtualHost: ELhost |
| BPMSoft | 1.9 | ✅ Нативный dotnet процесс |

---

## Ссылки и источники

- NotebookLM: BPMSoft Documentation (блокнот `eb410184-caa8-42fe-92b4-6f1971f4425f`)
- Официальная документация: edu.bpmsoft.ru
- Dev-сервер: 192.168.102.46 (SSH key: `~/.ssh/id_bpmsoft_dev`)
