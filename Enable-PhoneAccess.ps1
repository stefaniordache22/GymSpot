$ErrorActionPreference = 'Stop'
try {
    if (-not (Get-NetFirewallRule -DisplayName 'Spotter local phone testing' -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName 'Spotter local phone testing' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173 -RemoteAddress LocalSubnet -Profile Private | Out-Null
    }
    'Phone access enabled for your private local network.' | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'test-results/phone-access.log')
} catch {
    $_.Exception.Message | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'test-results/phone-access.log')
    throw
}
Write-Output 'Phone access enabled for your private local network.'
