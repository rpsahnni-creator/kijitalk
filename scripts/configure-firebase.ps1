# KijiTalk - Firebase Interactive Setup
# Run: powershell -ExecutionPolicy Bypass -File scripts\configure-firebase.ps1

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $Root "frontend\.env.local"
$backendEnv = Join-Path $Root "backend\.env"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KijiTalk Firebase Setup Wizard" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Browser mein Firebase khul raha hai..." -ForegroundColor Yellow
Write-Host "  - Project banao (ya existing select karo)" -ForegroundColor Gray
Write-Host "  - Authentication > Sign-in method > Google ENABLE" -ForegroundColor Gray
Write-Host "  - Authentication > Sign-in method > Email ENABLE" -ForegroundColor Gray
Write-Host "  - Project Settings > Your apps > Web app > Config copy karo" -ForegroundColor Gray
Write-Host ""

Start-Process "https://console.firebase.google.com"
Start-Sleep -Seconds 2
Start-Process "https://console.firebase.google.com/project/_/authentication/providers"

Write-Host "Firebase Console mein Google + Email enable karo, phir yahan aao." -ForegroundColor Green
Write-Host ""

$apiKey = Read-Host "NEXT_PUBLIC_FIREBASE_API_KEY (apiKey)"
$authDomain = Read-Host "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (authDomain)"
$projectId = Read-Host "NEXT_PUBLIC_FIREBASE_PROJECT_ID (projectId)"
$storageBucket = Read-Host "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET (storageBucket)"
$messagingSenderId = Read-Host "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID (messagingSenderId)"
$appId = Read-Host "NEXT_PUBLIC_FIREBASE_APP_ID (appId)"

if (-not $apiKey -or -not $projectId) {
    Write-Host ""
    Write-Host "Error: API Key aur Project ID zaroori hain!" -ForegroundColor Red
    exit 1
}

$envContent = @"
# Firebase - auto configured by configure-firebase.ps1
NEXT_PUBLIC_FIREBASE_API_KEY=$apiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$authDomain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$projectId
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$storageBucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$messagingSenderId
NEXT_PUBLIC_FIREBASE_APP_ID=$appId

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:4001
"@

Set-Content -Path $envFile -Value $envContent -Encoding UTF8
Write-Host ""
Write-Host "OK: frontend\.env.local saved!" -ForegroundColor Green

Write-Host ""
Write-Host "Optional: Backend Firebase Admin (Service Account JSON)" -ForegroundColor Yellow
Write-Host "Project Settings > Service Accounts > Generate new private key" -ForegroundColor Gray
$setupBackend = Read-Host "Backend service account setup karna hai? (y/n)"

if ($setupBackend -eq 'y' -or $setupBackend -eq 'Y') {
    $jsonPath = Read-Host "JSON file ka full path paste karo"
    if (Test-Path $jsonPath) {
        $json = Get-Content $jsonPath -Raw | ConvertFrom-Json
        $privateKey = $json.private_key -replace [Environment]::NewLine, '\n'

        $firebaseBlock = @"

# Firebase Admin SDK
FIREBASE_PROJECT_ID=$($json.project_id)
FIREBASE_CLIENT_EMAIL=$($json.client_email)
FIREBASE_PRIVATE_KEY="$privateKey"
"@
        Add-Content -Path $backendEnv -Value $firebaseBlock
        Write-Host "OK: backend\.env mein Firebase Admin added!" -ForegroundColor Green
    } else {
        Write-Host "JSON file nahi mili - baad mein manually add karo." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ab frontend restart karo:" -ForegroundColor Yellow
Write-Host "  cd E:\kijitalk\frontend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Browser: http://localhost:3100/login" -ForegroundColor Yellow
Write-Host "Continue with Google button try karo" -ForegroundColor White
Write-Host ""
