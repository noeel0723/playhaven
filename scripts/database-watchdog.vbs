Option Explicit

' wscript.exe is a GUI host: it does not create a console of its own.
' Run(..., 0, True) creates the PowerShell window hidden from the start and
' propagates the watchdog exit code to Task Scheduler.
Dim shell, files, scriptDirectory, powershellPath, watchdogPath, command
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
scriptDirectory = files.GetParentFolderName(WScript.ScriptFullName)
powershellPath = shell.ExpandEnvironmentStrings("%WINDIR%") & "\System32\WindowsPowerShell\v1.0\powershell.exe"
watchdogPath = scriptDirectory & "\database-watchdog.ps1"
command = Chr(34) & powershellPath & Chr(34) & " -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File " & Chr(34) & watchdogPath & Chr(34)
WScript.Quit shell.Run(command, 0, True)
