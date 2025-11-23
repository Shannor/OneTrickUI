import { Link } from 'react-router';
import { getAuth } from '~/.server/auth';
import { type Profile, type Session, getSessions, getUser } from '~/api';
import { LoadingButton } from '~/components/loading-button';
import { Logo } from '~/components/logo';
import { Stat } from '~/components/stat';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { useIsNavigating } from '~/lib/hooks';

import type { Route } from './+types/landing';

export function meta({}: Route.MetaArgs) {
  const title = 'One Trick — Destiny 2 Performance Tracker';
  const description =
    'Track your Destiny 2 performance with your favorite loadouts. Analyze stats and improve your game with One Trick by tracking performance across different game modes.';
  const url = 'https://d2onetrick.com/';
  const image = '/og-image.svg';
  return [
    { title },
    { description },
    {
      keywords:
        'Destiny 2, d2, tracker, stats, performance, loadouts, PvP, gaming, one trick',
    },
    { tagName: 'link', rel: 'canonical', href: url },
    { name: 'robots', content: 'index,follow' },
    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    // Twitter
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: '/twitter-image.svg' },
  ];
}
export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  let profile: Profile | null = null;
  if (auth) {
    const response = await getUser({ path: { userId: auth.id } });
    if (response.data) {
      profile = response.data;
    }
  }
  // Fetch lightweight public stats for the landing page
  try {
    const [pendingRes, recentRes] = await Promise.all([
      getSessions({ query: { count: 10, page: 0, status: 'pending' } }),
      getSessions({ query: { count: 10, page: 0, status: 'complete' } }),
    ]);

    // TODO: Add error handling for these requests
    const activeCount = pendingRes.data?.length ?? 0;
    const recent: Session[] = recentRes.data ?? [];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDayMs = 7 * oneDayMs;

    const todayCount = recent.filter((s) => {
      const t = s.completedAt ? new Date(s.completedAt).getTime() : 0;
      return t > 0 && now - t <= oneDayMs;
    }).length;

    const weekCount = recent.filter((s) => {
      const t = s.completedAt ? new Date(s.completedAt).getTime() : 0;
      return t > 0 && now - t <= sevenDayMs;
    }).length;

    // Trim recent to 3 for UI
    const recentTop = recent.slice(0, 3);

    return {
      activeCount,
      recent: recentTop,
      todayCount,
      weekCount,
      auth,
      profile,
    };
  } catch (e) {
    console.error(e);
    return {
      activeCount: 0,
      recent: [] as Session[],
      todayCount: 0,
      weekCount: 0,
      auth,
      profile,
    };
  }
}

export default function Landing({ loaderData }: Route.ComponentProps) {
  const [isLoading] = useIsNavigating();
  const { activeCount, recent, todayCount, weekCount, profile } =
    loaderData ?? {
      activeCount: 0,
      recent: [],
      todayCount: 0,
      weekCount: 0,
      auth: null,
    };

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="container mx-auto px-4 py-20 text-center">
        {/* Dual logo for light/dark */}
        <Logo className="mx-auto mb-6 h-16 w-auto" alt="D2 One Trick logo" />
        <h1 className="mx-auto max-w-3xl text-balance text-5xl font-extrabold tracking-tight text-foreground drop-shadow-sm md:text-6xl">
          <span className="text-primary"> 1</span>Trick
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground">
          One Trick helps you track sessions, analyze loadouts, and uncover
          insights to play your best.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <LoadingButton isLoading={isLoading}>
            {profile ? (
              <Link to={`/profile/${profile.id}`}>
                Continue to {profile.displayName}
              </Link>
            ) : (
              <Link to="/login">Sign In</Link>
            )}
          </LoadingButton>
          <LoadingButton variant="outline" isLoading={isLoading}>
            <Link to="/search">Search Players</Link>
          </LoadingButton>
        </div>
      </div>
      {/* Stats Preview */}
      <section className="container mx-auto px-4 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Active */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="uppercase tracking-wide">
                Active Sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{activeCount}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Currently being tracked
              </p>
            </CardContent>
          </Card>

          {/* Today */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="uppercase tracking-wide">
                Sessions Today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{todayCount}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Completed in the last 24h
              </p>
            </CardContent>
          </Card>

          {/* This Week */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="uppercase tracking-wide">
                This Week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{weekCount}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Completed in the last 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions List */}
        <Card className="mt-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-muted-foreground">
                No recent sessions yet. Be the first to start one!
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-3">
                {recent.map((s) => (
                  <li key={s.id} className="text-left">
                    <Link
                      to={`/profile/${s.userId}/c/${s.characterId}/sessions/${s.id}`}
                    >
                      <Card className="h-full">
                        <CardContent className="flex flex-col gap-4 p-4">
                          <div>
                            <div className="font-medium text-foreground">
                              {s.name ?? 'Session'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {s.completedAt
                                ? new Date(s.completedAt).toLocaleString()
                                : 'Active'}
                            </div>
                          </div>
                          <Stat
                            label="Games Played"
                            value={s.aggregateIds.length.toString()}
                          />
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
      <span className="text-muted-foreground">
        skein circle by Alexander Skowalsky from{' '}
        <a
          href="https://thenounproject.com/browse/icons/term/skein-circle/"
          className="hover:text-blue-400"
          target="_blank"
          title="skein circle Icons"
        >
          Noun Project
        </a>{' '}
        (CC BY 3.0)
      </span>
    </div>
  );
}
