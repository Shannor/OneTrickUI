---
name: implement-ticket
description: >
  End-to-end workflow for implementing a GitHub issue or Jira ticket: (1) create an isolated
  Git worktree from main using the `wt` (Worktrunk) CLI, (2) implement and test the changes,
  (3) spin up the local dev server on the worktree's port and share preview URLs along with the
  specific user(s)/routes that showcase the feature, and (4) commit and open a PR to hand off
  for the review phase. Use whenever asked to implement a ticket, issue, or feature end-to-end.
---

# Implement Ticket Workflow

Follow this 4-step workflow whenever implementing a GitHub issue or Jira ticket so that `main` stays clean, every ticket runs on its own isolated Worktrunk (`wt`) worktree and port, the user gets an immediate preview URL with demo user context, and a Pull Request is ready for the review phase.

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

## Step 2: Implement Changes & Run Automated Checks

1. **Understand the Ticket**:
   - Read the issue/ticket details thoroughly (`gh issue view <number>` for GitHub issues, or `/opt/homebrew/bin/jira` via the `jira-cli` skill for Jira tickets).
2. **Implement & Test**:
   - Make the required code changes inside the worktree directory.
   - Add or update unit/component tests covering the acceptance criteria.
   - Run tests and typecheck inside the worktree before moving on:
     ```bash
     npm test
     npm run typecheck
     ```

---

## Step 3: Spin Up Dev Server & Share Preview URL + Demo User(s)

1. **Determine the Worktree Dev Port**:
   - In OneTrickUI, `vite.config.ts` resolves a deterministic port per branch via Worktrunk:
     ```bash
     /opt/homebrew/bin/wt step eval '{{ branch | hash_port }}'
     ```
     *(Falls back to `5173` if not in a named branch).*
2. **Start the Dev Server**:
   - Launch `npm run dev` in the background inside the worktree directory and verify it is listening on `http://localhost:<port>`.
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

---

## Step 4: Commit & Open Pull Request (Hand Off to Review Phase)

1. **Stage & Commit**:
   - Follow the `git-commit` and `make-pr` skills.
   - Stage only the files belonging to the ticket (`git status` to verify no scratch artifacts are included).
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
   - Share the created PR link alongside the running local dev server link and demo user instructions so the user can immediately inspect the live app and kick off the review phase.
