param(
    [ValidateSet('all', 'laragon', 'web', 'vite', 'queue')]
    [string]$Service = 'all'
)

. "$PSScriptRoot\env.ps1"

switch ($Service) {
    'web' { & php artisan serve --host=127.0.0.1 --port=8000 }
    'vite' { & npm.cmd run dev }
    'queue' { & php artisan queue:listen --tries=3 --timeout=60 }
    'laragon' {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot\database.ps1" start
        if ($LASTEXITCODE -ne 0) { throw 'Database startup failed.' }
        & npx.cmd concurrently --kill-others --names vite,queue 'npm run dev' 'php artisan queue:listen --tries=3 --timeout=60'
    }
    'all' {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot\database.ps1" start
        if ($LASTEXITCODE -ne 0) { throw 'Database startup failed.' }
        & npx.cmd concurrently --kill-others --names web,vite,queue 'php artisan serve --host=127.0.0.1 --port=8000' 'npm run dev' 'php artisan queue:listen --tries=3 --timeout=60'
    }
}
exit $LASTEXITCODE
