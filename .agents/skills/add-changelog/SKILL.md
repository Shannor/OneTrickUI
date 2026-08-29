---
name: add-changelog
description: >
  Guidelines for authoring changelog entries in app/data/changelog.ts.
  Ensures changelog items focus on user-centric actions, benefits, and impact,
  rather than internal code implementation details.
---

# User-Centric Changelog Guidelines

When creating or updating release notes in `app/data/changelog.ts`, all entries MUST focus on **what the user can do and how it affects them**, rather than technical code implementation details.

## Core Principles

1. **User-Centric Perspective**:
   - Describe what new capabilities, workflows, or improvements are now available to Guardians and users.
   - Explain the direct benefit or impact on the user's experience.

2. **Avoid Technical Code Details**:
   - Do NOT mention variable names, component names, hooks, internal state, fetchers, refactoring details, or technical stack internals (e.g., avoid mentioning `useFetcher`, `useState`, `schema changes`, `refactored components`, etc.).
   - Instead of *"Converted forms to useFetcher for non-blocking submission"*, write *"Save session and loadout updates instantly without full page reloads."*
   - Instead of *"Added DeleteSessionDialog component with client action handler"*, write *"Easily delete unwanted sessions or loadout snapshots with a quick confirmation prompt."*

3. **Classification Types**:
   - `feature`: A brand new capability or action the user can perform.
   - `improvement`: An enhancement to an existing user workflow, UI visual polish, or clarity.
   - `fix`: Resolving an issue or bug that previously impacted the user experience.

4. **Structure of a Release Note**:
   - `id`: YYYY-MM-DD format (e.g., `'2026-08-29'`).
   - `date`: Friendly date format (e.g., `'August 29, 2026'`).
   - `title`: Catchy, high-level summary title focused on new user capabilities.
   - `summary`: 1-2 sentence overview of the highlights.
   - `changes`: Array of `{ type, text }` items written from the user's point of view.

## Examples

### Good (User-Centric)

- ✅ *"Easily delete sessions and loadout snapshots directly from the header using the new trash icon action."*
- ✅ *"Share your loadout links with a single click and instant clipboard copy feedback."*
- ✅ *"Save session details without losing your place—updates now process seamlessly in the background."*
- ✅ *"Get instant visual confirmation with toast notifications whenever you update a session or loadout."*

### Bad (Code-Centric - Avoid)

- ❌ *"Created DeleteSessionDialog component and added /action/delete-session route handler."*
- ❌ *"Added share button rendering logic in LoadoutHeaderActions.tsx."*
- ❌ *"Refactored forms to use fetcher.Form and useEffect hook for sonner toast calls."*
- ❌ *"Applied md:max-w-md Tailwind class to shrink form container."*
