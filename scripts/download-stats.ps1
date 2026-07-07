<#
.SYNOPSIS
  Print Tango Toolkit download stats (all-time total + last-30-day count per tool).

.DESCRIPTION
  Reads STATS_TOKEN from the linked Netlify site, calls /api/download-stats,
  and prints a sorted table. No need to remember the curl command.

.EXAMPLE
  npm run stats
  ./scripts/download-stats.ps1
  ./scripts/download-stats.ps1 -BaseUrl http://localhost:8899   # against `netlify dev`
#>
param(
  [string]$BaseUrl = "https://tangotoolkit.com"
)

$ErrorActionPreference = "Stop"

# netlify reads the linked site from the repo root, so run it from there.
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
  $token = (netlify env:get STATS_TOKEN).Trim()
} finally {
  Pop-Location
}

if (-not $token -or $token.Length -lt 16) {
  Write-Error "Could not read STATS_TOKEN from Netlify. Is the site linked (netlify link) and the var set (netlify env:get STATS_TOKEN)?"
  exit 1
}

try {
  $resp = Invoke-RestMethod "$BaseUrl/api/download-stats" -Headers @{ Authorization = "Bearer $token" }
} catch {
  Write-Error "Request to $BaseUrl/api/download-stats failed: $($_.Exception.Message)"
  exit 1
}

Write-Host ""
Write-Host "Tango Toolkit downloads" -ForegroundColor Cyan
Write-Host ("  Source: {0}" -f $BaseUrl) -ForegroundColor DarkGray
Write-Host ("  Generated: {0}" -f $resp.generatedAt) -ForegroundColor DarkGray
Write-Host ("  Total downloads (all tools): {0}" -f $resp.totalDownloads)
Write-Host ""

if (-not $resp.tools -or $resp.tools.Count -eq 0) {
  Write-Host "No downloads recorded yet." -ForegroundColor Yellow
  return
}

$resp.tools |
  Select-Object @{ N = 'Tool';         E = { $_.toolId } },
                @{ N = 'Total';        E = { $_.total } },
                @{ N = 'Last 30 days'; E = { $_.last30 } } |
  Format-Table -AutoSize
