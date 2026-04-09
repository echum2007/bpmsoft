#!/usr/bin/env python3
"""
Хук: напоминание о перезапуске Kestrel после изменения файлов с EntityEventListener.
Запускается как PostToolUse после Edit/Write.
"""
import sys
import json
import os

try:
    tool_input = json.loads(os.environ.get("CLAUDE_TOOL_INPUT", "{}"))
except Exception:
    sys.exit(0)

file_path = tool_input.get("file_path", "")
new_string = tool_input.get("new_string", "") or tool_input.get("content", "")

# Проверяем признаки EventListener в изменённом контенте или пути
has_listener = (
    "EntityEventListener" in new_string
    or "EntityEventListener" in file_path
    or "IEntityEventListener" in new_string
)

if has_listener:
    print("=" * 60)
    print("⚠️  ВАЖНО: ТРЕБУЕТСЯ ПЕРЕЗАПУСК KESTREL!")
    print("=" * 60)
    print("Файл содержит EntityEventListener.")
    print("После публикации схемы в BPMSoft — обязательно")
    print("перезапустить Kestrel, иначе изменения не вступят в силу.")
    print("=" * 60)

sys.exit(0)
