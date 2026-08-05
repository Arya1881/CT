echo @echo off
echo Starting CampusTransit...
echo.
echo Installing dependencies...
echo.
echo Running npm with full path...
"C:\Program Files\nodejs\npm.cmd" install
cd frontend
"C:\Program Files\nodejs\npm.cmd" run dev
pause
echo.
echo Installing backend dependencies...
cd ..\backend
"C:\Program Files\nodejs\npm.cmd" install
cd ..\frontend
"C:\Program Files\nodejs\npm.cmd" run dev
pause
