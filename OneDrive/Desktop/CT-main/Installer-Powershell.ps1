# Installer-Powershell.ps1
# Script to install and run the CampusTransit project

$rootDir = "C:\Users\lm268\OneDrive\Documents\Default Project"
$backendDir = "$rootDir\backend"
$frontendDir = "$rootDir\frontend"

Write-Host "Setting up Node.js environment..." -ForegroundColor Green

# Install Node.js and npm via winget if needed
$winget = Get-Command winget -ErrorAction SilentlyContinue
if ($winget) {
    Write-Host "Installing Node.js via winget..." -ForegroundColor Yellow
    winget install --id OpenJS.Nodejs -e
} else {
    Write-Host "winget not available. Please install Node.js manually." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
}

# Wait for Node.js installation
Write-Host "Waiting for Node.js installation..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if npm is available
$nmpPath = "${env:ProgramFiles}\nodejs\npm.cmd"
if (Test-Path $nmpPath) {
    Write-Host "npm found at: $nmpPath" -ForegroundColor Green
} else {
    Write-Host "npm not found at standard location" -ForegroundColor Red
    exit 1
}

# Create a batch file for running commands since PowerShell has limitations with &&
$batFile = "$rootDir\run-apps.bat"
$batContent = """@echo off
cd /d "%~dp0frontend"
npm.cmd install
echo.
echo Frontend installation complete.
echo.
cd /d "%~dp0backend"
npm.cmd install
echo.
echo Backend installation complete.
echo.
cd /d "%~dp0frontend"
echo.
echo Starting frontend development server...
echo Frontend will be available at: http://localhost:5173
echo.
npm.cmd run dev
"""

$batContent | Out-File -FilePath $batFile -Encoding UTF8
Write-Host "Created batch file: $batFile" -ForegroundColor Green

Write-Host "" -ForegroundColor White
Write-Host "Installation steps:" -ForegroundColor Yellow
Write-Host "1. Run the batch file: $batFile" -ForegroundColor Cyan
Write-Host "2. Or manually install by running:" -ForegroundColor Cyan
Write-Host "   - frontend: cd frontend && npm.cmd install && npm.cmd run dev" -ForegroundColor Gray
Write-Host "   - backend: cd backend && npm.cmd install && npm.cmd run dev" -ForegroundColor Gray
Write-Host "" -ForegroundColor White
Write-Host "The application will be available at:" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "  Backend: http://localhost:4000" -ForegroundColor Green