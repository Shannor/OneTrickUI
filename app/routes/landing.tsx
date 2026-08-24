import { Link } from 'react-router';
import { getAuth } from '~/.server/auth';
import { type Profile, type Session, getSessions, getUser } from '~/api';
import { ActiveSessionCard } from '~/components/active-session-card';
import { LoadingButton } from '~/components/loading-button';
import { Logo } from '~/components/logo';
import { Stat } from '~/components/stat';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '~/components/ui/card';
import { useIsNavigating } from '~/hooks/use-route-loaders';
import { Logger } from '~/lib/logger';

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
        'Destiny 2, d2, tracker, stats, performance, loadouts, PvP, gaming, one trick, min-max, min, max',
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

    const activeSessions: Session[] = pendingRes.data ?? [];
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

    // Collect all user IDs from recent and active sessions to fetch profiles
    const userIds = Array.from(
      new Set([
        ...recentTop.map((s) => s.userId),
        ...activeSessions.map((s) => s.userId),
      ]),
    );

    const profilesList = await Promise.all(
      userIds.map(async (userId) => {
        const { data: userProfile, error } = await getUser({
          path: { userId },
        });
        if (error) {
          return null;
        }
        return userProfile;
      }),
    );

    const sessionProfiles = profilesList.reduce<Record<string, Profile>>(
      (state, current) => {
        if (current) {
          state[current.id] = current;
        }
        return state;
      },
      {},
    );

    return {
      activeCount: activeSessions.length,
      activeSessions: activeSessions.slice(0, 3),
      recent: recentTop,
      todayCount,
      weekCount,
      auth,
      recentProfiles: sessionProfiles,
      profile,
    };
  } catch (e) {
    Logger.error(e, 'Failed to load landing stats');
    return {
      activeCount: 0,
      activeSessions: [] as Session[],
      recent: [] as Session[],
      todayCount: 0,
      weekCount: 0,
      auth,
      profile,
      recentProfiles: {},
    };
  }
}

export default function Landing({ loaderData }: Route.ComponentProps) {
  const [isLoading] = useIsNavigating();
  const {
    activeCount,
    activeSessions,
    recent,
    todayCount,
    weekCount,
    profile,
    recentProfiles,
  } = loaderData ?? {
    activeCount: 0,
    activeSessions: [],
    recent: [],
    todayCount: 0,
    weekCount: 0,
    auth: null,
    recentProfiles: {},
  };

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="container mx-auto mb-8 flex flex-col gap-2 px-4 text-center">
        <Logo className="mx-auto mb-4 h-16 w-auto" alt="D2 One Trick logo" />
        <h1 className="mx-auto max-w-3xl text-balance text-5xl font-extrabold uppercase tracking-wider text-foreground drop-shadow-sm md:text-6xl">
          <span className="text-primary"> 1</span> Trick
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
        </div>
      </div>
      {/* Stats Preview */}
      <section className="container mx-auto px-4 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Active Sessions Stat Card - links to /active-sessions */}
          <Link to="/active-sessions" className="block">
            <Card className="h-full cursor-pointer transition-colors hover:border-primary">
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
                <div className="mt-2 text-xs font-medium text-primary">
                  View all active sessions
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Today */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="uppercase tracking-wide">
                Last 24
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

        {/* Active Sessions Preview List */}
        {activeSessions.length > 0 && (
          <div className="mt-12 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Active Sessions</h3>
              <Link
                to="/active-sessions"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all active sessions
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-3">
              {activeSessions.map((s) => (
                <li key={s.id} className="text-left">
                  <ActiveSessionCard
                    session={s}
                    profile={recentProfiles[s.userId]}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent Sessions List */}
        <div className="mt-12 flex flex-col gap-4">
          <h3 className="text-xl font-semibold">Recent Sessions</h3>
          {recent.length === 0 ? (
            <p className="text-muted-foreground">
              No recent sessions yet. Be the first to start one!
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-3">
              {recent.map((s) => {
                const userProfile = recentProfiles[s.userId];
                return (
                  <li key={s.id} className="text-left">
                    <Link
                      to={`/profile/${s.userId}/c/${s.characterId}/sessions/${s.id}`}
                    >
                      <Card className="h-full cursor-pointer transition-all hover:border-primary hover:shadow-md">
                        <CardContent className="flex flex-col gap-4 p-4">
                          <div>
                            <div className="truncate font-medium text-foreground">
                              {s.name ?? 'Session'}
                            </div>
                            {userProfile?.displayName && (
                              <div className="truncate font-medium text-primary">
                                {userProfile.displayName}
                              </div>
                            )}
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
                );
              })}
            </ul>
          )}
        </div>
      </section>
      <span className="text-muted-foreground">
        skein circle by Alexander Skowalsky from{' '}
        <Link
          to="https://thenounproject.com/browse/icons/term/skein-circle/"
          reloadDocument
          target="_blank"
          className="hover:text-blue-400"
          title="skein circle Icons"
        >
          Noun Project
        </Link>{' '}
        (CC BY 3.0)
      </span>
    </div>
  );
}
