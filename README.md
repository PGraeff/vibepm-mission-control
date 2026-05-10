# VibePM

VibePM is a local-first project command center for vibe coders who want a clearer way to turn projects, GitHub issues, and Codex work into simple tasks.

## What is included

- React/Vite app with a Linear-style workflow and simple language
- Default `My Tasks` home screen
- `Inbox` for GitHub issues and project signals before they become tasks
- `Projects`, `Sprints`, saved `Views`, `Codex`, `Launch`, and `Settings`
- Task detail drawer with outcome, checks, links, activity, and GitHub resolve actions
- Local Node API server with JSON state in `.data/vibepm-state.json`
- Migration from the old card model into tasks, inbox items, and sprints
- Project scanner for local Git repos, dirty files, latest commits, TODO/FIXME notes, README/playbook gaps, and GitHub metadata through `gh`
- Codex live log through `codex-progress.json` and `tools/codex-progress.ps1`
- JSON backup/import in Settings

## Run locally

```bash
npm install
npm start
```

Then open:

```text
http://127.0.0.1:5174
```

`npm start` builds the React app and serves it from the local Node server. During UI development, use:

```bash
npm run dev
```

## Scan local projects

Edit `vibepm.config.json` to control which folders are scanned.

```bash
npm run scan
```

Or use the `Sync` button in the app.

## How Sprints Work

Sprints are short focus windows for each project. VibePM creates a current sprint per scanned project and fills it with the near-term tasks it thinks should be handled soon. New accepted Inbox tasks are added to the active sprint for their project when one exists.

## Teach VibePM About A Project

Copy `docs/VIBEPM_TEMPLATE.md` into a project as `VIBEPM.md`, then fill in product goal, current focus, useful commands, launch checklist, and what Codex should ignore.

## Codex Tracking

Codex should update the live ledger while working:

```powershell
.\tools\codex-progress.ps1 -Title "Implement feature" -Detail "What changed and how it was verified." -Files src/main.tsx,server.js
```

See `docs/CODEX_INTEGRATION.md` for the local API.
