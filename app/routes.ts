import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  route('/login', 'routes/login.tsx'),
  route('/oauth', 'routes/oauth.tsx'),
  layout('layouts/dashboard.tsx', [
    index('routes/home.tsx'),
    route('/activities', 'routes/activities.tsx'),
    route(`/activities/:instanceId`, 'routes/activity.tsx'),
    route('/loadouts', 'routes/snapshots.tsx'),
    route('/loadouts/:snapshotId', 'routes/snapshot.tsx'),
    route('/sessions', 'routes/sessions.tsx'),
    route('/sessions/:sessionId', 'routes/session.tsx'),
    route('/action/set-theme', 'routes/action.set-theme.tsx'),
    route('/action/session-check-in', 'actions/session-check-in.ts'),
    route('/action/set-preference', 'actions/set-preference.ts'),
  ]),
] satisfies RouteConfig;
