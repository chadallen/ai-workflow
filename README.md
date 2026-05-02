# A workflow for Claude coding with autonomous sub-agents

Let's create the world of autonomous vibe coding agents we deserve, so that AI can provide for our material needs while we pursue the realization of our authentic selves. For that to happen we need to make some improvements around here:

1. Agents need better memory
2. Agents need small, well-defined tasks to work on
3. Humans need to be isolated from the "how" so they focus on the "what" 

# The short version 

We can help with #1 and #2 by using a lightweight task tracker (Beads) and make #3 better by creating a clear delineation between "what" and "how" artifacts.

Enough talking! Try it or don't! Clone this repo into your Claude Code project folder:

```bash
git clone https://github.com/chadallen/claude-workflow.git your-project-path
```

1. For a new project: write your `PRD.md` (get Claude to help you) and invoke `/init-project`. Use the `PRD.MD` template if you want.
2. For an existing project: invoke `/migrate-project`. Claude will write the PRD for you as long as you have some code and/or documentation in your project directory (but you should probably at least glance at it).

The basic workflow is `/start-session` → `/create-tasks` and/or `/build-tasks` → `/end-session` → `/clear`. 


## The pieces

**PRD.md** — Product managers, please take a moment to silently reflect: agents are the only developers who have ever read a PRD front to back. Even they grow weary of this toil. When something in this doc becomes working software they'll replace your garrulous prose with a code pointer. This is really the only doc you need to touch in this workflow.

**CLAUDE.md** — Seeded from `CLAUDE.example.md` (the template in this repo) and filled in by `/init-project` or `/migrate-project`. Don't edit it manually after that — agents maintain it every session.

**plan.MD** — The big picture. Phases, what's active, what's next. Agents update it every session. The detailed task-level stuff is tracked as tasks. Don't touch this either.

**`docs/adr/`** — Architecture Decision Records. Short notes on why we made the choices we did. Curtails the idle speculation of idle agents about what might have been. They will write and maintain these.

**[Beads](https://github.com/steveyegge/beads)** — Task tracker for AI agents, built by Steve Yegge in a fugue state. Tasks have description, design, acceptance criteria and notes fields. Epics group tasks. Dependencies are tracked.

## The skills

| Skill | When |
|---|---|
| `/init-project` | Brand new project. Reads your PRD, creates CLAUDE.md and plan.MD, inits task tracking. |
| `/migrate-project` | One-time setup for existing projects. Cleans up docs, inits task tracking, imports tasks. |
| `/start-session` | Beginning of a session. Reads docs and task state, flags missing ADRs, proposes a plan. |
| `/create-tasks` | Turns a conversation into tasks. Writes a proposal for you to review, creates tasks on approval. Tip: once it has the proposal open, you can just keep adding to it: "add another task to make all of the buttons blue." After the PRD is written, this is your other main human touch point with the workflow.|
| `/build-tasks` | Tasks with no dependencies between them run in parallel as siblings (up to 3 at a time). Sub-agents write code, other sub-agents review. You can walk away if the agents have full bypass permissions. |
| `/adr` | Creates an Architecture Decision Record. Usually invoked by other skills, not directly. |
| `/end-session` | End of a session. Closes tasks, checks for ADR-worthy decisions, updates docs, pushes everything. |

### Language skills

The `implementer` and `code-reviewer` agents automatically invoke a language skill at the start of each task based on the files being touched. You don't invoke these directly.

| Skill | Language | What it adds |
|---|---|---|
| `typescript-developer` | TypeScript / JavaScript | Strict typing discipline, async pitfalls, Jest/Vitest test conventions, common review catches |
| `python-developer` | Python | Type hints, pytest conventions, asyncio patterns, common pitfalls (mutable defaults, broad excepts) |
| `ios-developer` | Swift / iOS | SwiftUI patterns, XCTest conventions, App Store compliance, Apple platform integrations |


> **Want these skills available in all your projects?** Copy them to your global Claude config once:
> ```bash
> cp -r .claude/skills/* ~/.claude/skills/
> cp .claude/agents/code-reviewer.MD ~/.claude/agents/
> cp .claude/agents/implementer.MD ~/.claude/agents/
> ```
> After that you don't need to clone this repo into each project.


## First time setup for newbies

Follow these steps if you're new to Claude code in general, in which case I have no idea why you're starting here but whatever

Advanced users skip to [Getting Started](#getting-started).

### What you need

- A **Claude Pro or Max subscription** ($20–200/month at [claude.ai](https://claude.ai)). The free plan doesn't include Claude Code.
- A **terminal** — Terminal.app on macOS, any terminal on Linux. On Windows, install [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) and use the Ubuntu terminal.
- **git** — Already there on macOS and most Linux systems. Check with `git --version`.

### 1. Install Claude Code

**macOS / Linux:**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Open a new terminal after it finishes. Verify:

```bash
claude --version
```

First time you run `claude` it opens a browser to sign in to your Anthropic account. Follow the prompts.

**Windows:** Use WSL (Ubuntu) and run the command above inside the Ubuntu terminal.

### 2. Install beads

```bash
brew install beads      # macOS
```

Linux: See [beads installation](https://github.com/steveyegge/beads) for your distro. Verify with `bd version`.

### 3. Get the skills

Clone this repo into your project folder — the skills are in `.claude/skills/` and Claude Code picks them up automatically:

```bash
git clone https://github.com/chadallen/claude-workflow.git our-project-path
cd my-project && claude
```

That's it. No copying required. If you later want the skills available globally across all projects, copy them once:

```bash
cp -r .claude/skills/* ~/.claude/skills/
cp .claude/agents/code-reviewer.MD ~/.claude/agents/
cp .claude/agents/implementer.MD ~/.claude/agents/
```

### 3a. Linters (install when you need them)

The repo includes configs for Python (Ruff), TypeScript/JavaScript (ESLint), and Swift (SwiftLint). You don't need to install them upfront — the code reviewer will tell you if one is missing when it runs.

### 4. Start a new project

```bash
mkdir my-project && cd my-project
git init
claude
```

Add your `PRD.md` to the folder. You can use the template provided or roll your own. Then:

```
/init-project
```

The skill reads your PRD, fills in `CLAUDE.example.md` with your project details, creates CLAUDE.md and plan.MD, inits task tracking, and installs hooks. When it's done it tells you how to create your first tasks.

---

## Getting started

Already set up? Existing project? Run `/migrate-project` instead of `/init-project`. It detects what exists, cleans up what needs cleaning, and adds what's missing.

---

## How to use

### Starting a session

```
/start-session
```

Agent reads docs and task state, surfaces the next ready task, flags any unrecorded architectural decisions from last session, proposes a plan. You approve or adjust.

### Ending a session

```
/end-session
```

Closes completed tasks, checks for ADR-worthy decisions, updates the docs, commits and pushes everything. Session isn't done until `git push` and `bd dolt push` both succeed. Prompts you to run `/clear` when done.

### Breaking work into tasks

Brainstorm with the agent in chat first. When the shape of the work is clear:

```
/create-tasks
```

Agent writes a proposal to `.beads/proposal.md` — tasks with descriptions, design context, acceptance criteria, and dependencies. Edit the file directly or tell Claude what to change. Reorder, rescope, add more tasks, delete what you don't want. Reply when ready and it creates the tasks.

### Building tasks autonomously

```
/build-tasks                 # next ready task (will ask: run to completion or checkpoints?)
/build-tasks --auto          # next ready task, runs to completion with no prompts
/build-tasks --checkpoints   # next ready task, stops for review after each task
/build-tasks <epic-id>       # all tasks in an epic
/build-tasks <task-id>       # one specific task
```

Tasks with no dependencies between them form a frontier and run as siblings in parallel (up to 3 at a time) — each gets its own implementer agent, and reviewers run in parallel too. Fresh subagent per task, comprehensive code review (tests, linting, security, performance, simplification), fixes issues, closes task, moves on. Use `--auto` to walk away completely.

### Working task by task (conversational mode)

For UI work or anything that needs real-time judgment:

```
/start-session    # see what's next
# work the task
/end-session      # close it out
```

### Recording an architectural decision

The agent does this automatically at session end. But you can also just:

```
/adr
```

Proposes a title and summary, waits for your confirm, writes the ADR to `docs/adr/`. Won't write one without asking.

### Checking what's next without a full session

```bash
bd ready              # next unblocked tasks
bd list --status open # all open tasks
bd stats              # project overview
```

---

The Beads part workflow inspired by [Jarred Kenny](https://jx0.ca/solving-agent-context-loss/).
