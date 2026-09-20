$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
Set-Location (Join-Path $RootDir "frontend")

Write-Host "[CartGuard] Starting Frontend on http://localhost:5173..." -ForegroundColor Cyan
npm run dev
