---
name: epic-executor
description: Autonomously execute all tasks in a beads epic using fresh subagents per task with two-stage review (spec compliance + code quality). Resumable across sessions. Invoked by the user to run a beads epic to completion.
disable-model-invocation: true
allowed-tools: Bash, Read
---

# Epic Executor

Execute all tasks in a beads epic autonomously. Loops: get next ready task → implement with fresh subagent → run `code-reviewer` subagent → close task on approval → push → repeat.

Use when tasks are well-specified and can be implemented without real-time human judgment. For UI work that needs visual iteration or live design decisions, work tasks manually with `/start-session` instead.

## Usage

```
/epic-executor <epic-id>
```

## Step 1: Validate the epic

```bash
bd show <epic-id> --json
bd list --parent <epic-id> --json
```

Read the epic's description — it contains the full design doc. Note the design doc path (also in plan.MD) for reference. Count tasks by status. Handle cases:

- Epic doesn't exist → stop, tell the user.
- All tasks closed → epic complete, stop, suggest `/end-session`.
- No ready tasks, some open → check `bd blocked --json`, report blockers, stop.

Record base SHA: `git rev-parse HEAD`. Ensure the working tree is clean — if not, stop and ask the user.

## Step 2: Confirm with user

Show:

- Epic ID and title.
- Progress: X/Y closed, Z ready, W blocked.
- First task to execute: ID and title.

Ask: "Run until complete or blocked? Or stop for review at checkpoints?" Wait for approval.

## Step 3: Execution loop

Repeat until all tasks closed OR no tasks ready:

### 3.1 Get next ready task

```bash
bd ready --json
```

Filter results to tasks where `parent_id == <epic-id>`. Take the first (highest priority).

If no ready task in the epic, check `bd blocked --json`, report what's blocking, stop.

### 3.2 Claim the task

```bash
bd update <task-id> --claim --json
```

### 3.3 Dispatch implementer subagent

Spawn a fresh general-purpose subagent with:

- The full task `description` field (from `bd show <task-id> --json`).
- The task `design` field.
- The task `acceptance` criteria.
- The epic ID and title.

Instructions for the subagent:

- Read CLAUDE.md before starting.
- Implement exactly as specified in the description.
- The `design` field contains the architectural context relevant to this task — read it carefully before writing any code.
- If you need broader context beyond the design field (e.g., a judgment call about an architectural pattern), run `bd show <epic-id> --json` to read the full design doc embedded in the epic description.
- Write tests as specified.
- Commit frequently with the task ID in parens: `git commit -m "<message> (<task-id>)"`.
- If any step is ambiguous or blocked, stop and report — do NOT guess.
- Run tests and confirm they pass before reporting back.
- Report: files changed, tests added, any deviations from the spec.

### 3.4 Code review

Dispatch the `code-reviewer` subagent (defined in `.claude/agents/code-reviewer.md`). Pass:

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

## Step 4: Epic completion

When all tasks in the epic are closed:

```bash
bd sync
```

Print: epic complete, tasks closed this run, commits pushed. Suggest `/end-session`.

## Step 5: Early termination

If the loop stops before completion:

- Revert any `in_progress` task to `open` with notes, OR leave `in_progress` with explanation.
- Run `bd sync`.
- Print what was completed, what stopped the loop, what the user should do next.

Do NOT leave any task in an ambiguous state.

## Key principles

- **Fresh subagent per task.** No context pollution between tasks.
- **Code review is non-negotiable.** `code-reviewer` runs after every implementation.
- **Reviewers verify code, not reports.** The code-reviewer reads the actual diff.
- **Fail loudly.** If something breaks, stop and surface to the user.
- **Push after each task.** Unpushed work strands progress if the session dies.
- **Always use `--json`.** All bd commands use `--json`.