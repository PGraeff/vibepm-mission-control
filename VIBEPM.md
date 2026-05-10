# VibePM Mission Control

## Product Goal

Help solo builders and small teams turn ideas, local project activity, Codex work, and launch decisions into one useful product execution board.

## Current Focus

Make VibePM useful on real local projects by scanning repos, generating clear project cards, and letting Codex understand what matters in each project.

## Useful Commands

```bash
npm start
npm run scan
```

## Important Paths

- `server.js`
- `app.js`
- `vibepm.config.json`
- `.data/vibepm-state.json`

## Ignore For Product Planning

- temporary screenshots
- generated exports
- dependency folders
- `.data/` local state

## Launch Checklist

- Local server runs
- Sync Projects finds repos
- Generated cards are understandable
- Card detail drawer explains the next action
- GitHub repo is updated

## How Codex Should Help

Create cards for real project risks, dirty work that needs review, missing setup docs, launch blockers, and unclear product decisions. Avoid creating noisy cards for every file change unless it affects current focus or launch readiness.
