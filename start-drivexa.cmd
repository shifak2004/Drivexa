@echo off
setlocal

set "ROOT=%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found in PATH.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm.cmd was not found in PATH.
  echo Reinstall Node.js or fix PATH, then run this file again.
  pause
  exit /b 1
)

echo Starting Drivexa services...
echo Backend: https://drivexa-backend.onrender.com
echo Rider:   http://localhost:5173
echo Driver:  http://localhost:5174
echo.

start "Drivexa Backend" /D "%ROOT%backend" cmd /k "npm.cmd start"
start "Drivexa Rider App" /D "%ROOT%rider-app" cmd /k "npm.cmd run dev"
start "Drivexa Driver App" /D "%ROOT%driver-app" cmd /k "npm.cmd run dev"

echo Opened three service windows. Keep them open while using the project.
endlocal
