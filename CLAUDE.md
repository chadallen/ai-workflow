# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

This is the `claude-workflow` public template repo — a collection of Claude Code skills, sub-agent definitions, and doc templates that implement a structured, autonomous coding workflow. There is no application code here. The entire repo is markdown: skills, agents, and starter templates that users clone into their own projects.

## Repository Structure

```
.claude/
  skills/          # Invocable skills (/start-session, /end-session, /create-tasks, /build-tasks, /adr, /init-project, /migrate-project)
  agents/          # Sub-agent definitions (implementer.MD, code-reviewer.MD)
  settings.local.json
docs/
  adr/             # Architecture Decision Records for this repo
PRD.md             # Template PRD users copy for their own projects
README.md          # User-facing docs and getting started guide
```

Each skill lives at `.claude/skills/<name>/skill.md`. Each agent lives at `.claude/agents/<name>.MD`.

## The Workflow This Repo Implements

The workflow centers on three project-level docs plus Beads task tracking:

- **PRD.md** — product requirements (source of truth, human-maintained)
- **CLAUDE.md** — agent instructions distilled from the PRD (agent-maintained)
- **plan.MD** — phases, active epic, current status (agent-maintained, one Current Status entry at a time)
- **`docs/adr/`** — Architecture Decision Records (agent-maintained via `/adr`)
- **`.beads/`** — task data (agent-maintained via `bd` CLI)

The session loop: `/start-session` → work or `/build-tasks` → `/end-session` → `/clear`.

## Agents

**`implementer`** — Implements one task from its spec. Reads CLAUDE.md first, gathers context from task `design` field, writes tests, commits with task ID in every message, reports deviations.

**`code-reviewer`** — Runs 8 parallel subagents (spec compliance, tests, linting, security, code quality, test quality, performance, simplification). Returns `APPROVED` or `NEEDS_CHANGES` with file:line references. Invoked by `/build-tasks` after every implementation; never skipped.

## Key Conventions

- **Agent model:** Never hardcode a model in agent or skill frontmatter — always use `model: inherit`.
- **Beads CLI:** All `bd` commands use `--json` for reliable parsing.
- **Commit format:** `git commit -m "<message> (<task-id>)"` — task ID in every commit.
- **Hook commands:** Both `SessionStart` and `PreCompact` hooks must use `bd prime --stealth` (not `bd prime` or `bd sync`).
- **plan.MD Current Status:** Only one entry ever exists — each session overwrites the last. No "What Remains" section (that's tasks).
- **CLAUDE.md target length:** Under 80 lines. Session history, progress tracking, and architecture decisions do NOT belong here.
- **`scratch.md` / `scratch.MD`:** Always in `.gitignore`. Never read by agents.

## Task Tracking

Task tracking is via bd. Run `bd ready` for next tasks.
Commits include the task ID: `git commit -m "<message> (<task-id>)"`

Skills: /start-session, /end-session, /create-tasks, /build-tasks, /adr
