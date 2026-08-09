#!/usr/bin/env powershell
# CampusTransit Development Runner
# Run with: powershell -ExecutionPolicy Bypass -File start.ps1

$ErrorActionPreference = "Stop"

# Project paths
$rootDir = "C:\Users\lm268\OneDrive\Documents\Default Project"
$nodejsPath = "C:\Program Files\nodejs"
$nodeExe = "$nodejsPath\node.exe"
$npmCmd = "$nodejsPath\npm.cmd"

Write-Host "🚀 CampusTransit Development Server" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "" -ForegroundColor White

# Check Node.js availability
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
if (-not (Test-Path $nodeExe)) {
    Write-Host "❌ Node.js not found at: $nodeExe" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

if (-not (Test-Path $npmCmd)) {
    Write-Host "❌ npm.cmd not found at: $npmCmd" -ForegroundColor Red
    pause
    exit 1
}

# Verify Node.js works
Write-Host "Testing Node.js..." -ForegroundColor Cyan
$nodeVersion = & $nodeExe --version
Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green

Write-Host "Testing npm..." -ForegroundColor Cyan
$npmVersion = & $npmCmd --version
Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green

Write-Host "" -ForegroundColor White
Write-Host "Installing dependencies..." -ForegroundColor Yellow

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Push-Location "$rootDir\frontend"
try {
    & $npmCmd install
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend installation failed!"
    }
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
}
finally {
    Pop-Location
}

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Push-Location "$rootDir\backend"
try {
    & $npmCmd install
    if ($LASTEXITCODE -ne 0) {
        throw "Backend installation failed!"
    }
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
}
finally {
    Pop-Location
}

Write-Host "✅ All dependencies installed successfully" -ForegroundColor Green
Write-Host "" -ForegroundColor White

Write-Host "Starting development servers..." -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend: http://localhost:4000" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "⏹️  Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White

# Function to start a server
function Start-Server($name, $directory) {
    Write-Host "Starting $name..." -ForegroundColor Yellow
    
    $command = "Push-Location '$directory'; & '$npmCmd' run dev; Pop-Location"
    
    $process = Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command \"Write-Host '=== $name ===' -ForegroundColor Cyan; $command\"" -PassThru -WindowStyle Minimized
    Write-Host "✅ $name started (PID: $($process.Id))" -ForegroundColor Green
    return $process
}

# Start backend server
$backendProcess = Start-Server "Backend API" "$rootDir\backend"

# Wait for backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Start frontend server
$frontendProcess = Start-Server "Frontend App" "$rootDir\frontend"

Write-Host "✅ All servers started successfully!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "🎉 Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "🎉 Backend: http://localhost:4000" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "Press Ctrl+C to stop all servers..." -ForegroundColor Yellow
Write-Host "" -ForegroundColor White

# Monitor servers
Write-Host "Monitoring servers..." -ForegroundColor Cyan

function Check-Servers {
    $backendRunning = $false
    $frontendRunning = $false
    
    try { $backendRunning = (Get-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue) -ne $null } catch { }
    try { $frontendRunning = (Get-Process -Id $frontendProcess.Id -ErrorAction SilentlyContinue) -ne $null } catch { }
    
    return $backendRunning, $frontendRunning
}

$shouldExit = $false
while (-not $shouldExit) {
    $backendRunning, $frontendRunning = Check-Servers
    
    if (-not $backendRunning -or -not $frontendRunning) {
        Write-Host "⚠️  One server stopped unexpectedly!" -ForegroundColor Red
        $shouldExit = $true
        break
    }
    
    Start-Sleep -Seconds 2
}

# Stop servers
Write-Host "" -ForegroundColor White
Write-Host "🛑 Stopping all servers..." -ForegroundColor Red
try { Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue } catch { }
try { Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue } catch { }
Write-Host "✅ All servers stopped" -ForegroundColor Green
exit 0