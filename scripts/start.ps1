param([switch]$NoBrowser)

. "$PSScriptRoot\env.ps1"

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot\database.ps1" start
if ($LASTEXITCODE -ne 0) { throw 'PlayHaven database startup failed.' }

& php artisan config:clear
if ($LASTEXITCODE -ne 0) { throw 'Could not clear the PlayHaven configuration cache.' }

if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'public\build\manifest.json'))) {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
}

# Never reuse an old PlayHaven hot file that could now point at another project.
$hotPath = Join-Path $projectRoot 'public\hot'
if (Test-Path -LiteralPath $hotPath) {
    $useDevServer = $false
    try {
        $hotUrl = [uri]([IO.File]::ReadAllText($hotPath).Trim())
        if ($hotUrl.Scheme -eq 'http' -and $hotUrl.Host -in @('127.0.0.1', 'localhost') -and $hotUrl.Port -eq 5181) {
            $viteProbe = New-Object System.Net.Sockets.TcpClient
            try {
                $viteProbe.Connect('127.0.0.1', 5181)
                $useDevServer = $viteProbe.Connected
            } finally {
                $viteProbe.Dispose()
            }
        }
    } catch {
        $useDevServer = $false
    }
    if (-not $useDevServer) {
        Remove-Item -LiteralPath $hotPath
        Write-Host 'Removed an outdated PlayHaven dev-server reference; using compiled assets.'
    }
}

$siteUrl = 'http://playhaven.test'
try {
    $response = Invoke-WebRequest -Uri $siteUrl -UseBasicParsing -TimeoutSec 20
    if ($response.StatusCode -ne 200) { throw 'Unexpected HTTP status.' }
} catch {
    throw 'PostgreSQL is ready, but PlayHaven could not be opened. Start Apache in Laragon and try again.'
}

Write-Host "PlayHaven is ready: $siteUrl"
Write-Host 'Database: PostgreSQL 127.0.0.1:5433 (project-local data directory).'
if (-not $NoBrowser) { Start-Process $siteUrl }
