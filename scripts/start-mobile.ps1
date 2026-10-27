# Mobile Expo — scan QR with Expo Go
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location "$Root\mobile"

Write-Host "Starting Expo — phone par Expo Go se QR scan karein" -ForegroundColor Cyan
npx expo start
