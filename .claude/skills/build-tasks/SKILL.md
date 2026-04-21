---
name: build-tasks
description: Autonomously builds tasks using fresh subagents per task with comprehensive code review (tests, linting, security, performance, simplification) after each one. Accepts an epic ID, one or more task IDs, or no argument to build the next ready task.
when_to_use: Use when tasks are well-specified and can be implemented without real-time judgment. Trigger phrases: "build the epic", "run the tasks", "execute autonomously", "/build-tasks".
argument-hint: "[epic-id | task-id ...]"
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
/build-tasks <epic-id>              # build all tasks in an epic
/build-tasks <task-id> [<task-id>]  # build specific tasks
/build-tasks                        # build the next ready task
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

Ask: "Run until complete or blocked? Or stop for review at checkpoints?" Wait for approval.

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

Spawn a fresh general-purpose subagent with:

- The full task `description` field (from `bd show <task-id> --json`).
- The task `design` field.
- The task `acceptance` criteria.
- The parent epic ID and title if one exists (check `parent_id` in the task).

Instructions for the subagent:

- Read CLAUDE.md before starting.
- Implement exactly as specified in the description.
- The `design` field contains the architectural context relevant to this task — read it carefully before writing any code.
- If you need broader context beyond the design field (e.g., a judgment call about an architectural pattern) and the task has a parent epic, run `bd show <epic-id> --json` to read the epic's description.
- If you REALLY NEED need broader context, you can read plan.MD and PRD.md, but try to LIMIT reading to the RELEVANT sections — you don't want to get lost in unrelated details.
- Write tests for any non-trivial logic you implement, even if the task spec doesn't explicitly say to. Check CLAUDE.md for the test command — if no test setup exists in the project at all, note it and skip. Otherwise, default to writing tests.
- Commit frequently with the task ID in parens: `git commit -m "<message> (<task-id>)"`.
- If any step is ambiguous or blocked, stop and report — do NOT guess.
- Run tests and confirm they pass before reporting back.
- Report: files changed, tests added, any deviations from the spec.

### 3.4 Code review

Dispatch the `code-reviewer` subagent (defined in `.claude/agents/code-reviewer.MD`). Pass:

- The task description and acceptance criteria.
- The diff: `git diff <base-sha>..HEAD`

The `code-reviewer` runs parallel agents covering: spec compliance, tests, linting, security, quality, test quality, performance, and simplification. It returns a verdict of `APPROVED` or `NEEDS_CHANGES` with specifics.

If `NEEDS_CHANGES`: go to 3.5.

### 3.5 Fix loop

Dispatch a fresh fix subagent with:

- The specific issues from the code review.
- File:line references.
- Instructions to address only those issues, commit, and report back.

Re-run `code-reviewer`. Repeat until `APPROVED`.

**Cap the fix loop at 3 attempts per task.** If a task still fails after 3 rounds, stop the executor, report to the user, and leave the task `in_progress`.

### 3.6 Close the task

```bash
bd close <task-id> --reason="Implemented and verified" --json
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
- **Code review is non-negotiable.** `code-reviewer` runs after every implementation.
- **Reviewers verify code, not reports.** The code-reviewer reads the actual diff.
- **Fail loudly.** If something breaks, stop and surface to the user.
- **Push after each task.** Unpushed work strands progress if the session dies.
- **Always use `--json`.** All bd commands use `--json`.
