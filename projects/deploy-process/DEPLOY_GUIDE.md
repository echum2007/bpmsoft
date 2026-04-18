# Инструкция по переносу изменений между средами BPMSoft

## Концепция

```
VS Code (локально)
    │  git commit + push
    ▼
GitHub (master = прод, dev = разработка)
    │  git pull (вручную на сервере)
    ▼
Dev-сервер: /etc/bpmsoft/BPMSoft.Configuration/Pkg/CTI/
    │  (BPMSoft читает файлы напрямую — файловая разработка)
    │  Экспорт пакета CTI → .zip
    ▼
Прод: Импорт пакета CTI (.zip)
```

---

## Часть 1: Первоначальная настройка (один раз)

### 1.1 Создать ветку dev

```bash
# Локально
git checkout -b dev
git push -u origin dev
```

**Зачем:** master всегда = состояние прода. dev = то, над чем работаем. Никогда не коммитить напрямую в master.

---

### 1.2 Клонировать репо на dev-сервере

Подключись к dev-серверу по SSH:

```bash
ssh user@dev-server
```

Клонируй репо:

```bash
git clone https://github.com/echum2007/bpmsoft.git ~/bpmsoft-repo
cd ~/bpmsoft-repo
git checkout dev
```

---

### 1.3 Синхронизировать текущее состояние dev → git (один раз)

Перед заменой папки — нужно зафиксировать то, что сейчас на dev-сервере, чтобы ничего не потерять.

```bash
# На dev-сервере: сравниваем что есть на сервере и что в git
diff -rq /etc/bpmsoft/BPMSoft.Configuration/Pkg/CTI/ ~/bpmsoft-repo/src/CTI/CTI/ \
    --exclude="*.log" --exclude="*.bak"
```

Если есть различия — копируем актуальный CTI в репо:

```bash
rsync -av /etc/bpmsoft/BPMSoft.Configuration/Pkg/CTI/ ~/bpmsoft-repo/src/CTI/CTI/
cd ~/bpmsoft-repo
git add src/CTI/CTI/
git commit -m "sync: начальное состояние CTI с dev-сервера"
git push origin dev
```

Локально подтянуть:

```bash
git pull
```

---

### 1.4 Подключить git-репо к BPMSoft (заменить папку CTI)

> ⚠️ **ВНИМАНИЕ:** Этот шаг заменяет рабочую папку пакета. Сделай резервную копию сначала.

```bash
# На dev-сервере:

# Резервная копия текущей папки CTI
cp -r /etc/bpmsoft/BPMSoft.Configuration/Pkg/CTI \
      /etc/bpmsoft/BPMSoft.Configuration/Pkg/CTI_backup_$(date +%Y%m%d)

# Удалить старую папку CTI
rm -rf /etc/bpmsoft/BPMSoft.Configuration/Pkg/CTI

# Создать симлинк: BPMSoft → git-репо
ln -s ~/bpmsoft-repo/src/CTI/CTI \
      /etc/bpmsoft/BPMSoft.Configuration/Pkg/CTI
```

Проверяем:

```bash
ls -la /etc/bpmsoft/BPMSoft.Configuration/Pkg/CTI
# Должно показать: CTI -> /home/user/bpmsoft-repo/src/CTI/CTI
```

После этого BPMSoft читает CTI напрямую из git-репо.

---

## Часть 2: Рабочий процесс (каждая задача)

### 2.1 Начало задачи

```bash
# Локально: создаём ветку для задачи
git checkout dev
git pull origin dev
git checkout -b feature/название-задачи

# Пример:
git checkout -b feature/labor-records
```

### 2.2 Разработка

Редактируем файлы в VS Code в папке `src/CTI/CTI/Schemas/`.

На dev-сервере после `git pull` BPMSoft видит изменения автоматически (файловая разработка). Публикуем схему в UI BPMSoft → тестируем.

> ⚠️ **Запрет «Сохранить новую версию»** для системных BPMN-процессов: кнопка создаёт замещение в пакете CTI, которое замораживает логику. При обновлении платформы новые исправления вендора не будут применены к этому процессу. Использовать только если нет другого способа.

```bash
# Коммит после каждого логического изменения
git add src/CTI/CTI/
git commit -m "labor-records: добавить объект UsrLaborRecord"
git push origin feature/labor-records
```

### 2.3 Синхронизация с dev-сервером

```bash
# На dev-сервере:
cd ~/bpmsoft-repo
git pull origin feature/labor-records
# BPMSoft сразу видит изменения — публикуем схему в UI
```

---

## Часть 3: Перенос на прод

### Чеклист переноса (выполнять по порядку)

```
□ Шаг 1. Создать папку для архивов (если нет)
□ Шаг 2. Экспортировать ТЕКУЩИЙ прод → сохранить архив (страховка отката)
□ Шаг 3. Поставить git-тег на текущий master (точка отката в git)
□ Шаг 4. Смержить feature → dev → master
□ Шаг 5. Поставить git-тег на новый master
□ Шаг 6. На dev: git pull, убедиться что всё работает
□ Шаг 7. Экспортировать CTI с dev → сохранить архив
□ Шаг 8. Импортировать .zip на прод
□ Шаг 9. Перезапустить Kestrel (если был EventListener)
□ Шаг 10. Проверить работоспособность на проде
   □ OK → готово
   □ Проблема → Шаг 11
□ Шаг 11 (откат). Импортировать архив из Шага 2 → перезапустить Kestrel
```

---

### Шаг 1. Создать папку для архивов

```bash
# Локально (один раз):
mkdir -p projects/prod-releases
```

В `.gitignore` добавить (чтобы .zip не попадали в git):
```
projects/prod-releases/*.zip
```

---

### Шаг 2. Экспортировать текущий прод (СТРАХОВКА)

В BPMSoft **прод** UI:
```
Конфигурация → Список пакетов → CTI → кнопка "Экспортировать"
→ скачать CTI.zip
→ сохранить как: projects/prod-releases/CTI_YYYY-MM-DD_до-[задача].zip
```

Пример: `CTI_2026-04-09_до-labor-records.zip`

---

### Шаг 3. Тег на текущий master (точка отката в git)

```bash
git checkout master
git tag prod-YYYY-MM-DD -m "прод до: [название задачи]"
git push origin --tags

# Пример:
git tag prod-2026-04-09-before -m "прод до: labor-records"
```

---

### Шаг 4. Мерж feature → dev → master

```bash
# Смержить feature в dev
git checkout dev
git merge feature/labor-records

# Смержить dev в master
git checkout master
git merge dev
git push origin master
```

---

### Шаг 5. Тег на новый master

```bash
git tag prod-YYYY-MM-DD -m "прод: [название задачи]"
git push origin --tags

# Пример:
git tag prod-2026-04-10-labor-records -m "прод: labor-records"
```

---

### Шаг 6. Проверить dev

```bash
# На dev-сервере:
cd ~/bpmsoft-repo
git pull origin master
```

Убедиться, что BPMSoft dev работает корректно с новым кодом.

---

### Шаг 7. Экспортировать CTI с dev

> ⚠️ **Призрачные схемы (Ghost Schemas):** объекты, удалённые в БД, могут сохраняться в старых архивных копиях репозитория. Всегда экспортировать заново с dev — не использовать старый .zip повторно.

В BPMSoft **dev** UI:
```
Конфигурация → Список пакетов → CTI → "Экспортировать"
→ сохранить как: projects/prod-releases/CTI_YYYY-MM-DD_[задача].zip
```

Пример: `CTI_2026-04-10_labor-records.zip`

---

### Шаг 8. Импортировать на прод

В BPMSoft **прод** UI:
```
Конфигурация → Импорт пакетов → выбрать .zip из Шага 7 → Импортировать
```

---

### Шаг 9. Перезапустить Kestrel (если нужно)

Нужен если в изменениях был **C#-код** (Исходный код), **EventListener** или **новый IMacrosInvokable**. JS/BPMN — перезапуск не нужен. Полная матрица: `knowledge/wiki/platform.md`, раздел «Матрица перезапуска Kestrel».

Схема с атрибутом `[EntityEventListener]`:

```bash
# На прод-сервере:
sudo systemctl restart bpmsoft
# или
sudo systemctl restart kestrel-bpmsoft
```

---

### Шаг 10. Проверка

Проверить функциональность на проде по тест-плану задачи.

---

### Шаг 11. Откат (если что-то пошло не так)

В BPMSoft **прод** UI:
```
Конфигурация → Импорт пакетов → выбрать архив из Шага 2 (CTI_..._до-[задача].zip)
→ Импортировать
```

Перезапустить Kestrel если нужно. Готово — прод на предыдущей версии.

---

## Часть 4: Хранение архивов

Держать локально последние **5 архивов прода**. Старые можно удалять.

```
projects/prod-releases/
├── CTI_2026-04-08_до-cc-notifications.zip   ← предыдущий прод (можно удалить)
├── CTI_2026-04-08_cc-notifications.zip      ← после CC
├── CTI_2026-04-09_до-labor-records.zip      ← перед labor-records (ДЕРЖАТЬ)
└── CTI_2026-04-10_labor-records.zip         ← текущий прод
```

---

## Справка: git-теги

```bash
# Посмотреть все теги (история релизов)
git tag -l "prod-*" --sort=-version:refname

# Посмотреть что было в конкретном теге
git show prod-2026-04-08-cc-notifications

# Восстановить состояние кода на момент тега (только для просмотра)
git checkout prod-2026-04-08-cc-notifications
git checkout master  # вернуться назад
```
