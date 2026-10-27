# Backend start — port 4001
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Fix PATH for Node.js
if ($env:Path -notlike "*Program Files\nodejs*") {
    $nodePath = "C:\Program Files\nodejs"
    if (Test-Path $nodePath) { $env:Path = "$nodePath;$env:Path" }
}

Set-Location "$Root\backend"

if (-not (Test-Path ".env")) {
    Write-Host "backend\.env missing! Copy karo:" -ForegroundColor Red
    Write-Host "  copy backend\.env.example backend\.env" -ForegroundColor Yellow
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: node command nahi mila!" -ForegroundColor Red
    Write-Host "Node.js 20 install karein: https://nodejs.org" -ForegroundColor Yellow
    Write-Host "Install ke baad terminal band karke dubara kholo." -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting KijiTalk Backend on http://localhost:4001" -ForegroundColor Cyan
npm run dev
