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
    id: '2026-11-21',
    date: 'November 21, 2026',
    title: 'Search Guardians by Bungie Name',
    summary:
      'Find any Destiny 2 Guardian directly from the sidebar—jump straight into recorded 1 Trick profiles and character overviews, or share 1 Trick with friends who have not started recording yet.',
    changes: [
      {
        type: 'feature',
        text: 'Search for Guardians by Bungie Name (such as Guardian#1234) directly from the Search link in the sidebar, whether you are signed in or browsing as a guest.',
      },
      {
        type: 'feature',
        text: 'Jump straight into recorded 1 Trick profiles and individual Hunter, Titan, or Warlock character pages directly from search results.',
      },
      {
        type: 'feature',
        text: 'Invite friends who have not recorded on 1 Trick yet with one-click Share 1 Trick and Start Recording prompts on unrecorded Guardian results.',
      },
    ],
  },
  {
    id: '2026-11-17',
    date: 'November 17, 2026',
    title: 'Competitive Division & Score Tracking Across Sessions',
    summary:
      'Opt in to track your Competitive Division rank and score whenever you start a session, and see your starting rank, ending rank, promotions, and net point gain or loss across active and completed sessions.',
    changes: [
      {
        type: 'feature',
        text: 'Enable "Track Competitive Score" when starting a session from your Overview, Sessions, or Fireteam page to automatically snapshot your current Competitive Division rank and points.',
      },
      {
        type: 'feature',
        text: 'See your starting Competitive Division badge and score while your session is live, and review your full start-to-end rank progression, promotions or relegations, and net point delta (+ / - pts) once the session completes.',
      },
    ],
  },
  {
    id: '2026-11-16',
    date: 'November 16, 2026',
    title:
      'One-Click Session Controls, Recent Form Trends & Rich Social Link Previews',
    summary:
      'Start or stop live Crucible sessions directly from your Overview page, track your recent win rate and K/D momentum at a glance, compare your top loadouts side by side, and share rich visual preview cards across Discord, X/Twitter, and iMessage.',
    changes: [
      {
        type: 'feature',
        text: 'Start or stop live Crucible tracking sessions with a single click directly from your Overview page without leaving your dashboard.',
      },
      {
        type: 'feature',
        text: 'See your recent Crucible momentum at a glance with the new Recent Form summary, complete with win rate and K/D trend indicators and quick links to previous sessions.',
      },
      {
        type: 'feature',
        text: 'Share any Session link to automatically display a rich visual summary card featuring your Guardian emblem, session status, total matches, win rate, K/D ratio, and efficiency.',
      },
      {
        type: 'feature',
        text: 'Share any Loadout link to showcase a custom visual build card highlighting your subclass, Kinetic, Energy, and Power weapons, and Exotic armor.',
      },
      {
        type: 'feature',
        text: 'Copy a ready-to-paste Destiny Item Manager (DIM) search query for all of your equipped weapons and armor directly from any Loadout page to quickly highlight and equip your exact build in DIM.',
      },
      {
        type: 'improvement',
        text: 'Compare your top 3 performing loadouts side by side on desktop in a streamlined horizontal layout with a clear "All Modes · Min. 10 Games" qualification badge.',
      },
      {
        type: 'improvement',
        text: 'Switch between Guardians more easily on mobile with a compact character header and jump straight to your Fireteam from the Overview page.',
      },
      {
        type: 'improvement',
        text: 'Shared Activity and Character Overview links now display the Crucible map artwork and your Guardian emblem banner in social previews.',
      },
      {
        type: 'fix',
        text: 'Browser tab titles, descriptions, and shared link previews now update accurately as you navigate across every page and tab.',
      },
    ],
  },
  {
    id: '2026-11-15',
    date: 'November 15, 2026',
    title: 'Similar Loadouts Comparison, Multi-Merge & Faster Mobile Loading',
    summary:
      'Easily find, compare, and batch-merge similar loadouts into a single primary build, inspect gear rolls and stat differences on hover, and enjoy faster page loads on mobile connections.',
    changes: [
      {
        type: 'feature',
        text: 'Filter your loadouts with the new "Has Similar Loadouts" toggle and see at a glance how many similar builds exist directly on each loadout card.',
      },
      {
        type: 'feature',
        text: 'See loadouts that are similar in the new "Similar" tab and merge them together so your stats are more easily tracked—complete with High and Base Similarity groups, one-click Primary target swapping, and a live preview of your combined Matches, Win Rate, and K/D.',
      },
      {
        type: 'improvement',
        text: 'Hover over any gear item, Exotic armor badge, Power weapon badge, or class stat difference to compare weapon perks, armor stat rolls, and stat totals side by side.',
      },
      {
        type: 'improvement',
        text: 'Streamlined session loadout merging to only list compatible builds sharing the same weapons and subclass, with clear status feedback while match history is reassigned.',
      },
      {
        type: 'improvement',
        text: 'Significantly faster Loadouts page and character banner loading on 3G and 4G mobile networks.',
      },
    ],
  },
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
