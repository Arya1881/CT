#!/usr/bin/env powershell
# CampusTransit Development Runner

$rootDir = "C:\Users\lm268\OneDrive\Documents\Default Project"
$nodejsPath = "C:\Program Files\nodejs"
$nodeExe = "$nodejsPath\node.exe"
$npmCmd = "$nodejsPath\npm.cmd"

Write-Host "Starting CampusTransit Development Server..." -ForegroundColor Green
Write-Host "" -ForegroundColor White

# Check if Node.js is available
if (-not (Test-Path $nodeExe)) {
    Write-Host "ERROR: Node.js not found at $nodeExe" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

if (-not (Test-Path $npmCmd)) {
    Write-Host "ERROR: npm not found at $npmCmd" -ForegroundColor Red
    pause
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow

Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Push-Location "$rootDir\frontend"
try {
    & $npmCmd install
}
finally {
    Pop-Location
}

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Push-Location "$rootDir\backend"
try {
    & $npmCmd install
}
finally {
    Pop-Location
}

Write-Host "" -ForegroundColor White
Write-Host "Starting development servers..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend: http://localhost:4000" -ForegroundColor Green
Write-Host "" -ForegroundColor White

# Create a process to run backend
$backendProcess = Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command \"cd '$rootDir\backend'; & '$npmCmd' run dev\"" -PassThru -WindowStyle Minimized

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Create a process to run frontend
$frontendProcess = Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command \"cd '$rootDir\frontend'; & '$npmCmd' run dev\"" -PassThru -WindowStyle Minimized

Write-Host "Backend PID: $($backendProcess.Id)" -ForegroundColor Yellow
Write-Host "Frontend PID: $($frontendProcess.Id)" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White
Write-Host "Servers are running! Press Ctrl+C to stop." -ForegroundColor Green
Write-Host "" -ForegroundColor White

# Wait for Ctrl+C
$cancelSource = New-Object System.Threading.CancellationTokenSource
$cancelToken = $cancelSource.Token

function Stop-Servers {
    Write-Host "Stopping servers..." -ForegroundColor Red
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "Done." -ForegroundColor Green
    exit 0
}

# Handle Ctrl+C
try {
    while (-not $cancelToken.IsCancellationRequested) {
        Start-Sleep -Seconds 1
    }
} catch {
    Stop-Servers
}

Stop-Servers