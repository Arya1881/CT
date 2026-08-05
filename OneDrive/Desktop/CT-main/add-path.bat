#!/usr/bin/env batch
REM CampusTransit - Add Node.js to PATH and Run Application

REM Add Node.js to PATH (64-bit)
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path /t REG_EXPAND_SZ /d "%PATH%;C:\Program Files\nodejs" /f

REM Refresh environment variables
Setx PATH "%PATH%;C:\Program Files\nodejs"

REM Restart CMD to pick up PATH changes
cmd /c "echo Node.js added to PATH. Please restart this command prompt or open a new one and run this script again."

REM Since we can't restart CMD from within CMD, exit with instruction
pause
exit /b 0