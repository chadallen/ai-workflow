---
name: plan-to-epic
description: Converts a feature design into a beads epic with structured tasks. Writes a design doc first, waits for review, then extracts per-task context slices from the design doc into each task's design field. Invoked by the user after brainstorming a feature.
disable-model-invocation: true
allowed-tools: Bash, Read, Write
---

# Plan to Epic

Converts a feature design into a beads epic. Follows a four-phase pipeline:

```
Design Doc → Review Checkpoint → Epic + Tasks → Execution
```

The key mechanic: the design doc is written and reviewed *before* any tasks are created. plan-to-epic then reads it and extracts only the relevant architectural context into each task's `design` field. Subagents never read the original design doc — the right slice is already embedded in their task.

## Usage

```
/plan-to-epic                          # start from conversation
/plan-to-epic docs/plans/foo.md        # existing design doc
```

---

## Phase 1: Write the design doc

If a design doc path was provided, read it and skip to Phase 2.

Otherwise, based on the current brainstorming conversation, write a design doc to:

```
docs/plans/YYYY-MM-DD-<topic>-design.md
```

Create `docs/plans/` if it doesn't exist.

The design doc should cover:

- **Goal** — What problem does this feature solve? One paragraph.
- **Approach** — The chosen implementation strategy and why. Note alternatives that were considered and rejected.
- **Architecture** — Key components, how they fit together, data flow.
- **Data model** — Any schema changes, new models, or storage decisions.
- **Error handling** — How failures are handled at each layer.
- **Testing strategy** — What needs to be tested and how.
- **Implementation sequence** — The order work needs to happen in, with dependencies made explicit. This becomes the task list.
- **Open questions** — Anything unresolved that might affect implementation.

Keep it to one or two pages. This is a working document, not a spec. Enough detail that an agent with no prior context could make correct architectural decisions.

Commit the design doc:

```bash
git add docs/plans/
git commit -m "docs: design doc — <topic>"
```

---

## Phase 2: Review checkpoint

Show the user:

```
Design doc written: docs/plans/YYYY-MM-DD-<topic>-design.md

Proposed tasks (N):
  1. <Task title> [no deps]
  2. <Task title> [depends on: 1]
  3. <Task title> [depends on: 1, 2]
  ...

Estimated complexity: low / medium / high

Review the design doc and confirm:
- Is the approach correct?
- Are the tasks correctly scoped?
- Are dependencies right?
- Ready to create the beads epic?
```

**Wait for explicit approval before proceeding.** If the user requests changes, update the design doc, commit, re-present.

This is the only checkpoint. Once approved, execution is autonomous.

---

## Phase 3: Create the epic

```bash
bd create "<Feature Title>" -t epic -p 1 \
  --description="$(cat docs/plans/YYYY-MM-DD-<topic>-design.md)" \
  --json
```

Put the full design doc in the epic description. This gives the epic a permanent record of the design and lets anyone (`bd show <epic-id>`) read it later.

Capture the returned epic ID.

---

## Phase 4: Create tasks with extracted design slices

For each task, read the design doc and extract only the portions relevant to that specific task. This extraction is the core of this skill — do it carefully.

**What belongs in each field:**

`--description`: Full implementation mechanics for this task only.
- Exact files to create or modify.
- Step-by-step implementation instructions.
- Code snippets where helpful.
- How to verify the work is done.

`--design`: The extracted design slice for this task — 3-10 sentences pulled from the design doc covering only what this task needs to know.
- The architectural decision that governs this task's approach.
- How this task's output will be consumed by later tasks.
- Error handling relevant to this task's layer.
- Any constraints from the design that would affect implementation choices.

Do NOT include design context for other tasks. If Task 4 is implementing the database schema, its design slice doesn't need to explain how the UI will consume the data.

`--acceptance`: Specific, verifiable outcomes.
- Tests pass.
- The specific behavior that can be confirmed.
- Commit made with task ID in parens.

`--notes`: Source references.
- `Design doc: docs/plans/YYYY-MM-DD-<topic>-design.md (Implementation sequence, item N)`
- Line numbers if helpful.

```bash
bd create "<Task Title>" -t task -p 1 \
  --parent <epic-id> \
  --description="<full implementation detail>" \
  --design="<extracted slice from design doc>" \
  --acceptance="<verifiable criteria>" \
  --notes="Design doc: docs/plans/YYYY-MM-DD-<topic>-design.md" \
  --json
```

For descriptions or design content with backticks, newlines, or special characters, write to a temp file and use:

```bash
--description="$(cat /tmp/task-N-desc.md)"
--design="$(cat /tmp/task-N-design.md)"
```

---

## Phase 5: Add dependencies

```bash
bd dep add <dependent-task-id> <dependency-task-id>
```

Argument order: dependent depends on dependency.

Infer dependencies from:
- The "Implementation sequence" section of the design doc.
- File overlap: if Task N and Task M both modify the same file and M > N, M depends on N.
- Explicit references in task descriptions ("after the schema is created...").

---

## Phase 6: Update plan.MD and commit

Update plan.MD's Overall Plan section:

```
Active epic: <epic-id> — <Feature Title> (N tasks)
Design doc: docs/plans/YYYY-MM-DD-<topic>-design.md
```

Commit everything:

```bash
git add .beads/
git commit -m "feat: create epic <epic-id> — <title>"
git push
bd sync
```

---

## Phase 7: Summary

Print:

- Epic ID and title.
- Task count with dependency graph summary.
- Design doc path.
- Any assumptions made or ambiguities in the design that were resolved.
- Next step: `/epic-executor <epic-id>` to run autonomously.

---

## Key principles

- **Design doc first, always.** No tasks get created until the design is written and reviewed.
- **Extract, don't reference.** Each task's `design` field contains the actual relevant text from the design doc — not a pointer to it. Subagents don't read the design doc; they read their task.
- **One slice per task.** If you find yourself repeating the same design context across multiple tasks, it probably belongs in the epic description, not per-task.
- **The checkpoint is real.** Don't proceed to task creation without explicit user approval. This is the only moment for course correction before autonomous execution.
- **Always use `--json`.** All bd commands use `--json` for reliable parsing.