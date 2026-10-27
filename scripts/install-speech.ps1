# Speech service Python deps (Windows / Python 3.12)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SpeechDir = Join-Path $Root "speech-service"

Set-Location $SpeechDir

$python = $null
foreach ($cmd in @("python", "py", "python3")) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        $python = $cmd
        break
    }
}
if (-not $python) {
    Write-Host "ERROR: Python not found." -ForegroundColor Red
    exit 1
}

Write-Host "Using: $(& $python --version)" -ForegroundColor Green

if (-not (Test-Path "venv")) {
    Write-Host "Creating venv..." -ForegroundColor Yellow
    & $python -m venv venv
}

$pip = Join-Path $SpeechDir "venv\Scripts\pip.exe"
$py = Join-Path $SpeechDir "venv\Scripts\python.exe"

& $py -m pip install --upgrade pip setuptools wheel
& $py -m pip install -r requirements.txt

Write-Host "`nDone. Start with:" -ForegroundColor Green
Write-Host "  cd E:\kijitalk\speech-service" -ForegroundColor Cyan
Write-Host "  .\venv\Scripts\python.exe main.py" -ForegroundColor Cyan
