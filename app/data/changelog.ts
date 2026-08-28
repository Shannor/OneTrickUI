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
    id: '2026-08-28',
    date: 'August 28, 2026',
    title: 'Condensed Loadouts, Expandable Weapon Perks & Class Stats',
    summary:
      'Easily compare and merge loadouts with condensed previews, expandable weapon perks, responsive class stats, and clear activity CTA buttons.',
    changes: [
      {
        type: 'feature',
        text: 'Added expandable weapon perks in condensed view for fast loadout scanning and merging.',
      },
      {
        type: 'feature',
        text: 'Extracted ClassStatsRadar for detailed loadout screens while keeping player cards lightweight.',
      },
      {
        type: 'improvement',
        text: 'Redesigned ClassStats with a responsive layout (3 per line on mobile, inline flex on desktop).',
      },
      {
        type: 'improvement',
        text: 'Added prominent "View Game Details" CTA buttons to session game lists for clearer navigation.',
      },
      {
        type: 'improvement',
        text: 'Promoted "Expand Loadout Details" actions on player cards for better discoverability.',
      },
      {
        type: 'fix',
        text: 'Fixed Activity page player cards so loadout details start collapsed by default.',
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
