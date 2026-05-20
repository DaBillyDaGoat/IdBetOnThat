@echo off
REM Phase A2: push to GitHub. Run after creating the repo on github.com.
cd /d "%~dp0.."
echo === Push idbetonthat to GitHub ===
echo.
echo You should have created a PRIVATE repo at https://github.com/new
echo named "idbetonthat" (no README/license/gitignore).
echo.
echo Paste the HTTPS URL it gave you. It looks like:
echo   https://github.com/DaBillyDaGoat/idbetonthat.git
echo.

set /p REPO_URL=Repo URL:

if "%REPO_URL%"=="" (
    echo ERROR: No URL provided. Bailing.
    pause
    exit /b 1
)

REM Remove any existing origin so re-runs don't error
git remote remove origin >nul 2>&1

git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

echo.
echo === Pushed! ===
echo View your repo: %REPO_URL:.git=%
echo.
echo Next: Phase B — go to https://neon.tech/ and create your prod DB.
pause
