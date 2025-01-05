import {
  type RouteConfig,
  index,
  route,
  layout,
} from '@react-router/dev/routes';

export default [
  layout('dashboard/page.tsx', [
    index('routes/home.tsx'),
    route('/tracker', 'routes/TrackerPage.tsx'),
    route(`/tracker/:instanceId`, 'routes/ActivityPage.tsx'),
  ]),
] satisfies RouteConfig;
