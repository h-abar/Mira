@echo off
rem ============================================
rem  Salon Management System - Quick Start
rem  Starts Backend (port 4000) + Frontend (5173)
rem ============================================
cd /d "%~dp0server"
start "Saloon Backend" /min cmd /c "node dist\index.js"
cd /d "%~dp0client"
start "Saloon Frontend" /min cmd /c "npm run dev"
exit