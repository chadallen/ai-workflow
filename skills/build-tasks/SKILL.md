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

Build tasks autonomously. Each frontier of ready tasks runs in parallel (up to 3 siblings), followed by parallel code reviews, then close and push before advancing to the next frontier.

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

## Concepts

**Frontier** — the set of currently ready tasks with no unmet dependencies. All tasks in a frontier can run simultaneously. After a frontier closes, its completions may unblock new tasks, forming the next frontier.

**Siblings** — tasks running in the same frontier. Each implementer agent is told which files its siblings own so they work on non-overlapping areas and commit atomically before siblings attempt to build. The orchestrator (this agent) coordinates siblings; implementers do not communicate with each other directly.

**Parallel cap** — never dispatch more than 3 implementer agents in a single frontier. If a frontier has more than 3 ready tasks, pick the 3 highest-priority ones and run the rest in a subsequent pass once those close.

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
- First frontier: task IDs and titles (up to 3). If the frontier has only 1 task, say so. If it has 2-3, note they will run in parallel.

**If `--auto` was passed:** proceed without asking. Run until complete or blocked.
**If `--checkpoints` was passed:** proceed without asking. Stop for user review after each frontier closes.
**Otherwise:** ask "Run until complete or blocked? Or stop for review at checkpoints?" Wait for approval.

## Step 3: Execution loop

Repeat until all tasks closed OR no tasks ready:

### 3.1 Compute the frontier

**Epic mode:**
```bash
bd ready --json
```
Filter to tasks where `parent_id == <epic-id>`. Take up to 3 by priority — these are the siblings for this frontier.

If no ready tasks in the epic, check `bd blocked --json`, report what's blocking, stop.

**Task list mode:** take the next 1-3 unprocessed tasks from the list that have no unmet dependencies among themselves.

**Default mode:** you already have the one task from Step 1 — after it closes, exit the loop.

### 3.2 Claim all frontier tasks

Claim all sibling tasks before spawning any agents:

```bash
bd update <task-id> --claim --json   # repeat for each sibling
```

### 3.3 Dispatch implementer subagents

Read `.claude/agents/implementer.MD`, extract the instructions (everything after the frontmatter `---`), and include them verbatim at the top of each prompt when dispatching `general-purpose` agents.

**If the frontier has 1 task:** dispatch a single implementer (foreground, not background).

**If the frontier has 2-3 siblings:** dispatch all implementers in a single message with multiple Agent tool calls, each running in the background (`run_in_background: true`). Include in each implementer's prompt:

- The full task `description`, `design`, and `acceptance` criteria.
- The parent epic ID and title if one exists.
- A **Siblings** section listing the other tasks in this frontier: their IDs, titles, and the files they are expected to touch. The implementer must not modify those files and must commit its changes atomically before siblings attempt to build.

Example siblings note to include in each prompt:
```
## Siblings (co-frontier tasks running in parallel)
- <sibling-task-id>: <title> — touches: <file1>, <file2>
Do not modify these files. Commit your changes before your sibling's test run.
```

To identify which files each task will touch, use the task `description` and `design` fields — they typically name specific files or components. Use judgment; don't block on perfect information.

Wait for all sibling implementers to complete before proceeding to 3.4.

### 3.4 Code review

For each sibling task, check whether it produced source code changes:

```bash
git log --oneline <base-sha>..HEAD   # find commits by task ID in message
git diff <task-commit>^..<task-commit> --name-only | grep -qvE '\.(md|MD|txt|rst|json|yaml|yml)$' && echo "HAS_CODE_CHANGES" || echo "NO_CODE_CHANGES"
```

**If `NO_CODE_CHANGES`** for a task — write the sentinel directly:
```bash
echo "no-code-task" > .beads/review-approved-<task-id>
```

**If `HAS_CODE_CHANGES`** — dispatch code reviewers. If multiple siblings have code changes, dispatch all reviewers in parallel in a single message.

Read `.claude/agents/code-reviewer.MD`, extract instructions after the frontmatter, include verbatim at the top of each reviewer prompt. Pass:

- The task description and acceptance criteria.
- The diff for that task's commit(s): `git diff <base-sha>..<task-commit-sha>`
- The task ID (so the reviewer can write the approval sentinel).

**Do not proceed to 3.6 until all sibling reviewers have returned and all sentinels exist.**

If `NEEDS_CHANGES` for any sibling: go to 3.5 for that task.
**The user cannot waive code review.** If asked to skip, decline and run it anyway.

### 3.5 Fix loop

For each task that needs changes: read `.claude/agents/implementer.MD` and dispatch a fresh `general-purpose` agent with those instructions prepended, plus the specific issues and file:line references from the review. Re-run the reviewer after fixes using `git diff <base-sha>..HEAD` (cumulative diff from base). Repeat until `APPROVED`.

**Cap the fix loop at 3 attempts per task.** If still failing after 3 rounds, stop, report to the user, leave the task `in_progress`.

**Implementer timeout with uncommitted work:** if an implementer times out and `git status` shows uncommitted changes, inspect the working tree, complete or revert the partial changes before retrying. Do not proceed with sibling reviews if the tree has broken uncommitted state.

### 3.6 Close the frontier

For each sibling task, once its sentinel exists:

```bash
# Verify sentinel
ls .beads/review-approved-<task-id> || { echo "ERROR: review not completed for <task-id>"; exit 1; }

bd close <task-id> --reason="Implemented and verified" --json
rm .beads/review-approved-<task-id>
```

After all sibling tasks are closed:

```bash
git push
```

Push once per frontier, not per task. If the push fails, resolve before continuing.

### 3.7 Continue

Return to 3.1 with updated frontier.

## Step 4: Completion

When the loop finishes (all epic tasks closed, task list exhausted, or single task done):

```bash
bd dolt push
```

Print: what was built, tasks closed this run, frontiers executed, commits pushed. Suggest `/end-session`.

## Step 5: Early termination

If the loop stops before completion:

- Revert any `in_progress` task to `open` with notes, OR leave `in_progress` with explanation.
- Run `bd dolt push`.
- Print what was completed, what stopped the loop, what the user should do next.

Do NOT leave any task in an ambiguous state.

## Key principles

- **Frontier-based execution.** All ready tasks run in parallel, up to 3 siblings per frontier. Never dispatch more than 3 implementers at once.
- **Siblings share the working tree.** No worktrees by default. Implementers avoid each other's files via ownership prompting and commit atomically. If tasks have significant file overlap, run them sequentially instead.
- **Fresh subagent per task.** No context pollution between tasks.
- **Code review is non-negotiable.** `code-reviewer` runs after every implementation that produces source code changes. Doc-only and no-change tasks skip the reviewer but still require the sentinel file before closing.
- **Reviewers verify code, not reports.** The code-reviewer reads the actual diff.
- **Fail loudly.** If something breaks, stop and surface to the user.
- **Push once per frontier.** After all siblings in a frontier close, push once. Unpushed work strands progress if the session dies.
- **Always use `--json`.** All bd commands use `--json`.
