---
name: end-session
description: End-of-session cleanup including beads issue management, documentation updates, and mandatory push to remote. Use whenever the user says "end session", "wrap up", "done for now", "let's stop here", "close out", "land the plane", or types /end-session.
---

# End Session

Run this procedure exactly. Do NOT write any project code during this procedure. The session is NOT done until the final `git push` and `bd dolt push` succeed.

## Step 1: Close completed beads issues

For each task completed this session:

- Verify the work is actually done (tests pass, acceptance criteria met).
- Close: `bd close <task-id> --reason="<brief summary>" --json`

For tasks started but not finished:

- Update with progress notes: `bd update <task-id> --description="<updated with what's done, what's next>" --json`
- Either leave status as `in_progress` (resume next session) or change back to `open` (let someone else take it).

Never leave a task `in_progress` just because the session ended without deciding.

## Step 2: Check for orphans

Run `bd doctor` to detect orphaned issues — work committed but not closed.

Note: `bd doctor` is not supported in embedded mode (the default). If it prints "not yet supported in embedded mode", skip this step — no action needed.

For any orphans found:

- If actually done, close it.
- If work is incomplete, file a follow-up task with `bd create`.

## Step 3: Commit session work

- Stage and commit uncommitted work. Include issue IDs: `"<message> (<task-id>)"`.
- If `scratch.md` exists (any casing), ensure it's in `.gitignore`. Do NOT read it.
- Don't push yet — we'll do one push at the end.

## Step 4: Read project docs

Read CLAUDE.md, PRD.md, and plan.MD in full.

## Step 5: Update CLAUDE.md (if needed)

Update only if this session changed project-level rules, conventions, tooling, or dependencies.

CLAUDE.md must not contain progress tracking, session history, or task lists — those live in plan.MD and beads.

If nothing changed, leave it alone.

## Step 6: Update and prune PRD.md (if needed)

Update only if product requirements or acceptance criteria changed.

Prune completed specs — detailed schemas, API contracts, or layout definitions for features that are fully built and tested become dead weight once the code is the source of truth. Replace with one-line pointers to source files.

If nothing changed, leave it alone.

## Step 7: Update plan.MD

plan.MD has three sections in the beads workflow:

**Overall Plan** — The high-level phase/epic roadmap. Which epic is active. What's next after the current one. Update only if the plan itself changed.

**Current Status** — What was accomplished this session. Be specific: features shipped, bugs fixed, decisions made, beads tasks closed (with IDs). Include the date.

**Known Issues / Blockers** — Anything unresolved that isn't already a beads task: blocked-on-user decisions, manual testing needed, environment issues, open design questions.

plan.MD should NOT contain a "What Remains" section — that's beads now.

**Prune session history.** Keep at most 3 recent entries in Current Status. Before removing older entries, check for decisions or rationale not captured elsewhere — migrate anything important to Overall Plan or Known Issues.

## Step 8: Check for ADR-worthy decisions

Review what happened this session. Did any decisions meet the ADR criteria?

- A choice between multiple viable options where alternatives were considered.
- Affects how future code will be structured.
- Non-trivial to reverse.
- The "why" isn't obvious from the code.

If yes, invoke `/adr` for each one — propose the title and summary, write on approval. If nothing qualifies, move on.

## Step 9: Consistency check

Re-read all three files. Verify:

- plan.MD doesn't contradict PRD.md.
- CLAUDE.md has no stale tool/pattern references.
- Beads state aligns with plan.MD's claimed progress.
- plan.MD has no "What Remains" list.
- No more than 3 session entries in Current Status.

## Step 10: Commit docs

Commit: `docs: end-of-session update — <brief summary>`. Include any task IDs closed this session.

## Step 11: Land the plane

**This step is non-negotiable. The session is not complete until both pushes succeed.**

1. `git pull --rebase` — pull any remote changes first.
2. `git push` — push everything.
3. `git status` — must show "up to date with origin/<branch>".
4. `bd dolt push` — sync beads data to remote. (`bd sync` does not exist — use `bd dolt push`.)
5. If any step fails, resolve the issue and retry. Do not give up.

Do NOT end the session with unpushed work. Do NOT tell the user "ready to push when you are." Push it yourself.

## Step 12: Session summary

Print for the user:

- What was accomplished (2-3 sentences).
- Beads tasks closed this session (with IDs).
- Top priority for next session (reference the next ready task by ID).
- Any items needing user attention (manual testing, decisions, external dependencies).
- Confirmation that everything is pushed and the working tree is clean.