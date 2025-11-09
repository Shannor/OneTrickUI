import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  index('routes/landing.tsx'),
  route('/login', 'routes/login.tsx'),
  route('/oauth', 'routes/oauth.tsx'),
  // Public Routes
  layout('layouts/basic.tsx', [route('search', 'routes/search.tsx')]),
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
        route('metrics', 'routes/metrics.tsx', { id: 'loadout-metrics' }),
      ]),
      route('fireteam', 'routes/fireteam.tsx'),
    ]),
  ]),
  // User Actions
  route('action/set-theme', 'actions/set-theme.ts'),
  route('action/session-check-in', 'actions/session-check-in.ts'),
  route('action/set-preference', 'actions/set-preference.ts'),
  route('action/logout', 'actions/logout.ts'),
  route('action/set-fireteam', 'actions/set-fireteam.ts'),
  route('action/start-session', 'actions/start-session.ts'),
  route('action/end-session', 'actions/end-session.ts'),
  // ]),
] satisfies RouteConfig;
