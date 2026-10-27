# KijiTalk — PATH fix + environment check
# Run: powershell -ExecutionPolicy Bypass -File scripts\verify-env.ps1

function Add-ToPathIfExists([string]$Dir) {
    if ($Dir -and (Test-Path $Dir)) {
        if ($env:Path -notlike "*$Dir*") {
            $env:Path = "$Dir;$env:Path"
        }
        return $true
    }
    return $false
}

# Common install locations (PATH mein folder ho lekin terminal ko na mile)
$nodeDirs = @(
    "C:\Program Files\nodejs",
    "$env:ProgramFiles\nodejs",
    "$env:LOCALAPPDATA\fnm_multishells",
    "$env:APPDATA\nvm"
)
$pythonDirs = @(
    "$env:LOCALAPPDATA\Programs\Python\Python312",
    "$env:LOCALAPPDATA\Programs\Python\Python311",
    "$env:LOCALAPPDATA\Programs\Python\Python313",
    "$env:LOCALAPPDATA\Programs\Python\Python312\Scripts",
    "C:\Python312"
)

foreach ($d in $nodeDirs) { Add-ToPathIfExists $d | Out-Null }
foreach ($d in $pythonDirs) { Add-ToPathIfExists $d | Out-Null }

Write-Host "`n=== KijiTalk Environment Check ===" -ForegroundColor Cyan

$ok = $true

# Node
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $node = node --version
    $npm = npm --version
    Write-Host "Node: $node" -ForegroundColor Green
    Write-Host "npm:  v$npm" -ForegroundColor Green
    Write-Host "  Path: $($nodeCmd.Source)" -ForegroundColor DarkGray
    $major = [int]($node -replace 'v(\d+)\..*', '$1')
    if ($major -ne 20) {
        Write-Host "  -> Node 20 LTS recommended (aapke paas $node hai)" -ForegroundColor Yellow
    }
    # Cursor bundled node has no npm — warn user
    if ($nodeCmd.Source -like "*cursor*") {
        Write-Host "  -> WARNING: Ye Cursor ka internal Node hai, npm nahi milega!" -ForegroundColor Red
        Write-Host "  -> Node.js 20 LTS install karein: https://nodejs.org" -ForegroundColor Yellow
        $ok = $false
    }
} else {
    Write-Host "Node: NOT FOUND" -ForegroundColor Red
    Write-Host "  -> Node.js 20 LTS install karein: https://nodejs.org" -ForegroundColor Yellow
    Write-Host "  -> Install ke baad CMD/PowerShell BAND karke dubara kholo" -ForegroundColor Yellow
    $ok = $false
}

# Python
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    foreach ($ver in @("312", "311", "313")) {
        $py = "$env:LOCALAPPDATA\Programs\Python\Python$ver\python.exe"
        if (Test-Path $py) {
            $env:Path = "$(Split-Path $py);$env:Path"
            $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
            break
        }
    }
}
if ($pythonCmd) {
    $pyVer = python --version 2>&1
    Write-Host "Python: $pyVer" -ForegroundColor Green
    Write-Host "  Path: $($pythonCmd.Source)" -ForegroundColor DarkGray
} else {
    Write-Host "Python: NOT FOUND (optional)" -ForegroundColor Yellow
}

# Env files
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFiles = @(
    @{ Path = "$root\backend\.env"; Required = $true },
    @{ Path = "$root\frontend\.env.local"; Required = $true }
)
Write-Host "`nEnv files:" -ForegroundColor Cyan
foreach ($f in $envFiles) {
    if (Test-Path $f.Path) {
        Write-Host "  OK: $(Split-Path $f.Path -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $($f.Path)" -ForegroundColor Red
        if ($f.Required) { $ok = $false }
    }
}

Write-Host "`nAPI keys bharein (abhi placeholder hain):" -ForegroundColor Cyan
Write-Host "  backend\.env         -> MONGODB_URI, GEMINI_API_KEY, Firebase"
Write-Host "  frontend\.env.local  -> NEXT_PUBLIC_FIREBASE_*"

Write-Host ""
if ($ok) {
    Write-Host "Ready! Run:" -ForegroundColor Green
    Write-Host "  scripts\start-backend.ps1"
    Write-Host "  scripts\start-frontend.ps1"
} else {
    Write-Host "Pehle Node.js 20 install karo, phir: scripts\install-all.ps1" -ForegroundColor Yellow
}
