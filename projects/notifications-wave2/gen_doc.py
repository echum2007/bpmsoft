from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from docx.opc.constants import RELATIONSHIP_TYPE as RT

doc = Document()

# === LANDSCAPE ORIENTATION ===
from docx.oxml import OxmlElement
section = doc.sections[0]
section.page_width, section.page_height = section.page_height, section.page_width
section.left_margin = Cm(1.5)
section.right_margin = Cm(1.5)
section.top_margin = Cm(1.5)
section.bottom_margin = Cm(1.5)

style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(9)


def set_col_widths(table, widths):
    for row in table.rows:
        for i, cell in enumerate(row.cells):
            if i < len(widths):
                cell.width = widths[i]


def shade_cell(cell, hex_color):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)


def add_header_row(table, texts, bg='2E74B5'):
    row = table.rows[0]
    for i, text in enumerate(texts):
        if i >= len(row.cells):
            break
        cell = row.cells[i]
        cell.text = text
        shade_cell(cell, bg)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.runs[0]
        run.bold = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        run.font.size = Pt(8.5)


def add_data_row(table, texts, bg=None):
    row = table.add_row()
    for i, text in enumerate(texts):
        if i >= len(row.cells):
            break
        cell = row.cells[i]
        cell.text = text
        if bg:
            shade_cell(cell, bg)
        p = cell.paragraphs[0]
        if p.runs:
            p.runs[0].font.size = Pt(8.5)
    return row


def add_h(doc, text, level=1):
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.color.rgb = RGBColor(0x1F, 0x39, 0x64)
    return h


def add_body(doc, text):
    p = doc.add_paragraph(text)
    p.runs[0].font.size = Pt(9.5)
    return p


def add_note(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.5)
    r1 = p.add_run('\u26a0 Примечание: ')
    r1.bold = True
    r1.font.size = Pt(8.5)
    r1.font.color.rgb = RGBColor(0x80, 0x60, 0x00)
    r2 = p.add_run(text)
    r2.font.size = Pt(8.5)
    r2.font.italic = True
    r2.font.color.rgb = RGBColor(0x60, 0x60, 0x60)


# ===================== TITLE =====================
title = doc.add_heading('Система email-уведомлений по обращениям', 0)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub = doc.add_paragraph('Описание работающего механизма (CTI / BPMSoft 1.9). Источники: анализ кода + документация BPMSoft v1.9')
sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub.runs[0].font.color.rgb = RGBColor(0x70, 0x70, 0x70)
sub.runs[0].font.size = Pt(10)
d = doc.add_paragraph('Дата: 14.04.2026  |  Архив прода: CTI от 2026-04-11')
d.alignment = WD_ALIGN_PARAGRAPH.CENTER
d.runs[0].font.size = Pt(8.5)
d.runs[0].font.color.rgb = RGBColor(0xAA, 0xAA, 0xAA)
doc.add_paragraph()

# ===================== РАЗДЕЛ 0: Кому уходят уведомления =====================
add_h(doc, '0. Кому отправляются уведомления — логика получателей', 1)
add_body(doc,
    'В обращении есть два разных контакта на стороне клиента:\n'
    '  \u2022 \u00abИнициатор\u00bb — контакт, который зарегистрировал обращение (кто написал/позвонил)\n'
    '  \u2022 \u00abПользователь услуги\u00bb — контакт, для которого зарегистрировано обращение (кто фактически пострадал)\n\n'
    'Это могут быть разные люди. Например: секретарь (инициатор) подала обращение за директора (пользователь услуги).\n\n'
    '\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u043d\u043e\u0435 \u043b\u0438\u0446\u043e (кому реально уйдёт письмо) определяется системными настройками:'
)
doc.add_paragraph()

t0 = doc.add_table(rows=1, cols=4)
t0.style = 'Table Grid'
add_header_row(t0, ['Системная настройка', 'Код', 'По умолчанию', 'Что означает'])
sysset_rows = [
    ('Оповещение пользователя услуги как контактного лица',
     'DefaultNotifyContactInCase', 'ВКЛЮЧЕНА',
     'Письма клиенту уходят на \u00abПользователь услуги\u00bb.\nПо умолчанию это главный получатель.'),
    ('Оповещение инициатора как контактного лица',
     'DefaultNotifyInitiatorInCase', 'ВЫКЛЮЧЕНА',
     'Письма клиенту уходят на \u00abИнициатора\u00bb.\nПо умолчанию выключено — инициатор не получает.'),
]
for i, r in enumerate(sysset_rows):
    bg = 'EBF3FB' if i % 2 == 0 else None
    add_data_row(t0, r, bg)
set_col_widths(t0, [Cm(6), Cm(5.5), Cm(3), Cm(11)])

doc.add_paragraph()
add_note(doc,
    'Если обе настройки включены — письма уходят обоим. Если инициатор = пользователь услуги — '
    'кнопки выбора контактного лица на странице обращения не отображаются. '
    'На странице обращения инженер может вручную переключить контактное лицо (кнопки рядом с полями).\n'
    'Одна из настроек должна быть включена — иначе уведомления не будут отправляться никому.'
)
add_note(doc,
    'При регистрации обращения из входящего email: уведомление о регистрации получают ВСЕ адресаты '
    'исходного письма (кому/копия). Поле \u00abОт кого\u00bb = адрес почтового ящика службы поддержки, '
    'на который пришло письмо. Если обращение создано иначе (звонок, вручную) — \u00abОт кого\u00bb '
    'берётся из системной настройки \u00abE-mail службы поддержки\u00bb.'
)

# ===================== РАЗДЕЛ 1: Клиент =====================
doc.add_page_break()
add_h(doc, '1. Уведомления в сторону Заказчика (клиента)', 1)
add_body(doc,
    'Все уведомления клиенту при смене статуса — через C#-класс SendEmailToCaseStatusChanged '
    '(feature-toggle SendEmailToCaseOnStatusChangeClass=1), который читает справочник CaseNotificationRule '
    'и подбирает шаблон по паре (статус + категория). '
    'Для каждого события есть ДВА шаблона: один для Пользователя услуги, другой для Инициатора. '
    'Исключение — регистрация: отдельный BPMN-процесс UsrProcess_send_reg_mail.'
)
doc.add_paragraph()

t1 = doc.add_table(rows=1, cols=6)
t1.style = 'Table Grid'
add_header_row(t1, ['Событие', 'Получатель', 'Шаблон (Пользователь услуги)', 'Шаблон (Инициатор)', 'Механизм (системное имя)', 'Тип механизма'])

client_rows = [
    ('Регистрация обращения',
     'Контактное лицо\n(по настройке)',
     'Создание нового обращения из чата',
     '\u2014 (отдельного нет)',
     'UsrProcess_send_reg_mail',
     'BPMN-процесс\n(CTI)'),
    ('\u2192 «В работе»',
     'Контактное лицо\n(по настройке)',
     'Сообщение о взятии обращения в работу',
     'Сообщение о взятии обращения в работу (для инициатора)',
     'SendEmailToCaseStatusChanged\n+ CaseNotificationRule',
     'C#-класс (CaseService)\n+ справочник'),
    ('Ответ инженера по обращению',
     'Контактное лицо\n(по настройке)',
     'Сообщение о получении нового ответа по обращению',
     'Сообщение о получении нового ответа по обращению (для инициатора)',
     'SendEmailToCaseStatusChanged\n+ CaseNotificationRule',
     'C#-класс (CaseService)\n+ справочник'),
    ('\u2192 «Решено»',
     'Контактное лицо\n(по настройке)',
     'Сообщение о разрешении обращения\nИЛИ\nСообщение о разрешении — только с решением',
     'Сообщение о разрешении обращения (для инициатора)\nИЛИ\nСообщение о разрешении — только с решением (для инициатора)',
     'SendEmailToCaseStatusChanged\n+ CaseNotificationRule',
     'C#-класс (CaseService)\n+ справочник'),
    ('\u2192 «Закрыто»',
     'Контактное лицо\n(по настройке)',
     'Сообщение о закрытии обращения',
     'Сообщение о закрытии обращения (для инициатора)',
     'SendEmailToCaseStatusChanged\n+ CaseNotificationRule',
     'C#-класс (CaseService)\n+ справочник'),
    ('Закрытие по таймеру\n(долго нет ответа)',
     'Контактное лицо\n(по настройке)',
     'Подтверждение закрытия обращения',
     'Подтверждение закрытия обращения (для инициатора)',
     'SendEmailToCaseStatusChanged\n+ CaseNotificationRule',
     'C#-класс (CaseService)\n+ справочник'),
    ('\u2192 «Отменено»',
     'Контактное лицо\n(по настройке)',
     'Сообщение об отмене обращения',
     'Сообщение об отмене обращения (для инициатора)',
     'SendEmailToCaseStatusChanged\n+ CaseNotificationRule',
     'C#-класс (CaseService)\n+ справочник'),
    ('Запрос оценки\n(после решения)',
     'Контактное лицо\n(по настройке)',
     'Запрос оценки по обращению',
     'Запрос оценки по обращению (для инициатора)',
     'SendEmailToCaseStatusChanged\n+ CaseNotificationRule',
     'C#-класс (CaseService)\n+ справочник'),
]

for i, r in enumerate(client_rows):
    bg = 'EBF3FB' if i % 2 == 0 else None
    add_data_row(t1, r, bg)

set_col_widths(t1, [Cm(3.2), Cm(2.8), Cm(6.5), Cm(6.5), Cm(5.5), Cm(3.5)])
doc.add_paragraph()
add_note(doc,
    'CC: к письмам клиенту автоматически добавляются CC-адреса из контракта и аккаунта — '
    'кастомизация через UsrActivityCcEventListener (CTI).\n'
    'Поле «Процитировать оригинальный email» в справочнике CaseNotificationRule позволяет '
    'включить цитату исходного письма (ParentActivity), но это корневое письмо, не последний ответ.'
)

# ===================== РАЗДЕЛ 2: Инженер =====================
doc.add_page_break()
add_h(doc, '2. Уведомления в сторону Инженера', 1)
add_body(doc,
    'Инженер получает уведомления при назначении ответственным и при получении ответа от клиента. '
    'Push-уведомление (колокольчик) приходит при ЛЮБОМ входящем письме, независимо от статуса.'
)
doc.add_paragraph()

t2 = doc.add_table(rows=1, cols=6)
t2.style = 'Table Grid'
add_header_row(t2, ['Событие', 'Получатель', 'Шаблон письма', 'Содержание', 'Механизм (системное имя)', 'Тип механизма'])

eng_rows = [
    ('Назначен ответственным',
     'Назначенный инженер',
     'Назначение ответственного в обращении',
     '«Вас назначили ответственным\nпо обращению №...»',
     'UsrSendEmailToSROwnerCustom1\n(замещает SendEmailToSROwner)',
     'BPMN-процесс (CTI)\n[родитель: CaseService]'),
    ('Назначено на группу',
     'Вся группа\nответственных',
     'На группу назначено обращение',
     '«На группу назначено\nобращение №...»',
     'SendEmailToSROwner\n(базовый, CaseService)',
     'BPMN-процесс\n(CaseService)'),
    ('Клиент написал ответ\n\u2192 «Получен ответ»\n(только из ряда статусов,\nсм. раздел 5)',
     'Ответственный инженер\n+ копия: роль «1-я линия»',
     'Добавление нового email\nпо обращению',
     '«Получен новый email\nпо обращению №...»\n\u26a0 Текст письма клиента\nНЕ включён\n\nОт: servicedesk@cti.ru\nКому: email ответственного\nКопия: роль «1-я линия»',
     'UsrProcess_0c71a12CTI5\n(запускается StartSignal\nпри смене Case.Status)',
     'BPMN-процесс (CTI)'),
]
for i, r in enumerate(eng_rows):
    bg = 'EBF3FB' if i % 2 == 0 else None
    add_data_row(t2, r, bg)
set_col_widths(t2, [Cm(3.5), Cm(3.0), Cm(5.5), Cm(4.5), Cm(5.5), Cm(3.5)])

# ===================== РАЗДЕЛ 3: Push =====================
doc.add_paragraph()
add_h(doc, '3. Push-уведомления внутри BPMSoft (не email)', 1)

t3 = doc.add_table(rows=1, cols=4)
t3.style = 'Table Grid'
add_header_row(t3, ['Событие', 'Получатель', 'Механизм (системное имя)', 'Тип механизма'])
push_rows = [
    ('Клиент написал по обращению\n(ЛЮБОЙ статус — без исключений)',
     'Ответственный инженер',
     'ReopenCaseAndNotifyAssignee \u2192 NotifyOwner()\n\u2192 запись Reminding в БД',
     'C#-класс (CaseService)'),
    ('Переоткрытие обращения (групповое)',
     'Группа ответственных',
     'Единое окно (штатный платформенный механизм)',
     'Платформа'),
]
for i, r in enumerate(push_rows):
    bg = 'EBF3FB' if i % 2 == 0 else None
    add_data_row(t3, r, bg)
set_col_widths(t3, [Cm(5.5), Cm(3.5), Cm(8), Cm(4)])

# ===================== РАЗДЕЛ 4: Цепочка =====================
doc.add_page_break()
add_h(doc, '4. Полная цепочка при получении email от клиента', 1)

steps = [
    ('1', 'BPMSoft получает входящее письмо',
     'Создаётся Activity (Type=Email, MessageType=Incoming). Письмо привязывается к обращению по номеру в теме.'),
    ('2', 'Сохранение CC-адресов',
     'UsrActivityCcEventListener (CTI) фиксирует CC-адреса из входящего письма в Case.UsrCcEmails.'),
    ('3', 'Запуск оркестратора',
     'Сигнал на новую Activity по обращению \u2192 BPMN RunSendNotificationCaseOwnerProcess (CaseService).'),
    ('4', 'Выбор пути (feature-toggle)',
     'toggle RunReopenCaseAndNotifyAssigneeClass=1 (на проде) \u2192 C#-класс ReopenCaseAndNotifyAssignee.\n'
     'При toggle=0 \u2014 шёл бы BPMN UsrSendNotificationToCaseOwnerCustom1 (на проде не используется).'),
    ('5', 'Переоткрытие (смена статуса)',
     'Предикат ReopeningCondition: если статус \u00abна паузе\u00bb или \u00abРешено\u00bb \u2192 меняет на \u00abПолучен ответ\u00bb.\n'
     'Если \u00abНовое\u00bb, \u00abВ работе\u00bb, уже \u00abПолучен ответ\u00bb или финальный \u2014 статус НЕ меняется.'),
    ('6', 'Push-уведомление инженеру (всегда)',
     'NotifyOwner() \u2192 запись Reminding \u2192 колокольчик BPMSoft. Срабатывает ВСЕГДА при наличии ответственного.'),
    ('7', 'Email инженеру (только если статус изменился)',
     'Смена статуса на \u00abПолучен ответ\u00bb \u2192 StartSignal \u2192 UsrProcess_0c71a12CTI5 (CTI).\n'
     'Читает данные обращения и email ответственного \u2192 отправляет по шаблону.\n'
     '\u26a0 Текст клиентского письма в email НЕ включён (GAP \u2014 задача 2.3).'),
]
for num, title_s, desc in steps:
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.3)
    r1 = p.add_run('Шаг {}. {}\n'.format(num, title_s))
    r1.bold = True
    r1.font.size = Pt(9.5)
    r1.font.color.rgb = RGBColor(0x2E, 0x74, 0xB5)
    r2 = p.add_run(desc)
    r2.font.size = Pt(9)
doc.add_paragraph()

# ===================== РАЗДЕЛ 5: Статус «Получен ответ» =====================
add_h(doc, '5. Логика статуса \u00abПолучен ответ\u00bb \u2014 откуда берётся перечень статусов', 1)

add_h(doc, '5.1 Где задаётся в системе', 2)
add_body(doc,
    'Путь: Администрирование \u2192 Справочники \u2192 Состояния обращений (таблица CaseStatus)\n\n'
    'Каждое состояние имеет флаги:\n'
    '  \u2022 \u00abНа паузе\u00bb (IsPaused) \u2014 обращение ожидает чего-либо\n'
    '  \u2022 \u00abЯвляется решением\u00bb (IsResolved) \u2014 обращение считается решённым\n'
    '  \u2022 \u00abФинальный\u00bb (IsFinal) \u2014 обращение завершено (Закрыто/Отменено)\n'
    '  \u2022 \u00abПереоткрыто\u00bb (IsReopen) \u2014 статус \u00abПолучен ответ\u00bb\n\n'
    'Чтобы добавить новый статус в перечень \u2192 поставить ему флаг \u00abНа паузе\u00bb или '
    '\u00abЯвляется решением\u00bb в справочнике. Изменения в коде не требуются.'
)
doc.add_paragraph()

add_h(doc, '5.2 Предикат в C#-коде (ReopenCaseAndNotifyAssignee.cs, CaseService)', 2)
add_body(doc,
    'Переход в \u00abПолучен ответ\u00bb происходит, если выполнены ВСЕ три условия:\n'
    '  1. Статус НЕ является уже \u00abПолучен ответ\u00bb (!IsReopenStatus)\n'
    '  2. Статус НЕ финальный (!IsFinalStatus) \u2014 не \u00abЗакрыто\u00bb и не \u00abОтменено\u00bb\n'
    '  3. Статус является \u00abРешённым\u00bb ИЛИ \u00abНа паузе\u00bb (IsResolved OR IsPaused)\n\n'
    'Значения флагов читаются из справочника CaseStatus через CaseStatusStore \u2014 '
    'список не зашит в коде, берётся из БД.'
)
doc.add_paragraph()

add_h(doc, '5.3 Перечень статусов (с прода, апрель 2026)', 2)

t4 = doc.add_table(rows=1, cols=4)
t4.style = 'Table Grid'
add_header_row(t4, ['Статус обращения', 'На паузе (IsPaused)', 'Решено (IsResolved)', 'Переход в \u00abПолучен ответ\u00bb?'])
status_rows = [
    ('Новое', '\u2014', '\u2014', 'Нет'),
    ('В работе', '\u2014', '\u2014', 'Нет'),
    ('Ожидает ответа', 'Да', '\u2014', 'Да'),
    ('Отложен', 'Да', '\u2014', 'Да'),
    ('Передано сервис-менеджеру', 'Да', '\u2014', 'Да'),
    ('Направлено в группу специализации', 'Да', '\u2014', 'Да'),
    ('Находится в работе у вендора', 'Да', '\u2014', 'Да'),
    ('Передано в отдел логистики', 'Да', '\u2014', 'Да'),
    ('Ожидаем поставщика', 'Да', '\u2014', 'Да'),
    ('Ожидается применение релиза', 'Да', '\u2014', 'Да'),
    ('Ожидает повторение проблемы', 'Да', '\u2014', 'Да'),
    ('Идёт доработка', 'Да', '\u2014', 'Да'),
    ('Идёт тестирование', 'Да', '\u2014', 'Да'),
    ('Передано в отдел разработки', 'Да', '\u2014', 'Да'),
    ('Передано в SD', 'Да', '\u2014', 'Да'),
    ('Приостановлен', 'Да', '\u2014', 'Да'),
    ('Решено', '\u2014', 'Да', 'Да'),
    ('Работы выполнены', '\u2014', 'Да', 'Да'),
    ('Получен ответ', '\u2014', '\u2014 (IsReopen=Да)', 'Нет (уже переоткрыт)'),
    ('Закрыто', '\u2014', '\u2014 (IsFinal=Да)', 'Нет (финальный)'),
    ('Отменено', '\u2014', '\u2014 (IsFinal=Да)', 'Нет (финальный)'),
]
for r in status_rows:
    v = r[3]
    bg = 'E2EFDA' if v == 'Да' else ('FCE4D6' if v == 'Нет' else 'FFF2CC')
    add_data_row(t4, r, bg)
set_col_widths(t4, [Cm(7), Cm(4), Cm(4), Cm(6)])

# ===================== РАЗДЕЛ 6: Справочник шаблонов =====================
doc.add_page_break()
add_h(doc, '6. Полный список шаблонов уведомлений (по документации BPMSoft v1.9)', 1)
add_body(doc,
    'Шаблоны хранятся в справочнике \u00abШаблоны сообщений\u00bb (EmailTemplate). '
    'Для клиентских событий существуют пары шаблонов: один для Пользователя услуги, '
    'второй для Инициатора (суффикс \u00ab(для инициатора)\u00bb). '
    'Шаблоны редактируются в Дизайнере системы \u2192 Справочники \u2192 Шаблоны сообщений.'
)
doc.add_paragraph()

t5 = doc.add_table(rows=1, cols=4)
t5.style = 'Table Grid'
add_header_row(t5, ['Шаблон', 'Вариант для инициатора', 'Направление', 'Назначение'])
tpl_rows = [
    ('Создание нового обращения из чата', '\u2014', 'Клиенту',
     'Уведомление о создании обращения через чат'),
    ('Сообщение о взятии обращения в работу',
     'Сообщение о взятии обращения в работу (для инициатора)', 'Клиенту',
     'Обращение взято в работу'),
    ('Сообщение о получении нового ответа по обращению',
     'Сообщение о получении нового ответа по обращению (для инициатора)', 'Клиенту',
     'Инженер написал ответ по обращению'),
    ('Сообщение о разрешении обращения',
     'Сообщение о разрешении обращения (для инициатора)', 'Клиенту',
     'Обращение решено'),
    ('Сообщение о разрешении обращения \u2013 только с решением',
     'Сообщение о разрешении обращения \u2013 только с решением (для инициатора)', 'Клиенту',
     'Обращение решено (упрощённый вариант — только текст решения)'),
    ('Подтверждение закрытия обращения',
     'Подтверждение закрытия обращения (для инициатора)', 'Клиенту',
     'Запрос подтверждения закрытия из-за долгого ожидания ответа'),
    ('Сообщение о закрытии обращения',
     'Сообщение о закрытии обращения (для инициатора)', 'Клиенту',
     'Обращение закрыто'),
    ('Сообщение об отмене обращения',
     'Сообщение об отмене обращения (для инициатора)', 'Клиенту',
     'Обращение отменено'),
    ('Запрос оценки по обращению',
     'Запрос оценки по обращению (для инициатора)', 'Клиенту',
     'Запрос оценки качества обслуживания после решения'),
    ('Назначение ответственного в обращении', '\u2014', 'Инженеру',
     'Внутреннее: ответственный назначен'),
    ('На группу назначено обращение', '\u2014', 'Инженеру (группа)',
     'Внутреннее: обращение назначено на группу'),
    ('Добавление нового email по обращению', '\u2014', 'Инженеру',
     'Внутреннее: получен новый email от клиента по обращению'),
    ('Пустой шаблон по обращению', '\u2014', 'Любое',
     'Нестандартные уведомления (заготовка)'),
    ('Шаблон приглашения SSP', '\u2014', 'Клиенту',
     'Приглашение клиента на портал самообслуживания'),
    ('Шаблон регистрации пользователя портала', '\u2014', 'Клиенту',
     'Ссылка активации для нового портального пользователя'),
]
for i, r in enumerate(tpl_rows):
    is_eng = r[2] == 'Инженеру' or r[2] == 'Инженеру (группа)'
    bg = 'E2EFDA' if is_eng else ('EBF3FB' if i % 2 == 0 else None)
    add_data_row(t5, r, bg)
set_col_widths(t5, [Cm(6.5), Cm(7), Cm(2.5), Cm(9)])

doc.add_paragraph()
add_note(doc, 'Зелёным выделены шаблоны для внутренних уведомлений инженерам.')

# ===================== РАЗДЕЛ 7: Справочник механизмов =====================
doc.add_page_break()
add_h(doc, '7. Справочник: системные имена механизмов', 1)

t6 = doc.add_table(rows=1, cols=5)
t6.style = 'Table Grid'
add_header_row(t6, ['Системное имя', 'Тип', 'Пакет', 'Статус', 'Описание'])
ref_rows = [
    ('UsrProcess_send_reg_mail', 'BPMN-процесс', 'CTI', 'Активен',
     'Отправка уведомлений заказчику о регистрации обращения'),
    ('UsrSendEmailToSROwnerCustom1', 'BPMN-процесс', 'CTI', 'Активен',
     'Email ответственному при назначении (замещает SendEmailToSROwner из CaseService)'),
    ('UsrSendNotificationToCaseOwnerCustom1', 'BPMN-процесс', 'CTI', 'НЕ активен\n(toggle=1)',
     'Переоткрытие + уведомление ответственного о новом комментарии\n'
     '(замещает SendNotificationToCaseOwner; при toggle=1 обходится C#-классом)'),
    ('UsrProcess_0c71a12CTI5', 'BPMN-процесс', 'CTI', 'Активен',
     'Email инженеру при переходе обращения в \u00abПолучен ответ\u00bb\n'
     '(StartSignal на изменение Case.StatusId)\n'
     'Отправитель (Sender): servicedesk@cti.ru (MailboxSyncSettings)\n'
     'Получатель (Recipient1): email ответственного инженера (из Contact)\n'
     'Копия (CopyRecipient1): роль \u00ab1-я линия\u00bb (VwSysFunctionalRole)\n'
     'Шаблон: \u00abДобавление нового email по обращению\u00bb\n'
     'CreateActivity = false (Activity-запись не создаётся)'),
    ('RunSendNotificationCaseOwnerProcess', 'BPMN-процесс', 'CaseService', 'Активен',
     'Оркестратор при входящем email: выбирает путь (C# или BPMN) по feature-toggle'),
    ('SendEmailToSROwner', 'BPMN-процесс', 'CaseService', 'Базовый\n(замещён CTI)',
     'Базовый: email ответственному при назначении (родитель UsrSendEmailToSROwnerCustom1)'),
    ('SendNotificationToCaseOwner', 'BPMN-процесс', 'CaseService', 'Базовый\n(замещён CTI)',
     'Базовый: уведомление ответственного при входящем ответе (родитель UsrSendNotificationToCaseOwnerCustom1)'),
    ('ReopenCaseAndNotifyAssignee', 'C#-класс', 'CaseService', 'Активен\n(toggle=1)',
     'Переоткрытие обращения (смена статуса) + push Reminding при входящем email'),
    ('SendEmailToCaseStatusChanged', 'C#-класс', 'CaseService', 'Активен\n(toggle=1)',
     'Email клиенту при смене статуса \u2014 читает CaseNotificationRule\n'
     'toggle: SendEmailToCaseOnStatusChangeClass=1'),
    ('CaseNotificationRule', 'Справочник', 'CaseService', 'Настраивается',
     'Правила: (статус + категория) \u2192 шаблон email. Содержит поле \u00abПроцитировать оригинальный email\u00bb.\n'
     'UI: Дизайнер системы \u2192 Справочники \u2192 Правила уведомлений контакта по обращению'),
    ('EmailWithMacrosManager', 'C#-класс', 'CaseService', 'Системный',
     'Создание email по шаблону с подстановкой макросов (номер, статус, ответственный, даты SLA...)'),
    ('ExtendedEmailWithMacrosManager', 'C#-класс', 'CaseService', 'Системный (не используется)',
     'Расширение EmailWithMacrosManager: добавляет тело ParentActivity (корневого письма) как цитату.\n'
     'Не даёт последнее письмо клиента \u2014 только корневое.'),
    ('AsyncEmailSender', 'C#-класс', 'CaseService', 'Системный',
     'Асинхронная отправка email через очередь (toggle UseAsyncEmailSender)'),
    ('UsrActivityCcEventListener', 'EntityEventListener\n(C#)', 'CTI', 'Активен',
     'При входящем email \u2014 фиксирует CC в Case.UsrCcEmails;\n'
     'При создании исходящего email по обращению \u2014 добавляет CC из контракта и аккаунта клиента'),
]
for i, r in enumerate(ref_rows):
    if 'НЕ активен' in r[3]:
        bg = 'FFF2CC'
    elif i % 2 == 0:
        bg = 'EBF3FB'
    else:
        bg = None
    add_data_row(t6, r, bg)
set_col_widths(t6, [Cm(5.5), Cm(3), Cm(2.5), Cm(2.5), Cm(11.5)])

# ===================== РАЗДЕЛ 8: GAP =====================
doc.add_page_break()
add_h(doc, '8. Что сейчас не реализовано (GAP-ы)', 1)

t7 = doc.add_table(rows=1, cols=3)
t7.style = 'Table Grid'
add_header_row(t7, ['Чего не хватает', 'Описание проблемы', 'Задача'])
gap_rows = [
    ('Текст письма клиента\nв уведомлении инженеру',
     'Инженер получает «Получен новый email...», но без текста письма. '
     'Открывает BPMSoft, ищет обращение, читает переписку.',
     'Задача 2.3 (приоритет 1)'),
    ('Напоминание о зависании\nв «Получен ответ»',
     'Если инженер не отреагировал — никто не напоминает.',
     'Задача 2.2'),
    ('SLA-предупреждения\n(75% / 85% / 95%)',
     'Система считает SLA и показывает цвет на странице, но email не шлёт.',
     'Задача 2.1'),
    ('Уведомления инженеру\nо сменах статуса',
     'Инженер получает только «назначение» и «новый email». '
     'Переходы (эскалация, переоткрытие и др.) — без уведомлений.',
     'Задача 2.4'),
    ('Подписка (роль наблюдателя)',
     'Нельзя следить за обращением без назначения ответственным.',
     'Задача 2.5'),
]
for i, r in enumerate(gap_rows):
    bg = 'FCE4D6' if i % 2 == 0 else 'FFF2CC'
    add_data_row(t7, r, bg)
set_col_widths(t7, [Cm(4.5), Cm(14), Cm(4)])

out_path = r'c:\Users\echum\Documents\BPMsoft\projects\notifications-wave2\email_notifications_description.docx'
doc.save(out_path)
print('Saved: ' + out_path)
