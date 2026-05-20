@echo off
REM Phase A1: initialize git and commit. Run once.
cd /d "%~dp0.."
echo === Setting up git repo for idbetonthat ===
echo.

REM Wipe any half-init from previous attempts
if exist ".git" (
    echo Removing existing .git folder from previous attempts...
    rmdir /s /q .git
)

git init -b main
git config user.email "billybuteau@gmail.com"
git config user.name "DaBillyDaGoat"

echo.
echo === Files about to be committed (verify .env is NOT listed): ===
git add .
git status --short
echo.
echo If you see ".env" anywhere in the list above, STOP and tell Claude.
echo Otherwise press any key to commit.
pause

git commit -m "Initial commit: idbetonthat sprints 1-5"
echo.
echo === Done. ===
echo Next:
echo   1. Go to https://github.com/new and create a PRIVATE repo named "idbetonthat" (no README/license/gitignore)
echo   2. Copy the HTTPS URL it gives you
echo   3. Double-click 2-push-to-github.bat
echo.
pause
