import { RadioIcon, SwordsIcon } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { getRequestLogger } from '~/.server/logger';
import { getBestPerformingLoadouts, getUserSessions } from '~/api';
import { Empty } from '~/components/empty';
import { LoadoutCard } from '~/components/loadout-card';
import {
  DirectSessionStartForm,
  OverviewHeader,
  RecentFormPulse,
} from '~/components/overview-pulse';
import { SessionCard } from '~/components/session-card';
import { Badge } from '~/components/ui/badge';
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

export function Home({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const routeParams = useParams();
  const data = useProfileData();
  const { sessions = [], loadouts, error } = loaderData ?? {};
  const resolvedUserId = params?.id ?? routeParams.id;
  const resolvedCharacterId = params?.characterId ?? routeParams.characterId;

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
    const isOwner = type === 'owner';
    const characterId = resolvedCharacterId ?? character?.id;
    const userId = resolvedUserId ?? profile.id;
    const topLoadouts = loadouts?.items ?? [];
    const statsRecord = (loadouts?.stats ?? {}) as Record<
      string,
      Record<string, { value?: number }>
    >;
    const countRecord = (loadouts?.count ?? {}) as Record<string, number>;

    const activeSession = sessions.find((s) => s.status === 'pending');

    const origin = getSiteOrigin();
    const pageTitle = `${profile.displayName} - ${character?.class ?? 'Home'} | 1 Trick`;
    const pageDescription = `View ${profile.displayName}'s Destiny 2 PvP overview, sessions, and top loadouts on 1 Trick.`;
    const canonicalUrl =
      userId && characterId
        ? `https://d2onetrick.com/profile/${userId}/c/${characterId}`
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
          <OverviewHeader
            profile={profile}
            character={character}
            isOwner={isOwner}
            activeSession={activeSession}
            hasSessions={sessions.length > 0}
            characterId={characterId}
            userId={userId}
          />

          <RecentFormPulse
            sessions={sessions}
            onSelectSession={(sessionId) =>
              navigate(
                userId && characterId
                  ? `/profile/${userId}/c/${characterId}/sessions/${sessionId}`
                  : `sessions/${sessionId}`,
              )
            }
          />

          {(activeSession || sessions.length === 0) && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  Active Session
                </h3>
                {sessions.length > 0 && (
                  <Link
                    to={
                      userId && characterId
                        ? `/profile/${userId}/c/${characterId}/sessions`
                        : 'sessions'
                    }
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View all sessions
                  </Link>
                )}
              </div>

              {activeSession ? (
                <div className="grid grid-cols-1 gap-4">
                  <SessionCard
                    key={activeSession.id}
                    onClick={() =>
                      navigate(
                        userId && characterId
                          ? `/profile/${userId}/c/${characterId}/sessions/${activeSession.id}`
                          : `sessions/${activeSession.id}`,
                      )
                    }
                    session={activeSession}
                  />
                </div>
              ) : (
                <Empty
                  icon={
                    <RadioIcon className="h-12 w-12 self-center text-muted-foreground/60" />
                  }
                  title="No Sessions Recorded"
                  description={
                    isOwner
                      ? 'Start a live tracking session before queueing into the Crucible to automatically track matches and loadout snapshots.'
                      : 'This Guardian has not recorded any Crucible sessions on this character yet.'
                  }
                >
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {isOwner && (
                      <DirectSessionStartForm
                        characterId={characterId}
                        userId={userId}
                        label="Start First Session"
                      />
                    )}
                    <Button
                      asChild
                      variant={isOwner ? 'outline' : 'default'}
                    >
                      <Link to="/sessions">Browse Community Sessions</Link>
                    </Button>
                  </div>
                </Empty>
              )}
            </section>
          )}

          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  Top Loadouts
                </h3>
                <Badge
                  variant="secondary"
                  className="text-xs font-medium uppercase tracking-wider"
                >
                  All Modes · Min. 10 Games
                </Badge>
              </div>
              {topLoadouts.length > 0 && (
                <Link
                  to={
                    userId && characterId
                      ? `/profile/${userId}/c/${characterId}/loadouts`
                      : 'loadouts'
                  }
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View all loadouts
                </Link>
              )}
            </div>

            {topLoadouts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {topLoadouts.map((snapshot) => (
                  <LoadoutCard
                    key={snapshot.id}
                    snapshot={snapshot}
                    stats={statsRecord[snapshot.id]}
                    gamesCount={countRecord[snapshot.id] ?? 0}
                    compact
                    onClick={() =>
                      navigate(
                        userId && characterId
                          ? `/profile/${userId}/c/${characterId}/loadouts/${snapshot.id}`
                          : `loadouts/${snapshot.id}`,
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <Empty
                icon={
                  <SwordsIcon className="h-12 w-12 self-center text-muted-foreground/60" />
                }
                title={
                  isOwner ? 'Get in the Crucible!' : 'No Top Loadouts Yet'
                }
                description={
                  isOwner
                    ? 'Play at least 10 games with a loadout so your top builds will start showing up!'
                    : 'This Guardian has not recorded 10 or more games with a single loadout on this character yet.'
                }
              >
                {sessions.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      asChild
                      variant={isOwner ? 'outline' : 'default'}
                    >
                      <Link to="loadouts?minimum=1">Browse All Loadouts</Link>
                    </Button>
                  </div>
                )}
              </Empty>
            )}
          </section>
        </div>
      </div>
    );
  }

  return null;
}

export default Home;


