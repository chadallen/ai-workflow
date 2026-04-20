---
name: init-project
description: Sets up a brand new project from a PRD. Checks for Claude Code initialization and PRD.md, then creates CLAUDE.md, plan.MD, initializes task tracking, and installs hooks. Ends by explaining how to use /create-tasks — the user runs that when ready.
when_to_use: Use once at the start of a brand new project after adding PRD.md to the repo. Trigger phrases: "set up this project", "initialize the workflow", "new project setup", "/init-project".
disable-model-invocation: true
allowed-tools: Bash, Read, Write
---

# Init Project

Sets up a new project for the planning docs + task workflow. Run this once after cloning the repo template and adding your PRD.

This skill does NOT create tasks. When setup is complete it explains how to use `/create-tasks` — you run that yourself when ready.

---

## Step 1: Check Claude Code is initialized

Check for a `.claude/` directory in the project root:

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

## Step 3: Ask a few questions

You need a small amount of information that isn't in the PRD to set up CLAUDE.md properly. Ask the user — don't try to infer from the PRD:

1. What's the primary language and framework?
2. What are the build, run, and test commands?
3. Are there any hard rules around secrets, data handling, or naming conventions the agent must never violate?
4. Anything else the agent needs to know every session that the PRD doesn't cover?

Keep it short. If the user says "figure it out from the PRD" for any question, that's fine — note it and move on.

---

## Step 4: Create CLAUDE.md

Build CLAUDE.md from the PRD and the user's answers. Follow these principles:

**What belongs:**
- One-paragraph "What This Is" distilled from the PRD vision section
- Build, test, and run commands (from Step 3)
- Stack constraints that differ from language/framework defaults
- Hard rules: secrets policy, critical data rules, naming/branding rules (from Step 3)
- Task tracking reference (see below)

**What does NOT belong:**
- PRD content — that lives in PRD.md, not here
- Progress tracking or session history — that lives in plan.MD
- Code style rules — those belong in linter config
- Anything that only applies sometimes — that belongs in skill files

**Target length:** Under 80 lines. If you're going over, you're including too much.

**Style:**
- "Don't X, do Y" — never leave a prohibition without a concrete alternative
- Reserve emphasis (IMPORTANT, YOU MUST) for 2-3 rules that truly matter

Always include this section at the end:

```
## Task Tracking

Task tracking is via bd. Run `bd ready` for next tasks.
Commits include the task ID: `git commit -m "<message> (<task-id>)"`

Skills: /start-session, /end-session, /create-tasks, /build-tasks, /adr
```

Show the user the draft and wait for approval before writing it to disk.

---

## Step 5: Create plan.MD

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

## Step 6: Create docs/ structure

```bash
mkdir -p docs/adr
```

This directory will hold Architecture Decision Records as they're created.

---

## Step 7: Initialize task tracking

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

## Step 8: Add .gitignore entries

Ensure these are in `.gitignore`:

```
scratch.md
scratch.MD
```

Add them if missing.

---

## Step 9: Initial commit

Stage and commit:

```bash
git add CLAUDE.md plan.MD docs/ .beads/ .claude/ .gitignore
git commit -m "chore: init project workflow"
```

Before pushing, check the remote:

```bash
git remote get-url origin 2>/dev/null || echo "NO_REMOTE"
```

- If the output is `NO_REMOTE`: tell the user no remote is configured and skip `git push`. They'll need to add one (`git remote add origin <url>`) and push manually.
- If the URL contains `chadallen/claude-workflow`: **stop immediately.** Tell the user:
  > This repo's origin still points to the claude-workflow template. Update it before pushing: `git remote set-url origin <your-repo-url>`
  Do NOT push. Skip `git push` and `bd dolt push`.
- Otherwise: push normally.

```bash
git push
bd dolt push
```

---

## Step 10: Tell the user how to proceed

Print a summary:

```
Project setup complete.

Created:
  ✓ CLAUDE.md
  ✓ plan.MD
  ✓ docs/adr/
  ✓ .beads/ (initialized)
  ✓ Claude Code hooks (SessionStart, PreCompact)

Next step: create your first tasks.

Run /create-tasks in Claude Code. The agent will read your PRD and
conversation context, propose a set of tasks in a scratch file
(.beads/proposal.md), and wait for you to review and edit before
creating anything.

Once tasks exist, use:
  /start-session   — begin a session and pick up the next task
  /build-tasks     — run tasks autonomously with code review
  /end-session     — close tasks, update docs, push everything
```

---

## Key principles

- **Check prerequisites first.** Claude Code init and PRD.md must both exist before doing anything else.
- **Ask, don't infer.** A few targeted questions to the user are cheaper than reading the whole codebase and guessing wrong.
- **CLAUDE.md from the PRD, not the other way around.** The PRD is the source of truth. CLAUDE.md is a distillation of what the agent needs every session.
- **Don't run /create-tasks.** Setup ends at Step 9. The user runs create-tasks when they're ready.
