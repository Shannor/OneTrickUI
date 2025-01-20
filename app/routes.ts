import {
  type RouteConfig,
  index,
  route,
  layout,
} from '@react-router/dev/routes';

export default [
  route('/login', 'routes/login.tsx'),
  route('/oauth', 'routes/oauth.tsx'),
  layout('layouts/dashboard.tsx', [
    index('routes/home.tsx'),
    route('/activities', 'routes/activities.tsx'),
    route(`/activities/:instanceId`, 'routes/activity.tsx'),
    route('/snapshots', 'routes/snapshots.tsx'),
    route('/sessions', 'routes/sessions.tsx'),
    route('/sessions/:sessionId', 'routes/session.tsx'),
    route('/action/set-theme', 'routes/action.set-theme.tsx'),
    route('/action/set-preference', 'routes/action.set-preference.ts'),
  ]),
] satisfies RouteConfig;
