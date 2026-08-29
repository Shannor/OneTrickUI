import { Link, useNavigate } from 'react-router';
import { getBestPerformingLoadouts, getUserSessions } from '~/api';
import { Empty } from '~/components/empty';
import { LoadoutCard } from '~/components/loadout-card';
import { SessionCard } from '~/components/session-card';
import { Button } from '~/components/ui/button';
import { useProfileData } from '~/hooks/use-route-loaders';
import { Logger } from '~/lib/logger';

import type { Route } from './+types/home';

export async function loader({ params }: Route.LoaderArgs) {
  const { characterId, id } = params;

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
    Logger.error(e, 'Failed to load home page data');
    return {
      sessions: [],
      loadouts: { items: [], count: {}, stats: {} },
      error: 'Failed to load home page data',
    };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const data = useProfileData();
  const { sessions = [], loadouts, error } = loaderData ?? {};

  if (!data) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <Empty title="Unexpected Error" description="Failed to load home page" />
    );
  }

  if (data.type === 'error') {
    return null;
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

    return (
      <div>
        <title>{`${profile.displayName} - ${character?.class ?? 'Home'}`}</title>
        <meta
          property="og:title"
          content={`${profile.displayName} - ${character?.class ?? 'Home'}`}
        />
        <meta
          name="description"
          content={`Home page for ${profile.displayName}`}
        />
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
