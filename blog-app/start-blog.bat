@echo off
title field notes - local editor
cd /d "%~dp0"
echo Starting field notes on http://localhost:4000 ...
echo (Close this window to stop the server)
echo.
node server.js
pause
