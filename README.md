# VibePM Mission Control

A dark-mode static prototype for the VibePM product-management mission control UI.

## What is included

- Desktop-first Mission Control dashboard
- Product maturity Kanban board
- Product intelligence right rail
- Search and status filtering
- New-card dialog
- Drag-and-drop card movement
- Local persistence with `localStorage`
- Editable card detail drawer
- PRD, prompt, signal, agent run, launch check, and decision sections
- Workflow actions for capture, PRD draft, agent mission, and launch check
- Priority and risk sorting
- JSON schema for the local data model in `schemas.json`
- Working sidebar pages for Roadmap, Idea Inbox, Agent Runs, User Signals, Docs + PRDs, and Launches
- Inline editors for context links, signals, agent runs, founder decisions, and launch checks
- Guided PRD generation fields
- Structured agent mission composer
- Fast Idea Inbox capture form
- Launch readiness dashboard with blockers and incomplete checks
- JSON import/export for local backups and migration
- Local Codex/project activity monitor model
- Database schema starter in `database-schema.sql`
- Local project snapshot helper in `tools/codex-snapshot.ps1`
- Local Node server with JSON state storage in `.data/vibepm-state.json`
- Project scanner that reads local Git repos, branches, remotes, dirty files, latest commits, TODO/FIXME comments, and launch-doc gaps
- `Sync Projects` action for generating real cards/activity from current projects
- Optional per-project `VIBEPM.md` playbook so generated cards reflect product intent instead of raw Git noise
- GitHub enrichment through authenticated `gh`: open issues, open PRs, review state, recent branch checks, and generated cards for GitHub work

## Run locally

```bash
npm start
```

Then open:

```text
http://127.0.0.1:5174
```

## Scan local projects

Edit `vibepm.config.json` to control which folders are scanned.

```bash
npm run scan
```

Or use the `Sync Projects` button in the app.

## Teach VibePM About A Project

Copy `docs/VIBEPM_TEMPLATE.md` into a project as `VIBEPM.md`, then fill in product goal, current focus, useful commands, launch checklist, and what Codex should ignore. The scanner reads this file and uses it to generate more useful cards.

## GitHub Connection

The local scanner uses each repo's `origin` remote plus your authenticated `gh` CLI session. Run `gh auth status` if GitHub data does not appear after `Sync Projects`.
