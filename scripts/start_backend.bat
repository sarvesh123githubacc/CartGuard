@echo off
set ROOT=%~dp0..
cd /d "%ROOT%"
set PYTHONPATH=%ROOT%
if exist "%ROOT%\backend\.venv\python.exe" (
    "%ROOT%\backend\.venv\python.exe" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
) else (
    python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
)
