import { format, formatDistance } from 'date-fns';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Gamepad2,
  Radio,
  Swords,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getPreferences } from '~/.server/preferences';
import { type Profile, type Session, getSessions, getUser } from '~/api';
import { ActiveSessionCard } from '~/components/active-session-card';
import { LoadingButton } from '~/components/loading-button';
import { Logo } from '~/components/logo';
import { buttonVariants } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { useHydrated } from '~/hooks/use-hydrated';
import { useIsNavigating } from '~/hooks/use-route-loaders';
import { Logger } from '~/lib/logger';
import { cn } from '~/lib/utils';

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
  const preferences = await getPreferences(request);
  let profile: Profile | null = null;
  let selectedCharacterId: string | null = null;

  if (auth) {
    const response = await getUser({ path: { userId: auth.id } });
    if (response.data) {
      profile = response.data;
      const prefCharId = preferences.character?.id;
      const isValid = profile.characters?.some((c) => c.id === prefCharId);
      if (isValid && prefCharId) {
        selectedCharacterId = prefCharId;
      }
    }
  }
  // Fetch lightweight public stats for the landing page
  try {
    const [pendingRes, recentRes] = await Promise.all([
      getSessions({ query: { count: 20, page: 0, status: 'pending' } }),
      getSessions({ query: { count: 20, page: 0, status: 'complete' } }),
    ]);

    const activeSessions: Session[] = pendingRes.data ?? [];
    const recent: Session[] = recentRes.data ?? [];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDayMs = 7 * oneDayMs;

    const sortedActive = [...activeSessions].sort((a, b) => {
      const timeA = new Date(a.startedAt).getTime();
      const timeB = new Date(b.startedAt).getTime();
      return timeB - timeA;
    });

    const sortedRecent = [...recent].sort((a, b) => {
      const timeA = a.completedAt
        ? new Date(a.completedAt).getTime()
        : new Date(a.startedAt).getTime();
      const timeB = b.completedAt
        ? new Date(b.completedAt).getTime()
        : new Date(b.startedAt).getTime();
      return timeB - timeA;
    });

    const todayCount = sortedRecent.filter((s) => {
      const t = s.completedAt ? new Date(s.completedAt).getTime() : 0;
      return t > 0 && now - t <= oneDayMs;
    }).length;

    const weekCount = sortedRecent.filter((s) => {
      const t = s.completedAt ? new Date(s.completedAt).getTime() : 0;
      return t > 0 && now - t <= sevenDayMs;
    }).length;

    // Trim recent and active to top 6 for UI grid
    const recentTop = sortedRecent.slice(0, 6);
    const activeTop = sortedActive.slice(0, 6);

    // Collect all user IDs from recent and active sessions to fetch profiles
    const userIds = Array.from(
      new Set([
        ...recentTop.map((s) => s.userId),
        ...activeTop.map((s) => s.userId),
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
      activeSessions: activeTop,
      recent: recentTop,
      todayCount,
      weekCount,
      auth,
      recentProfiles: sessionProfiles,
      profile,
      selectedCharacterId,
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
      selectedCharacterId: null,
      recentProfiles: {},
    };
  }
}

export function Landing({ loaderData }: Route.ComponentProps) {
  const isHydrated = useHydrated();
  const [isLoading] = useIsNavigating();
  const {
    activeCount,
    activeSessions,
    recent,
    todayCount,
    weekCount,
    profile,
    recentProfiles,
    selectedCharacterId,
  } = loaderData ?? {
    activeCount: 0,
    activeSessions: [],
    recent: [],
    todayCount: 0,
    weekCount: 0,
    auth: null,
    recentProfiles: {},
    selectedCharacterId: null,
  };

  const [activeCharId, setActiveCharId] = useState<string | null>(
    selectedCharacterId ?? null,
  );

  useEffect(() => {
    if (profile?.id) {
      try {
        const stored = localStorage.getItem(
          `onetrick_active_char_${profile.id}`,
        );
        if (stored && profile.characters?.some((c) => c.id === stored)) {
          setActiveCharId(stored);
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, [profile]);

  const targetCharacterId =
    activeCharId || (profile?.characters?.[0]?.id ?? null);
  const continueUrl = profile
    ? targetCharacterId
      ? `/profile/${profile.id}/c/${targetCharacterId}`
      : `/profile/${profile.id}`
    : '/login';

  return (
    <div className="flex h-full flex-col justify-between gap-12">
      {/* Hero Section */}
      <div className="container mx-auto flex flex-col gap-4 px-4 pt-4 text-center">
        <Logo className="mx-auto mb-2 h-16 w-auto" alt="D2 One Trick logo" />

        <h1 className="mx-auto max-w-4xl text-balance text-4xl font-extrabold uppercase tracking-wider text-foreground drop-shadow-sm sm:text-5xl md:text-6xl">
          <span className="text-primary">1</span> Trick
        </h1>

        <p className="mx-auto mt-2 max-w-2xl text-balance text-muted-foreground sm:text-lg">
          Track active Destiny 2 PvP sessions, inspect community loadouts, and
          uncover deep performance insights across game modes.
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <LoadingButton
            asChild
            isLoading={isLoading}
            size="lg"
            className="w-full justify-center sm:w-60"
          >
            {profile ? (
              <Link to={continueUrl}>
                Continue to {profile.displayName}
              </Link>
            ) : (
              <Link to="/login">Start a Session</Link>
            )}
          </LoadingButton>

          <Link
            to="/sessions"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'w-full justify-center gap-2 font-medium sm:w-60',
            )}
          >
            <Activity className="h-4 w-4 text-primary" />
            <span>Browse Sessions</span>
          </Link>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <section className="container mx-auto px-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary">
                <Radio className="h-5 w-5" />
                <CardTitle className="text-base font-semibold">
                  Active Feeds
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Inspect active tracking feeds from Guardians currently playing
                in real-time.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary">
                <BarChart3 className="h-5 w-5" />
                <CardTitle className="text-base font-semibold">
                  Loadout Analytics
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Analyze win rates, kills, and weapon efficiency across loadout
                snapshots.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" />
                <CardTitle className="text-base font-semibold">
                  Community Exploration
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Browse player sessions, inspect fireteams, and learn from top
                performers.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Preview & Active Community Sessions */}
      <section className="container mx-auto space-y-12 px-4 pb-16">
        {/* Quick Metrics Cards */}
        <div className="grid gap-6 sm:grid-cols-3">
          <Link to="/sessions" className="group block">
            <Card className="h-full cursor-pointer transition-all group-hover:border-primary group-hover:shadow-md">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between uppercase tracking-wide">
                  <span>Active Sessions</span>
                  <Radio className="h-4 w-4 animate-pulse text-primary" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{activeCount}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Currently active & being tracked
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
                  <span>View all active feeds</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="uppercase tracking-wide">
                Last 24 Hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{todayCount}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Sessions completed in last 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="uppercase tracking-wide">
                This Week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{weekCount}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Sessions completed in last 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Sessions Feed */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                <Radio className="h-5 w-5 animate-pulse text-primary" />
                Active Sessions
              </h3>
              <p className="text-xs text-muted-foreground">
                Click any session card to view active games and loadouts as they
                happen.
              </p>
            </div>
            <Link
              to="/sessions"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <span>View all ({activeCount})</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {activeSessions.length === 0 ? (
            <Card className="border-dashed p-8 text-center">
              <CardContent className="flex flex-col items-center justify-center p-0">
                <Activity className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <h4 className="font-semibold text-foreground">
                  No Active Sessions
                </h4>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Be the first Guardian to start a tracking session right now!
                </p>
                <Link
                  to="/login"
                  className={cn(
                    buttonVariants({ variant: 'default', size: 'sm' }),
                    'mt-4',
                  )}
                >
                  Start a Session
                </Link>
              </CardContent>
            </Card>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeSessions.map((s) => (
                <li key={s.id} className="text-left">
                  <ActiveSessionCard
                    session={s}
                    profile={recentProfiles[s.userId]}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Community Sessions List */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                <Swords className="h-5 w-5 text-primary" />
                Recent Community Sessions
              </h3>
              <p className="text-xs text-muted-foreground">
                View completed PvP tracking sessions and loadout performance.
              </p>
            </div>
          </div>

          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No completed sessions yet. Start your own session to be featured!
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((s) => {
                const userProfile = recentProfiles[s.userId];
                const character = userProfile?.characters?.find(
                  (c) => c.id === s.characterId,
                );
                const completedTime = s.completedAt
                  ? new Date(s.completedAt)
                  : null;

                return (
                  <li key={s.id} className="text-left">
                    <Link
                      to={`/profile/${s.userId}/c/${s.characterId}/sessions/${s.id}`}
                      className="group block h-full"
                    >
                      <Card className="flex h-full flex-col overflow-hidden border transition-all duration-200 hover:border-primary hover:shadow-lg">
                        {character?.emblemBackgroundURL && (
                          <div
                            style={{
                              backgroundImage: `url(${character.emblemBackgroundURL})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                            className="relative flex min-h-[5rem] w-full items-center justify-between px-5 py-3"
                          >
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                            <div className="relative z-10 flex min-w-0 flex-col justify-center gap-0.5 py-1">
                              <span className="truncate text-base font-extrabold tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                                {userProfile?.displayName || 'Guardian'}
                              </span>
                              {character.currentTitle && (
                                <div>
                                  <span className="inline-block shrink-0 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                                    {character.currentTitle}
                                  </span>
                                </div>
                              )}
                            </div>
                            {character.light != null && (
                              <span className="relative z-10 shrink-0 text-base font-bold text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                                {character.light.toString()}
                              </span>
                            )}
                          </div>
                        )}

                        <CardContent className="flex flex-1 flex-col justify-between space-y-4 p-4">
                          <div>
                            <div className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                              {s.name || 'Completed Session'}
                            </div>
                            {character?.class ? (
                              <div className="truncate text-xs font-semibold uppercase tracking-wider text-primary">
                                {character.class}
                              </div>
                            ) : userProfile?.displayName ? (
                              <div className="truncate text-xs font-semibold uppercase tracking-wider text-primary">
                                {userProfile.displayName}
                              </div>
                            ) : null}
                          </div>

                          <div className="space-y-2 border-t pt-3 text-xs">
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Gamepad2 className="h-3.5 w-3.5 text-muted-foreground" />
                                Games Logged
                              </span>
                              <span className="font-bold text-foreground">
                                {s.aggregateIds.length.toString()}
                              </span>
                            </div>

                            {completedTime && (
                              <div className="text-muted-foreground">
                                Completed{' '}
                                {isHydrated
                                  ? formatDistance(completedTime, new Date(), {
                                      addSuffix: true,
                                    })
                                  : format(completedTime, 'MMM d, yyyy')}
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-1 font-medium text-primary opacity-90 transition-opacity group-hover:underline group-hover:opacity-100">
                              <span>View Session Stats</span>
                              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                          </div>
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

      {/* Footer Attribution */}
      <footer className="container mx-auto px-4 pb-8 text-center text-xs text-muted-foreground">
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
      </footer>
    </div>
  );
}

export default Landing;
