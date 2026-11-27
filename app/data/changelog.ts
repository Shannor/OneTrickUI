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
    id: '2026-11-26',
    date: 'November 26, 2026',
    title:
      'Full Match Scoreboards, Enhanced Weapons & One-Click Fireteam Sessions',
    summary:
      'Review every Guardian in a Crucible match side-by-side with a slide-over loadout inspector, spot enhanced weapons and Exotic catalysts at a glance, and launch tracking sessions for your fireteam in one click.',
    changes: [
      {
        type: 'feature',
        text: 'Inspect the full post-game match roster grouped by Alpha and Bravo teams (or standings in Free-for-All modes), complete with emblem, class, light level, K/D/A, efficiency, color-coded fireteam stack bars, dimmed rows for players who left early, and weapon kill summaries for every Guardian.',
      },
      {
        type: 'feature',
        text: 'Spot Guardians tracked in 1 Trick right on the scoreboard with live subclass and exotic armor previews, then tap any highlighted row to open a responsive side drawer (or mobile bottom sheet) to browse full subclass builds, stats, weapon rolls, and switch between multiple tracked players without losing your place.',
      },
      {
        type: 'feature',
        text: 'Spot enhanced weapons, enhanced perks, and Exotic catalysts at a glance with Destiny-style yellow borders and catalyst sockets across Loadout Cards, Loadout Details, Similar Loadouts, and Activity Performance views.',
      },
      {
        type: 'feature',
        text: 'Start tracking sessions for multiple fireteam teammates at once from the Fireteam page, complete with per-teammate Guardian selection and an optional Competitive Score tracking toggle.',
      },
      {
        type: 'feature',
        text: 'Spot which teammates are already tracking at a glance with live status badges on each fireteam card and one-click links straight to their active session.',
      },
      {
        type: 'improvement',
        text: 'Fireteam bulk starts automatically skip teammates who already have an active session and give clear per-player confirmation feedback so no one is double-tracked.',
      },
      {
        type: 'improvement',
        text: 'Load the Fireteam page faster with active session statuses resolved up front in a single pass.',
      },
    ],
  },
  {
    id: '2026-11-25',
    date: 'November 25, 2026',
    title: 'Mobile Loadout Readability, Touch Controls & Tap-to-Open Tooltips',
    summary:
      'Read loadouts effortlessly on your phone with larger text across every build view, hit every weapon, perk, and sub-page control comfortably, and tap any gear, perk, or stat badge to inspect full tooltip details.',
    changes: [
      {
        type: 'fix',
        text: 'Tap any weapon, armor piece, perk socket, kill stat, or set bonus badge on mobile to open and dismiss its tooltip—including tapping gear pills directly on Loadout and Session cards without accidentally leaving the page.',
      },
      {
        type: 'improvement',
        text: 'Read loadout names, weapon titles, subclass headers, armor pieces, and stat breakdowns much more easily on mobile with larger, higher-legibility typography across Loadouts, Overview, Sessions, and Activity views.',
      },
      {
        type: 'improvement',
        text: 'Tap loadout links, weapon perk expanders, perk and mod sockets, sub-page tabs, and loadout filters comfortably on phones with generously sized touch targets.',
      },
    ],
  },
  {
    id: '2026-11-24',
    date: 'November 24, 2026',
    title: 'Faster Page Loads, Snappier Navigation & Reliable Loadout Merging',
    summary:
      'Open 1 Trick faster even after quiet periods, move across Guardian views smoothly without full-screen loading overlays, enjoy steadier real-time session tracking, and merge multiple similar loadouts at once reliably.',
    changes: [
      {
        type: 'improvement',
        text: 'Load Guardian and Loadout Metrics significantly faster with broader match history, more accurate game mode filtering, and a clear indicator when viewing the most recent subset of your tracked matches.',
      },
      {
        type: 'improvement',
        text: 'Get into your Guardian profile, sessions, and loadouts much faster—even when visiting 1 Trick after quiet periods.',
      },
      {
        type: 'improvement',
        text: 'Browse completed Crucible sessions more smoothly with lighter page downloads, loading live match updates only when a session is actively recording.',
      },
      {
        type: 'improvement',
        text: 'Jump between sidebar views, Guardian characters, and Session or Loadout tabs noticeably faster with hover-warmed transitions.',
      },
      {
        type: 'improvement',
        text: 'Filter, sort, and paginate loadouts or switch between Session and Loadout sub-tabs seamlessly—subtle progress indicators replace the full-screen blurred loading overlay so your controls stay accessible.',
      },
      {
        type: 'fix',
        text: 'Eliminated duplicate background page loads and rapid back-to-back refreshes during active sessions for faster, steadier live stat tracking.',
      },
      {
        type: 'fix',
        text: 'Fixed the loadout stats radar chart collapsing on desktop screens so all six stat labels display cleanly without clipping.',
      },
      {
        type: 'fix',
        text: 'Merge multiple similar loadouts at once reliably without hitting unexpected errors.',
      },
      {
        type: 'improvement',
        text: 'Show clearer error details if a loadout merge request fails instead of reporting a generic network error.',
      },
    ],
  },
  {
    id: '2026-11-23',
    date: 'November 23, 2026',
    title:
      'Guardian-Wide Metrics, Map Swap Insights & Active Armor Set Bonuses',
    summary:
      'Explore a dedicated Metrics view across all recorded loadouts with rolling 5-match trends and strong vs. swap-candidate maps, plus inspect active Armor 3.0 set bonuses across loadouts and comparisons.',
    changes: [
      {
        type: 'feature',
        text: 'Open the new Metrics page from your Guardian sidebar to analyze K/D, Efficiency, Win %, and per-map performance across all of your recorded sessions and loadouts in one place.',
      },
      {
        type: 'feature',
        text: 'Spot Strong maps to keep equipped and Swap Candidate maps where a build struggles, complete with one-tap links to your top-performing loadout on each map.',
      },
      {
        type: 'feature',
        text: 'View active Armor Set Bonuses—including 2-piece, 4-piece, and 2+2 split builds—directly alongside your equipped armor on Loadout Details with set names, tier badges, perk icons, and descriptions.',
      },
      {
        type: 'feature',
        text: 'Spot active armor set bonuses at a glance on Loadout Cards with compact set bonus badges and hover or tap tooltips detailing every unlocked perk.',
      },
      {
        type: 'feature',
        text: 'Compare active Armor Set Bonuses when merging Similar Loadouts to immediately see whether candidate loadouts match or differ from your primary build.',
      },
      {
        type: 'improvement',
        text: 'Read performance clearly with Win/Loss match dots and a 5-game rolling average on focused windows, while large All Time histories stay clean with headline summary numbers.',
      },
      {
        type: 'improvement',
        text: 'Browse large Crucible map pools effortlessly on both desktop and mobile with search, Strong/Swap filters, sortable stats, and a clean open mobile layout.',
      },
      {
        type: 'improvement',
        text: 'Jump into Guardian Overview and individual Loadout pages right away—recent sessions and loadout details now appear immediately while top loadouts and similar-build counts load seamlessly in place.',
      },
      {
        type: 'fix',
        text: 'Eliminated misleading drops in long-term performance charts caused by inactive weeks or months between Crucible sessions.',
      },
    ],
  },
  {
    id: '2026-11-22',
    date: 'November 22, 2026',
    title: 'Compact Guardian Switcher & Seamless Tab Swapping',
    summary:
      'Keep the spotlight on your active Guardian with a compact emblem header, one-tap crest tabs, and a quick-swap menu that keeps your place across Loadouts, Sessions, and Fireteam.',
    changes: [
      {
        type: 'improvement',
        text: 'Focus on your active Guardian emblem while keeping your other characters one tap away via stepped crest tabs or the quick Swap menu on desktop and mobile.',
      },
      {
        type: 'improvement',
        text: 'Stay right where you are when switching Guardians—swapping characters from Loadouts, Sessions, or Fireteam now keeps you on that same view instead of resetting to Overview.',
      },
    ],
  },
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
