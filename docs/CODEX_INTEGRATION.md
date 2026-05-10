# Codex Integration

VibePM exposes a local work-item API that Codex or another local agent can call while working in a project.

## Track Codex Progress

Codex should update `codex-progress.json` while working on this app. The server reads that tracked file and shows it in Codex Work as the live log.

```powershell
.\tools\codex-progress.ps1 -Title "Simplify card language" -Detail "Replaced P/R shorthand with plain labels." -Files app.js,styles.css
```

## Create A Work Item

```bash
curl -X POST http://127.0.0.1:5174/api/codex/work-items \
  -H "Content-Type: application/json" \
  -d "{\"projectId\":\"project-new-project-4\",\"title\":\"Implement settings view\",\"outcome\":\"Add scoped settings for the active project\"}"
```

## PowerShell Helper

```powershell
.\tools\codex-work-item.ps1 -ProjectId project-new-project-4 -Title "Implement settings view" -Outcome "Add scoped settings for the active project"
```

## Optional GitHub Issue Creation

Set `CreateGithubIssue` in the helper or `"createGithubIssue": true` in the JSON payload. This uses the selected project's GitHub repo from the scanner and your authenticated `gh` session.

## MCP Direction

The HTTP API is the local capability layer. A future MCP server should wrap these same actions as tools:

- `list_projects`
- `create_work_item`
- `record_progress`
- `update_work_item`
- `resolve_github_issue`
- `sync_projects`
- `create_github_issue`
