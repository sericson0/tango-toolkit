<#
.SYNOPSIS
  Print Tango Toolkit usage stats (all-time total + last-30-day count per item).

.DESCRIPTION
  Reads STATS_TOKEN from the linked Netlify site, calls /api/download-stats,
  and prints sorted tables of tool downloads, web-tool usage (e.g. Name That
  Tango plays / unique players), and per-page traffic. No need to remember the
  curl command.

.EXAMPLE
  npm run stats
  ./scripts/download-stats.ps1
  ./scripts/download-stats.ps1 -Top 40                          # more page rows
  ./scripts/download-stats.ps1 -NoPages                         # tools only
  ./scripts/download-stats.ps1 -BaseUrl http://localhost:8899   # against `netlify dev`
#>
param(
  [string]$BaseUrl = "https://tangotoolkit.com",
  [int]$Top = 20,
  [switch]$NoPages
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

$url = "$BaseUrl/api/download-stats"
if ($NoPages) { $url += "?pages=0" }

try {
  $resp = Invoke-RestMethod $url -Headers @{ Authorization = "Bearer $token" }
} catch {
  Write-Error "Request to $url failed: $($_.Exception.Message)"
  exit 1
}

Write-Host ""
Write-Host "Tango Toolkit usage" -ForegroundColor Cyan
Write-Host ("  Source: {0}" -f $BaseUrl) -ForegroundColor DarkGray
Write-Host ("  Generated: {0}" -f $resp.generatedAt) -ForegroundColor DarkGray
Write-Host ""

if (-not $resp.tools -or $resp.tools.Count -eq 0) {
  Write-Host "No downloads or tool usage recorded yet." -ForegroundColor Yellow
  Write-Host ""
} else {
  # totalDownloads sums every row, including the "-unique" counters and tool
  # usage, so break it out rather than quoting it as a download count.
  $uniqueRows = $resp.tools | Where-Object { $_.toolId -like '*-unique' }
  $usageIds   = $uniqueRows | ForEach-Object { $_.toolId -replace '-unique$', '' }
  $usageRows  = $resp.tools | Where-Object { $usageIds -contains $_.toolId }
  $dlRows     = $resp.tools | Where-Object {
    $_.toolId -notlike '*-unique' -and $usageIds -notcontains $_.toolId
  }

  $sum = { param($rows) ($rows | Measure-Object -Property total -Sum).Sum }
  Write-Host ("  File downloads: {0}" -f ([int](& $sum $dlRows)))
  Write-Host ("  Tool uses: {0} from {1} unique browsers" -f `
    ([int](& $sum $usageRows)), ([int](& $sum $uniqueRows)))
  Write-Host ""

  $resp.tools |
    Select-Object @{ N = 'Item';         E = { $_.toolId } },
                  @{ N = 'Total';        E = { $_.total } },
                  @{ N = 'Last 30 days'; E = { $_.last30 } } |
    Format-Table -AutoSize
}

if ($NoPages) { return }

if (-not $resp.pages) {
  Write-Host "Page traffic unavailable (the page counters could not be read)." -ForegroundColor Yellow
  return
}

Write-Host "Page traffic" -ForegroundColor Cyan
Write-Host ("  Views: {0} all time / {1} last 30 days" -f `
  $resp.pages.totalViews, $resp.pages.totalViewsLast30)
Write-Host ("  Unique visitors: {0}   Sessions: {1}" -f `
  $resp.pages.uniqueVisitors, $resp.pages.sessions)
if ($resp.pages.sessions -gt 0) {
  Write-Host ("  Pages per session: {0:N1}" -f ($resp.pages.totalViews / $resp.pages.sessions))
}
if ($resp.pages.otherViews -gt 0) {
  Write-Host ("  Off-sitemap views (404s, stale links): {0}" -f $resp.pages.otherViews) -ForegroundColor DarkGray
}
if ($resp.pages.pendingCompaction) {
  # Keep this file ASCII-only: Windows PowerShell 5.1 reads a BOM-less .ps1 as
  # ANSI, where a UTF-8 em dash decodes into a smart quote and breaks parsing.
  Write-Host "  Note: a large event backlog is still compacting - run again to shrink it." -ForegroundColor DarkGray
}
Write-Host ""

if (-not $resp.pages.pages -or $resp.pages.pages.Count -eq 0) {
  Write-Host "No page views recorded yet." -ForegroundColor Yellow
  return
}

$shown = $resp.pages.pages | Select-Object -First $Top
$shown |
  Select-Object @{ N = 'Page';         E = { $_.path } },
                @{ N = 'Views';        E = { $_.views } },
                @{ N = 'Last 30 days'; E = { $_.last30 } } |
  Format-Table -AutoSize

if ($resp.pages.pages.Count -gt $Top) {
  Write-Host ("  ... and {0} more pages (use -Top {1} to see all)." -f `
    ($resp.pages.pages.Count - $Top), $resp.pages.pages.Count) -ForegroundColor DarkGray
}
