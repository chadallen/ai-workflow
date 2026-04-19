---
name: create-beads
description: Turns recent conversation context into beads tasks (and an epic if the work warrants it). Writes a proposal to .beads/proposal.md for the user to review and edit, then creates the beads on approval.
when_to_use: Use after brainstorming a feature or set of changes in chat. Trigger phrases: "create tasks", "make beads", "break this into tasks", "turn this into an epic", "/create-beads".
disable-model-invocation: true
allowed-tools: Bash, Read, Write
---

# Create Beads

Turns recent conversation context into beads tasks (and an epic if the work warrants it). The user reviews a proposal in a scratch markdown file, edits as needed, and the agent creates the beads when they confirm.

Use this when:
- You've discussed a feature or set of changes in chat
- The work is well-enough defined to break into tasks

---

## Step 1: Decide structure

Based on the conversation, decide whether the work needs an epic:

- **Single task:** Trivial change, one file or one clear action. Skip the epic, create one task.
- **Epic with tasks:** Multi-step work, crosses multiple files, has internal dependencies, or benefits from being tracked as a unit.

If unsure, default to an epic when there are 3 or more tasks.

---

## Step 2: Draft the proposal

Write a scratch file at `.beads/proposal.md` (create `.beads/` if it doesn't exist — it's already gitignored by beads).

**Format:**

```markdown
# Beads Proposal — [Feature or work summary]

## Epic (if applicable)

**Title:** [Short imperative title]
**Description:** [1-2 paragraphs on the goal and scope]

## Tasks

### 1. [Task title]

**Description:** [What needs to be done. Files to modify. Implementation approach if non-obvious.]
**Design:** [Architectural context the implementer needs — patterns to follow, constraints, relevant data models. Omit if the description covers it.]
**Acceptance:** [Verifiable outcome — tests pass, feature works as X]
**Depends on:** [None | task numbers]

### 2. [Task title]

**Description:** ...
**Design:** ...
**Acceptance:** ...
**Depends on:** 1

### 3. [Task title]

**Description:** ...
**Design:** ...
**Acceptance:** ...
**Depends on:** 1, 2
```

Keep task descriptions concise — 2-5 sentences. The agent implementing the task can always ask for clarification or read the code. Don't try to write the full implementation in the description.

---

## Step 3: Present for review

Tell the user:

> Proposal written to `.beads/proposal.md`. Review and edit as needed — reorder tasks, adjust scope, change dependencies, delete what you don't want. Reply when ready and I'll create the beads.

Wait for the user. Don't create any beads yet.

---

## Step 4: Create the beads

When the user confirms, read `.beads/proposal.md` again (in case they edited it) and create:

### If there's an epic

```bash
bd create "<Epic Title>" -t epic -p 1 \
  --description="<epic description from proposal>" \
  --json
```

Capture the epic ID.

### Create each task

```bash
bd create "<Task Title>" -t task -p 1 \
  --parent <epic-id>  \
  --description="<task description>" \
  --design="<design field from proposal, if present>" \
  --acceptance="<acceptance criteria>" \
  --json
```

Omit `--parent` if there's no epic.

For descriptions with backticks or special characters, write to a temp file and use `--description="$(cat /tmp/task-N.md)"`.

### Add dependencies

```bash
bd dep add <dependent-task-id> <dependency-task-id>
```

Argument order: dependent first, then what it depends on.

---

## Step 5: Update plan.MD

If an epic was created, update plan.MD's header:

```
**Active epic:** <epic-id> — <Epic Title> (<N> tasks)
```

If no epic (just standalone tasks), skip this.

---

## Step 6: Clean up and commit

Delete the scratch file:

```bash
rm .beads/proposal.md
```

Commit:

```bash
git add .beads/ plan.MD
git commit -m "feat: create [epic/tasks] for <work summary>"
bd sync
```

---

## Step 7: Summary

Print:
- Epic ID and title (if created)
- Task count and IDs
- Dependency summary (e.g., "task 2 depends on task 1; task 3 depends on tasks 1 and 2")
- Next step: `/build-beads <epic-id>` for autonomous execution, or `/start-session` to pick up the next ready task manually

---

## Key principles

- **Conversation is the source.** The proposal is distilled from what was just discussed — don't invent tasks that weren't mentioned.
- **Derive acceptance criteria from the PRD.** Users describe intent; agents translate it into verifiable outcomes. If acceptance criteria aren't explicit in the conversation, read the relevant PRD feature description and write criteria that a reviewer could check without asking the user. Prefer observable behavior ("tapping X shows Y") over implementation details ("function Z returns true").
- **Edit in the file, not in chat.** Scratch markdown is faster to review and edit than asking for changes through multiple chat turns.
- **Read the file again before creating.** The user may have edited it — don't rely on what the agent drafted.
- **Default to smaller tasks.** If a task description feels like it covers too much, split it. Beads tasks should be 30-90 minute chunks of work.
- **Use `--json`.** All bd commands use `--json` for reliable parsing.
