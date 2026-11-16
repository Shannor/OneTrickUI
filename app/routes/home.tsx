import { Link, useNavigate } from 'react-router';
import { getRequestLogger } from '~/.server/logger';
import { getBestPerformingLoadouts, getUserSessions } from '~/api';
import { Empty } from '~/components/empty';
import { LoadoutCard } from '~/components/loadout-card';
import { SessionCard } from '~/components/session-card';
import { Button } from '~/components/ui/button';
import { useProfileData } from '~/hooks/use-route-loaders';
import { getSiteOrigin } from '~/lib/utils';

import type { Route } from './+types/home';

export async function loader({ params, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const { characterId, id } = params;
  log.set({ route: 'routes/home', home: { userId: id, characterId } });

  try {
    const [sessionsRes, loadoutsRes] = await Promise.all([
      getUserSessions({
        path: {
          userId: id,
        },
        query: {
          count: BigInt(5),
          page: BigInt(0),
          characterId,
        },
      }),
      getBestPerformingLoadouts({
        query: {
          characterId,
          userId: id,
          gameMode: 'allGameModes',
          count: 3,
          minimumGames: 10,
        },
      }),
    ]);

    return {
      sessions: sessionsRes.data ?? [],
      loadouts: loadoutsRes.data ?? { items: [], count: {}, stats: {} },
      error: undefined,
    };
  } catch (e) {
    log.error(e instanceof Error ? e : String(e), {
      home: { userId: id, characterId },
    });
    return {
      sessions: [],
      loadouts: { items: [], count: {}, stats: {} },
      error: 'Failed to load home page data',
    };
  }
}

export default function Home({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const data = useProfileData();
  const { sessions = [], loadouts, error } = loaderData ?? {};
  const { id, characterId } = params ?? {};

  if (!data) {
    return (
      <div>
        <title>Overview | 1 Trick</title>
        <meta
          name="description"
          content="View Destiny 2 PvP sessions and top loadouts on 1 Trick."
        />
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <>
        <title>Overview | 1 Trick</title>
        <meta
          name="description"
          content="View Destiny 2 PvP sessions and top loadouts on 1 Trick."
        />
        <Empty title="Unexpected Error" description="Failed to load home page" />
      </>
    );
  }

  if (data.type === 'error') {
    return (
      <>
        <title>Profile Not Found | 1 Trick</title>
        <meta
          name="description"
          content="Unable to load Guardian profile on 1 Trick."
        />
      </>
    );
  }

  if (data.type === 'viewer' || data.type === 'owner') {
    const { profile, type, character } = data;
    const topLoadouts = loadouts?.items ?? [];
    const statsRecord = (loadouts?.stats ?? {}) as Record<
      string,
      Record<string, { value?: number }>
    >;
    const countRecord = (loadouts?.count ?? {}) as Record<string, number>;

    const activeSession = sessions.find((s) => s.status === 'pending');
    const lastSession = sessions[0];
    const featuredSession = activeSession ?? lastSession;
    const displayedSessions = featuredSession ? [featuredSession] : [];

    const origin = getSiteOrigin();
    const pageTitle = `${profile.displayName} - ${character?.class ?? 'Home'} | 1 Trick`;
    const pageDescription = `View ${profile.displayName}'s Destiny 2 PvP overview, sessions, and top loadouts on 1 Trick.`;
    const canonicalUrl =
      id && characterId
        ? `https://d2onetrick.com/profile/${id}/c/${characterId}`
        : '';
    const shareImageUrl = character?.emblemBackgroundURL
      ? character.emblemBackgroundURL.startsWith('http')
        ? character.emblemBackgroundURL
        : `https://www.bungie.net${character.emblemBackgroundURL}`
      : `${origin}/og-image.png`;

    return (
      <div>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        <meta property="og:image" content={shareImageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={shareImageUrl} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        <div className="flex flex-col gap-8">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            {type === 'viewer' ? 'Viewing' : 'Welcome'} {profile.displayName}!
          </h2>

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                {activeSession ? 'Active Session' : 'Recent Session'}
              </h3>
              {sessions.length > 0 && (
                <Link
                  to="sessions"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View all sessions
                </Link>
              )}
            </div>

            {displayedSessions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {displayedSessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    onClick={() => navigate(`sessions/${s.id}`)}
                    session={s}
                  />
                ))}
              </div>
            ) : (
              <Empty
                title="No Sessions Recorded"
                description="Start a tracking session to monitor your Destiny 2 stats!"
              >
                <Button asChild>
                  <Link to="sessions">Start Session</Link>
                </Button>
              </Empty>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                Top Loadouts
              </h3>
              {topLoadouts.length > 0 && (
                <Link
                  to="loadouts"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View all loadouts
                </Link>
              )}
            </div>

            {topLoadouts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {topLoadouts.map((snapshot) => (
                  <LoadoutCard
                    key={snapshot.id}
                    snapshot={snapshot}
                    stats={statsRecord[snapshot.id]}
                    gamesCount={countRecord[snapshot.id] ?? 0}
                    onClick={() => navigate(`loadouts/${snapshot.id}`)}
                  />
                ))}
              </div>
            ) : (
              <Empty
                title="Get in the Crucible!"
                description="Play more games so your top loadouts will start showing up!"
              >
                <Button asChild>
                  <Link to="sessions">Start Session</Link>
                </Button>
              </Empty>
            )}
          </section>
        </div>
      </div>
    );
  }

  return null;
}
