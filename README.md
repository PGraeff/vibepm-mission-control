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

## Run locally

```bash
python -m http.server 5174 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:5174
```
