# Speech service — port 5001 (Python + Whisper + Edge TTS)
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location "$Root\speech-service"

if (-not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "venv nahi mila. Pehle: scripts\install-all.ps1" -ForegroundColor Red
    exit 1
}

Write-Host "Starting Speech Service on http://localhost:5001" -ForegroundColor Cyan
& ".\venv\Scripts\python.exe" main.py
