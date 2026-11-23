---
name: implement-ticket
description: >
  End-to-end workflow for implementing a GitHub issue or Jira ticket: (1) create an isolated
  Git worktree from main using the `wt` (Worktrunk) CLI, (2) implement and test the changes
  and add a user-centric changelog entry, (3) spin up the local dev server on the worktree's
  port, share preview URLs along with the specific user(s)/routes that showcase the feature,
  and ask for review, and (4) commit and open a PR to hand off for the PR review phase. Use
  whenever asked to implement a ticket, issue, or feature end-to-end.
---

# Implement Ticket Workflow

Follow this workflow whenever implementing a GitHub issue or Jira ticket so that `main` stays clean, every ticket runs on its own isolated Worktrunk (`wt`) worktree and port, `app/data/changelog.ts` is kept up to date, the user gets an immediate preview URL with demo user context to review, and a Pull Request is ready for the review phase.

---

## Step 1: Isolate on a Worktree (`wt` CLI)

1. **Check Current Branch & Worktrees**:
   ```bash
   git branch --show-current
   /opt/homebrew/bin/wt list
   ```
2. **Create a Worktree When on `main` (Safest Default)**:
   - Never commit or leave feature work directly on `main`.
   - Prefer creating a new **worktree** with `wt` inside `.worktrees/<slug>` (which is gitignored and inside the workspace root so IDE/agent file and command tools have full access):
     ```bash
     /opt/homebrew/bin/wt switch --create <type>/<short-ticket-slug> --base=^ --path .worktrees/<type>-<short-ticket-slug>
     ```
     Examples:
     - `/opt/homebrew/bin/wt switch --create feat/issue-38-copy-dim-query --base=^ --path .worktrees/feat-issue-38-copy-dim-query`
     - `/opt/homebrew/bin/wt switch --create fix/issue-42-session-filter --base=^ --path .worktrees/fix-issue-42-session-filter`
   - Run all subsequent file edits and commands inside `.worktrees/<type>-<short-ticket-slug>`.
   - **If changes were already started on `main`**:
     - Copy/apply the modified and untracked files to the new worktree directory, then reset `main` (`git checkout -- .` and remove untracked ticket files on `main`) so `main` remains pristine.

---

## Step 2: Implement Changes, Update Changelog & Run Automated Checks

1. **Understand the Ticket**:
   - Read the issue/ticket details thoroughly (`gh issue view <number>` for GitHub issues, or `/opt/homebrew/bin/jira` via the `jira-cli` skill for Jira tickets).
2. **Implement & Test**:
   - Make the required code changes inside the worktree directory.
   - Add or update unit/component tests covering the acceptance criteria.
3. **Add Changes to the Changelog (`app/data/changelog.ts`)**:
   - Follow the `add-changelog` skill (`.agents/skills/add-changelog/SKILL.md`):
     - Add a user-centric entry (`feature`, `improvement`, or `fix`) to `app/data/changelog.ts` under the current date's release note (or create a new top entry for today's date if one does not exist yet).
     - Focus on what Guardians/users can now do and the benefit to their workflow, avoiding internal code or implementation details.
4. **Run Automated Checks**:
   - Run tests and typecheck inside the worktree before moving on:
     ```bash
     npm test
     npm run typecheck
     ```

---

## Step 3: Spin Up Dev Server, Share Preview URL + Demo User(s) & Ask for Review

1. **Determine the Worktree Dev Port**:
   - In OneTrickUI, `vite.config.ts` resolves a deterministic port per branch via Worktrunk:
     ```bash
     /opt/homebrew/bin/wt step eval '{{ branch | hash_port }}'
     ```
     *(Falls back to `5173` if not in a named branch).*
2. **Start the Dev Server (Always Detached)**:
   - **Never** leave `npm run dev` attached to an agent shell task (background tasks hit the 600s command timeout, and plain `nohup ... &` is killed on process-group teardown).
   - Always spawn the dev server in a **new detached session** (`detached: true` + `stdio: ['ignore', out, out]` + `child.unref()`), write logs to `/tmp/<repo>-<port>-dev.log`, and poll `http://localhost:<port>` until it returns HTTP `200`:
     ```bash
     node -e '
     const { spawn } = require("node:child_process");
     const fs = require("node:fs");
     const out = fs.openSync("/tmp/dev-server-<port>.log", "w");
     const child = spawn("npm", ["run", "dev"], {
       cwd: process.cwd(),
       detached: true,
       stdio: ["ignore", out, out],
       env: { ...process.env },
     });
     child.unref();
     console.log("Spawned detached dev server PID:", child.pid);
     '
     ```
   - Verify in a follow-up check (`lsof -i :<port>` / `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:<port>/`) that the detached server remained alive after the spawn command exited.
   - *(Tip: Stop a detached server later via `lsof -ti :<port> | xargs kill`).*
3. **Identify Demo User(s) & Deep Links That Showcase the Change**:
   - Provide the user with:
     - **Base Dev URL & Port**: `http://localhost:<port>`
     - **Demo User(s)**: Specify the exact user profile(s), character(s), and snapshot/session IDs that demonstrate the feature change:
       - **Owner / Authenticated View**: Use the local `/action/dev-login` endpoint so the user can authenticate in one click without Bungie OAuth:
         ```text
         http://localhost:<port>/action/dev-login?userId=TTXWDT9pzDEA0XiO1iAc&redirectTo=/profile/TTXWDT9pzDEA0XiO1iAc/c/2305843009261519028/loadouts/<snapshotId>
         ```
         *(Default test user: **Zone 6 Weegee** — `userId`: `TTXWDT9pzDEA0XiO1iAc`, Hunter `characterId`: `2305843009261519028`).*
       - **Public / Non-Owner View** (if relevant for comparison): Provide the direct `/profile/<userId>/...` URL or a secondary `userId` via `/action/dev-login?userId=<otherUserId>&redirectTo=...`.
4. **Ask for Review**:
   - Present the preview links and changelog update to the user and ask them to review the changes before/while finalizing the PR.

---

## Step 4: Commit & Open Pull Request (Hand Off to PR Review Phase)

1. **Stage & Commit**:
   - Follow the `git-commit` and `make-pr` skills.
   - Stage only the files belonging to the ticket, including `app/data/changelog.ts` (`git status` to verify no scratch artifacts are included).
   - Commit with a clear message explaining the **why** and **what**, ending with `Closes #<issue-number>` (or `Closes: <TICKET_ID>`).
2. **Push & Create PR**:
   - Push the worktree branch to `origin`:
     ```bash
     git push -u origin <branch-name>
     ```
   - Create the Pull Request using `gh pr create` (or `bb pr create` for Bitbucket) with:
     - **Summary** (what & why)
     - **Changes** (grouped by concern)
     - **How to Test** (including the local preview URL pattern and demo user steps)
     - **Ticket reference** (`Closes #<issue-number>`)
3. **Hand Off for Review**:
   - Share the created PR link alongside the changelog entry and ask the user to review and kick off the PR review phase (`pr-review` / `pr-comments-review`).
