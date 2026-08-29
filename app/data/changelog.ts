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
      'Redesigned Session and Loadout management headers and update forms, introduced trash icon delete confirmation dialogs, non-blocking form submissions with toast notifications, and share buttons.',
    changes: [
      {
        type: 'feature',
        text: 'Added session and loadout deletion dialogs with action handlers for deleting sessions and loadout snapshots.',
      },
      {
        type: 'feature',
        text: 'Added share buttons for loadouts and sessions with instant copy-to-clipboard feedback tooltips.',
      },
      {
        type: 'improvement',
        text: 'Redesigned session and loadout header actions, moving the delete action to a trash icon button with a hover tooltip separated from the Save button.',
      },
      {
        type: 'improvement',
        text: 'Converted session and loadout update forms to fetcher-based submissions with localized button loading indicators and toast feedback.',
      },
      {
        type: 'improvement',
        text: 'Applied responsive max-width layout constraints for form description boxes on desktop displays.',
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
