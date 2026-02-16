@echo off
echo Setting up Node.js environment...
set "PATH=%PATH%;C:\Program Files\nodejs"

echo Verifying Node.js installation...
node -v
if %errorlevel% neq 0 (
    echo Node.js not found in C:\Program Files\nodejs. Please install Node.js manually.
    pause
    exit /b 1
)

echo Installing dependencies...
call npm.cmd install
if %errorlevel% neq 0 (
    echo Error during installation.
    pause
    exit /b 1
)

echo Starting development server...
call npm.cmd run dev
pause
