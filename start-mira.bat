@echo off
chcp 65001 >nul
title Mira System Launcher
echo =============================================
echo        MIRA SALON - SYSTEM LAUNCHER
echo =============================================
echo.

:: Start backend server
echo [1/2] Starting API server (port 4000)...
start "Mira API" cmd /k "cd /d D:\saloon\server && npm run dev"

:: Wait a moment for API to boot
timeout /t 6 >nul

:: Start frontend (Vite)
echo [2/2] Starting Web UI (port 5173)...
start "Mira UI" cmd /k "cd /d D:\saloon\client && npm run dev"

echo.
echo =============================================
echo  Servers are starting...
echo  Open your browser at:  http://localhost:5173
echo  Login: admin / admin123
echo =============================================
echo.
echo  Press any key to close this window (servers keep running).
pause >nul
