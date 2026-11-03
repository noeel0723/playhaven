param(
    [ValidateSet('start', 'stop', 'status')]
    [string]$Action = 'start',
    [switch]$ExistingOnly
)

. "$PSScriptRoot\env.ps1"

$dataDirectory = Join-Path $projectRoot '.local\postgres'
$logPath = Join-Path $projectRoot '.local\postgres.log'
$databasePort = '5433'
$pausePath = Join-Path $projectRoot '.local\postgres-autostart.paused'

# Refuse to run this project helper against another project's database settings.
$expectedSettings = @{
    DB_CONNECTION = 'pgsql'
    DB_HOST = '127.0.0.1'
    DB_PORT = $databasePort
    DB_DATABASE = 'playhaven'
    DB_USERNAME = 'playhaven'
}
$environmentLines = Get-Content -LiteralPath (Join-Path $projectRoot '.env')
foreach ($name in $expectedSettings.Keys) {
    $line = $environmentLines | Where-Object { $_ -match "^$name=" }
    $value = ($line -replace "^$name=", '').Trim('"', "'")
    if ($value -ne $expectedSettings[$name]) {
        throw "PlayHaven isolation check failed: $name must be $($expectedSettings[$name]). No database was changed."
    }
}

if ($Action -eq 'status') {
    & pg_ctl -D $dataDirectory status
    exit $LASTEXITCODE
}

# Serialize startup/stop requests from the launcher, development terminal, and
# scheduled health check. The OS releases this lock even if a caller exits.
New-Item -ItemType Directory -Force (Join-Path $projectRoot '.local') | Out-Null
$lockPath = Join-Path $projectRoot '.local\postgres-control.lock'
$controlLock = $null
$deadline = [DateTime]::UtcNow.AddSeconds(90)
while ($null -eq $controlLock) {
    try {
        $controlLock = [IO.File]::Open($lockPath, [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
    } catch [IO.IOException] {
        if ([DateTime]::UtcNow -ge $deadline) { throw 'Another PlayHaven database command is still running. Try again shortly.' }
        Start-Sleep -Milliseconds 250
    }
}
try {
    if ($Action -eq 'stop') {
        [IO.File]::WriteAllText($pausePath, 'Paused by database.ps1 stop. Run database.ps1 start to resume.')
        & pg_ctl -D $dataDirectory status *> $null
        if ($LASTEXITCODE -ne 0) {
            Write-Host 'PlayHaven PostgreSQL is stopped; automatic recovery is paused.'
            exit 0
        }
        & pg_ctl -D $dataDirectory -m fast -w stop
        exit $LASTEXITCODE
    }
    if ($ExistingOnly -and (Test-Path -LiteralPath $pausePath)) {
        Write-Host 'PlayHaven automatic recovery is paused.'
        exit 0
    }
    if (-not $ExistingOnly -and (Test-Path -LiteralPath $pausePath)) { Remove-Item -LiteralPath $pausePath }

    $passwordLine = Get-Content -LiteralPath (Join-Path $projectRoot '.env') | Where-Object { $_ -match '^DB_PASSWORD=' }
    $databasePassword = ($passwordLine -replace '^DB_PASSWORD=', '').Trim('"')
    if ([string]::IsNullOrWhiteSpace($databasePassword)) {
        throw 'Set DB_PASSWORD in .env before starting the local database.'
    }

    if (-not (Test-Path -LiteralPath (Join-Path $dataDirectory 'PG_VERSION'))) {
        if ($ExistingOnly) { throw 'The existing PlayHaven data directory is missing. Automatic recovery will not initialize a new cluster.' }
        New-Item -ItemType Directory -Force (Split-Path -Parent $dataDirectory) | Out-Null
        $passwordPath = Join-Path $projectRoot '.local\postgres-password.tmp'
        try {
            [IO.File]::WriteAllText($passwordPath, $databasePassword)
            & initdb -D $dataDirectory -U playhaven --encoding=UTF8 --locale=C --auth=scram-sha-256 --pwfile=$passwordPath
            if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL initialization failed.' }
        } finally {
            if (Test-Path -LiteralPath $passwordPath) { Remove-Item -LiteralPath $passwordPath }
        }
    }

    & pg_ctl -D $dataDirectory status *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Host 'PlayHaven PostgreSQL is already running on port 5433.'
    } else {
        $portProbe = New-Object System.Net.Sockets.TcpClient
        $portOccupied = $false
        try {
            $portProbe.Connect('127.0.0.1', [int]$databasePort)
            $portOccupied = $portProbe.Connected
        } catch [System.Net.Sockets.SocketException] {
            $portOccupied = $false
        } finally {
            $portProbe.Dispose()
        }
        if ($portOccupied) {
            throw 'Port 5433 is used by another process. Refusing to stop it or change ports automatically.'
        }

        & pg_ctl -D $dataDirectory -l $logPath -o "-h 127.0.0.1 -p $databasePort" -t 60 -w start
        if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL did not start. Check .local/postgres.log.' }
    }

    $previousPgPassword = $env:PGPASSWORD
    try {
        $env:PGPASSWORD = $databasePassword
        $actualDirectory = & psql -h 127.0.0.1 -p $databasePort -U playhaven -d postgres -tAc 'SHOW data_directory'
        if ($LASTEXITCODE -ne 0) { throw 'Could not authenticate to the PlayHaven PostgreSQL instance.' }
        $resolvedActual = [IO.Path]::GetFullPath($actualDirectory.Trim()).TrimEnd('\', '/')
        $resolvedExpected = [IO.Path]::GetFullPath($dataDirectory).TrimEnd('\', '/')
        if (-not [string]::Equals($resolvedActual, $resolvedExpected, [StringComparison]::OrdinalIgnoreCase)) {
            throw 'Unexpected PostgreSQL data directory. Refusing to modify databases on this instance.'
        }
        $databaseExists = & psql -h 127.0.0.1 -p $databasePort -U playhaven -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'playhaven'"
        if ($LASTEXITCODE -ne 0) { throw 'Could not authenticate to PostgreSQL.' }
        if ($databaseExists -ne '1') {
            if ($ExistingOnly) { throw 'The playhaven database is missing. Automatic recovery will not create a replacement.' }
            & createdb -h 127.0.0.1 -p $databasePort -U playhaven -O playhaven playhaven
            if ($LASTEXITCODE -ne 0) { throw 'Could not create the playhaven database.' }
        }
    } finally {
        $env:PGPASSWORD = $previousPgPassword
    }

    Write-Host 'PlayHaven PostgreSQL is running on 127.0.0.1:5433.'
} finally {
    $controlLock.Dispose()
}
