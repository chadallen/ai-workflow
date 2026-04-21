---
name: create-tasks
description: Turns recent conversation context into tasks (and an epic if the work warrants it). Writes a proposal to .beads/proposal.md for the user to review and edit, then creates the tasks on approval.
when_to_use: Use after brainstorming a feature or set of changes in chat. Trigger phrases: "create tasks", "make tasks", "break this into tasks", "turn this into an epic", "/create-tasks".
disable-model-invocation: false
allowed-tools: Bash, Read, Write
---

# Create Tasks

Turns recent conversation context into tasks (and an epic if the work warrants it). The user reviews a proposal in a scratch markdown file, edits as needed, and the agent creates the tasks when they confirm.

Use this when:
- You've discussed a feature or set of changes in chat
- The work is well-enough defined to break into tasks

---

## Usage

Should only be invoked after '/start-session' to ensure context is fresh and the agent is oriented. If the user invokes it without starting a session, instruct the user to invoke '/start-session' first. DO NOT proceed with building tasks until the user has started a session using /start-session.

```
/create-tasks                        # use preceding conversation to create an epic and/or tasks OR kick off a conversation to define the work and then create tasks
```

---

## Step 1: Decide structure

Based on the conversation, decide if there is enough context to start creating tasks. 

If there IS enough context already, then decide if you should to create an epic with multiple tasks, or just one task. If it's one task, create it without an epic. If it's multiple tasks that are part of a larger feature or change, group them under an epic.

If there IS NOT enough context, ask the user to describe the work in more detail. The user should describe the feature or change they want to make, and you can ask follow-up questions to clarify until you have enough to create at least one task.

- **Single task:** Trivial change, one file or one clear action. Skip the epic, create one task.
- **Epic with tasks:** Multi-step work, crosses multiple files, has internal dependencies, or benefits from being tracked as a unit.

If unsure, default to an epic when there are 3 or more tasks. If there is NOT enough relevant conversation to start creating tasks, ask the user to describe a task or tasks.

---

## Step 2: Draft the proposal

Write a scratch file at `.beads/proposal.md` (create `.beads/` if it doesn't exist). This file is deleted before commit in Step 7.

**Format:**

```markdown
# Task Proposal — [Feature or work summary]

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

> Proposal written to `.beads/proposal.md`. Review and edit as needed — reorder tasks, adjust scope, change dependencies, delete what you don't want. Or tell me here that you want to add another task and describe it. Reply when ready and I'll create the tasks or add more.

Wait for the user. Don't create any tasks yet.

---

## Step 4: Create the tasks

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

## Step 6: Add more tasks if needed

Ask the user if they want to add another task. If yes, repeat Steps 2-5 for each new task. Add additional tasks the the proposal.md file you have already created.For additional tasks that belong to an existing epic, just create them with `--parent <epic-id>` and update the plan.MD header count.

---

## Step 7: Clean up and commit

Make sure the user is done adding tasks. If they confirm they are done then you can proceed with this step.

Delete the scratch file:

```bash
rm .beads/proposal.md
```

Commit:

```bash
git add .beads/ plan.MD
git commit -m "feat: create [epic/tasks] for <work summary>"
bd dolt push
```

---

## Step 8: Summary

Print:
- Epic ID and title (if created)
- Task count and IDs
- Dependency summary (e.g., "task 2 depends on task 1; task 3 depends on tasks 1 and 2")
- Next step — tell the user explicitly:
  - To build autonomously: run `/build-tasks <epic-id>`. Fresh subagents implement each task, a code reviewer checks the work, and tasks close automatically.
  - To work tasks manually: run `/start-session` to pick up the next ready task.

Do NOT offer to start building or begin implementation. Your job ends here. The user must explicitly invoke `/build-tasks` or `/start-session` themselves.

---

## Key principles

- **Conversation is the source.** The proposal is distilled from what was just discussed — don't invent tasks that weren't mentioned.
- **Derive acceptance criteria from the PRD.** Users describe intent; agents translate it into verifiable outcomes. If acceptance criteria aren't explicit in the conversation, read the relevant PRD feature description and write criteria that a reviewer could check without asking the user. Prefer observable behavior ("tapping X shows Y") over implementation details ("function Z returns true").
- **Edit in the file, not in chat.** Scratch markdown is faster to review and edit than asking for changes through multiple chat turns.
- **Read the file again before creating.** The user may have edited it — don't rely on what the agent drafted.
- **Default to smaller tasks.** If a task description feels like it covers too much, split it. Tasks should be 30-90 minute chunks of work.
- **Chain sequential tasks.** A flat list where every task has "Depends on: None" is a red flag — it means everything becomes ready at once and the agent has no guidance on order. If tasks are naturally sequential (T2 needs T1's output, T3 needs T2's scaffolding), set explicit dependencies. Only tasks that can genuinely run in parallel should share the same dependency level.
- **Use `--json`.** All bd commands use `--json` for reliable parsing.
