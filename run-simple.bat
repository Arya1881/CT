@echo off
REM Simple CampusTransit Development Server Launcher
REM This script uses the full path to npm.cmd to avoid PATH issues

REM Check if Node.js is available
if not exist "C:\Program Files\nodejs\npm.cmd" (
    echo ERROR: npm.cmd not found at C:\Program Files\nodejs\npm.cmd
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Node.js executable exists
if not exist "C:\Program Files\nodejs\node.exe" (
    echo ERROR: node.exe not found at C:\Program Files\nodejs\node.exe
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "backend\package.json" (
    echo ERROR: backend\package.json not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ERROR: frontend\package.json not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo ==============================================
echo  CampusTransit Development Server Launcher
echo ==============================================
echo.
echo Node.js found at: C:\Program Files\nodejs\node.exe
echo npm.cmd found at: C:\Program Files\nodejs\npm.cmd
echo.
echo Installing dependencies...
echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
C:\Program Files\nodejs\npm.cmd install
if %errorlevel% neq 0 (
    echo ERROR: Frontend installation failed
    pause
    exit /b 1
)

REM Install backend dependencies
echo.
echo Installing backend dependencies...
cd ..\backend
C:\Program Files\nodejs\npm.cmd install
if %errorlevel% neq 0 (
    echo ERROR: Backend installation failed
    pause
    exit /b 1
)

cd ..

echo.
echo ==============================================
echo All dependencies installed successfully!
echo ==============================================
echo.
echo Starting development servers...
echo.
echo Frontend will be available at: http://localhost:5173
echo Backend API will be available at: http://localhost:4000
echo.
echo Press any key to stop all servers...
echo.

REM Start backend server (in background)
echo Starting backend server...
cd backend
start "Backend API" cmd /c "C:\Program Files\nodejs\npm.cmd run dev"

REM Wait a bit for backend to start
sleep 3

REM Start frontend server (in background)
cd ..
cd frontend
start "Frontend App" cmd /c "C:\Program Files\nodejs\npm.cmd run dev"

REM Display completion message
echo.
echo ==============================================
echo Development servers are running!
echo ==============================================
echo.
echo Frontend: http://localhost:5173
echo Backend: http://localhost:4000
echo.
echo ⚠️  IMPORTANT: You must close the backend and frontend command prompt windows to stop the servers
echo.

echo.
echo To stop all servers:
echo 1. Close the "Backend API" command prompt window
echo 2. Close the "Frontend App" command prompt window
echo 3. Or run this script again and close all opened windows

echo.
echo Health check endpoints:
echo  http://localhost:4000/api/health
echo.

echo ==============================================
echo Press any key to continue...
pause > nul

echo.
echo Stopping all servers...

REM Try to kill any remaining node processes (optional)
REM Uncomment the following line if you want to automatically kill processes
REM taskkill /f /im node.exe >nul 2>&1

echo.
echo You can now access the application:
echo  - Frontend: http://localhost:5173
if %errorlevel%==0 (
    echo  - Backend API: http://localhost:4000
)

echo.
echo ==============================================
echo Setup complete!
echo ====================================