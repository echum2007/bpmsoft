@echo off
cd /d "C:\Users\echum\Documents\BPMsoft\memory-compiler"
"C:\Users\echum\.local\bin\uv.exe" run python scripts\compile.py >> scripts\compile-scheduled.log 2>&1
