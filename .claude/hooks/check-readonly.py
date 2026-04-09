#!/usr/bin/env python3
"""
Хук: защита системных пакетов BPMSoft от случайного редактирования.
Разрешён только пакет CTI (src/CTI/CTI/).
Все остальные пакеты в src/CTI/ и src/All packages/ — только для чтения.
"""
import sys
import json
import os

try:
    tool_input = json.loads(os.environ.get("CLAUDE_TOOL_INPUT", "{}"))
except Exception:
    sys.exit(0)

file_path = tool_input.get("file_path", "").replace("\\", "/")

# Нормализуем путь
fp = file_path.lower().replace("\\", "/")

# Защищённые зоны
readonly_markers = [
    "src/all packages/",
    "documentation 1.9/",
]

# Системные пакеты CTI (всё кроме CTI/CTI/)
# Если путь содержит /src/CTI/ но НЕ содержит /src/CTI/CTI/
in_cti = "/src/cti/" in fp
in_cti_working = "/src/cti/cti/" in fp

if in_cti and not in_cti_working:
    print(f"ОШИБКА: Попытка изменить системный пакет BPMSoft (только для чтения): {file_path}")
    print("Все доработки — только в пакет CTI (src/CTI/CTI/).")
    sys.exit(1)

for marker in readonly_markers:
    if marker in fp:
        print(f"ОШИБКА: Попытка изменить защищённую зону (только для чтения): {file_path}")
        sys.exit(1)

sys.exit(0)
