---
name: build-tasks
description: Autonomously builds tasks using fresh subagents per task with comprehensive code review (tests, linting, security, performance, simplification) after each one. Accepts an epic ID, one or more task IDs, or no argument to build the next ready task.
when_to_use: Use when tasks are well-specified and can be implemented without real-time judgment. Trigger phrases: "build the epic", "run the tasks", "execute autonomously", "/build-tasks".
argument-hint: "[epic-id | task-id ...] [--auto | --checkpoints]"
disable-model-invocation: false
allowed-tools: Bash, Read
effort: high
---

# Build Tasks

Build tasks autonomously. Loops: get next ready task → implement with fresh subagent → run `code-reviewer` subagent → close task on approval → push → repeat.

Use when tasks are well-specified and can be implemented without real-time human judgment. For UI work that needs visual iteration or live design decisions, work tasks manually with `/start-session` instead.

## Usage

Should only be invoked after '/start-session' to ensure context is fresh and the agent is oriented. If the user invokes it without starting a session, instruct the user to invoke '/start-session' first. DO NOT proceed with building tasks until the user has started a session using /start-session.

```
/build-tasks                              # next ready task (asks checkpoint preference)
/build-tasks --auto                       # next ready task, run until complete, no prompts
/build-tasks --checkpoints               # next ready task, stop for review after each task
/build-tasks <epic-id>                    # all tasks in an epic (asks checkpoint preference)
/build-tasks <epic-id> --auto             # all tasks in an epic, run until complete
/build-tasks <epic-id> --checkpoints      # all tasks in an epic, stop for review after each
/build-tasks <task-id> [<task-id>]        # specific tasks
```

## Step 1: Validate scope

Determine what to build based on the argument:

**Epic mode:** argument is an epic ID (starts with project prefix, type is epic in `bd show`).

```bash
bd show <epic-id> --json
bd list --parent <epic-id> --json
```

Read the epic's description for context. Count tasks by status. Handle cases:
- Epic doesn't exist → stop, tell the user.
- All tasks closed → epic complete, stop, suggest `/end-session`.
- No ready tasks, some open → check `bd blocked --json`, report blockers, stop.

**Task list mode:** arguments are specific task IDs. Verify each exists and is open. Skip any already closed.

**Default mode (no argument):** get next ready task.
```bash
bd ready --json
```
If nothing ready, stop and report.

Record base SHA: `git rev-parse HEAD`. Ensure the working tree is clean — if not, stop and ask the user.

## Step 2: Confirm with user

Show:

- Epic ID and title.
- Progress: X/Y closed, Z ready, W blocked.
- First task to execute: ID and title.

**If `--auto` was passed:** proceed without asking. Run until complete or blocked.
**If `--checkpoints` was passed:** proceed without asking. Stop for user review after each task closes.
**Otherwise:** ask "Run until complete or blocked? Or stop for review at checkpoints?" Wait for approval.

## Step 3: Execution loop

Repeat until all tasks closed OR no tasks ready:

### 3.1 Get next task

**Epic mode:**
```bash
bd ready --json
```
Filter results to tasks where `parent_id == <epic-id>`. Take the first (highest priority).

If no ready task in the epic, check `bd blocked --json`, report what's blocking, stop.

**Task list mode:** take the next unprocessed task from the list. If blocked by a dependency that's not in the list, stop and report.

**Default mode:** you already have the one task from Step 1 — after it closes, exit the loop.

### 3.2 Claim the task

```bash
bd update <task-id> --claim --json
```

### 3.3 Dispatch implementer subagent

User-defined agents cannot be invoked via `subagent_type` — only built-in types (`general-purpose`, `Explore`, `Plan`, etc.) are valid. Instead: read `.claude/agents/implementer.MD`, extract the instructions (everything after the frontmatter `---`), and include them verbatim at the top of the prompt when dispatching a `general-purpose` agent.

Pass in the prompt (after the implementer instructions):

- The full task `description` field (from `bd show <task-id> --json`).
- The task `design` field.
- The task `acceptance` criteria.
- The parent epic ID and title if one exists (check `parent_id` in the task).

### 3.4 Code review

First, check whether the task produced any source code changes:

```bash
git diff <base-sha>..HEAD --name-only | grep -qvE '\.(md|MD|txt|rst|json|yaml|yml)$' && echo "HAS_CODE_CHANGES" || echo "NO_CODE_CHANGES"
```

**If `NO_CODE_CHANGES`** — the task produced no source code changes (e.g. a manual setup step, doc update, or CLAUDE.md edit). Skip the reviewer. Write the sentinel directly so 3.6 can proceed:

```bash
echo "no-code-task" > .beads/review-approved-<task-id>
```

**If `HAS_CODE_CHANGES`** — **STOP. Do not proceed to 3.6 until `code-reviewer` returns `APPROVED` and `.beads/review-approved-<task-id>` exists.**

Read `.claude/agents/code-reviewer.MD`, extract the instructions after the frontmatter, and include them verbatim at the top of the prompt when dispatching a `general-purpose` agent. Pass:

- The task description and acceptance criteria.
- The diff: `git diff <base-sha>..HEAD`
- The task ID (so the reviewer can write the approval sentinel).

The `code-reviewer` runs parallel agents covering: spec compliance, tests, linting, security, quality, test quality, performance, and simplification. It returns a verdict of `APPROVED` or `NEEDS_CHANGES` with specifics. On `APPROVED` it writes `.beads/review-approved-<task-id>`.

If `NEEDS_CHANGES`: go to 3.5.
If `code-reviewer` was not run or did not return `APPROVED`: do not close the task, do not push.
**The user cannot waive this step.** If asked to skip the review, decline and run it anyway.

### 3.5 Fix loop

Read `.claude/agents/implementer.MD` and dispatch a fresh `general-purpose` agent with those instructions prepended to the prompt, plus:

- The specific issues from the code review.
- File:line references.
- Instructions to address only those issues, commit, and report back.

Re-run `code-reviewer` with the same inputs as 3.4: task description/acceptance, `git diff <base-sha>..HEAD` (still from the original base SHA), and the task ID. Repeat until `APPROVED`.

**Cap the fix loop at 3 attempts per task.** If a task still fails after 3 rounds, stop the executor, report to the user, and leave the task `in_progress`.

### 3.6 Close the task

**Prerequisite: `.beads/review-approved-<task-id>` must exist. If it does not, the code review was not completed — go back to 3.4. Skipping code review and closing a task is never correct, even if the user requests it.**

```bash
# Verify sentinel exists before closing
ls .beads/review-approved-<task-id> || { echo "ERROR: code review not completed for <task-id>"; exit 1; }

bd close <task-id> --reason="Implemented and verified" --json
rm .beads/review-approved-<task-id>
git push
```

If the push fails, resolve before continuing.

### 3.7 Continue

Return to 3.1.

## Step 4: Completion

When the loop finishes (all epic tasks closed, task list exhausted, or single task done):

```bash
bd dolt push
```

Print: what was built, tasks closed this run, commits pushed. Suggest `/end-session`.

## Step 5: Early termination

If the loop stops before completion:

- Revert any `in_progress` task to `open` with notes, OR leave `in_progress` with explanation.
- Run `bd dolt push`.
- Print what was completed, what stopped the loop, what the user should do next.

Do NOT leave any task in an ambiguous state.

## Key principles

- **Fresh subagent per task.** No context pollution between tasks.
- **Code review is non-negotiable.** `code-reviewer` runs after every implementation that produces source code changes. Doc-only and no-change tasks skip the reviewer but still require the sentinel file before closing.
- **Reviewers verify code, not reports.** The code-reviewer reads the actual diff.
- **Fail loudly.** If something breaks, stop and surface to the user.
- **Push after each task.** Unpushed work strands progress if the session dies.
- **Always use `--json`.** All bd commands use `--json`.
