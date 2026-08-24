import { Link, useNavigate } from 'react-router';
import { getBestPerformingLoadouts, getUserSessions } from '~/api';
import { ArmorStats } from '~/components/armor-stats';
import { Empty } from '~/components/empty';
import { ItemSnapshot } from '~/components/item-snapshot';
import { Label } from '~/components/label';
import { SessionCard } from '~/components/session-card';
import { Super } from '~/components/sub-class';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { WeaponStats } from '~/components/weapon-stats';
import { getDetailWeapons, getExotic } from '~/hooks/use-loadout';
import { useProfileData } from '~/hooks/use-route-loaders';
import { cn } from '~/lib/utils';
import { Performance, type StatItem } from '~/organisims/performance';
import { SubClassProvider } from '~/providers/sub-class-provider';

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
          count: BigInt(3),
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
          minimumGames: 1,
        },
      }),
    ]);

    return {
      sessions: sessionsRes.data ?? [],
      loadouts: loadoutsRes.data ?? { items: [], count: {}, stats: {} },
      error: undefined,
    };
  } catch (e) {
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

          {/* Last 3 Sessions Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                Recent Sessions
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

            {sessions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {sessions.map((s) => (
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

          {/* Top 3 Loadouts Section */}
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
                {topLoadouts.map((snapshot) => {
                  const { armor } = getExotic(snapshot?.loadout);
                  const weapons = getDetailWeapons(snapshot?.loadout);
                  const kd = statsRecord[snapshot.id]?.kd?.value ?? 0;
                  const kda = statsRecord[snapshot.id]?.kda?.value ?? 0;
                  const winRatio = statsRecord[snapshot.id]?.standing?.value ?? 0;

                  const stats: StatItem[] = [
                    { label: 'K/D', value: kd.toFixed(2) },
                    { label: 'Efficiency', value: kda.toFixed(2) },
                    {
                      label: 'Win Percentage',
                      value: `${(winRatio * 100).toFixed(0)}%`,
                      valueClassName:
                        winRatio >= 0.5 ? 'text-green-500' : 'text-red-500',
                    },
                    {
                      label: 'Games',
                      value: countRecord[snapshot.id]?.toString() ?? '0',
                    },
                  ];

                  return (
                    <Card
                      key={snapshot.id}
                      className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                      onClick={() => navigate(`loadouts/${snapshot.id}`)}
                    >
                      <CardHeader className="flex flex-col gap-1">
                        <h4 className="text-xl font-semibold tracking-tight">
                          {snapshot.name}
                        </h4>
                        {snapshot.description && (
                          <div className="truncate text-sm text-muted-foreground">
                            {snapshot.description}
                          </div>
                        )}
                        <SubClassProvider snapshot={snapshot}>
                          <Super />
                        </SubClassProvider>
                        <div className="flex flex-col flex-wrap gap-4 align-top lg:flex-row lg:items-center lg:align-middle">
                          {weapons.map((item) => (
                            <ItemSnapshot key={item.itemHash} item={item}>
                              <div className="flex flex-col gap-4">
                                <Label
                                  className={cn(
                                    'truncate',
                                    item.details.baseInfo.tierTypeName ===
                                      'Exotic'
                                      ? 'text-yellow-500'
                                      : 'text-purple-500',
                                  )}
                                >
                                  {item.details.baseInfo.name}
                                </Label>
                                {item.details.stats && (
                                  <WeaponStats stats={item.details.stats} />
                                )}
                              </div>
                            </ItemSnapshot>
                          ))}
                          {armor && (
                            <ItemSnapshot item={armor}>
                              <div className="flex flex-col gap-4">
                                <Label className="truncate text-yellow-500">
                                  {armor.details.baseInfo.name}
                                </Label>
                                {armor.details.stats && (
                                  <ArmorStats stats={armor.details.stats} />
                                )}
                              </div>
                            </ItemSnapshot>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col items-start gap-10">
                        <Performance
                          stats={stats}
                          className="flex flex-col flex-wrap items-start gap-4 align-top md:flex-row md:items-center md:align-middle"
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Empty
                title="No Top Loadouts Found"
                description="Play games during tracking sessions to record loadout performance data!"
              >
                <Button asChild>
                  <Link to="loadouts">Explore Loadouts</Link>
                </Button>
              </Empty>
            )}
          </section>
        </div>
      </div>
    );
  }
}
