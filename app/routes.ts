import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  layout('layouts/basic.tsx', [
    index('routes/landing.tsx'),
    route('search', 'routes/search.tsx'),
  ]),
  route('/login', 'routes/login.tsx'),
  route('/oauth', 'routes/oauth.tsx'),
  // SEO / Crawlers
  route('/robots.txt', 'routes/robots.txt.ts'),
  route('/sitemap.xml', 'routes/sitemap.xml.ts'),
  // Public Routes
  route('profile/:id', 'routes/profile-state.tsx', [
    index('routes/character-select.tsx'),
    // In the future there may be a view to see all characters at once. It would need to go here
    route('c/:characterId', 'layouts/sidebar.tsx', [
      index('routes/home.tsx'),
      route(`activities/:instanceId`, 'routes/activity.tsx'),
      route('sessions', 'routes/sessions.tsx'),
      route('sessions/:sessionId', 'routes/session.tsx', [
        index('routes/session-games.tsx', { id: 'session-games' }),
        route('metrics', 'routes/session-metrics.tsx', {
          id: 'session-metrics',
        }),
      ]),
      route('loadouts', 'routes/snapshots.tsx'),
      route('loadouts/:snapshotId', 'routes/snapshot.tsx', [
        index('routes/loadout-details.tsx', { id: 'loadout-details' }),
        route('metrics', 'routes/loadout-metrics.tsx', {
          id: 'loadout-metrics',
        }),
      ]),
      route('fireteam', 'routes/fireteam.tsx'),
      layout('layouts/favorites.tsx', [
        route('search', 'routes/search.tsx', { id: 'sign-search' }),
      ]),
    ]),
  ]),
  // User Actions
  route('action/set-theme', 'actions/set-theme.ts'),
  route('action/set-preference', 'actions/set-preference.ts'),
  route('action/logout', 'actions/logout.ts'),
  route('action/set-fireteam', 'actions/set-fireteam.ts'),
  route('action/start-session', 'actions/start-session.ts'),
  route('action/end-session', 'actions/end-session.ts'),
  // ]),
] satisfies RouteConfig;
