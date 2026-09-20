$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
Set-Location $RootDir

$PythonExe = Join-Path $RootDir "backend\.venv\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}

Write-Host "[CartGuard] Starting Backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
$env:PYTHONPATH = $RootDir
& $PythonExe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
