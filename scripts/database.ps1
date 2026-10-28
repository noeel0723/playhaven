param(
    [ValidateSet('start', 'stop', 'status')]
    [string]$Action = 'start'
)

. "$PSScriptRoot\env.ps1"

$dataDirectory = Join-Path $projectRoot '.local\postgres'
$logPath = Join-Path $projectRoot '.local\postgres.log'
$databasePort = '5433'

if ($Action -eq 'stop') {
    & pg_ctl -D $dataDirectory -m fast stop
    exit $LASTEXITCODE
}

if ($Action -eq 'status') {
    & pg_ctl -D $dataDirectory status
    exit $LASTEXITCODE
}

$passwordLine = Get-Content -LiteralPath (Join-Path $projectRoot '.env') | Where-Object { $_ -match '^DB_PASSWORD=' }
$databasePassword = ($passwordLine -replace '^DB_PASSWORD=', '').Trim('"')
if ([string]::IsNullOrWhiteSpace($databasePassword)) {
    throw 'Set DB_PASSWORD in .env before starting the local database.'
}

if (-not (Test-Path -LiteralPath (Join-Path $dataDirectory 'PG_VERSION'))) {
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
    & pg_ctl -D $dataDirectory -l $logPath -o "-h 127.0.0.1 -p $databasePort" -w start
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL did not start. Check .local/postgres.log.' }
}

$previousPgPassword = $env:PGPASSWORD
try {
    $env:PGPASSWORD = $databasePassword
    $databaseExists = & psql -h 127.0.0.1 -p $databasePort -U playhaven -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'playhaven'"
    if ($LASTEXITCODE -ne 0) { throw 'Could not authenticate to PostgreSQL.' }
    if ($databaseExists -ne '1') {
        & createdb -h 127.0.0.1 -p $databasePort -U playhaven -O playhaven playhaven
        if ($LASTEXITCODE -ne 0) { throw 'Could not create the playhaven database.' }
    }
} finally {
    $env:PGPASSWORD = $previousPgPassword
}

Write-Host 'PlayHaven PostgreSQL is running on 127.0.0.1:5433.'
