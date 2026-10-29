$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
Write-Output 'Starting GymSpot'
try {
    $spotterResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 5
    if ($spotterResponse.Content -match '<title>GymSpot') {
        Write-Output 'GymSpot running at http://localhost:5173 (already running)'
        exit 0
    }
    throw 'Port 5173 is occupied by another app.'
} catch {
    if ($_.Exception.Message -eq 'Port 5173 is occupied by another app.') { throw }
}
$spotterNode = Get-Command node -ErrorAction SilentlyContinue
if ($spotterNode) { $spotterNodePath = $spotterNode.Source } else { $spotterNodePath = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' }
if (-not (Test-Path -LiteralPath $spotterNodePath)) { throw 'Node.js not found. Install Node.js 22 or newer.' }
& $spotterNodePath --env-file-if-exists=.env server.mjs
exit $LASTEXITCODE

