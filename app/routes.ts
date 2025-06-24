import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  route('/login', 'routes/login.tsx'),
  route('/oauth', 'routes/oauth.tsx'),
  layout('layouts/basic.tsx', [
    index('routes/landing.tsx'),
    route('search', 'routes/search.tsx'),
    route('profile/:id', 'routes/profile.tsx'),
    route('profile/:id/sessions/:sessionId', 'routes/session-public.tsx'),
  ]),
  route('dashboard', 'layouts/sidebar.tsx', [
    index('routes/home.tsx'),
    route('activities', 'routes/activities.tsx'),
    route(`activities/:instanceId`, 'routes/activity.tsx'),
    route('loadouts', 'routes/snapshots.tsx'),
    route('loadouts/:snapshotId', 'routes/snapshot.tsx'),
    route('sessions', 'routes/sessions.tsx'),
    route('sessions/:sessionId', 'routes/session.tsx'),
    route('search', 'routes/search.tsx'),
    route('profile/:id', 'routes/profile.tsx'),
    route('profile/:id/sessions/:sessionId', 'routes/session-public.tsx'),
    route('action/set-theme', 'actions/set-theme.ts'),
    route('action/session-check-in', 'actions/session-check-in.ts'),
    route('action/set-preference', 'actions/set-preference.ts'),
    route('action/logout', 'actions/logout.ts'),
  ]),
] satisfies RouteConfig;
