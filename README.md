# AI Coding Workflow: Planning Docs + ADR + Beads

let's create the world of autonomous vibe coding agents we deserve. but first these little dudes need us to fix their amnesia and ADHD problems.

**amnesia:** agents forget everything between sessions. we write things down so they don't have to start from scratch every time.

**ADHD:** agents get distracted and go off on tangents. we give them a task list and a clear process so they stay focused.

this repo is the fix. a handful of markdown files, a task tracker, and some skills that wire it all together.

## The Pieces

**CLAUDE.md** — the usual stuff. stack, conventions, hard rules. keep it short. agents will help maintain it.

**PRD.md** — product managers take a moment to silently reflect: agents are the only developers who have ever read your PRD front to back. even they grow weary, so when something in this doc becomes working software they'll replace your prose with a code pointer.

**plan.MD** — the big picture. phases, what's active, what's next. agents update it every session. the detailed task-level stuff lives in beads.

**`docs/adr/`** — Architecture Decision Records. short notes on why we made the choices we did. curtails the idle speculation of idle agents about what might have been.

**[Beads](https://github.com/steveyegge/beads)** — task tracker for AI agents, built by Yegge in a fugue state. tasks have description, design, acceptance criteria, and notes fields. epics group tasks. dependencies are tracked, so `bd ready` only surfaces work that's actually unblocked.

`bd setup claude` installs hooks that auto-inject task state at session start. commits include the task ID (`git commit -m "fix login (bd-42)"`) so `bd doctor` can catch work that got committed but never closed.

## The Skills

| Skill | When |
|---|---|
| `/init-project` | brand new project. reads your PRD, creates CLAUDE.md and plan.MD, inits beads. |
| `/start-session` | beginning of a session. reads docs and beads, flags missing ADRs, proposes a plan. |
| `/end-session` | end of a session. closes tasks, checks for ADR-worthy decisions, updates docs, pushes everything. |
| `/create-beads` | turns a conversation into tasks. writes a proposal for you to review, creates on approval. |
| `/build-beads` | autonomously builds tasks with code review after each one. you can walk away. |
| `/adr` | creates an Architecture Decision Record. usually invoked by other skills, not directly. |
| `/migrate-project` | one-time setup for existing projects. cleans up docs, inits beads, imports tasks. |

## First Time Setup (if you're new to this)

advanced users skip to [Getting Started](#getting-started).

### what you need

- a **Claude Pro or Max subscription** ($20–200/month at [claude.ai](https://claude.ai)). the free plan doesn't include Claude Code.
- a **terminal** — Terminal.app on macOS, any terminal on Linux. on Windows, install [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) and use the Ubuntu terminal.
- **git** — already there on macOS and most Linux systems. check with `git --version`.

### 1. install Claude Code

**macOS / Linux:**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

open a new terminal after it finishes. verify:

```bash
claude --version
```

first time you run `claude` it opens a browser to sign in to your Anthropic account. follow the prompts.

**Windows:** use WSL (Ubuntu) and run the command above inside the Ubuntu terminal.

### 2. install beads

```bash
brew install beads      # macOS
```

Linux: see [beads installation](https://github.com/steveyegge/beads) for your distro. verify with `bd version`.

### 3. install the skills

```bash
mkdir -p ~/.claude/skills ~/.claude/agents

cp -r path/to/this-repo/skills/* ~/.claude/skills/
cp path/to/this-repo/agents/code-reviewer.MD ~/.claude/agents/
```

### 3a. linters (install when you need them)

the repo includes configs for Python (Ruff), TypeScript/JavaScript (ESLint), and Swift (SwiftLint). you don't need to install them upfront — the code reviewer will tell you if one is missing when it runs.

### 4. start a new project

```bash
mkdir my-project && cd my-project
git init
claude
```

add your `PRD.md` to the folder, then:

```
/init-project
```

the skill reads your PRD, asks a few quick questions about your stack, creates CLAUDE.md and plan.MD, inits beads, and installs hooks. when it's done it tells you how to create your first tasks.

---

## Getting Started

already set up? existing project? run `/migrate-project` instead of `/init-project`. it detects what exists, cleans up what needs cleaning, and adds what's missing.

---

## How to Use

### starting a session

```
/start-session
```

agent reads docs and beads state, surfaces the next ready task, flags any unrecorded architectural decisions from last session, proposes a plan. you approve or adjust.

### ending a session

```
/end-session
```

closes completed tasks, checks for ADR-worthy decisions, updates the docs, commits and pushes everything. session isn't done until `git push` and `bd sync` both succeed. prompts you to run `/clear` when done.

### breaking work into tasks

brainstorm with the agent in chat first. when the shape of the work is clear:

```
/create-beads
```

agent writes a proposal to `.beads/proposal.md` — tasks with descriptions, design context, acceptance criteria, and dependencies. edit the file directly. reorder, rescope, delete what you don't want. reply when ready and it creates the beads.

### building tasks autonomously

```
/build-beads <epic-id>      # all tasks in an epic
/build-beads <task-id>      # one specific task
/build-beads                # next ready task
```

fresh subagent per task, comprehensive code review after each one (tests, linting, security, performance, simplification), fixes issues, closes task, moves on. you can walk away. resumes where it left off.

### working task by task (conversational mode)

for UI work or anything that needs real-time judgment:

```
/start-session    # see what's next
# work the task
/end-session      # close it out
```

### recording an architectural decision

the agent does this automatically at session end. but you can also just:

```
/adr
```

proposes a title and summary, waits for your confirm, writes the ADR to `docs/adr/`. won't write one without asking.

### checking what's next without a full session

```bash
bd ready              # next unblocked tasks
bd list --status open # all open tasks
bd stats              # project overview
```

---

`/create-beads` and `/build-beads` are adapted from [Jarred Kenny's beads workflow](https://jx0.ca/solving-agent-context-loss/).