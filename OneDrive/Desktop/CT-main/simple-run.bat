@echo off
REM CampusTransit Simple Server Launcher
REM Run this script from Command Prompt

REM Set error handling
ver >nul

echo ==============================================
echo  CampusTransit Development Server
Echo ==============================================
echo.
echo Checking system...

REM Check Node.js
echo Checking Node.js at C:\Program Files\nodejs\node.exe...
if not exist "C:\Program Files\nodejs\node.exe" (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

REM Check npm
echo Checking npm.cmd at C:\Program Files\nodejs\npm.cmd...
if not exist "C:\Program Files\nodejs\npm.cmd" (
    echo ERROR: npm.cmd not found!
    pause
    exit /b 1
)

echo ✅ npm.cmd found
echo.

REM Check project structure
echo Checking project structure...
cd /d "%~dp0"
if not exist "backend\package.json" (
    echo ERROR: backend\package.json not found!
    pause
    exit /b 1
)
if not exist "frontend\package.json" (
    echo ERROR: frontend\package.json not found!
    pause
    exit /b 1
)

echo ✅ Project structure is correct
echo.

REM Install dependencies
echo Installing dependencies...
echo.

echo Installing frontend dependencies...
cd frontend
C:\Program Files\nodejs\npm.cmd install
if %errorlevel% neq 0 (
    echo ERROR: Frontend installation failed!
    pause
    exit /b 1
)

echo ✅ Frontend dependencies installed
echo.

echo Installing backend dependencies...
cd ..\backend
C:\Program Files\nodejs\npm.cmd install
if %errorlevel% neq 0 (
    echo ERROR: Backend installation failed!
    pause
    exit /b 1
)

echo ✅ Backend dependencies installed
echo.

cd ..

echo ==============================================
echo All dependencies installed successfully!
echo ==============================================
echo.

echo Starting development servers...
echo.
echo Frontend will be available at: http://localhost:5173
echo Backend API will be available at: http://localhost:4000
echo.
echo ⚠️  IMPORTANT: Servers will run in separate windows

echo.
echo Starting backend server...
echo Opening backend command prompt window...

cd backend
start "Backend API" cmd /c "C:\Program Files\nodejs\npm.cmd run dev"

REM Wait a bit for backend to start
echo Waiting for backend to initialize...
echo.
sleep 3

echo.
echo Starting frontend server...
echo Opening frontend command prompt window...
cd ..
cd frontend
start "Frontend App" cmd /c "C:\Program Files\nodejs\npm.cmd run dev"

echo.
echo ==============================================
echo Development servers are running!
echo ==============================================
echo.
echo Frontend: http://localhost:5173
echo Backend: http://localhost:4000
echo.
echo Health check: http://localhost:4000/api/health
echo.
echo ⚠️  IMPORTANT: Close the "Backend API" and "Frontend App" windows to stop servers
echo.

echo ==============================================
echo Setup complete!
echo ====================================
echo.
echo Press any key to exit this launcher (servers will continue running)
pause > nul

echo.
echo Note: The servers are running in separate windows.
echo You can access them via the URLs above.

echo.
echo To stop all servers, close the backend and frontend command prompt windows.
echo.
echo ==============================================
echo Done!
echo ====================================