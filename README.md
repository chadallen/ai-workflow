# AI Coding Workflow: Planning Docs + ADR + Beads

Agents have two problems: they forget everything between sessions, and they need supervision on long features. This workflow handles both. Three markdown files plus a task tracker hold the state. Any agent can pick up cold. Well-specified work hands off to an autonomous executor with built-in review.

Two modes run in parallel: conversational for tasks that need real-time judgment, autonomous for everything else.

## The Pieces

**CLAUDE.md** — Project rules, stack, conventions. Changes rarely.

**PRD.md** — Product requirements. Aggressively pruned: when a feature is built and tested, its detailed spec gets replaced with a one-line pointer to the code.

**plan.MD** — Session state. Three sections: Overall Plan (which epic is active), Current Status (last 3 sessions), Known Issues. No "what remains" list — that's beads now.

**`docs/adr/`** — Architecture Decision Records. One file per decision. Captures what was chosen, what alternatives were considered, and why. The agent creates these automatically when it detects ADR-worthy decisions during a session — no manual bookkeeping.

**`docs/plans/`** — Feature design docs, one per epic. Written by `/plan-to-epic` before tasks are created and reviewed before execution starts. The full design lives in the file and in the epic's beads record. Each task gets only the relevant architectural slice extracted into its `design` field — subagents never read the design doc directly.

**[Beads](https://github.com/steveyegge/beads)** — Git-backed task tracker built for AI agents. Tasks have `description`, `design`, `acceptance`, and `notes` fields. Epics group tasks. Dependencies are tracked, so `bd ready` returns only what's actually unblocked.

`bd setup claude` installs hooks that auto-inject task state at session start. Commits include the task ID (`git commit -m "Add login (bd-42)"`) so `bd doctor` can flag work that got committed but never closed.

## The Skills

| Skill | When |
|---|---|
| `/start-session` | Beginning of a session. Reads docs and beads, flags missing ADRs, proposes a plan. |
| `/end-session` | End of a session. Closes tasks, checks for ADR-worthy decisions, updates docs, pushes everything. |
| `/plan-to-epic` | Writes a design doc, waits for review, then creates a beads epic with per-task context slices extracted from the design. |
| `/epic-executor` | Autonomously executes all tasks in an epic. Comprehensive code review after each task. |
| `/adr` | Creates an Architecture Decision Record. Usually invoked by other skills, not directly. |
| `/migrate` | One-time setup for any project. Constructs docs if needed, skips what already exists. |

## Getting Started

### 1. Install the tools

Install [beads](https://github.com/steveyegge/beads) — a Go binary, installs in seconds:

```bash
brew install beads   # macOS
# or see beads docs for other platforms
```

You'll also need [Claude Code](https://claude.ai/code) with a Pro or Max subscription.

### 2. Install the skills

Clone or download this repo. Copy the skill folders to your Claude skills directory:

```bash
# Personal (available across all projects)
cp -r skills/start-session skills/end-session skills/plan-to-epic \
      skills/epic-executor skills/adr skills/migrate \
      ~/.claude/skills/

# Code reviewer subagent
cp agents/code-reviewer.md ~/.claude/agents/
```

Or per-project:

```bash
cp -r skills/* .claude/skills/
cp agents/code-reviewer.md .claude/agents/
```

### 3. Set up your project

In Claude Code, run:

```
/migrate
```


That's it. The skill detects what's already in your project, builds what's missing, initializes beads, installs hooks, and imports any existing tasks. For projects with sparse docs it'll ask you a few questions first to avoid reading unnecessary code.

---

## How to Use

### Starting a session

At the beginning of every coding session:

```
/start-session
```

The agent reads your docs and beads state, surfaces the next ready task, flags any unrecorded architectural decisions from last session, and proposes a plan. You approve or adjust, then work begins.

### Ending a session

At the end of every session:

```
/end-session
```

Closes completed beads tasks, checks for ADR-worthy decisions made during the session, updates CLAUDE.md/PRD.md/plan.MD, commits and pushes everything. The session isn't done until `git push` and `bd sync` both succeed.

### Planning a new feature (autonomous mode)

When you have a feature to build:

```
/plan-to-epic
```

Brainstorm with the agent in chat first. When the design is clear, this skill writes a design doc to `docs/plans/`, shows you the proposed task list with dependencies, and waits for your approval. Once you confirm, it creates the beads epic with per-task context already extracted from the design. Then:

```
/epic-executor <epic-id>
```

The agent implements each task with a fresh subagent, runs a comprehensive code review after each one (tests, linting, security, performance, simplification), fixes issues, closes the task, and moves to the next. You can walk away. Resume any time with `continue epic <epic-id>`.

### Working task by task (conversational mode)

For UI work, learning-heavy tasks, or anything needing real-time feedback, skip the executor and work one task at a time:

```
/start-session        # see what's next
# work the task
/end-session          # close it out
```

### Recording an architectural decision

The agent handles this automatically at session end, but you can trigger it directly:

```
/adr
```

The agent proposes a title and one-line summary, waits for your confirm, then writes the ADR to `docs/adr/`. It won't write one without asking first.

### Checking what's next

Without starting a full session:

```bash
bd ready              # next unblocked tasks
bd list --status open # all open tasks
bd stats              # project overview
```

---

`/plan-to-epic` and `/epic-executor` are adapted from [Jarred Kenny's beads workflow](https://jx0.ca/solving-agent-context-loss/).