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
    title: 'Activity Breakdown, Condensed Loadouts & Performance Logging',
    summary:
      'Collapsible activity player cards, Destiny 2 weapon slot sorting, expandable loadout perks, responsive class stats, SEO meta tags, and GCP structured logging.',
    changes: [
      {
        type: 'feature',
        text: 'Added collapsible player loadout breakdown to Activity view supporting up to 12 player cards cleanly.',
      },
      {
        type: 'feature',
        text: 'Added expandable weapon perks in condensed loadouts for fast loadout comparison and merging.',
      },
      {
        type: 'feature',
        text: 'Extracted ClassStatsRadar for detailed loadout screens while maintaining lightweight stat pills for cards.',
      },
      {
        type: 'feature',
        text: 'Integrated structured Pino Logger across client and server loaders for GCP JSON log ingestion.',
      },
      {
        type: 'improvement',
        text: 'Sorted weapons in PlayerCard automatically by Destiny 2 equipment slots (Kinetic → Energy → Power) and kills.',
      },
      {
        type: 'improvement',
        text: 'Added compact SubClassHeader above weapon grids with expandable subclass abilities.',
      },
      {
        type: 'improvement',
        text: 'Redesigned ClassStats to render 3 stats per row on mobile and flex pills on desktop.',
      },
      {
        type: 'improvement',
        text: 'Added prominent "View Game Details" CTA buttons to session games list for clearer navigation.',
      },
      {
        type: 'improvement',
        text: 'Added SEO meta tags, OpenGraph titles, and canonical resource routes across profile and activity pages.',
      },
      {
        type: 'fix',
        text: 'Fixed Activity page player cards so loadout details start collapsed by default.',
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
