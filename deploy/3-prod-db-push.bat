@echo off
REM Phase E: push Prisma schema to production Neon DB.
REM Run AFTER you've created the Neon project and have the connection string.
cd /d "%~dp0.."
echo === Push Prisma schema to production Neon DB ===
echo.
echo You need the POOLED connection string from your Neon dashboard.
echo It looks like:
echo   postgresql://user:password@host-pooler.region.aws.neon.tech/neondb?sslmode=require
echo.

set /p DB_URL=Paste your prod DATABASE_URL:

if "%DB_URL%"=="" (
    echo ERROR: No URL provided. Bailing.
    pause
    exit /b 1
)

REM Use the same URL for direct connection during push (it's a one-shot, pooled is fine).
set DATABASE_URL=%DB_URL%
set DIRECT_URL=%DB_URL%

echo.
echo === Running prisma db push (this creates all 11 tables in Neon) ===
echo This may take 30-60s on first run because it downloads prisma...
echo.
call npx --yes prisma@5.22.0 db push --skip-generate

echo.
echo === Done. ===
echo Verify in Neon dashboard: you should see tables like User, Wager, Bet, Payout, etc.
echo.
echo Next: Phase D — back to https://vercel.com/new to deploy.
pause
