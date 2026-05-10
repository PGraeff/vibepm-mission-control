param(
  [string]$Root = "$env:USERPROFILE\OneDrive\Documentos",
  [string]$Output = ".\vibepm-codex-snapshot.json"
)

$projects = Get-ChildItem -LiteralPath $Root -Directory -ErrorAction SilentlyContinue |
  Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName ".git") } |
  ForEach-Object {
    $repo = ""
    try {
      $repo = git -C $_.FullName remote get-url origin 2>$null
    } catch {
      $repo = ""
    }

    [pscustomobject]@{
      id = "project-" + ($_.Name.ToLowerInvariant() -replace '[^a-z0-9]+','-').Trim('-')
      name = $_.Name
      path = $_.FullName
      repo = $repo
      status = "Observed"
      linkedCards = @()
      updatedAt = (Get-Date).ToUniversalTime().ToString("o")
    }
  }

$activity = $projects | ForEach-Object {
  [pscustomobject]@{
    id = "activity-" + [guid]::NewGuid().ToString("N")
    projectId = $_.id
    source = "Local snapshot"
    status = "Observed"
    title = "Project discovered: $($_.name)"
    detail = $_.path
    linkedCardId = ""
    createdAt = (Get-Date).ToUniversalTime().ToString("o")
  }
}

[pscustomobject]@{
  projects = @($projects)
  activity = @($activity)
} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $Output -Encoding UTF8

Write-Output "Wrote $Output"
