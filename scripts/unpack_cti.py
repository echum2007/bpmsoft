import struct
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

SRC = r"c:/Users/echum/Documents/BPMsoft/src/CTI_2026-04-23_17.59.05/CTI"
OUT = r"c:/Users/echum/Documents/BPMsoft/src/CTI_2026-04-23_17.59.05/unpacked"

os.makedirs(OUT, exist_ok=True)

with open(SRC, "rb") as f:
    data = f.read()

pos = 0
count = 0
labor_files = []
while pos < len(data):
    name_len = struct.unpack_from("<I", data, pos)[0]
    pos += 4
    name = data[pos : pos + name_len * 2].decode("utf-16-le")
    pos += name_len * 2
    content_len = struct.unpack_from("<I", data, pos)[0]
    pos += 4
    content = data[pos : pos + content_len]
    pos += content_len
    count += 1
    if "LaborRecords" in name or "laborrecords" in name.lower():
        labor_files.append((name, content_len))
    normalized = name.replace("\\", "/")
    full = os.path.join(OUT, normalized)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "wb") as out_f:
        out_f.write(content)

print(f"Total files: {count}")
print("Labor files:")
for n, l in labor_files:
    print(f"  {n}  ({l} bytes)")
