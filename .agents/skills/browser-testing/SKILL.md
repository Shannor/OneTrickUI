---
name: browser-testing
description: Run token-efficient browser UI tests, network throttling benchmarks (3G/4G), and Core Web Vitals performance traces against OneTrickUI using Aeroxy's Rust Chrome DevTools CLI (aeroxy/tap/chrome-devtools), Google's Chrome DevTools MCP CLI (chrome-devtools-mcp), or Playwright CLI (@playwright/cli). Recommends which of the 3 tools to use based on the task at hand and guides installation.
---

# Browser CLI Testing & Performance Profiling Skill

This skill provides token-efficient workflows for testing OneTrickUI in a real Chromium browser without the heavy token overhead of full Playwright test script generation or raw MCP DOM dumps.

## 1. Prerequisites & Installation Policy

1. **Prefer Local `package.json` (`devDependencies`) Over Global Installs**:
   - **Do NOT install `chrome-devtools-mcp` or `@playwright/cli` globally (`npm install -g`).**
   - Both `chrome-devtools-mcp` and `@playwright/cli` are installed locally in this repository's `package.json` `devDependencies` and should be invoked via `./node_modules/.bin/chrome-devtools` and `./node_modules/.bin/playwright-cli` (or `npx playwright-cli`).
   - If either npm package is ever missing from `node_modules`, install it locally into `devDependencies`:
     ```bash
     npm install -D chrome-devtools-mcp @playwright/cli
     ```
2. **Global Homebrew Binary (`aeroxy/tap/chrome-devtools`)**:
   - Aeroxy's `chrome-devtools` is a native Rust binary distributed via Homebrew (`/opt/homebrew/bin/chrome-devtools`) rather than npm.
   - Check if `/opt/homebrew/bin/chrome-devtools` is present first. If it is not installed, **warn the user that it requires a global Homebrew installation** (`brew install aeroxy/tap/chrome-devtools`) before installing it.
3. **Avoiding Binary Name Collisions**:
   - Because both `aeroxy/tap/chrome-devtools` and `chrome-devtools-mcp` provide an executable named `chrome-devtools`, always invoke:
     - Aeroxy Rust CLI via `/opt/homebrew/bin/chrome-devtools`
     - Google Chrome DevTools MCP CLI via `./node_modules/.bin/chrome-devtools`
     - Playwright CLI via `./node_modules/.bin/playwright-cli` (or `npx playwright-cli`)

---

## 2. Task-Based Recommendation Guide (Choose the Right Tool for the Job)

Recommend and use the appropriate tool among the 3 based on the specific task at hand:

| Task / Scenario | Recommended Tool | Why It Wins for This Task |
|-----------------|------------------|---------------------------|
| **Fast interactive UI flows, `network --toon` / `console` buffer drains, attaching to your live desktop Chrome, Markdown page extraction (`read-page`), URL blocking (`--block-url`), or V8 heap leak diffing** | **1. Aeroxy Chrome DevTools CLI**<br>(`/opt/homebrew/bin/chrome-devtools`) | Native Rust binary + persistent Unix socket daemon (~10ms per command). Zero Node startup latency, built-in `wait-for`, compact TOON network tables, and can attach directly to either an unattended headless Chrome or your signed-in desktop Chrome (`chrome://inspect/#remote-debugging`). |
| **3G / 4G network throttling (`Slow 3G`, `Fast 3G`, `Slow 4G`, `Fast 4G`), CPU throttling (`--cpuThrottlingRate`), Core Web Vitals (`LCP`, `CLS`, `TTFB`), and DevTools performance traces** | **2. Google Chrome DevTools MCP CLI**<br>(`./node_modules/.bin/chrome-devtools`) | Built-in DevTools trace engine (`performance_start_trace`, `performance_analyze_insight`) and preset mobile/cellular network condition emulation (`emulate --networkConditions="Fast 3G"`). |
| **Ultra-low-token UI assertions, searching large pages for specific text/buttons (`find "<text>"`), and clicking by `ref` without loading the accessibility tree into LLM context** | **3. Playwright CLI**<br>(`./node_modules/.bin/playwright-cli`) | Saves full YAML accessibility snapshots to `.playwright-cli/` on disk instead of stdout, and `find "<query>"` returns only the matching 5–10 lines with stable element `ref` IDs (`e139`). |

---

## 3. Local Dev Authentication Bypass (`/action/dev-login`)

`http://localhost:<port>` (e.g., `http://localhost:5173` or the branch-specific Worktrunk port) supports a development-only authentication route (`NODE_ENV !== 'production'`) that sets a valid signed `__auth_session` cookie without requiring interactive Bungie OAuth:

- **Default test user (`Zone 6 Weegee`, `TTXWDT9pzDEA0XiO1iAc`)**:
  ```
  http://localhost:5173/action/dev-login?redirectTo=/profile/TTXWDT9pzDEA0XiO1iAc/c/2305843009261519028/loadouts
  ```
- **Custom user**:
  ```
  http://localhost:5173/action/dev-login?userId=<USER_ID>&redirectTo=/profile/<USER_ID>
  ```

---

## 4. Tool 1: Aeroxy Chrome DevTools CLI (`/opt/homebrew/bin/chrome-devtools`)

### Option A: Unattended Headless Chrome Recipe (No Approval Dialog)
```bash
export CHROME_USER_DATA_DIR="/tmp/aeroxy-cdp-profile"
CDT="/opt/homebrew/bin/chrome-devtools"
rm -rf "$CHROME_USER_DATA_DIR" && mkdir -p "$CHROME_USER_DATA_DIR"
$CDT kill-daemon --force 2>/dev/null || true

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --remote-debugging-port=0 \
  --user-data-dir="$CHROME_USER_DATA_DIR" \
  --no-first-run --no-default-browser-check \
  about:blank >/dev/null 2>&1 &

for _ in $(seq 1 40); do
  [ -f "$CHROME_USER_DATA_DIR/DevToolsActivePort" ] && break
  sleep 0.25
done

# Get the friendly word-pair target ID (e.g. sharp-owl)
$CDT list-pages
```

### Option B: Attach to User's Running Desktop Chrome
Requires `chrome://inspect/#remote-debugging` enabled in Chrome. Do **not** set `CHROME_USER_DATA_DIR`:
```bash
/opt/homebrew/bin/chrome-devtools list-pages
```
*(If a connection attempt times out waiting for the Chrome approval dialog, retry at most once, then ask the user to approve the prompt in Chrome — never run `kill-daemon` to fix a connection prompt).*

### Navigate, Interact, Drain Network/Console, and Inspect
Always pin commands with `--target <word-pair>` from `list-pages` or `navigate` output:
```bash
# Navigate and wait for text
$CDT --target <target> navigate "http://localhost:5173/action/dev-login?redirectTo=/profile/TTXWDT9pzDEA0XiO1iAc/c/2305843009261519028/loadouts?hasSimilar=true" --viewport 1440x900
$CDT --target <target> wait-for "Similar" --timeout 5000

# Click by CSS selector (e.g. data-testid)
$CDT --target <target> click '[data-testid="similar-loadouts-trigger"]'
$CDT --target <target> wait-for "Primary Target" --timeout 5000

# Drain accumulated Fetch/XHR network requests in compact TOON format
$CDT --target <target> network --toon --type Fetch --type XHR

# Drain console errors/warnings
$CDT --target <target> console --type error --type warning

# Inspect accessibility tree (use default text format + grep; avoid --toon on snapshot as it dumps raw AX properties)
$CDT --target <target> snapshot | grep -E "Primary Target|High Similarity|Base Similarity|Merge Selected"

# Extract clean Markdown representation of the page
$CDT --target <target> read-page
```

### Cleanup Unattended Headless Instance
```bash
$CDT kill-daemon --force 2>/dev/null || true
pkill -f "/tmp/aeroxy-cdp-profile" 2>/dev/null || true
rm -rf /tmp/aeroxy-cdp-profile
```

---

## 5. Tool 2: Google Chrome DevTools MCP CLI (`./node_modules/.bin/chrome-devtools`)

Uses the local `chrome-devtools-mcp` package installed in `package.json`.

### Start & Authenticate
```bash
./node_modules/.bin/chrome-devtools start --headless
./node_modules/.bin/chrome-devtools navigate_page 1 --type=url --url="http://localhost:5173/action/dev-login?redirectTo=/profile/TTXWDT9pzDEA0XiO1iAc/c/2305843009261519028/loadouts"
```

### Emulate 3G / 4G Network & CPU Throttling
Valid `--networkConditions` values: `"Offline"`, `"Slow 3G"`, `"Fast 3G"`, `"Slow 4G"`, `"Fast 4G"`.
```bash
# Emulate Fast 3G (or Slow 4G / Fast 4G)
./node_modules/.bin/chrome-devtools emulate 1 --networkConditions="Fast 3G"

# Emulate Slow 4G + 4x CPU slowdown
./node_modules/.bin/chrome-devtools emulate 1 --networkConditions="Slow 4G" --cpuThrottlingRate=4

# Reset throttling back to normal
./node_modules/.bin/chrome-devtools emulate 1
```

### Record Cold Load Performance Trace (Core Web Vitals & Insights)
```bash
./node_modules/.bin/chrome-devtools performance_start_trace 1 --reload=true --autoStop=true --ignoreCache=true
```
To drill into a specific insight returned by the trace:
```bash
./node_modules/.bin/chrome-devtools performance_analyze_insight 1 <insightSetId> <insightName>
```

### Stop the Browser
```bash
./node_modules/.bin/chrome-devtools stop
```

---

## 6. Tool 3: Playwright CLI (`./node_modules/.bin/playwright-cli`)

Uses the local `@playwright/cli` package installed in `package.json`. Writes full snapshots to `.playwright-cli/` on disk and lets you query specific text/elements with `find`:

```bash
# 1. Open and authenticate
./node_modules/.bin/playwright-cli open "http://localhost:5173/action/dev-login?redirectTo=/profile/TTXWDT9pzDEA0XiO1iAc/c/2305843009261519028/loadouts"

# 2. Search the page snapshot for specific text (very low token output)
./node_modules/.bin/playwright-cli find "Similar"

# 3. Click or hover using the ref ID from find output (without @ prefix, e.g. e259)
./node_modules/.bin/playwright-cli click e259
./node_modules/.bin/playwright-cli find "Primary Target"

# 4. Close and clean up temporary snapshot logs
./node_modules/.bin/playwright-cli close
rm -rf .playwright-cli
```
