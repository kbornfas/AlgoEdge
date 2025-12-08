@echo off
echo ======================================
echo PostgreSQL Database Setup for AlgoEdge
echo ======================================
echo.

set /p PGPASS="Enter your PostgreSQL postgres user password: "
set PGPASSWORD=%PGPASS%

echo.
echo Creating database 'algoedge'...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE algoedge;"

if %ERRORLEVEL% == 0 (
    echo [SUCCESS] Database created
) else (
    echo [INFO] Database may already exist
)

echo.
echo Running migrations...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d algoedge -f "backend\migrations\add_verification_codes.sql"

if %ERRORLEVEL% == 0 (
    echo [SUCCESS] Migrations completed
) else (
    echo [WARNING] Migrations may have already been applied
)

echo.
echo Updating backend/.env file...
powershell -Command "(Get-Content backend\.env) -replace 'DATABASE_URL=postgresql://postgres:.*@localhost:5432/algoedge', 'DATABASE_URL=postgresql://postgres:%PGPASS%@localhost:5432/algoedge' | Set-Content backend\.env"

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo Next steps:
echo   1. cd backend
echo   2. npm start
echo.
pause
