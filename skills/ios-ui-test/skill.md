---
name: ios-ui-test
description: Tests the iOS simulator UI using idb and xcrun. Snapshots the accessibility tree, takes screenshots, drives interactions (tap, swipe, type), walks user flows, and reports findings. Works with any iOS project that has scripts/screenshot.sh and scripts/tap.sh set up.
when_to_use: Use after implementing any view change, when the user asks to "test the UI", "check a flow", or "verify the simulator looks right". Also use before ending a session where UI changes were made. Trigger phrases: "test the UI", "check the flow", "verify the simulator", "take a screenshot", "/ios-ui-test".
allowed-tools: Bash, Read
---

# iOS UI Test

Use idb and xcrun to drive the iOS simulator and verify the UI. Follow this procedure exactly.

## Step 1: Establish what to test

Read the user's request (or the current task description) and identify:
- Which screen(s) or flow(s) to test
- The happy path (golden path)
- Any edge cases mentioned

If the request is vague ("test the UI"), default to screenshotting the current state, walking the primary user flow, and checking for visual issues.

## Step 2: Verify prerequisites

Check that a simulator is booted:

```bash
xcrun simctl list devices booted
```

If no simulator is booted, boot the default one:
```bash
xcrun simctl boot "iPhone 17"
```

The app must already be running — Claude cannot launch it. If the screen is a home screen or the app isn't visible, tell the user to launch it via Sweetpad or Xcode, then proceed.

Verify idb is available:
```bash
~/.venv/idb312/bin/idb --version
```

If idb is missing, tell the user. The install is: `brew install idb-companion` + `pip3.12 install fb-idb` in a Python 3.12 venv at `~/.venv/idb312/`.

## Step 3: Resolve the simulator UDID

All raw idb commands need the UDID. Resolve it once and reuse:

```bash
UDID=$(xcrun simctl list devices booted --json | python3 -c "
import json, sys
d = json.load(sys.stdin)
devs = [v for vs in d['devices'].values() for v in vs if v['state'] == 'Booted']
print(devs[0]['udid'] if devs else '')
")
echo $UDID
```

`scripts/tap.sh` resolves the UDID automatically — you only need `$UDID` for raw `idb` commands like `describe-all`.

## Step 4: Accessibility snapshot

Before interacting, snapshot the full screen accessibility tree to understand what elements are present and their exact coordinates:

```bash
~/.venv/idb312/bin/idb ui describe-all --udid "$UDID" 2>/dev/null | python3 -c "
import json, sys
elements = json.load(sys.stdin)
for el in elements:
    label = el.get('AXLabel') or el.get('title') or ''
    kind = el.get('type', '')
    frame = el.get('frame', {})
    cx = round(frame.get('x', 0) + frame.get('width', 0) / 2)
    cy = round(frame.get('y', 0) + frame.get('height', 0) / 2)
    if label:
        print(f'{kind:12} center=({cx},{cy})  \"{label}\"')
"
```

This gives you every interactive element's center coordinates. Use these coordinates with `scripts/tap.sh` — don't guess or use hardcoded values.

To inspect a single point:
```bash
~/.venv/idb312/bin/idb ui describe-point --udid "$UDID" <x> <y>
```

## Step 5: Initial screenshot

Capture the current visual state:

```bash
bash scripts/screenshot.sh
```

Then read it:
```
Read scripts/screenshots/latest.png
```

The absolute path is always `/path/to/project/scripts/screenshots/latest.png`. Always read it visually — the image tells you layout, color, and content at a glance.

## Step 6: Walk the flow

For each step in the user flow:

1. **Find the target** — from the accessibility snapshot (Step 4), get the element's center coordinates.
2. **Interact** — use `scripts/tap.sh`.
3. **Screenshot** — always take a screenshot after each interaction to verify the result before the next action.

Common interactions:
```bash
bash scripts/tap.sh tap <x> <y>                           # tap a point
bash scripts/tap.sh swipe <x1> <y1> <x2> <y2> [duration] # swipe (scroll down: swipe cx top cx bottom)
bash scripts/tap.sh type "<text>"                          # type into focused field
```

Wait if needed — animations take ~0.3–0.5s. Use `sleep 1` before screenshotting after navigations or sheet presentations. Use `sleep 2` after OAuth or network-dependent transitions.

### Scrolling

To scroll down: swipe from bottom to top. To scroll up: swipe from top to bottom.
```bash
# Scroll down one screen (on a 402×874 device)
bash scripts/tap.sh swipe 200 700 200 200 0.4

# Scroll up
bash scripts/tap.sh swipe 200 200 200 700 0.4
```

Adjust coordinates to the actual screen bounds shown in the accessibility snapshot.

### Dismissing sheets and alerts

Tap the dismiss button found in the accessibility snapshot. For system alerts, the button labels ("OK", "Cancel", "Allow") appear as elements — find their coordinates with `describe-all`.

## Step 7: Check for issues

While walking the flow, actively look for:

- **Broken layout** — clipped text, overlapping elements, content outside safe area
- **Wrong colors** — hardcoded colors that break in dark mode, wrong contrast
- **Missing content** — empty states, nil values shown as blank, placeholders not hidden
- **Wrong state** — loading spinners stuck, buttons disabled that shouldn't be
- **Accessibility gaps** — interactive elements with no label (they show empty `AXLabel` in the snapshot)
- **Navigation issues** — back button missing, wrong title, stale nav stack

## Step 8: Report findings

After completing the test, report:

**Tested:** [list screens/flows tested]

**Passed:**
- Bullet each thing that worked correctly

**Issues found:**
- Bullet each problem: what it is, where it occurs, severity (cosmetic / functional / blocking)

**Not tested / blocked:**
- Note anything you couldn't test and why (app not running, auth wall, network required, etc.)

**Recommended next steps:** (only if issues were found)

---

## Quick reference

| Goal | Command |
|------|---------|
| List booted simulators | `xcrun simctl list devices booted` |
| Capture screenshot | `bash scripts/screenshot.sh` |
| Read screenshot | `Read scripts/screenshots/latest.png` |
| Full accessibility tree | `~/.venv/idb312/bin/idb ui describe-all --udid "$UDID"` |
| Tap a point | `bash scripts/tap.sh tap <x> <y>` |
| Swipe / scroll | `bash scripts/tap.sh swipe <x1> <y1> <x2> <y2> [dur]` |
| Type text | `bash scripts/tap.sh type "<text>"` |
| Inspect a point | `~/.venv/idb312/bin/idb ui describe-point --udid "$UDID" <x> <y>` |

## Coordinate system

- Coordinates are in **logical points**, not pixels.
- Screen bounds come from the first element in `describe-all` (`AXFrame` of the Application node).
- Center of any element = `x + width/2`, `y + height/2` from its `frame`.
- Always derive coordinates from `describe-all` — never hardcode or guess device dimensions.
