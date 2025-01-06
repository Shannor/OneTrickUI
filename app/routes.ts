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
    route('/sessions', 'routes/sessions.tsx'),
    route('/sessions/:sessionId', 'routes/session.tsx'),
  ]),
] satisfies RouteConfig;
