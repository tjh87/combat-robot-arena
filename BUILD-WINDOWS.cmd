@echo off
setlocal
cd /d "%~dp0"
set "ARENA_NODE=%~dp0runtime\windows-x64\node.exe"
if not exist "%ARENA_NODE%" set "ARENA_NODE=node"
set "PATH=%~dp0runtime\windows-x64;%PATH%"
"%ARENA_NODE%" scripts\build.mjs
if errorlevel 1 pause
