param([string]$Filter = '')

. "$PSScriptRoot\env.ps1"

# Only this disposable database is used; never run RefreshDatabase against playhaven.
$testDatabase = 'playhaven_testing'
$variables = @('DB_CONNECTION', 'DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD', 'DB_URL', 'PGPASSWORD')
$previousValues = @{}
foreach ($name in $variables) { $previousValues[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }

try {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot\database.ps1" start
    if ($LASTEXITCODE -ne 0) { throw 'Database startup failed.' }

    $passwordLine = Get-Content -LiteralPath (Join-Path $projectRoot '.env') | Where-Object { $_ -match '^DB_PASSWORD=' }
    $env:PGPASSWORD = ($passwordLine -replace '^DB_PASSWORD=', '').Trim('"')
    $databaseExists = & psql -h 127.0.0.1 -p 5433 -U playhaven -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'playhaven_testing'"
    if ($LASTEXITCODE -ne 0) { throw 'Could not authenticate to PostgreSQL.' }
    if ($databaseExists -ne '1') {
        & createdb -h 127.0.0.1 -p 5433 -U playhaven -O playhaven $testDatabase
        if ($LASTEXITCODE -ne 0) { throw 'Could not create the isolated test database.' }
    }

    $env:DB_CONNECTION = 'pgsql'
    $env:DB_HOST = '127.0.0.1'
    $env:DB_PORT = '5433'
    $env:DB_DATABASE = $testDatabase
    $env:DB_USERNAME = 'playhaven'
    $env:DB_PASSWORD = $env:PGPASSWORD
    $env:DB_URL = ''

    & php artisan config:clear
    if ($LASTEXITCODE -ne 0) { throw 'Could not clear cached configuration.' }

    # Verify Laravel sees the intended database before tests can refresh tables.
    & php "$PSScriptRoot\assert-test-database.php"
    if ($LASTEXITCODE -ne 0) { throw 'Test database safety check failed.' }

    if ($Filter) {
        & php artisan test "--filter=$Filter"
    } else {
        & php artisan test
    }
    $testExitCode = $LASTEXITCODE
} finally {
    foreach ($name in $variables) { [Environment]::SetEnvironmentVariable($name, $previousValues[$name], 'Process') }
}

exit $testExitCode
