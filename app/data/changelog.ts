export type ChangeType = 'feature' | 'improvement' | 'fix';

export interface ChangelogItem {
  type: ChangeType;
  text: string;
}

export interface ReleaseNote {
  id: string;
  date: string;
  title: string;
  summary?: string;
  changes: ChangelogItem[];
}

export const CHANGELOG: ReleaseNote[] = [
  {
    id: '2026-08-29',
    date: 'August 29, 2026',
    title: 'Session & Loadout Management & Non-Blocking Updates',
    summary:
      'Easily manage sessions and loadouts with streamlined delete dialogs, instant link sharing, non-blocking form saves, and visual toast notifications.',
    changes: [
      {
        type: 'improvement',
        text: 'Updated the Overview page to feature a single active session or most recent session card instead of listing multiple past sessions.',
      },
      {
        type: 'improvement',
        text: 'Featured an interactive K/D and Efficiency timeline performance graph directly on the session overview page.',
      },
      {
        type: 'improvement',
        text: 'Added class stats radar charts and class armor loadout breakdowns with socket mods and individual stat bars on session views.',
      },
      {
        type: 'improvement',
        text: 'Redesigned Top Loadouts cards to showcase weapon and exotic gear icons along with item names and exotic rarity highlighting.',
      },
      {
        type: 'improvement',
        text: 'Standardized loadout performance metrics (Games, Win Rate, K/D, Efficiency) with HUD labels and positive/negative win rate indicators matching the session cards.',
      },
      {
        type: 'improvement',
        text: 'Enhanced visual identity with a futuristic boxy header font (Iceland) paired with clean body text (Inter) across titles, sidebar branding, and stat callouts.',
      },
      {
        type: 'improvement',
        text: 'Standardized numeric stat callouts (Matches, Win Rate, K/D, Efficiency) and uppercase HUD labels across session feeds, game lists, and metrics summaries for improved readability.',
      },
      {
        type: 'improvement',
        text: 'View comprehensive session performance summaries—including matches played, win rate, K/D ratios, game modes, and top weapons—at a glance directly from the session list.',
      },
      {
        type: 'feature',
        text: 'Easily delete unwanted sessions or loadout snapshots with a quick confirmation prompt.',
      },
      {
        type: 'feature',
        text: 'Share your loadout and session links with a single click and instant clipboard copy feedback.',
      },
      {
        type: 'improvement',
        text: 'Cleaned up session and loadout headers by separating the delete action into a compact trash icon button with a hover description.',
      },
      {
        type: 'improvement',
        text: 'Save session and loadout details seamlessly in the background without losing your place or reloading the page.',
      },
      {
        type: 'improvement',
        text: 'Receive instant visual confirmation via toast notifications whenever you save changes to a session or loadout.',
      },
    ],
  },
  {
    id: '2026-08-28',
    date: 'August 28, 2026',
    title: 'Navigation Suite, Condensed Loadouts & Activity Breakdown',
    summary:
      'Mobile back button with safe history fallbacks, dynamic breadcrumbs featuring real Session and Loadout names, exact sidebar route highlighting, and condensed loadout views.',
    changes: [
      {
        type: 'feature',
        text: 'Added a mobile back button with safe history fallback handling so users can navigate backwards without leaving the app.',
      },
      {
        type: 'feature',
        text: 'Introduced dynamic breadcrumbs displaying actual Session, Loadout, Activity, and Profile names.',
      },
      {
        type: 'improvement',
        text: 'Added exact route matching and visual active state highlighting to the sidebar navigation.',
      },
      {
        type: 'improvement',
        text: 'Directly navigate signed-in users with a selected character to their Overview page from the home landing CTA.',
      },
      {
        type: 'improvement',
        text: 'Improved the Activity page layout and design. Showing more information the user in a more digestible format.',
      },
      {
        type: 'improvement',
        text: 'Renamed categories to make them clearer as to what they lead to.',
      },
      {
        type: 'improvement',
        text: 'Sorted weapons in PlayerCard automatically by Destiny 2 equipment slots (Kinetic → Energy → Power) and kills.',
      },
      {
        type: 'fix',
        text: 'Fixed weapon card width constraints to allow full-width grid column alignment across screen breakpoints.',
      },
    ],
  },
  {
    id: '2026-08-25',
    date: 'August 25, 2026',
    title: 'Community Sessions & Modernized Date Formatting',
    summary:
      'Browse PvP sessions across Guardians with pagination, filter active vs completed runs, and enjoy faster, error-free date rendering.',
    changes: [
      {
        type: 'feature',
        text: 'Introduced paginated Sessions page with status filters for active and completed runs.',
      },
      {
        type: 'improvement',
        text: 'Updated Top Loadouts empty states to explain actions to the user',
      },
      {
        type: 'improvement',
        text: 'Renamed public tracking feed to "Sessions" and user profile logs to "My Sessions".',
      },
      {
        type: 'fix',
        text: 'Eliminated server hydration mismatches and modernized relative time formatting.',
      },
    ],
  },
];
