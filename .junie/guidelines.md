# Junie Guidelines

This repository uses Junie (JetBrains autonomous programmer) to assist with development tasks. These guidelines standardize how Junie should operate within this project and across the workspace.

Last updated: 2025-08-10 19:25 local time

## Objectives
- Make the minimal necessary changes to meet the issue requirements.
- Keep maintainers informed every step using the required `<UPDATE>` format.
- Prefer small, safe, and reversible edits.

## Required Response Format
Every Junie message must have TWO parts in this exact order:
1) `<UPDATE>` block with:
   - `<PREVIOUS_STEP>`: Brief summary of outcomes since the last step.
   - `<PLAN>`: Numbered list; include progress marks at the end of each line: ✓ (done), * (in progress), ! (failed). Keep sub-points concise and marked as well.
   - `<NEXT_STEP>`: The immediate next action.
2) Exactly one tool call that corresponds to `<NEXT_STEP>`.

Never call a tool before the `<UPDATE>` block. Never omit the tool call.

## Tools and Execution Rules
- Use the provided tools (search_project, get_file_structure, open, create, search_replace, run_test, build, etc.).
- Do not mix terminal commands with special tools in the same step.
- Do not create files outside this repository.
- When searching, prefer search_project over shell commands for discovery.
- When editing files, prefer search_replace with exact unique search blocks.
- Use create only to add new files; re-run create to overwrite only files you created in the current session.
- Use run_test for tests and build to compile when necessary.
- If unclear, use ask_user to request clarification.

## Development Workflow
1. Understand the issue and craft an initial plan in `<PLAN>`. Use concise numbered points with progress marks. Include sub-points if needed.
2. Explore the codebase:
   - Use search_project to locate relevant files, symbols, and text.
   - Use get_file_structure and open to inspect target areas.
3. Reproduce issues (if applicable) with a minimal script or by running targeted tests.
4. Implement minimal changes:
   - Keep diffs small and focused on the issue.
   - Follow project conventions.
5. Verify:
   - Re-run reproduction steps/tests.
   - Ensure no related tests regress.
   - Run npm run typecheck to make sure typescript compiles. If not fix the compile errors.
6. Report:
   - Summarize changes and outcomes in `<UPDATE>`.
   - If complete, mark plan items ✓ and proceed to submit when asked.

## Coding Conventions
- TypeScript/React (this repo):
  - Use ES modules, adhere to existing linting/formatting (Prettier/Tailwind conventions if present).
  - Favor explicit types in public APIs; allow inference in local scope when clear.
  - Keep components small, pure, and accessible.
  - Avoid breaking changes to routes and shared components without coordination.
- Styling
  - When styling components use tailwind styles and any Shadcn components 
  - Use the `cn` utility method for joining classnames inside components or divs
- Tests:
  - Prefer existing testing framework patterns.
  - Add targeted tests when fixing bugs.

## Commit and Change Scope
- One issue = minimal set of changes.
- Prefer additive changes over refactors unless necessary for the fix.
- Avoid speculative optimizations.

## Communication Standards
- Be transparent about findings, blockers, and edge cases in `<PREVIOUS_STEP>`.
- Keep `<NEXT_STEP>` focused on a single concrete action.
- If the requirements appear to conflict, confirm with ask_user.

## Repository-Specific Notes
- Project root: /Users/shannortrotty/WebstormProjects/oneTrickUI
- Frontend stack: Remix/React with Vite, Tailwind, TypeScript.
- Do not modify node_modules or generated files (e.g., app/api/types.gen.ts) unless the task explicitly requires regeneration.

## Safety
- Back up via minimal, reversible edits.
- Use search_replace with precise unique blocks to avoid unintended changes.
- When unsure, pause and ask for guidance.

