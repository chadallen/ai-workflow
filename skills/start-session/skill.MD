---
name: start-session
description: Start-of-session orientation for projects using beads for task tracking. Reads CLAUDE.md, PRD.md, plan.MD, and beads state to propose a session plan. Use whenever the user says "start session", "let's get started", "pick up where we left off", "new session", "what's next", or types /start-session.
---

# Start Session

Run this procedure exactly. Do NOT write any code or make any changes until the user explicitly approves the plan.

If `bd setup claude` has been run on this project, beads context is already injected at session start by the SessionStart hook (`bd prime`). You can build on that context — don't duplicate it.

## Step 1: Check project state

Run `git status` and `git log --oneline -5`.

- If the working tree is dirty, stop and tell the user. Don't proceed until they decide what to do with the uncommitted work.
- Note the current branch.
- The most recent commit message often summarizes what happened last session.

## Step 2: Read project docs

CLAUDE.md is already auto-loaded. Read:

- **plan.MD** — Session history and active epic. Read in full.
- **PRD.md** — Product requirements. Read in full.

If plan.MD doesn't exist, stop. This project hasn't been set up for this workflow yet — suggest running `/migrate-to-beads`.

## Step 3: Scan for missing ADRs

If `docs/adr/` exists, quickly review plan.MD's recent Current Status entries. If any session mentions an architectural decision that doesn't have a corresponding ADR, note it. Don't create it now — mention it in the session plan (Step 5) so the user can decide whether to record it before starting new work.

## Step 4: Check beads state

If `bd prime` already ran via hook, you have most of this. Otherwise run:

- `bd ready --json` — next ready tasks
- `bd blocked --json` — blocked tasks
- If plan.MD notes an active epic, run `bd list --parent <epic-id> --json` to see all tasks in the epic and their status

If `.beads/` doesn't exist, stop. Suggest running `/migrate-to-beads`.

## Step 5: Present the session plan

Print for the user:

1. **Last session recap** — 2-3 sentences from plan.MD's most recent Current Status entry.
2. **Active epic status** — If there's an active epic noted in plan.MD: count of open/in_progress/closed tasks. Example: "`enzo-12` (Phase 6): 2 closed, 1 in progress, 4 open."
3. **Next ready task(s)** — Top 1-3 tasks from `bd ready`, each with ID and title.
4. **Proposed focus** — What you recommend working on this session. Default to the highest-priority ready task. If the remaining tasks in the active epic are well-specified, mention that `/epic-executor <epic-id>` could run them autonomously.
5. **Missing ADRs** — If Step 3 found any undocumented architectural decisions from recent sessions, list them here. Offer to create them before starting new work.
6. **Blockers or questions** — Anything from plan.MD's Known Issues, from `bd blocked`, or anything ambiguous where you want clarification before starting.
7. **Estimated scope** — Rough sense of how much fits in this session.

## Step 6: Wait

Do NOT proceed until the user approves the plan, modifies it, or gives a different direction. Do not write code until you have explicit approval.

Once approved:

- Claim the task: `bd update <task-id> --claim --json`
- Begin work.
- Commit frequently with the issue ID in parens: `git commit -m "Add X (<task-id>)"`. This enables orphan detection at session end.