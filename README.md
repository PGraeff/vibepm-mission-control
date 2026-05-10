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

## Run locally

```bash
python -m http.server 5174 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:5174
```
