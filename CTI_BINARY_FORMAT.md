# Формат бинарного архива CTI

`src/CTI_2026-04-11_15.14.44/CTI/CTI` — кастомный формат BPMSoft (уже gunzip'ed).

## Структура формата

```
[4 байта LE = длина имени в UTF-16 code units]
[имя UTF-16LE]
[4 байта LE = длина контента]
[контент]
```

Повторяется для каждого файла в архиве.

## Python-скрипт распаковки

```python
import struct, os

data = open('src/CTI_2026-04-11_15.14.44/CTI/CTI', 'rb').read()
pos = 0

while pos < len(data):
    # Читаем длину имени
    name_len = struct.unpack_from('<I', data, pos)[0]
    pos += 4
    
    # Читаем имя (UTF-16LE)
    name = data[pos:pos + name_len * 2].decode('utf-16-le')
    pos += name_len * 2
    
    # Читаем длину контента
    content_len = struct.unpack_from('<I', data, pos)[0]
    pos += 4
    
    # Читаем контент
    content = data[pos:pos + content_len]
    pos += content_len
    
    # name = относительный путь файла, content = байты
    print(f"Файл: {name}, размер: {content_len}")
```

## Системные пакеты

Уже распакованы в: `src/PKG_BPMSoft_Full_House_1.9.0.14114/<PackageName>/Schemas/`
