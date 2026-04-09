import struct, sys, os

data = open("c:/Users/echum/Documents/BPMsoft/src/CTI_prod_extracted/CTI_raw.bin", "rb").read()
out_dir = "c:/Users/echum/Documents/BPMsoft/src/CTI_prod_extracted/files"
os.makedirs(out_dir, exist_ok=True)

pos = 0
count = 0
while pos < len(data):
    if pos + 4 > len(data):
        break
    name_len = struct.unpack_from('<I', data, pos)[0]
    pos += 4
    if name_len == 0 or name_len > 500:
        break
    name = data[pos:pos + name_len * 2].decode('utf-16-le')
    pos += name_len * 2
    content_len = struct.unpack_from('<I', data, pos)[0]
    pos += 4
    content = data[pos:pos + content_len]
    pos += content_len

    if 'CasePage' in name or 'UsrCasePageCSS' in name:
        safe_name = name.replace('/', '__').replace('\\', '__').replace(':', '_')
        out_path = os.path.join(out_dir, safe_name)
        open(out_path, 'wb').write(content)
        print(f"[{count}] {name} ({content_len} bytes)")
    count += 1

print(f"\nTotal entries: {count}")
