$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$phpDirectory = 'D:\laragon\bin\php\php-8.5.10-Win32-vs17-x64'
$composerDirectory = 'D:\laragon\bin\composer'
$postgresDirectory = 'C:\Program Files\PostgreSQL\16\bin'
$env:Path = "$phpDirectory;$composerDirectory;$postgresDirectory;$env:Path"
Set-Location -LiteralPath $projectRoot
