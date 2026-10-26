@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 需要 Node.js 22.13 或更新版本。请安装后再次打开本文件。
  pause
  exit /b 1
)
node scripts\serve-local.mjs
if errorlevel 1 pause
