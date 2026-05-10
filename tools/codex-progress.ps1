param(
  [Parameter(Mandatory = $true)]
  [string]$Title,

  [Parameter(Mandatory = $true)]
  [string]$Detail,

  [string]$Status = "Active",
  [string]$ProjectId = "project-new-project-4",
  [string]$LinkedCardId = "",
  [string[]]$Files = @()
)

$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ledgerPath = Join-Path $repoRoot "codex-progress.json"
$now = (Get-Date).ToUniversalTime().ToString("o")
$id = ($Title.ToLowerInvariant() -replace "[^a-z0-9]+", "-" -replace "^-|-$", "")
if (-not $id) {
  $id = "codex-" + [guid]::NewGuid().ToString("N")
}

if (Test-Path $ledgerPath) {
  $ledger = Get-Content $ledgerPath -Raw | ConvertFrom-Json
} else {
  $ledger = [pscustomobject]@{ version = 1; projectId = $ProjectId; entries = @(); issues = @() }
}

$entries = @($ledger.entries | Where-Object { $_.id -ne $id })
$entries += [pscustomobject]@{
  id = $id
  projectId = $ProjectId
  status = $Status
  title = $Title
  detail = $Detail
  linkedCardId = $LinkedCardId
  files = $Files
  createdAt = $now
  updatedAt = $now
}

$ledger.entries = @($entries)
$json = $ledger | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText($ledgerPath, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))

$payload = @{
  projectId = $ProjectId
  status = $Status
  title = $Title
  detail = $Detail
  linkedCardId = $LinkedCardId
} | ConvertTo-Json -Depth 6

try {
  Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:5174/api/codex/activity" -ContentType "application/json" -Body $payload | Out-Null
} catch {
  Write-Warning "Ledger updated, but the local VibePM server did not accept the live activity event."
}

Write-Host "Codex progress recorded: $Title"
