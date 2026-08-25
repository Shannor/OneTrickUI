import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  layout('layouts/sidebar.tsx', [
    index('routes/landing.tsx'),
    route('active-sessions', 'routes/active-sessions.tsx'),
    // Public Routes
    route('profile/:id', 'routes/profile-state.tsx', [
      index('routes/character-select.tsx'),
      route('c/:characterId', 'layouts/character-layout.tsx', [
        index('routes/home.tsx'),
        route(`activities/:instanceId`, 'routes/activity.tsx'),
        route('sessions', 'routes/sessions.tsx'),
        route('sessions/:sessionId', 'routes/session.tsx', [
          index('routes/session-games.tsx', { id: 'session-games' }),
          route('metrics', 'routes/session-metrics.tsx', {
            id: 'session-metrics',
          }),
          route('loadouts', 'routes/session-loadouts.tsx', {
            id: 'session-loadout',
          }),
        ]),
        route('loadouts', 'routes/loadouts.tsx'),
        route('loadouts/:snapshotId', 'routes/loadout.tsx', [
          index('routes/loadout-details.tsx', { id: 'loadout-details' }),
          route('metrics', 'routes/loadout-metrics.tsx', {
            id: 'loadout-metrics',
          }),
        ]),
        route('fireteam', 'routes/fireteam.tsx'),
      ]),
    ]),
  ]),
  route('/login', 'routes/login.tsx'),
  route('/oauth', 'routes/oauth.tsx'),
  // SEO / Crawlers
  route('/robots.txt', 'routes/robots.txt.ts'),
  route('/sitemap.xml', 'routes/sitemap.xml.ts'),
  // Favicon & Icons
  route('/favicon.ico', 'routes/favicon.ico.ts', { id: 'favicon-ico' }),
  route('/apple-touch-icon.png', 'routes/apple-touch-icon.png.ts', {
    id: 'apple-touch-icon',
  }),
  route('/apple-touch-icon-precomposed.png', 'routes/apple-touch-icon.png.ts', {
    id: 'apple-touch-icon-precomposed',
  }),
  route('/apple-touch-icon-120x120.png', 'routes/apple-touch-icon.png.ts', {
    id: 'apple-touch-icon-120x120',
  }),
  route(
    '/apple-touch-icon-120x120-precomposed.png',
    'routes/apple-touch-icon.png.ts',
    { id: 'apple-touch-icon-120x120-precomposed' },
  ),
  route('/apple-touch-icon-152x152.png', 'routes/apple-touch-icon.png.ts', {
    id: 'apple-touch-icon-152x152',
  }),
  route(
    '/apple-touch-icon-152x152-precomposed.png',
    'routes/apple-touch-icon.png.ts',
    { id: 'apple-touch-icon-152x152-precomposed' },
  ),
  route('/apple-touch-icon-180x180.png', 'routes/apple-touch-icon.png.ts', {
    id: 'apple-touch-icon-180x180',
  }),
  route(
    '/apple-touch-icon-180x180-precomposed.png',
    'routes/apple-touch-icon.png.ts',
    { id: 'apple-touch-icon-180x180-precomposed' },
  ),
  // User Actions
  route('action/set-theme', 'actions/set-theme.ts'),
  route('action/set-preference', 'actions/set-preference.ts'),
  route('action/logout', 'actions/logout.ts'),
  route('action/set-fireteam', 'actions/set-fireteam.ts'),
  route('action/start-session', 'actions/start-session.ts'),
  route('action/end-session', 'actions/end-session.ts'),
  route('action/merge-loadout', 'actions/merge-loadout.ts'),
  route('action/update-session', 'actions/update-session.ts'),
  route('action/update-loadout', 'actions/update-loadout.ts'),
] satisfies RouteConfig;
