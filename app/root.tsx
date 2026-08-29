import { clsx } from 'clsx';
import LogRocket from 'logrocket';
import { useEffect } from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from 'react-router';
import {
  PreventFlashOnWrongTheme,
  type Theme,
  ThemeProvider,
  useTheme,
} from 'remix-themes';
import { getAuth } from '~/.server/auth';
import { themeSessionResolver } from '~/.server/sessions';
import { type Character, getUser } from '~/api';
import { client } from '~/api/client.gen';
import { ErrorBoundaryContent } from '~/components/error-boundary-content';
import { ModeToggle } from '~/components/mode-toggle';
import { Toaster } from '~/components/ui/sonner';
import { useToastNotification } from '~/hooks/use-toast-notification';
import { Logger } from '~/lib/logger';
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
  {
    rel: 'apple-touch-icon',
    href: '/apple-touch-icon.png',
  },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Iceland&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
  { rel: 'stylesheet', href: stylesheet },
];
export type RootUser = {
  id: string;
  membershipId: string;
  primaryMembershipId: string;
  name?: string;
  displayName?: string;
  uniqueName?: string;
  characters?: Character[];
};

export type RootLoaderData = {
  theme: Theme | null;
  user: RootUser | null;
};

export const loader = async ({
  request,
}: Route.LoaderArgs): Promise<RootLoaderData> => {
  let theme: Theme | null = null;
  try {
    const { getTheme } = await themeSessionResolver(request);
    theme = getTheme();
  } catch (e) {
    Logger.error(e, 'Failed to resolve theme session in root loader');
    theme = null;
  }

  let user: RootUser | null = null;
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
            characters: profile.characters ?? [],
          };
        }
      } catch (e) {
        Logger.error(e, 'Failed to fetch user profile in root loader');
      }
    }
  } catch (e) {
    Logger.error(e, 'Failed to resolve auth session in root loader');
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
  useToastNotification();

  useEffect(() => {
    trackUserSession(data.user);
  }, [data.user]);

  return (
    // Needed for setting the theme on the website
    <html lang="en" className={clsx(theme)} suppressHydrationWarning={true}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>One Trick — Destiny 2 PvP Loadout & Session Tracker</title>
        <meta
          name="description"
          content="Track your Destiny 2 PvP performance across game modes, analyze real-time sessions, and inspect community loadout snapshots."
        />
        <meta
          name="keywords"
          content="destiny, destiny 2, d2, one trick, tracker, destiny pvp, pvp, loadouts, sessions, stats, min-max"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://d2onetrick.com/" />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="One Trick" />
        <meta
          property="og:title"
          content="One Trick — Destiny 2 PvP Loadout & Session Tracker"
        />
        <meta
          property="og:description"
          content="Track your Destiny 2 PvP performance across game modes, analyze real-time sessions, and inspect community loadout snapshots."
        />
        <meta property="og:url" content="https://d2onetrick.com/" />
        <meta
          property="og:image"
          content="https://d2onetrick.com/og-image.svg"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="One Trick — Destiny 2 PvP Loadout & Session Tracker"
        />
        <meta
          name="twitter:description"
          content="Track your Destiny 2 PvP performance across game modes, analyze real-time sessions, and inspect community loadout snapshots."
        />
        <meta
          name="twitter:image"
          content="https://d2onetrick.com/twitter-image.svg"
        />
        <Meta />
        <PreventFlashOnWrongTheme ssrTheme={Boolean(data.theme)} />
        <Links />
      </head>
      <body className="min-h-screen w-full max-w-full overflow-x-hidden bg-background font-sans text-foreground antialiased">
        <Outlet />
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <ThemeProvider specifiedTheme={null} themeAction="/action/set-theme">
      <ErrorBoundaryWithTheme error={error} />
    </ThemeProvider>
  );
}

function ErrorBoundaryWithTheme({ error }: { error: unknown }) {
  const [theme] = useTheme();

  return (
    <html lang="en" className={clsx(theme)} suppressHydrationWarning={true}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error — One Trick</title>
        <meta
          name="description"
          content="An error occurred while loading this page on One Trick."
        />
        <meta name="robots" content="noindex, follow" />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="One Trick" />
        <meta property="og:title" content="Error — One Trick" />
        <meta
          property="og:description"
          content="An error occurred while loading this page on One Trick."
        />
        <meta
          property="og:image"
          content="https://d2onetrick.com/og-image.svg"
        />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Error — One Trick" />
        <meta
          name="twitter:description"
          content="An error occurred while loading this page on One Trick."
        />
        <meta
          name="twitter:image"
          content="https://d2onetrick.com/twitter-image.svg"
        />
        <Meta />
        <PreventFlashOnWrongTheme ssrTheme={false} />
        <Links />
      </head>
      <body className="relative min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="absolute right-4 top-4 z-50">
          <ModeToggle />
        </div>
        <ErrorBoundaryContent error={error} />
        <Scripts />
      </body>
    </html>
  );
}
