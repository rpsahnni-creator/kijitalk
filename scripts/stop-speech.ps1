# Stop KijiTalk speech service on port 5001 only
$port = 5001
$lines = netstat -ano | Select-String ":$port.*LISTENING"
if (-not $lines) {
    Write-Host "Port $port is free"
    exit 0
}
foreach ($line in $lines) {
    $procId = ($line -split '\s+')[-1]
    if ($procId -match '^\d+$') {
        Write-Host "Stopping PID $procId on port $port"
        taskkill /PID $procId /F 2>$null
    }
}
Start-Sleep -Seconds 2
Write-Host "Port $port is now free"
