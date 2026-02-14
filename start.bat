@echo off
echo ========================================
echo Starting AI PRD Agent with Analytics
echo ========================================
echo.
echo [1] Cleaning cache...
rmdir /s /q ".next" 2>nul
del /s /q ".next\dev\lock" 2>nul
echo [2] Starting server...
npm run dev
pause
