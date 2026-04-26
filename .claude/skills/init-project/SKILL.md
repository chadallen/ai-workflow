---
name: init-project
description: Sets up a brand new project from a PRD. Checks for Claude Code initialization and PRD.md, then creates CLAUDE.md, plan.MD, initializes task tracking, and installs hooks. Ends by explaining how to use /create-tasks — the user runs that when ready.
when_to_use: Use once at the start of a brand new project after adding PRD.md to the repo. Trigger phrases: "set up this project", "initialize the workflow", "new project setup", "/init-project".
disable-model-invocation: false
allowed-tools: Bash, Read, Write
---

# Init Project

Sets up a new project for the planning docs + task workflow. Run this once after cloning the repo template and adding your PRD.

This skill does NOT create tasks. When setup is complete it explains how to use `/create-tasks` — you run that yourself when ready.

---

## Step 1: Check prerequisites

**Check the git remote:**

```bash
git remote get-url origin 2>/dev/null || echo "NO_REMOTE"
```

- If the URL contains `claude-workflow`: stop immediately.
  > This repo's `origin` still points to the claude-workflow template. Set your own remote first: `git remote set-url origin <your-repo-url>`. Then run `/init-project` again.
- If `NO_REMOTE`: note it — no remote is fine. The push at the end will be skipped.
- Otherwise: proceed normally.

**Check Claude Code is initialized:**

```bash
ls .claude/
```

If `.claude/` doesn't exist, stop immediately:

> Claude Code hasn't been initialized in this directory. Run `claude` in your terminal from the project root to initialize it, then come back and run `/init-project` again.

Do not proceed until `.claude/` exists.

---

## Step 2: Check PRD.md exists

Look for `PRD.md` or `PRD.MD` in the project root. 

If it doesn't exist, stop:

> No PRD.md found. Add your product requirements document to the project root as `PRD.md`, then run `/init-project` again. This is the only file you need to create — everything else will be built from it.

If it the first line of `PRD.md` or `PRD.MD`says "# [Your Product Name Here] — Product requirements", stop:

> Looks like you haven't updated the PRD template. Please edit `PRD.md`, replace the placeholder content with your actual product requirements, and then run `/init-project` again.

If it exists and is updated from the template, read it in full before doing anything else.

---

## Step 3: Create CLAUDE.md

Read `CLAUDE.example.md` from the repo root — it is the canonical template. Fill in every `[TODO:]` placeholder using the PRD:

- **What This Is** — one paragraph distilled from the PRD vision section
- **Stack** — primary language(s), frameworks, key dependencies
- **Commands** — build, test, and run commands inferred from the PRD or any package/config files present
- **Key Conventions** — hard naming rules, secrets policy, or critical data constraints mentioned in the PRD; remove the section entirely if nothing notable applies

**What does NOT belong:**
- PRD prose — that lives in PRD.md
- Progress tracking or session history — that lives in plan.MD
- Code style rules — those belong in linter config

**Target length:** Under 80 lines. If you're going over, you're including too much.

Leave any command you can't determine as `[TODO]` — subsequent agents will fill in the gaps naturally. Do not ask the user questions to resolve them.

Show the user the filled-in draft and wait for approval before writing it to disk.

---

## Step 4: Create plan.MD

Build plan.MD from the PRD's build sequence or feature roadmap:

```markdown
# [Project Name] — Plan

**Task tracking:** Task tracking is via bd. Run `bd ready` for next tasks.
**Active epic:** none yet — run `/create-tasks` to create your first epic

---

## Overall Plan

Extract the high-level phase or milestone sequence from the PRD. 
If the PRD has a Build Sequence section, use that. Otherwise infer from the features]

---

## Current Status

### [Today's date]

Project initialized. CLAUDE.md and plan.MD created from PRD. Task tracking initialized and hooks installed. Ready to create first epic with `/create-tasks`.

---

## Known Issues / Blockers

None yet.

---

## Build Notes

Leave this section empty — it fills in as the project develops.
```

Write this to disk without needing approval — it's scaffolding, not a decision.

---

## Step 5: Create docs/ structure

```bash
mkdir -p docs/adr
```

This directory will hold Architecture Decision Records as they're created.

---

## Step 6: Initialize task tracking

```bash
bd init --quiet
```

If bd isn't installed, stop:

> beads isn't installed. Install it with `brew install beads` (macOS) or see https://github.com/steveyegge/beads for other platforms, then run `/init-project` again.

After init, install Claude Code hooks:

```bash
bd setup claude
bd setup claude --check
```

This installs:
- `SessionStart` → `bd prime --stealth` — injects task state without git instructions (our skills own the git flow)
- `PreCompact` → `bd prime --stealth` — re-injects task state after context compaction

`bd setup claude` has known bugs: it may set the command to `bd prime` (missing `--stealth`) or `bd sync` (deprecated). Fix both hooks:

```bash
python3 -c "
import json
p = '.claude/settings.json'
s = json.load(open(p))
for hook_type in ('SessionStart', 'PreCompact'):
    for h in s.get('hooks', {}).get(hook_type, []):
        for inner in h.get('hooks', []):
            inner['command'] = 'bd prime --stealth'
print('Hooks set to bd prime --stealth')
json.dump(s, open(p, 'w'), indent=2)
"
```

---

## Step 7: Add .gitignore entries

Ensure these are in `.gitignore`:

```
scratch.md
scratch.MD
```

Add them if missing.

---

## Step 8: Initial commit

Stage and commit:

```bash
git add CLAUDE.md plan.MD docs/ .beads/ .claude/ .gitignore
git commit -m "chore: init project workflow"
```

If Step 1 found no remote, skip the pushes and tell the user:
> No remote configured — push manually once you've added one: `git remote add origin <url> && git push -u origin main && bd dolt push`

Otherwise:

```bash
git push
bd dolt push
```

---

## Step 9: Tell the user how to proceed

Print a summary:

```
Project setup complete.

Created:
  ✓ CLAUDE.md
  ✓ plan.MD
  ✓ docs/adr/
  ✓ .beads/ (initialized)
  ✓ Claude Code hooks (SessionStart, PreCompact)

Next step:

Run /clear to reset the context window, then /start-session to orient
the agent on your project. Once in a session, use /create-tasks to
break your first feature into tasks.

The workflow from there:
  /create-tasks    — plan work (do this first)
  /build-tasks     — run tasks autonomously with code review
  /end-session     — close tasks, update docs, push everything
```

---

## Key principles

- **Check prerequisites first.** Claude Code init and PRD.md must both exist before doing anything else.
- **Template first.** Start from `CLAUDE.example.md` — the workflow conventions are pre-baked. Fill in the TODOs; don't rebuild from scratch.
- **CLAUDE.md from the PRD, not the other way around.** The PRD is the source of truth. CLAUDE.md is a distillation of what the agent needs every session.
- **Leave gaps rather than guess.** If a command or convention isn't in the PRD, leave it as `[TODO]`. Don't ask the user — subsequent agents will surface the gaps naturally.
- **Don't run /create-tasks.** Setup ends at Step 8. The user runs create-tasks when they're ready.
