@echo off
chcp 65001 >nul
title Mira System (silent)
:: Headless launcher: runs API + UI without visible consoles.

start "Mira API" /min cmd /c "cd /d D:\saloon\server && npm run dev > D:\saloon\server\log_silent.txt 2>&1"
timeout /t 6 >nul
start "Mira UI" /min cmd /c "cd /d D:\saloon\client && npm run dev > D:\saloon\client\log_silent.txt 2>&1"
exit
