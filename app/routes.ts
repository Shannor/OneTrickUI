import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('/tracker', 'routes/TrackerPage.tsx'),
  route(`/tracker/:instanceId`, 'routes/ActivityPage.tsx'),
] satisfies RouteConfig;
