@echo off
setlocal
cd /d "%~dp0"
set "ARENA_NODE=%~dp0runtime\windows-x64\node.exe"
if not exist "%ARENA_NODE%" set "ARENA_NODE=node"
set "PATH=%~dp0runtime\windows-x64;%PATH%"
"%ARENA_NODE%" scripts\dev.mjs --open
set "ARENA_EXIT=%ERRORLEVEL%"
if not "%ARENA_EXIT%"=="0" pause
exit /b %ARENA_EXIT%
