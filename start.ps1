$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$backendDirectory = Join-Path $root "backend"
$frontendDirectory = Join-Path $root "frontend"
$backendEnvironment = Join-Path $backendDirectory ".env"
$backendPython = Join-Path $backendDirectory ".venv\Scripts\python.exe"

if (-not (Test-Path $backendEnvironment)) {
    throw "Backend configuration is missing. Copy backend\.env.example to backend\.env and set DATABASE_URL."
}

if (-not (Test-Path $backendPython)) {
    throw "Backend Python environment is missing. Create backend\.venv and install backend\requirements.txt as described in README.md."
}

$pythonVersion = & $backendPython -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
if ($LASTEXITCODE -ne 0) {
    throw "Could not determine the backend Python version."
}
if ($pythonVersion -notin @("3.11", "3.12")) {
    throw "This backend's pinned dependencies require Python 3.11 or 3.12. Recreate backend\.venv with Python 3.12 and reinstall backend\requirements.txt."
}

& $backendPython -c "import fastapi, pydantic_core, sqlalchemy"
if ($LASTEXITCODE -ne 0) {
    throw "Backend dependencies are missing or cannot be imported. Reinstall backend\requirements.txt in backend\.venv."
}

$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCommand) {
    throw "npm was not found. Install Node.js 20.19+ (or 22.12+) and npm."
}

if (-not (Test-Path (Join-Path $frontendDirectory "node_modules"))) {
    throw "Frontend dependencies are missing. Run 'npm install' from the frontend directory first."
}

$shellPath = (Get-Process -Id $PID).Path
$backendCommand = @"
`$Host.UI.RawUI.WindowTitle = 'Rake Formation Backend'
Set-Location -LiteralPath '$backendDirectory'
& '$backendPython' -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
"@
$frontendCommand = @"
`$Host.UI.RawUI.WindowTitle = 'Rake Formation Frontend'
Set-Location -LiteralPath '$frontendDirectory'
& '$($npmCommand.Source)' run dev -- --host localhost --port 5173 --strictPort
"@

foreach ($command in @($backendCommand, $frontendCommand)) {
    $encodedCommand = [Convert]::ToBase64String(
        [Text.Encoding]::Unicode.GetBytes($command)
    )
    Start-Process -FilePath $shellPath -ArgumentList @(
        "-NoExit",
        "-EncodedCommand",
        $encodedCommand
    )
}

Write-Host "Started the backend and frontend in separate PowerShell windows."
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://127.0.0.1:8000 (API docs: /docs)"
