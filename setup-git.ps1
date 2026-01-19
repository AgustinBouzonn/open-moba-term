# OpenMoba - Git Initialization Script
# Run this script after installing Git and creating your GitHub repository

Write-Host "=== OpenMoba GitHub Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
try {
    git --version | Out-Null
    Write-Host "✓ Git is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is not installed" -ForegroundColor Red
    Write-Host "  Download Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Prompt for GitHub username
$username = Read-Host "Enter your GitHub username"
if ([string]::IsNullOrWhiteSpace($username)) {
    Write-Host "✗ Username is required" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Repository will be: https://github.com/$username/openmoba" -ForegroundColor Cyan
$confirm = Read-Host "Is this correct? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== Updating project files with your username ===" -ForegroundColor Cyan

# Update package.json
$packageJson = Get-Content "package.json" -Raw
$packageJson = $packageJson -replace "YOUR_USERNAME", $username
Set-Content "package.json" -Value $packageJson
Write-Host "✓ Updated package.json" -ForegroundColor Green

# Update README.md
$readme = Get-Content "README.md" -Raw
$readme = $readme -replace "YOUR_USERNAME", $username
Set-Content "README.md" -Value $readme
Write-Host "✓ Updated README.md" -ForegroundColor Green

# Update GIT_SETUP.md
$gitSetup = Get-Content "GIT_SETUP.md" -Raw
$gitSetup = $gitSetup -replace "YOUR_USERNAME", $username
Set-Content "GIT_SETUP.md" -Value $gitSetup
Write-Host "✓ Updated GIT_SETUP.md" -ForegroundColor Green

Write-Host ""
Write-Host "=== Initializing Git repository ===" -ForegroundColor Cyan

# Initialize Git
if (Test-Path ".git") {
    Write-Host "! Repository already initialized" -ForegroundColor Yellow
} else {
    git init
    Write-Host "✓ Initialized Git repository" -ForegroundColor Green
}

# Add all files
git add .
Write-Host "✓ Added all files" -ForegroundColor Green

# Create initial commit
git commit -m "Initial commit: OpenMoba v1.0.0"
Write-Host "✓ Created initial commit" -ForegroundColor Green

# Add remote
$remoteUrl = "https://github.com/$username/openmoba.git"
try {
    git remote add origin $remoteUrl 2>&1 | Out-Null
    Write-Host "✓ Added remote origin: $remoteUrl" -ForegroundColor Green
} catch {
    Write-Host "! Remote origin already exists" -ForegroundColor Yellow
}

# Rename branch to main
git branch -M main
Write-Host "✓ Renamed branch to main" -ForegroundColor Green

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Create repository on GitHub: https://github.com/new" -ForegroundColor White
Write-Host "   - Name: openmoba" -ForegroundColor Gray
Write-Host "   - DO NOT initialize with README or license" -ForegroundColor Gray
Write-Host ""
Write-Host "2. After creating the repository, run:" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. (Optional) Create version tag:" -ForegroundColor White
Write-Host "   git tag -a v1.0.0 -m 'Release v1.0.0'" -ForegroundColor Yellow
Write-Host "   git push origin v1.0.0" -ForegroundColor Yellow
Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
