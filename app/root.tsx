import { clsx } from 'clsx';
import LogRocket from 'logrocket';
import { useEffect } from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
} from 'react-router';
import {
  PreventFlashOnWrongTheme,
  ThemeProvider,
  useTheme,
} from 'remix-themes';
import { getAuth } from '~/.server/auth';
import { themeSessionResolver } from '~/.server/sessions';
import { getUser } from '~/api';
import { client } from '~/api/client.gen';
import { trackUserSession } from '~/lib/tracking';
import { isDev } from '~/lib/utils';

import type { Route } from './+types/root';
import stylesheet from './app.css?url';

if (typeof window !== 'undefined') {
  LogRocket.init('gruntt/d2-one-trick');
}

client.setConfig({
  baseUrl: isDev() ? 'http://localhost:8080' : 'https://api.d2onetrick.com',
});

export const meta = () => [
  {
    title: 'One Trick',
  },
  {
    description:
      'A PvP tracker for Destiny 2 centered around activities and loadouts.',
  },
  {
    keywords:
      'destiny, destiny 2, one trick, tracker, destiny pvp, pvp, loadouts',
  },
  {
    tagName: 'link',
    rel: 'canonical',
    href: 'https://d2onetrick.com/',
  },
];
export const links: Route.LinksFunction = () => [
  // Favicon and app icons
  {
    rel: 'icon',
    type: 'image/x-icon',
    href: '/logo.ico',
    media: '(prefers-color-scheme: light)',
  },
  {
    rel: 'icon',
    type: 'image/x-icon',
    href: '/logo-white.ico',
    media: '(prefers-color-scheme: dark)',
  },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
  { rel: 'stylesheet', href: stylesheet },
];
export const loader = async ({ request }: Route.LoaderArgs) => {
  let theme = null;
  try {
    const { getTheme } = await themeSessionResolver(request);
    theme = getTheme();
  } catch {
    theme = null;
  }

  let user = null;
  try {
    const auth = await getAuth(request);
    if (auth?.id) {
      user = {
        id: auth.id,
        membershipId: auth.membershipId,
        primaryMembershipId: auth.primaryMembershipId,
      };
      try {
        const { data: profile } = await getUser({ path: { userId: auth.id } });
        if (profile?.displayName) {
          user = {
            ...user,
            name: profile.displayName,
            displayName: profile.displayName,
            uniqueName: profile.uniqueName,
          };
        }
      } catch {
        // Fallback to basic session user if profile fetch throws
      }
    }
  } catch {
    // Treat as signed-out if auth session retrieval throws or is malformed
    user = null;
  }

  return {
    theme,
    user,
  };
};

// Wrap your app with ThemeProvider.
// `specifiedTheme` is the stored theme in the session storage.
// `themeAction` is the action name that's used to change the theme in the session storage.
export default function AppWithProviders() {
  const data = useLoaderData<typeof loader>();
  return (
    <ThemeProvider specifiedTheme={data.theme} themeAction="/action/set-theme">
      <App />
    </ThemeProvider>
  );
}

export function App() {
  const data = useLoaderData<typeof loader>();
  const [theme] = useTheme();

  useEffect(() => {
    trackUserSession(data.user);
  }, [data.user]);

  return (
    // Needed for setting the theme on the website
    <html lang="en" className={clsx(theme)} suppressHydrationWarning={true}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <PreventFlashOnWrongTheme ssrTheme={Boolean(data.theme)} />
        <Links />
      </head>
      <body style={{ height: '100vh' }}>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }
  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
