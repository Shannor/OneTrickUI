---
name: jsx-meta-tags
description: >
  Guidelines for managing page metadata in this repository. Enforces rendering <title>, <meta>,
  and <link> tags directly within React component JSX HTML head elements instead of exporting a meta function from route files.
---

# JSX Meta Tags Guidelines

In this repository, page metadata (titles, descriptions, OpenGraph tags, Twitter cards, canonical links) MUST be defined directly within the **component JSX** (HTML head tags) of route files, rather than using exported `meta` functions (`export function meta(...)` / `export const meta = ...`).

## Core Rules

1. **Do NOT Export `meta` Functions in Route Modules**:
   - Avoid exporting `function meta()` or `const meta = ...` in route files under `app/routes/`.
   - All dynamic metadata MUST be handled in the component JSX rendering.

2. **Render Head Meta Tags Directly in Component JSX**:
   - Place `<title>`, `<meta>`, and `<link>` tags at the top of the route component's JSX return value.

3. **Required Meta Tags for Route Components**:
   - `<title>`: Dynamic title combining entity name, display name (if applicable), and brand suffix (e.g., `"{Session Name} - {Guardian Name} | 1 Trick"`).
   - `<meta name="description" content="..." />`: Descriptive summary of page content.
   - **OpenGraph Tags**:
     - `<meta property="og:title" content="..." />`
     - `<meta property="og:description" content="..." />`
     - `<meta property="og:type" content="website" />`
     - `<meta property="og:url" content="..." />`
   - **Twitter Card Tags**:
     - `<meta name="twitter:card" content="summary_large_image" />`
     - `<meta name="twitter:title" content="..." />`
     - `<meta name="twitter:description" content="..." />`
   - **Canonical Link**:
     - `<link rel="canonical" href="..." />`

4. **Dynamic Metadata in Sub-routes & Parent Routes**:
   - Use custom route hooks (e.g., `useProfileData()`, `useOptionalProfileData()`, `useSessionData()`) to access profile and route state.
   - Sub-routes (e.g., `session-games.tsx`, `session-metrics.tsx`) MUST dynamically build titles using available route data rather than hardcoding static fallback titles like `<title>Session Games</title>`.

5. **Branding Standard**:
   - The brand suffix MUST be `"1 Trick"` (never "One Trick").

## Example

```tsx
import {
  useOptionalProfileData,
  useSessionData,
} from '~/hooks/use-route-loaders';

import type { Route } from './+types/session';

export function Session({ loaderData }: Route.ComponentProps) {
  const { profile } = useOptionalProfileData() ?? {};
  const { session, path } = loaderData;

  const sessionName = session?.name || 'Session';
  const displayName = profile?.displayName;
  const sessionNameText = session?.name ? ` ${session.name}` : '';

  const pageTitle = displayName
    ? `${sessionName} - ${displayName} | 1 Trick`
    : `${sessionName} | 1 Trick`;

  const pageDescription =
    session?.description ||
    `View games, metrics, and details for ${displayName ?? 'player'}'s session${sessionNameText} on 1 Trick.`;

  return (
    <div className="flex flex-col gap-4">
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={path} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <link rel="canonical" href={path} />

      {/* Page content */}
    </div>
  );
}
```
