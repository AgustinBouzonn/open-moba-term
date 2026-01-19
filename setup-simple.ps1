# OpenMoba Release Preparation
Write-Host "=== OpenMoba GitHub Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check Node
Write-Host "[1/3] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  OK Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js not found!" -ForegroundColor Red
    exit 1
}

# Get GitHub username
Write-Host ""
Write-Host "[2/3] GitHub Configuration" -ForegroundColor Yellow
$username = Read-Host "Enter your GitHub username"
if ([string]::IsNullOrWhiteSpace($username)) {
    Write-Host "  ERROR: Username required!" -ForegroundColor Red
    exit 1
}

Write-Host "  Repository will be: https://github.com/$username/openmoba" -ForegroundColor Cyan

# Update files
Write-Host ""
Write-Host "[3/3] Updating files with username..." -ForegroundColor Yellow

$files = @(
    "package.json",
    "README.md",
    "electron-builder.yml",
    "QUICKSTART.md",
    "docs\FAQ.md",
    "RELEASE.md"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace "YOUR_USERNAME", $username
        Set-Content $file -Value $content -NoNewline
        Write-Host "  Updated: $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Run: npm run build" -ForegroundColor Yellow
Write-Host "2. Installer will be in: release\OpenMoba-1.0.0-Setup.exe" -ForegroundColor Yellow
Write-Host "3. Install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
Write-Host "4. Create repo at: https://github.com/new" -ForegroundColor Yellow
Write-Host ""
