@echo off
cd /d "%~dp0"
"%~dp0portable-node\node.exe" "%~dp0LOCAL-SERVER.cjs"
if errorlevel 1 pause
