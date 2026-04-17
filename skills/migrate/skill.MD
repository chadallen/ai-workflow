---
name: migrate
description: Convert a project using the three-file documentation system (CLAUDE.md, PRD.md, plan.MD) to use beads for task tracking. One-time migration. Use when the user says "migrate to beads", "set up beads on this project", "convert this to beads workflow", or types /migrate-to-beads.
---

# Migrate to Beads

One-time migration that moves a project from markdown-only task tracking to beads-based task tracking. After this runs, plan.MD's "What Remains" content is managed by beads, and `/start-session`, `/end-session`, `/plan-to-epic`, and `/epic-executor` become functional.

Do NOT write any application code during this migration.

## Step 1: Verify prerequisites

Check:

- `beads` is installed: run `bd version`. If not, stop — the user needs to install it first.
- Repo has CLAUDE.md, PRD.md, and plan.MD (any casing variant). If not, stop — this project isn't on the three-file system yet.

## Step 2: Read current state

Read CLAUDE.md, PRD.md, and plan.MD in full. From plan.MD, focus on:

- "What Remains" section (the task list to migrate).
- "Overall Plan" section (identifies active phase or milestone).
- Any tasks already in progress or blocked.

From PRD.md, note any dependencies or sequencing info that informs task dependencies.

## Step 3: Initialize beads

If `.beads/` doesn't exist:

```
bd init --quiet
```

Beads will use a default prefix (typically `bd`). If the user wants a project-specific prefix (e.g., `enzo-1` instead of `bd-1`), they can configure it after init via `bd config`.

## Step 4: Install Claude Code integration

```
bd setup claude
```

This installs two hooks:
- `SessionStart` → runs `bd prime` (injects ~1-2k tokens of beads context at session start)
- `PreCompact` → runs `bd sync` (saves work to git before context compaction)

Verify: `bd setup claude --check`

## Step 5: Propose epic structure

Analyze plan.MD and propose:

- One epic per active phase/milestone from Overall Plan.
- Tasks derived from What Remains, grouped by epic.
- Inferred dependencies based on file overlap or explicit ordering.

Show the user the proposed structure. Example:

```
Proposed epics:
- Phase 6 — Strava OAuth (3 tasks)
- Phase 7 — Historical sync Phase 1 (5 tasks)

Phase 6 tasks:
  1. Set up OAuth credential flow [depends on: none]
  2. Handle token refresh [depends on: 1]
  3. Store tokens in Keychain [depends on: 1]

Phase 7 tasks:
  ...

Proceed with this structure?
```

Wait for approval. Iterate if the user wants changes.

## Step 6: Create epics and tasks

For each approved epic:

```
bd create "<Epic Title>" -t epic -p 1 \
  --description="<goal and scope>" \
  --json
```

Capture the returned epic ID.

For each task within the epic, populate the four built-in fields:

- **`--description`**: Mechanics — files to modify, implementation steps, test requirements. Extract from plan.MD and PRD.md.
- **`--design`**: Relevant context from PRD.md. Architecture decisions affecting this task.
- **`--acceptance`**: Verifiable outcomes (tests pass, feature works as specified, commit with task ID).
- **`--notes`**: Source references, e.g., "Migrated from plan.MD section 'What Remains'".

```
bd create "<Task Title>" -t task -p 1 \
  --parent <epic-id> \
  --description="<full implementation detail>" \
  --design="<context from PRD.md>" \
  --acceptance="<verifiable criteria>" \
  --notes="Migrated from plan.MD" \
  --json
```

For long descriptions with special characters, write to a temp file first and use `--description="$(cat /tmp/desc.md)"`.

Add dependencies:

```
bd dep add <dependent-task-id> <dependency-task-id>
```

## Step 7: Rewrite plan.MD

Remove the "What Remains" section entirely. plan.MD now has three sections only:

- **Overall Plan** — Reference active epic(s) by ID. High-level roadmap across epics.
- **Current Status** — Keep the most recent session entries (max 3).
- **Known Issues / Blockers** — Keep unresolved items that aren't suitable as beads tasks (decisions needed, manual testing, etc.).

Add a note near the top:

```
**Task tracking:** This project uses beads. Run `bd ready` for next tasks. Active epic: <epic-id>.
```

## Step 8: Update CLAUDE.md

Add a short section:

```
## Task tracking

This project uses beads for task management.
- Next ready task: `bd ready --json`
- Show task details: `bd show <task-id> --json`
- Claim a task: `bd update <task-id> --claim --json`
- Close a task: `bd close <task-id> --reason="..." --json`
- Sync to git: `bd sync` (run at session end)
- Commit with task ID: `git commit -m "<message> (<task-id>)"` — enables orphan detection via `bd doctor`

Workflow skills: /start-session, /end-session, /plan-to-epic, /epic-executor
```

If CLAUDE.md already has a "standing instructions" section, add: "Always include task ID in parens in commit messages."

## Step 9: Generate ADRs for existing decisions

Scan CLAUDE.md, PRD.md, and plan.MD for past architectural decisions that meet the ADR criteria (choice between viable options, affects future code structure, non-trivial to reverse, "why" not obvious from code).

Create `docs/adr/` if it doesn't exist.

Propose a batch of ADR titles — show the list and let the user approve/reject/modify. Then invoke `/adr` for each approved one.

Common places to find existing decisions:

- PRD.md "design principles" or "tech stack" sections (why this stack over alternatives).
- CLAUDE.md "key technical decisions" sections.
- plan.MD session entries that mention choosing between options.
- Any existing ARCHITECTURE.md, DESIGN.md, or BROWSER_RESEARCH.md type docs.

If no ADR-worthy decisions are found, skip this step.

## Step 10: Update PRD.md if needed

PRD.md usually doesn't need changes — it remains the product spec. But if PRD.md has any "next steps", "TODO", or implementation roadmap sections, remove them (that's beads now).

## Step 11: Offer to install git hooks

Ask the user:

```
Install beads git hooks for automatic sync with git operations?
This installs pre-commit (syncs beads data) and post-merge (pulls remote beads changes).
```

If yes:

```
bd hooks install
```

Some users prefer manual control. Default to asking.

## Step 12: Commit and push

```
git add .beads/ .claude/ docs/adr/ CLAUDE.md PRD.md plan.MD
git commit -m "chore: migrate to beads-based task tracking"
git push
bd sync
```

## Step 13: Summary

Print for the user:

- Epics created (count and IDs).
- Tasks created (count per epic).
- ADRs created (count and titles).
- plan.MD changes (what was removed).
- CLAUDE.md changes (what was added).
- Hooks installed: SessionStart, PreCompact (and pre-commit/post-merge if user chose to install).
- Next steps:
  - `/start-session` to begin a session with beads (the SessionStart hook will auto-inject beads context).
  - `/epic-executor <epic-id>` to autonomously execute the active epic if tasks are well-specified.

## Key principles

- **Ask before creating.** This migration is a significant change. Confirm epic and task structure before running bd commands.
- **Preserve source context in task `--notes`.** Tasks should trace back to the docs they came from.
- **Don't delete session history.** Recent plan.MD session entries stay (up to the 3-entry limit).
- **Single commit at the end.** The migration lands as one logical change.
- **Run `bd sync` after the git push.** This ensures the beads database is also pushed.