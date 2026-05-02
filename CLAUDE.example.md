# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

[TODO: One paragraph describing this project and its purpose, distilled from PRD.md]

## Stack

[TODO: Primary language(s), frameworks, and key dependencies]

## Commands

```bash
# Build
[TODO]

# Test
[TODO]

# Run
[TODO]
```

## Tests

**File location:** [TODO: where test files live — e.g., `__tests__/` directories alongside source, root-level `tests/`, colocated `*.test.ts` files, or `*Tests.swift` targets]
**Naming convention:** [TODO: e.g., `FooTests.swift`, `foo.test.ts`, `test_foo.py`]

## Key Conventions

[TODO: Naming rules, hard constraints, or patterns specific to this project. Remove this section if nothing notable applies.]

## Workflow

Three project-level docs plus Beads task tracking:

- **PRD.md** — product requirements (source of truth, human-maintained)
- **CLAUDE.md** — agent instructions distilled from the PRD (agent-maintained)
- **plan.MD** — phases, active epic, current status (agent-maintained)
- **`docs/adr/`** — Architecture Decision Records (agent-maintained via `/adr`)
- **`.beads/`** — task data (agent-maintained via `bd` CLI)

Session loop: `/start-session` → work or `/build-tasks` → `/end-session` → `/clear`.

## Agents

**`implementer`** — Implements one task from its spec. Reads CLAUDE.md first, gathers context from the task `design` field, writes tests, commits with task ID in every message.

**`code-reviewer`** — Runs 8 parallel subagents (spec compliance, tests, linting, security, code quality, test quality, performance, simplification). Returns `APPROVED` or `NEEDS_CHANGES`. Invoked by `/build-tasks` after every task; never skipped.

## Workflow Conventions

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
