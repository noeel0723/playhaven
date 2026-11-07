param(
    [ValidateSet('install', 'status', 'remove')]
    [string]$Action = 'status'
)

. "$PSScriptRoot\env.ps1"

$taskName = 'PlayHaven-PostgreSQL-5433'
$watchdogPath = Join-Path $PSScriptRoot 'database-watchdog.ps1'
$windowsPowerShell = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
$legacyArguments = '-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $watchdogPath + '"'
$scriptHost = Join-Path $env:WINDIR 'System32\wscript.exe'
$launcherPath = Join-Path $PSScriptRoot 'database-watchdog.vbs'
$taskArguments = '//B //Nologo "' + $launcherPath + '"'
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$task = Get-ScheduledTask -TaskName $taskName -TaskPath '\' -ErrorAction SilentlyContinue

# Never overwrite/remove an unrelated registration with the same task name.
if ($task -and ($task.Actions.Count -ne 1 -or -not (
    ($task.Actions[0].Execute -eq $windowsPowerShell -and $task.Actions[0].Arguments -eq $legacyArguments) -or
    ($task.Actions[0].Execute -eq $scriptHost -and $task.Actions[0].Arguments -eq $taskArguments)
))) {
    throw "Task $taskName points somewhere else. No scheduled task was changed."
}

if ($Action -eq 'status') {
    if (-not $task) { Write-Host 'PlayHaven database autostart is not installed.'; exit 1 }
    $info = Get-ScheduledTaskInfo -TaskName $taskName -TaskPath '\'
    Write-Host "Task: $taskName; state: $($task.State); account: $($task.Principal.UserId)"
    Write-Host "Launcher: $($task.Actions[0].Execute)"
    Write-Host "Last result: $($info.LastTaskResult); next check: $($info.NextRunTime)"
    Write-Host "Recovery paused: $(Test-Path -LiteralPath (Join-Path $projectRoot '.local\postgres-autostart.paused'))"
    exit 0
}

if ($Action -eq 'remove') {
    if ($task) { Unregister-ScheduledTask -TaskName $taskName -TaskPath '\' -Confirm:$false }
    Write-Host 'PlayHaven database autostart removed. The running database was not stopped.'
    exit 0
}

# Installation first verifies the existing cluster, without creating a new one.
& powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$PSScriptRoot\database.ps1" start -ExistingOnly
if ($LASTEXITCODE -ne 0) { throw 'Cannot install automatic recovery until the existing PlayHaven database is healthy.' }
if (-not (Test-Path -LiteralPath $scriptHost) -or -not (Test-Path -LiteralPath $launcherPath)) {
    throw 'The windowless script host or PlayHaven launcher is missing. No task was changed.'
}
$taskAction = New-ScheduledTaskAction -Execute $scriptHost -Argument $taskArguments -WorkingDirectory $projectRoot
$logonTrigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
$timerTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1)
# The GUI script host creates PowerShell hidden from its first window creation;
# launching powershell.exe directly can flash before it processes WindowStyle.
$principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 3) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName $taskName -TaskPath '\' -Action $taskAction -Trigger @($logonTrigger, $timerTrigger) -Principal $principal -Settings $settings -Description 'Start and recover only the existing PlayHaven PostgreSQL cluster on 127.0.0.1:5433. No other project or database service is managed.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName -TaskPath '\'
Write-Host "Installed $taskName for $currentUser (limited permissions; no stored Windows password)."
Write-Host 'Checks run through a windowless launcher at sign-in and every minute while signed in. Manual database.ps1 stop pauses recovery; start resumes it.'
