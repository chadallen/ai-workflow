# AI coding workflow: Planning docs + ADR + Beads

Let's create the world of autonomous vibe coding agents we deserve. But first these little dudes need us to fix their amnesia and ADHD problems.

**Amnesia:** Agents forget everything between sessions. We write things down so they don't have to start from scratch every time.

**ADHD:** Agents get distracted and go off on tangents. We give them a task list and a clear process so they stay focused.

This repo is the fix. A handful of markdown files, a task tracker, and some skills that wire it all together.

## The pieces

**CLAUDE.md** — The usual stuff. Stack, conventions, hard rules. Keep it short. Agents will help maintain it.

**PRD.md** — Product managers take a moment to silently reflect: agents are the only developers who have ever read your PRD front to back. Even they grow weary, so when something in this doc becomes working software they'll replace your prose with a code pointer.

**plan.MD** — The big picture. Phases, what's active, what's next. Agents update it every session. The detailed task-level stuff lives in beads.

**`docs/adr/`** — Architecture Decision Records. Short notes on why we made the choices we did. Curtails the idle speculation of idle agents about what might have been.

**[Beads](https://github.com/steveyegge/beads)** — Task tracker for AI agents, built by Yegge in a fugue state. Tasks have description, design, acceptance criteria, and notes fields. Epics group tasks. Dependencies are tracked, so `bd ready` only surfaces work that's actually unblocked.

`bd setup claude` installs hooks that auto-inject task state at session start. Commits include the task ID (`git commit -m "fix login (bd-42)"`) so `bd doctor` can catch work that got committed but never closed.

## The skills

| Skill | When |
|---|---|
| `/init-project` | Brand new project. Reads your PRD, creates CLAUDE.md and plan.MD, inits beads. |
| `/start-session` | Beginning of a session. Reads docs and beads, flags missing ADRs, proposes a plan. |
| `/end-session` | End of a session. Closes tasks, checks for ADR-worthy decisions, updates docs, pushes everything. |
| `/create-beads` | Turns a conversation into tasks. Writes a proposal for you to review, creates on approval. |
| `/build-beads` | Autonomously builds tasks with code review after each one. You can walk away. |
| `/adr` | Creates an Architecture Decision Record. Usually invoked by other skills, not directly. |
| `/migrate-project` | One-time setup for existing projects. Cleans up docs, inits beads, imports tasks. |

## First time setup (if you're new to this)

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

### 3. Install the skills

```bash
mkdir -p ~/.claude/skills ~/.claude/agents

cp -r path/to/this-repo/skills/* ~/.claude/skills/
cp path/to/this-repo/agents/code-reviewer.MD ~/.claude/agents/
```

### 3a. Linters (install when you need them)

The repo includes configs for Python (Ruff), TypeScript/JavaScript (ESLint), and Swift (SwiftLint). You don't need to install them upfront — the code reviewer will tell you if one is missing when it runs.

### 4. Start a new project

```bash
mkdir my-project && cd my-project
git init
claude
```

Add your `PRD.md` to the folder, then:

```
/init-project
```

The skill reads your PRD, asks a few quick questions about your stack, creates CLAUDE.md and plan.MD, inits beads, and installs hooks. When it's done it tells you how to create your first tasks.

---

## Getting started

Already set up? Existing project? Run `/migrate-project` instead of `/init-project`. It detects what exists, cleans up what needs cleaning, and adds what's missing.

---

## How to use

### Starting a session

```
/start-session
```

Agent reads docs and beads state, surfaces the next ready task, flags any unrecorded architectural decisions from last session, proposes a plan. You approve or adjust.

### Ending a session

```
/end-session
```

Closes completed tasks, checks for ADR-worthy decisions, updates the docs, commits and pushes everything. Session isn't done until `git push` and `bd sync` both succeed. Prompts you to run `/clear` when done.

### Breaking work into tasks

Brainstorm with the agent in chat first. When the shape of the work is clear:

```
/create-beads
```

Agent writes a proposal to `.beads/proposal.md` — tasks with descriptions, design context, acceptance criteria, and dependencies. Edit the file directly. Reorder, rescope, delete what you don't want. Reply when ready and it creates the beads.

### Building tasks autonomously

```
/build-beads <epic-id>      # all tasks in an epic
/build-beads <task-id>      # one specific task
/build-beads                # next ready task
```

Fresh subagent per task, comprehensive code review after each one (tests, linting, security, performance, simplification), fixes issues, closes task, moves on. You can walk away. Resumes where it left off.

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

`/create-beads` and `/build-beads` are adapted from [Jarred Kenny's beads workflow](https://jx0.ca/solving-agent-context-loss/).
