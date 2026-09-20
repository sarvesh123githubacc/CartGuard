param (
    [string]$Target = "all"
)

$RootDir = Split-Path -Parent $PSScriptRoot
$PythonExe = Join-Path $RootDir "backend\.venv\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}

$env:PYTHONPATH = $RootDir

switch ($Target) {
    "cedar" {
        & $PythonExe -m pytest "$RootDir\backend\tests\test_cedar_smoke.py" -v -s
    }
    "strands" {
        & $PythonExe -m pytest "$RootDir\backend\tests\test_strands_smoke.py" -v -s
    }
    "health" {
        & $PythonExe -m pytest "$RootDir\backend\tests\test_health.py" -v -s
    }
    default {
        & $PythonExe -m pytest "$RootDir\backend\tests" -v -s
    }
}
