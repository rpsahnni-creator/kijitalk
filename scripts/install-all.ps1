# KijiTalk — Install all dependencies (Node 20 + Python)
# Run: powershell -ExecutionPolicy Bypass -File scripts\install-all.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "`n=== KijiTalk Install (Node 20) ===" -ForegroundColor Cyan

# Check Node 20
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERROR: node command nahi mila. Node.js 20 install karein aur terminal restart karein." -ForegroundColor Red
    exit 1
}
Write-Host "Node: $nodeVersion" -ForegroundColor Green

$major = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($major -ne 20) {
    Write-Host "WARNING: Node 20 recommended. Aapke paas $nodeVersion hai." -ForegroundColor Yellow
}

$npmVersion = npm --version 2>$null
Write-Host "npm:  v$npmVersion" -ForegroundColor Green

# Backend
Write-Host "`n[1/3] Backend install..." -ForegroundColor Yellow
Set-Location "$Root\backend"
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Frontend
Write-Host "`n[2/3] Frontend install..." -ForegroundColor Yellow
Set-Location "$Root\frontend"
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Mobile
Write-Host "`n[3/3] Mobile install..." -ForegroundColor Yellow
Set-Location "$Root\mobile"
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Python speech service (optional)
Set-Location "$Root\speech-service"
$python = $null
foreach ($cmd in @("python", "py", "python3")) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        $python = $cmd
        break
    }
}

if ($python) {
    Write-Host "`n[Optional] Speech service (Python)..." -ForegroundColor Yellow
    & powershell -ExecutionPolicy Bypass -File "$Root\scripts\install-speech.ps1"
} else {
    Write-Host "`nPython nahi mila — speech service skip (web browser STT/TTS use karega)." -ForegroundColor Yellow
}

# Env files
Set-Location $Root
node scripts/setup-env.js

Write-Host "`n=== Install Complete ===" -ForegroundColor Green
Write-Host "Ab run karein: powershell -File scripts\start-backend.ps1" -ForegroundColor Cyan
Write-Host "              powershell -File scripts\start-frontend.ps1" -ForegroundColor Cyan
