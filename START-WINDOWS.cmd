@echo off
setlocal
cd /d "%~dp0"
set "ARENA_NODE=%~dp0runtime\windows-x64\node.exe"
if not exist "%ARENA_NODE%" set "ARENA_NODE=node"
"%ARENA_NODE%" scripts\serve.mjs --open
set "ARENA_EXIT=%ERRORLEVEL%"
if not "%ARENA_EXIT%"=="0" pause
exit /b %ARENA_EXIT%
