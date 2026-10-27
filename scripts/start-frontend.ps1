# Frontend start — port 3000
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location "$Root\frontend"

if (-not (Test-Path ".env.local")) {
    Write-Host "frontend\.env.local missing! Pehle scripts\install-all.ps1 chalao." -ForegroundColor Red
    exit 1
}

Write-Host "Starting KijiTalk Web on http://localhost:3100" -ForegroundColor Cyan
npm run dev
