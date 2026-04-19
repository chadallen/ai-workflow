# A workflow for Claude coding with autonomous sub-agents

Let's create the world of autonomous vibe coding agents we deserve so that AI can provide for us while we pursue the realization of our authentic selves. It will only happen if these agents have better memories and more focused work habits.

# The short version 

What do you have to lose? Clone this repo into your Claude Code project folder and run:

```bash
git clone https://github.com/chadallen/claude-workflow.git your-project-path
cd your-project-path && claude
```

The skills live in `.claude/skills/` and are picked up automatically by Claude Code. No copying required.

1. For a new project: write your `PRD.md` and invoke `/init-project`. Use the PRD template if you want.
2. For an existing project: invoke `/migrate-project`. Claude will write the PRD for you as long as you have some code and/or documentation in there.

The basic workflow is `start-session` → `create-beads` → `build-beads` → `end-session`. Don't know what Beads are? Whatever, man.

# The long version 


## The pieces

**PRD.md** — Product managers take a moment to silently reflect: agents are the only developers who have ever read a PRD front to back. Even they grow weary, so when something in this doc becomes working software they'll replace your garrulous prose with a code pointer. This is really the only doc you need to touch in this workflow.

**CLAUDE.md** — The usual stuff. Stack, conventions, hard rules. If you're starting a new project just let Claude write this. Actually don't ever touch this. Agents will maintain it.

**plan.MD** — The big picture. Phases, what's active, what's next. Agents update it every session. The detailed task-level stuff lives in beads. Don't touch this either.

**`docs/adr/`** — Architecture Decision Records. Short notes on why we made the choices we did. Curtails the idle speculation of idle agents about what might have been. They will write and maintain these.

**[Beads](https://github.com/steveyegge/beads)** — Task tracker for AI agents, built by Yegge in a fugue state. Tasks have description, design, acceptance criteria, and notes fields. Epics group tasks. Dependencies are tracked.

## The skills

| Skill | When |
|---|---|
| `/init-project` | Brand new project. Reads your PRD, creates CLAUDE.md and plan.MD, inits beads. |
| `/start-session` | Beginning of a session. Reads docs and beads, flags missing ADRs, proposes a plan. |
| `/end-session` | End of a session. Closes tasks, checks for ADR-worthy decisions, updates docs, pushes everything. |
| `/create-beads` | Turns a conversation into tasks. Writes a proposal for you to review, creates Beads on approval. Tip: once it has the proposal open, you can just keep adding to it: "add another task to make all of the buttons blue." After the PRD is written, this is your other main human touch point with the workflow.|
| `/build-beads` | Will ask you what Beads tasks to work on. Sub-agents write code and other sub-agents review. You can walk away if you the agents have full bypass permissions. |
| `/adr` | Creates an Architecture Decision Record. Usually invoked by other skills, not directly. |
| `/migrate-project` | One-time setup for existing projects. Cleans up docs, inits beads, imports tasks. |


> **Want these skills available in all your projects?** Copy them to your global Claude config once:
> ```bash
> cp -r .claude/skills/* ~/.claude/skills/
> cp .claude/agents/code-reviewer.MD ~/.claude/agents/
> ```
> After that you don't need to clone this repo into each project.


## First time setup (if you're new to Claude code in general, in which case I have no idea why you're starting here but whatever)

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
git clone https://github.com/chadallen/claude-workflow.git my-project
cd my-project && claude
```

That's it. No copying required. If you later want the skills available globally across all projects, copy them once:

```bash
cp -r .claude/skills/* ~/.claude/skills/
cp .claude/agents/code-reviewer.MD ~/.claude/agents/
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

Closes completed tasks, checks for ADR-worthy decisions, updates the docs, commits and pushes everything. Session isn't done until `git push` and `bd dolt push` both succeed. Prompts you to run `/clear` when done.

### Breaking work into tasks

Brainstorm with the agent in chat first. When the shape of the work is clear:

```
/create-beads
```

Agent writes a proposal to `.beads/proposal.md` — tasks with descriptions, design context, acceptance criteria, and dependencies. Edit the file directly or tell Claude what to change. Reorder, rescope, add more tasks, delete what you don't want. Reply when ready and it creates the beads.

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


