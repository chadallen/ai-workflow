# AI Coding Workflow: Planning Docs + ADR + Beads

let's create the world of autonomous vibe coding agents we deserve. and/or melt the polar ice caps with the heat of a thousand data centers. but fist these little dudes need us to fix their amnesia and ADHD problems. 

amnesia: agents need us to write down what we want and they need skills to turn this into a plan with bite-sized chunks of work. 

ADHD: agents need a task list and a clear set of instructions on how to work through it so they don't get sidetracked by random ideas they have. focus, agents, focus!

## The Pieces

**CLAUDE.md** — put the usual stuff here. don't change it frequentky. maybe just let the agents worry about it. 

**PRD.md** — product managers take a moment to silently reflect on this: agents are the only developers who have ever read your PRD front to back. even they will grow weary, so when something in this doc becomes working software the agents will replace your prose with a code pointer. 

**plan.MD** — agents love making plans more than following them. this doc provides the big picture approach for building your thing. it gets updated every session. the detailed session-level plans are in beads (below).

**`docs/adr/`** — Architecture Decision Records. "don't forget why we decided to use Python instead of PHP." these are short but curtail the idle speculation of idle agents about what might have been. 

**`docs/plans/`** — design docs, one per epic.  helps keep context windows under control: each beads  task gets only the relevant details dumped to its `design` field — subagents never read the design doc directly.

**[Beads](https://github.com/steveyegge/beads)** — task tracker for AI agents built by Yegge in a fugue state. epics group tasks. dependencies are tracked.

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

you also need [Claude Code](https://claude.ai/code) with a Pro or Max subscription. are you even alive otherwise?

### 2. Install the skills

clone or download this repo. copy the skill folders to your Claude skills directory:

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