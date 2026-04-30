---
name: web-ui-test
description: Tests the web UI experience using browser automation. Uses Claude Code's Chrome integration (--chrome) as the primary approach — shares your existing browser sessions so authenticated flows work without re-logging in. Falls back to Playwright MCP for headless/CI scenarios. Works with any web project.
when_to_use: Use after implementing frontend changes, when the user asks to "test the UI" or "check a flow", or before ending a session where UI changes were made. Trigger phrases: "test the UI", "check the flow", "test it", "verify the UI", "/web-ui-test".
allowed-tools: Bash
---

# Web UI Test

Test the running web app using browser automation. Follow this procedure exactly.

## Step 1: Choose the right browser mode

Check your available tools to determine which mode to use:

**Chrome integration (preferred):** If `claude-in-chrome` MCP tools are available (e.g., tools with names like `chrome_*` or similar from the Chrome extension), use those. Chrome integration shares your existing browser sessions — authenticated flows work without re-logging in, and you can read console errors directly. Start Claude Code with `--chrome` or run `/chrome` to connect.

**Playwright MCP (fallback):** If Chrome integration is not connected, use Playwright MCP tools (`browser_navigate`, `browser_snapshot`, etc.). Playwright starts a fresh headless browser with no sessions — you'll hit auth walls for authenticated flows.

If neither is available, tell the user: Chrome integration requires the Claude in Chrome extension + `--chrome` flag (or `/chrome` to enable). Playwright MCP requires `~/.claude/mcp.json` with the playwright server configured and a Claude Code restart.

---

## Step 2: Establish what to test

Read the user's request (or the current task description) and identify:
- Which page(s) or flow(s) to test
- The happy path (golden path)
- Any edge cases mentioned
- Which viewport(s) matter (mobile, desktop, or both)

If the request is vague ("test the UI"), default to testing the primary user-facing flow end-to-end at mobile viewport.

## Step 3: Ensure the dev server is running

Check if a dev server is already running on the expected port (commonly 3000, 3001, 5173, 8080):

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

If it returns a non-2xx/non-3xx code, start the dev server in the background using the project's start command (`pnpm dev`, `npm run dev`, `yarn dev`, etc.) from CLAUDE.md or package.json.

Note the base URL — typically `http://localhost:3000`.

## Step 4: Set viewport

For mobile-first apps, start at mobile viewport (390×844 — iPhone 14 size). For desktop-first apps, use 1440×900. If both matter, test mobile first, then repeat key steps at desktop.

In Playwright MCP: `browser_resize width=390 height=844`

In Chrome integration: ask to resize or use the appropriate tool.

## Step 5: Navigate and observe

Navigate to the starting page and immediately observe the page structure. In Chrome mode, you can also check for console errors on load.

**What to look for on first load:**
- Page title and heading — does it match expectations?
- Key UI elements — are they present and visible?
- Any console errors (Chrome mode only) — note these immediately
- Layout at the target viewport — anything overflowing or misaligned?

Take a snapshot (accessibility tree) to understand the semantic structure. Take a screenshot to capture visual state.

## Step 6: Walk the flow

For each step in the user flow:

1. **Identify the target** — from the snapshot/page structure, find the element by its label, role, or text (e.g., button "Sign in", input "Phone number")
2. **Interact** — click, type, select as needed
3. **Observe** — after each meaningful interaction, snapshot/observe to see the updated state
4. **Screenshot on notable states** — new page, success state, error state, or anything visually significant

Common interactions (Playwright tool names shown; Chrome tools may differ):
- `browser_click element="..."` — click an element
- `browser_type element="..." text="..."` — fill an input
- `browser_key_press key="Enter"` — submit forms
- `browser_scroll direction="down" amount=300` — scroll to reveal content

## Step 7: Handle auth walls

**Chrome integration:** Auth walls are usually transparent — if you're already signed into the app in your browser, Chrome integration shares that session. Walk through authenticated flows normally.

If you hit a login page in Chrome mode anyway: pause and tell the user which page requires login, then ask them to sign in manually and tell you when done.

**Playwright MCP:** Playwright starts fresh with no sessions. Strategies:
- Test pre-auth pages freely (landing, sign-in form, public routes)
- OTP/magic link flows: you can fill the phone/email field but cannot receive the code — stop and note it in the report
- If the project has a test bypass (check CLAUDE.md), use it
- If given a session token/cookie, you can attempt to inject it

## Step 8: Check for issues

While walking the flow, actively look for:

- **Broken layout** — elements overlapping, text cut off, buttons off-screen at mobile viewport
- **Missing content** — placeholders, empty states, "undefined" text, broken images
- **Console errors** (Chrome mode) — JS errors, failed network requests, warnings
- **Wrong states** — loading spinners that never resolve, disabled buttons that shouldn't be
- **Accessibility gaps** — inputs without labels, buttons without accessible names
- **Visual regressions** — anything that looks wrong compared to the expected design

## Step 9: Report findings

After completing the test, report clearly:

**Mode used:** Chrome integration / Playwright MCP

**Tested:** [list pages/flows tested, viewport(s) used]

**Passed:**
- Bullet each thing that worked correctly

**Issues found:**
- Bullet each problem: what it is, where it occurs, severity (cosmetic / functional / blocking)
- Attach relevant screenshots

**Console errors:** (Chrome mode only) — list any JS errors or failed requests observed

**Not tested / blocked:**
- Note anything you couldn't test and why (auth wall, missing test data, etc.)

**Recommended next steps:** (only if issues were found)

---

## Quick reference — tool sets

### Chrome integration (preferred)

Connect with `--chrome` flag or run `/chrome`. Run `/mcp` → `claude-in-chrome` in Claude Code to see the full tool list. Key capabilities:
- Shares your existing browser sessions — no re-authentication needed
- Reads browser console logs and errors
- Records GIFs of interactions
- Works with any site you're already logged into

### Playwright MCP (headless fallback)

Configured in `~/.claude/mcp.json`. Tools include:

| Tool | Purpose |
|------|---------|
| `browser_navigate` | Go to a URL |
| `browser_snapshot` | Get accessibility tree (semantic structure) |
| `browser_screenshot` | Capture visual state |
| `browser_click` | Click an element |
| `browser_type` | Type into an input |
| `browser_key_press` | Send a keyboard key (Enter, Tab, Escape, etc.) |
| `browser_scroll` | Scroll the page |
| `browser_hover` | Hover over an element |
| `browser_resize` | Set viewport size |
| `browser_wait_for` | Wait for an element or condition |
| `browser_select_option` | Choose from a select/dropdown |
| `browser_close` | Close the browser session |
