@echo off
echo.
echo ========================================
echo   KijiTalk Firebase Setup
echo ========================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0configure-firebase.ps1"
pause
