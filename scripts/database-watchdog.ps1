# One bounded health check, run at sign-in and every minute by Task Scheduler.
# Do not initialize clusters, run migrations, or restart any other service.
. "$PSScriptRoot\env.ps1"

$dataDirectory = Join-Path $projectRoot '.local\postgres'
$pausePath = Join-Path $projectRoot '.local\postgres-autostart.paused'
$watchLog = Join-Path $projectRoot '.local\postgres-watchdog.log'

function Write-WatchLog([string]$Message) {
    if ((Test-Path -LiteralPath $watchLog) -and (Get-Item -LiteralPath $watchLog).Length -gt 1MB) {
        Move-Item -LiteralPath $watchLog -Destination "$watchLog.1" -Force
    }
    Add-Content -LiteralPath $watchLog -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
}

try {
    if (Test-Path -LiteralPath $pausePath) { exit 0 }
    if (-not (Test-Path -LiteralPath (Join-Path $dataDirectory 'PG_VERSION'))) {
        throw 'Existing PlayHaven cluster is missing; no replacement was initialized.'
    }
    & pg_ctl -D $dataDirectory status *> $null
    $clusterRunning = $LASTEXITCODE -eq 0
    & pg_isready -h 127.0.0.1 -p 5433 -t 3 *> $null
    if ($clusterRunning -and $LASTEXITCODE -eq 0) { exit 0 }

    # database.ps1 validates .env, port ownership, and the actual data directory.
    # Do not pipe a database startup process: PostgreSQL can inherit an open
    # output pipe and keep PowerShell waiting after startup has already finished.
    # Wait for the helper itself, not the lifetime of its database descendants.
    $recovery = Start-Process -FilePath (Join-Path $PSHOME 'powershell.exe') -ArgumentList @('-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', ('"' + "$PSScriptRoot\database.ps1" + '"'), 'start', '-ExistingOnly') -WindowStyle Hidden -PassThru
    if (-not $recovery.WaitForExit(120000) -or $recovery.ExitCode -ne 0) {
        throw 'PlayHaven recovery failed or timed out. Check .local/postgres.log and run scripts/database.ps1 start for details.'
    }
    Write-WatchLog 'PlayHaven database recovery completed (or intentionally paused during the check).'
    exit 0
} catch {
    # Never log credentials or the contents of .env.
    if (Test-Path -LiteralPath (Join-Path $projectRoot '.local')) {
        Write-WatchLog "ERROR: $($_.Exception.Message)"
    }
    exit 1
}
