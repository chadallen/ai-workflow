---
name: migrate-project
description: Sets up the three-file plus beads workflow on any project. Detects what already exists and skips it — works on greenfield projects, partially set up projects, and projects with existing docs. One-time setup per project.
disable-model-invocation: true
allowed-tools: Bash, Read, Write
---

# Migrate

Sets up the complete workflow on any project: CLAUDE.md, PRD.md, plan.MD, docs/adr/, docs/plans/, beads, and Claude Code hooks. Detects what already exists and skips it. Constructs what's missing.

Do NOT write any application code during this migration.

---

## Step 1: Cost warning and inventory

**If docs are sparse or missing, warn the user:**

> This migration may consume significant tokens if documentation is sparse — I'll need to read code to infer the project's architecture, conventions, and current state. If you have existing planning docs or can describe the project and current status briefly, that's much cheaper than reading code.

Then ask:
1. Do you have any existing planning or spec documents? (README, design docs, specs — list paths if yes)
2. Can you briefly describe what the project is, what's built, and what's planned next?
3. How large is the codebase? (rough file count or small/medium/large)

Wait for answers before reading any code. A verbal description from the user is almost always cheaper than reading files.

**Inventory what exists:**

Check for each of the following and note present/missing:

- `CLAUDE.md` (or `Claude.MD`)
- `PRD.md` (or `PRD.MD`)
- `plan.MD` (or `plan.md`)
- `docs/adr/` directory
- `docs/plans/` directory
- `.beads/` directory
- `.claude/` settings with beads hooks

If everything exists and beads is initialized, this project may already be migrated. Confirm with the user before proceeding.

---

## Step 2: Verify prerequisites

- `bd version` — beads must be installed. If not, stop and tell the user to install it first.
- `git status` — must be in a git repo. If not, stop.
- Working tree should be clean. If not, stop and ask the user what to do with uncommitted work.

---

## Step 3: Build CLAUDE.md (if missing)

If CLAUDE.md exists, read it. Check for content that doesn't belong — progress tracking, build status, session history — and migrate it to plan.MD (Step 5), then remove it from CLAUDE.md.

If CLAUDE.md doesn't exist, construct it from available sources: existing README, package files (package.json, go.mod, Cargo.toml, pyproject.toml, etc.), and user description. Read code only if necessary and only after asking.

CLAUDE.md must contain:
- Project description (1 paragraph)
- Stack and key dependencies
- Build, test, and run commands
- Project structure overview
- Coding conventions and patterns (infer from existing code if needed)
- Secrets and environment variable policy
- Standing behavioral instructions for the agent:
  - Wait for approval before writing code
  - Commit frequently with task IDs in parens: `git commit -m "<message> (<task-id>)"`
  - Prompt the user when manual testing or decisions are needed
  - Do not read scratch.md

Add beads task tracking reference:

```
## Task tracking

This project uses beads. Run `bd ready` for next tasks.
Skills: /start-session, /end-session, /create-beads, /build-beads, /adr
```

CLAUDE.md must NOT contain progress tracking, session history, or implementation specs.

---

## Step 4: Build PRD.md (if missing or needs pruning)

If PRD.md exists, read it. Prune completed specs — detailed schemas, API contracts, layout definitions for features that are fully built become dead weight. Replace with one-line pointers to the relevant source files. Keep high-level feature descriptions, acceptance criteria, and product vision even for completed features.

**Context budget guideline:** PRD.md should be under 500 lines. If significantly over, prune aggressively.

If PRD.md doesn't exist, construct it from README, existing docs, and user description. Include:
- Product vision and goals
- Features that exist today (high-level)
- Features planned but not built (with more detail)
- Design principles

PRD.md must NOT contain build progress, session history, or project rules.

---

## Step 5: Build plan.MD (if missing)

If plan.MD exists and already has the correct structure (Overall Plan, Current Status, Known Issues), leave it alone unless it contains a "What Remains" section — that moves to beads.

If plan.MD doesn't exist, or has stale structure (e.g., contains handoff notes, kickoff prompts, or a "What Remains" task list), construct it:

**Overall Plan** — High-level phase or milestone roadmap. Extract from existing docs. Reference active epic by ID once beads is set up (Step 7). Include design doc path convention: `docs/plans/YYYY-MM-DD-<topic>-design.md`.

**Current Status** — One entry dated today: "Migrated to three-file plus beads workflow. Project state at migration: [brief summary of what's built vs what's planned]."

**Known Issues / Blockers** — Anything the user mentioned that's unresolved and doesn't fit as a beads task.

plan.MD must NOT contain a "What Remains" task list — that's beads.

---

## Step 6: Create docs/adr/ and generate initial ADRs

Create `docs/adr/` if it doesn't exist.

Scan CLAUDE.md, PRD.md, existing docs, and any ARCHITECTURE.md or DESIGN.md type files for past architectural decisions that meet ADR criteria:

- A choice between multiple viable options where alternatives were actually considered
- Affects how future code will be structured
- Non-trivial to reverse
- The "why" wouldn't be obvious from reading the code alone

Propose a batch of ADR titles — show the list, let the user approve/reject/modify. Then invoke `/adr` for each approved one.

Common sources for Enzo-style projects: tech stack choices, data model decisions, authentication approach, third-party service choices, deprecated features.

If no ADR-worthy decisions are found, create the `docs/adr/` directory and note it's empty.

---

## Step 7: Create docs/plans/

Create `docs/plans/` if it doesn't exist. No content needed yet — design docs are created by `/create-beads` when features are planned.

---

## Step 8: Initialize beads

If `.beads/` doesn't exist:

```bash
bd init --quiet
```

Note: `bd init` automatically creates its own git commit (`bd init: initialize beads issue tracking`). This is expected — the migration will land as two commits rather than one.

Install Claude Code hooks:

```bash
bd setup claude
bd setup claude --check
```

This installs:
- `SessionStart` → `bd prime` (injects task context at session start)
- `PreCompact` → `bd sync` (saves beads state before context compaction)

**Verify the PreCompact hook explicitly** — `bd setup claude` sometimes leaves a pre-existing `PreCompact` hook unchanged. Check `.claude/settings.json` and confirm `PreCompact` runs `bd sync`, not `bd prime`. Fix manually if wrong.

Ask the user:
> Install beads git hooks for automatic sync? (pre-commit, post-merge)

If yes: `bd hooks install`

---

## Step 9: Propose initial epic structure

Based on plan.MD's Overall Plan and any "What Remains" content found during migration, propose beads epics for unbuilt work:

- One epic per phase or major feature area
- Tasks within each epic with inferred dependencies
- Only for work that is genuinely unbuilt

Show the proposed structure and wait for approval before creating anything in beads. If the user has nothing planned yet or the project is fully caught up, skip this step — they can use `/create-beads` when ready.

For each approved epic and task:

```bash
bd create "<Epic Title>" -t epic -p 1 --description="<scope and goal>" --json
bd create "<Task Title>" -t task -p 1 \
  --parent <epic-id> \
  --description="<implementation detail>" \
  --design="<context from PRD.md>" \
  --acceptance="<verifiable criteria>" \
  --notes="Migrated from plan.MD" \
  --json
bd dep add <dependent> <dependency>
```

---

## Step 10: Handle stale or redundant docs

For each existing doc that's now redundant (handoff.md, prompt.txt, kickoff-prompt.md, etc.):
- Ask the user before deleting — some may have historical value
- If the user agrees it's stale: delete it

For docs that don't fit the three-file system but are still useful (ARCHITECTURE.md, BROWSER_RESEARCH.md, runbooks):
- Suggest moving to `docs/` so they don't clutter the repo root
- Don't auto-move — ask first

Add `scratch.md` to `.gitignore` if not already there.

---

## Step 11: Commit and push

```bash
git add .beads/ .claude/ docs/ CLAUDE.md PRD.md plan.MD .gitignore
git commit -m "chore: migrate to planning docs + ADR + beads workflow"
git push
bd dolt push
```

---

## Step 12: Summary

Print:

- What was created vs what already existed (per file/directory)
- ADRs created (count and titles)
- Epics and tasks created (count)
- Stale files deleted or moved
- Any `TODO:` markers left in new docs that need user input
- Next steps:
  - `/start-session` to begin working
  - `/create-beads` when ready to plan the next feature
  - `/build-beads <epic-id>` to autonomously execute an existing epic

---

## Key principles

- **Detect before building.** Read what exists before constructing anything. Never overwrite existing docs without confirming with the user.
- **Ask early, ask often.** This migration makes consequential decisions about project structure. Get input rather than guessing.
- **Verbal beats code-reading.** Always prefer asking the user to describe something over reading code to infer it.
- **Better sparse than wrong.** Use `TODO:` markers rather than hallucinating project details.
- **Don't delete without asking.** Existing docs may have meaning even if they're redundant.
- **Two commits is normal.** `bd init` auto-commits its own initialization. The migration lands as two commits: the `bd init` commit and the main migration commit. This is expected.