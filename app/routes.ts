import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  route('/login', 'routes/login.tsx'),
  route('/oauth', 'routes/oauth.tsx'),
  route('/character-select', 'routes/character-select.tsx'),
  // Public Routes
  layout('layouts/basic.tsx', [
    index('routes/landing.tsx'),
    route('search', 'routes/search.tsx'),
    route('profiles/:id', 'routes/profile.tsx'),
    route('profiles/:id/sessions/:sessionId', 'routes/session-public.tsx'),
    route(`activities/:instanceId`, 'routes/activity.tsx', {
      id: 'public-activity',
    }),
  ]),
  route('dashboard', 'layouts/sidebar.tsx', [
    index('routes/home.tsx'),
    route(`activities/:instanceId`, 'routes/activity.tsx'),
    route('loadouts', 'routes/snapshots.tsx'),
    route('loadouts/:snapshotId', 'routes/snapshot.tsx', [
      index('routes/loadout-details.tsx', { id: 'loadout-details' }),
      route('metrics', 'routes/metrics.tsx', { id: 'loadout-metrics' }),
    ]),
    route('sessions', 'routes/sessions.tsx'),
    route('sessions/:sessionId', 'routes/session.tsx'),
    route('fireteam', 'routes/fireteam.tsx'),

    // Profile Routes
    route('profiles', 'routes/search.tsx', { id: 'profiles' }),
    route('profiles/:id', 'routes/profile.tsx', { id: 'profile' }, [
      route('sessions', 'routes/sessions.tsx', { id: 'profile-sessions' }),
      route('loadouts', 'routes/snapshots.tsx', { id: 'profile-loadouts' }),
      route('activities', 'routes/activities.tsx', {
        id: 'profile-activities',
      }),
    ]),
    route('profiles/:id/sessions/:sessionId', 'routes/session.tsx', {
      id: 'profile-session',
    }),
    route('profiles/:id/activities/:activityId', 'routes/activity.tsx', {
      id: 'profile-activity',
    }),
    // User Actions
    route('action/set-theme', 'actions/set-theme.ts'),
    route('action/session-check-in', 'actions/session-check-in.ts'),
    route('action/set-preference', 'actions/set-preference.ts'),
    route('action/logout', 'actions/logout.ts'),
    route('action/set-fireteam', 'actions/set-fireteam.ts'),
    route('action/start-session', 'actions/start-session.ts'),
    route('action/end-session', 'actions/end-session.ts'),
  ]),
] satisfies RouteConfig;
