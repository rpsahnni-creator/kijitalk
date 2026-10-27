@echo off
cd /d "%~dp0"

if not exist "venv\Scripts\python.exe" (
    echo venv nahi mila. Pehle ye chalao:
    echo   powershell -ExecutionPolicy Bypass -File "..\scripts\install-speech.ps1"
    pause
    exit /b 1
)

netstat -ano | findstr ":5001.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo.
    echo ERROR: Port 5001 pehle se use ho raha hai.
    echo Pehle purani service band karo:
    echo   E:\kijitalk\scripts\stop-speech.bat
    echo.
    pause
    exit /b 1
)

echo Starting Speech Service on http://localhost:5001
"venv\Scripts\python.exe" main.py
pause
