# AI Coding Workflow: Three Files + ADR + Beads

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

## Setup

1. Install [beads](https://github.com/steveyegge/beads).
2. Drop the seven skill folders into `~/.claude/skills/` (personal) or `.claude/skills/` (per-project). Place `code-reviewer.md` in `~/.claude/agents/`.
3. Run `/migrate` in your project. Handles init, hooks, doc creation or reading, initial ADRs, and task import. Detects what already exists and skips what doesn't need to be built.

---

`/plan-to-epic` and `/epic-executor` are adapted from [Jarred Kenny's beads workflow](https://jx0.ca/solving-agent-context-loss/).