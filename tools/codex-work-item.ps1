param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [Parameter(Mandatory = $true)]
  [string]$Title,

  [Parameter(Mandatory = $true)]
  [string]$Outcome,

  [string]$Status = "Active",
  [string]$Column = "Build Watch",
  [string[]]$Checks = @("Review implementation", "Verify behavior"),
  [switch]$CreateGithubIssue
)

$payload = @{
  projectId = $ProjectId
  title = $Title
  outcome = $Outcome
  status = $Status
  column = $Column
  checks = $Checks
  createGithubIssue = [bool]$CreateGithubIssue
} | ConvertTo-Json -Depth 6

Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:5174/api/codex/work-items" -ContentType "application/json" -Body $payload
