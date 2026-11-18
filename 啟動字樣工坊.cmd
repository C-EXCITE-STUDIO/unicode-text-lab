@echo off
chcp 65001 >nul
set "PYTHONUTF8=1"
cd /d "%~dp0"
rem 優先使用 Hermes 已附帶的 Python，不依賴桌面程式的 PATH。
for /d %%D in ("%LOCALAPPDATA%\hermes\tools\python-*") do (
  if exist "%%~fD\python.exe" (
    "%%~fD\python.exe" "%~dp0start.py" %*
    goto :finish
  )
)
where python3 >nul 2>nul
if not errorlevel 1 (
  python3 "%~dp0start.py" %*
  goto :finish
)
where python >nul 2>nul
if not errorlevel 1 (
  python "%~dp0start.py" %*
  goto :finish
)
where py >nul 2>nul
if not errorlevel 1 (
  py -3 "%~dp0start.py" %*
  goto :finish
)
echo 找不到 Python 3，請先安裝 Python 3.10 或更新版本。
pause
exit /b 1
:finish
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" pause
exit /b %RESULT%
