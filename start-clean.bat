@echo off
echo ========================================
echo Starting AI PRD Agent with Analytics
echo ========================================
echo.
echo [1] Cleaning cache...
if exist ".next" rmdir /s /q ".next"
if exist ".next\dev\lock" del /s /q ".next\dev\lock" 2>nul
echo [2] Starting server...
npm run dev
pause
