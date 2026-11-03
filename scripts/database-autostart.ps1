param(
    [ValidateSet('install', 'status', 'remove')]
    [string]$Action = 'status'
)

. "$PSScriptRoot\env.ps1"

$taskName = 'PlayHaven-PostgreSQL-5433'
$watchdogPath = Join-Path $PSScriptRoot 'database-watchdog.ps1'
$windowsPowerShell = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
$taskArguments = '-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $watchdogPath + '"'
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$task = Get-ScheduledTask -TaskName $taskName -TaskPath '\' -ErrorAction SilentlyContinue

# Never overwrite/remove an unrelated registration with the same task name.
if ($task -and ($task.Actions.Count -ne 1 -or $task.Actions[0].Execute -ne $windowsPowerShell -or $task.Actions[0].Arguments -ne $taskArguments)) {
    throw "Task $taskName points somewhere else. No scheduled task was changed."
}

if ($Action -eq 'status') {
    if (-not $task) { Write-Host 'PlayHaven database autostart is not installed.'; exit 1 }
    $info = Get-ScheduledTaskInfo -TaskName $taskName -TaskPath '\'
    Write-Host "Task: $taskName; state: $($task.State); account: $($task.Principal.UserId)"
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
$taskAction = New-ScheduledTaskAction -Execute $windowsPowerShell -Argument $taskArguments -WorkingDirectory $projectRoot
$logonTrigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
$timerTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 3) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName $taskName -TaskPath '\' -Action $taskAction -Trigger @($logonTrigger, $timerTrigger) -Principal $principal -Settings $settings -Description 'Start and recover only the existing PlayHaven PostgreSQL cluster on 127.0.0.1:5433. No other project or database service is managed.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName -TaskPath '\'
Write-Host "Installed $taskName for $currentUser (limited permissions; no stored Windows password)."
Write-Host 'Checks run silently at sign-in and every minute while you are signed in. Manual database.ps1 stop pauses recovery; start resumes it.'
