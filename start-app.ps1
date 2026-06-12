# Portable Node.js Loader & Application Starter
$ErrorActionPreference = "Stop"

$zipPath = Join-Path $PSScriptRoot "node-portable.zip"
$extractPath = Join-Path $PSScriptRoot "node-portable"
$nodeBinDir = Join-Path $extractPath "node-v20.14.0-win-x64"

# Download and extract Node.js if not already done
if (-not (Test-Path $nodeBinDir)) {
    Write-Host "Node.js not found. Setting up portable Node.js v20.14.0..."
    
    if (-not (Test-Path $zipPath)) {
        Write-Host "Downloading Node.js..."
        # Using .NET Client to bypass Powershell restrictions
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile("https://nodejs.org/dist/v20.14.0/node-v20.14.0-win-x64.zip", $zipPath)
    }
    
    Write-Host "Extracting Node.js..."
    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
    
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
}

# Update path for the current process
$env:Path = "$nodeBinDir;" + $env:Path

Write-Host "Verifying installation..."
$nodeVer = node -v
$npmVer = npm -v
Write-Host "Node version: $nodeVer"
Write-Host "NPM version: $npmVer"

# Setup .env.local if not exist
$envFile = Join-Path $PSScriptRoot ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env.local template..."
    "GEMINI_API_KEY=YOUR_GEMINI_API_KEY" | Out-File -FilePath $envFile -Encoding utf8
}

# Install dependencies
Write-Host "Installing dependencies..."
npm install

# Start the application
Write-Host "Starting the application..."
npm run dev
