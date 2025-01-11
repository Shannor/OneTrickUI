import {
  type RouteConfig,
  index,
  route,
  layout,
} from '@react-router/dev/routes';

export default [
  layout('dashboard/page.tsx', [
    index('routes/home.tsx'),
    route('/activities', 'routes/activities.tsx'),
    route(`/activities/:instanceId`, 'routes/activity.tsx'),
    route('/snapshots', 'routes/snapshots.tsx'),
    route('/sessions/:sessionId', 'routes/session.tsx'),
    route('/action/set-theme', 'routes/action.set-theme.tsx'),
  ]),
] satisfies RouteConfig;
