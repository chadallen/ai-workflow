---
name: web-ui-test
description: Tests the web UI experience using Playwright browser automation. Navigates the app, snapshots page structure, interacts with flows, takes screenshots, and reports findings. Works with any web project.
when_to_use: Use after implementing frontend changes, when the user asks to "test the UI" or "check a flow", or before ending a session where UI changes were made. Trigger phrases: "test the UI", "check the flow", "test it", "verify the UI", "/web-ui-test".
allowed-tools: Bash
---

# Web UI Test

Use Playwright MCP browser tools to test the running web app. Follow this procedure exactly.

## Step 1: Establish what to test

Read the user's request (or the current task description) and identify:
- Which page(s) or flow(s) to test
- The happy path (golden path)
- Any edge cases mentioned
- Which viewport(s) matter (mobile, desktop, or both)

If the request is vague ("test the UI"), default to testing the primary user-facing flow end-to-end at mobile viewport.

## Step 2: Ensure the dev server is running

Check if a dev server is already running on the expected port (commonly 3000, 3001, 5173, 8080). Try:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

If it returns a non-200/non-redirect, start the dev server in the background. Use the project's start command (`pnpm dev`, `npm run dev`, `yarn dev`, etc.) from CLAUDE.md or package.json.

Note the base URL — typically `http://localhost:3000`.

## Step 3: Set viewport

For mobile-first apps, start at mobile viewport (390×844, iPhone 14 size):
```
browser_resize width=390 height=844
```

For desktop-first apps, use 1440×900. If both matter, test mobile first, then repeat key steps at desktop.

## Step 4: Navigate and snapshot

Navigate to the starting page:
```
browser_navigate url=<base-url>
```

Take an accessibility snapshot immediately:
```
browser_snapshot
```

The snapshot gives you the semantic page structure — headings, buttons, inputs, links, ARIA labels. Read it to understand what's on the page before interacting. This is more reliable than trying to infer from screenshots alone.

Take a screenshot to capture visual state:
```
browser_screenshot
```

## Step 5: Walk the flow

For each step in the user flow:

1. **Identify the target** — from the snapshot, find the element by its label, role, or text (e.g., button "Sign in", input "Phone number").
2. **Interact** — click, type, select as needed.
3. **Snapshot again** — after each meaningful interaction, snapshot to see the updated state.
4. **Screenshot on notable states** — take a screenshot when you reach a new page, a success state, an error state, or anything visually significant.

Common interactions:
- `browser_click element="..."` — use the element description from the snapshot
- `browser_type element="..." text="..."` — fill an input
- `browser_key_press key="Enter"` — submit forms
- `browser_scroll direction="down" amount=300` — scroll to reveal content

## Step 6: Handle auth walls

Many apps require authentication to access most pages. Strategies:

**If you can test pre-auth pages:** Test the landing page, sign-in page, and sign-up page without credentials.

**OTP / magic link flows (e.g., Clerk, Auth0):** You can navigate to the sign-in page and fill in a phone number or email, but you cannot complete the flow without receiving the actual code. Stop here and note it in your report. Ask the user if they want to provide a session cookie or test credentials.

**If the project has a test/dev bypass:** Check CLAUDE.md or the project's README for test credentials, a `?bypass=true` param, or a dev-mode auth skip. Use it if available.

**If given a session cookie:** Use `browser_navigate` to the app and inject the cookie via browser evaluation if needed, then proceed with post-auth testing.

## Step 7: Check for issues

While walking the flow, actively look for:

- **Broken layout** — elements overlapping, text cut off, buttons off-screen at mobile viewport
- **Missing content** — placeholders, empty states, "undefined" text, broken images
- **Console errors** — if the MCP tool provides console access, check for JS errors
- **Wrong states** — loading spinners that never resolve, disabled buttons that shouldn't be
- **Accessibility gaps** — inputs without labels, buttons without accessible names (visible in snapshot)
- **Visual regressions** — anything that looks wrong compared to the expected design

## Step 8: Report findings

After completing the test, report clearly:

**Tested:** [list pages/flows tested, viewport(s) used]

**Passed:**
- Bullet each thing that worked correctly

**Issues found:**
- Bullet each problem with: what it is, where it occurs, severity (cosmetic / functional / blocking)
- Attach relevant screenshots

**Not tested / blocked:**
- Note anything you couldn't test and why (auth wall, missing test data, etc.)

**Recommended next steps:** (only if issues were found)

---

## Quick reference — common Playwright MCP tools

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
