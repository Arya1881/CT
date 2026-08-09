@echo off
REM CampusTransit Simple Launcher
REM Run this script to start the CampusTransit application

REM Project paths
set PROJECT_ROOT=C:\Users\lm268\OneDrive\Documents\Default Project

REM Check Node.js existence
echo Checking Node.js installation...
if not exist "%PROJECT_ROOT%\backend\package.json" (
    echo ERROR: backend\package.json not found!
    echo Please ensure you're in the correct directory
    pause
    exit /b 1
)

if not exist "%PROJECT_ROOT%\frontend\package.json" (
    echo ERROR: frontend\package.json not found!
    echo Please ensure you're in the correct directory
    pause
    exit /b 1
)

echo ✅ Project structure is correct
echo.

echo Checking Node.js executables...
if not exist "C:\Program Files\nodejs\node.exe" (
    echo ERROR: C:\Program Files\nodejs\node.exe not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

if not exist "C:\Program Files\nodejs\npm.cmd" (
    echo ERROR: C:\Program Files\nodejs\npm.cmd not found!
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available

REM Install dependencies
echo.
echo Installing dependencies...
echo.

echo Installing frontend dependencies...
cd "%PROJECT_ROOT%\frontend"
"C:\Program Files\nodejs\npm.cmd" install
if %errorlevel% neq 0 (
    echo ERROR: Frontend installation failed!
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed

REM Install backend dependencies
echo.
echo Installing backend dependencies...
cd "%PROJECT_ROOT%\backend"
"C:\Program Files\nodejs\npm.cmd" install
if %errorlevel% neq 0 (
    echo ERROR: Backend installation failed!
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

cd "%PROJECT_ROOT%"
echo.

echo ================================================
echo  CampusTransit Development Server Started!
echo ================================================
echo.
echo Installing complete and ready to run!
echo.
echo Frontend will be available at: http://localhost:5173
echo Backend API will be available at: http://localhost:4000
echo.
echo ⚠️  IMPORTANT: Servers will start in separate windows

echo.
echo Starting backend server...
start "Backend API" cmd /c "cd /d "%PROJECT_ROOT%\backend" && "C:\Program Files\nodejs\npm.cmd" run dev"

REM Wait a moment for backend to start
echo Waiting for backend to initialize...
echo.
sleep 3

echo.
echo Starting frontend server...
start "Frontend App" cmd /c "cd /d "%PROJECT_ROOT%\frontend" && "C:\Program Files\nodejs\npm.cmd" run dev"

echo.
echo ================================================
echo Development servers are running!
echo ================================================
echo.
echo ✅ Frontend: http://localhost:5173
echo ✅ Backend: http://localhost:4000
echo ✅ Health check: http://localhost:4000/api/health
echo.
echo ⚠️  To stop all servers, close the "Backend API" and "Frontend App" windows
echo.
echo ================================================
echo Ready for verification!
echo ================================================
echo.

echo Verification demo accounts:
echo  Admin: admin@campustransit.app / Admin@123

echo  Driver: driver1@campustransit.app / Driver@123

echo  Student: student1@campustransit.app / Student@123

echo  Parent: parent1@campustransit.app / Parent@123

echo.
echo Press any key to exit this launcher (servers will continue running)
pause > nul