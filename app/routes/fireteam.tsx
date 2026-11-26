import { FlaskConical, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, data, useFetcher, useLocation } from 'react-router';
import {
  type DevFireteamMockScenario,
  loadDevMockFireteam,
} from '~/.server/dev-fireteam-mock';
import { getFireteamData } from '~/.server/fireteam';
import { getRequestLogger } from '~/.server/logger';
import { setPreferences } from '~/.server/preferences';
import type { FireteamMember } from '~/api';
import { Empty } from '~/components/empty';
import { FireteamHeader } from '~/components/fireteam-header';
import { FireteamMemberCard } from '~/components/fireteam-member-card';
import { MemberSessionStatus } from '~/components/member-session-status';
import {
  BulkStartResultsSummary,
  StartFireteamBar,
} from '~/components/start-fireteam-bar';
import { buttonVariants } from '~/components/ui/button';
import { toast } from '~/components/ui/sonner';
import { useIsNavigating } from '~/hooks/use-route-loaders';
import {
  type StartFireteamSessionsActionData,
  buildFireteamCharacterMap,
  buildFireteamViewModel,
  formatBulkStartSummary,
} from '~/lib/fireteam-sessions';
import { cn, getSiteOrigin } from '~/lib/utils';

import type { Route } from './+types/fireteam';

const DEV_MOCK_SCENARIOS: Array<{
  id: DevFireteamMockScenario;
  label: string;
}> = [
  { id: 'mixed', label: 'Mixed (1 Active, 2 Ready)' },
  { id: 'race', label: 'Race (Started + Skipped)' },
  { id: 'all-inactive', label: 'All Ready' },
  { id: 'all-active', label: 'All Active' },
];

interface DevFireteamMockBannerProps {
  scenario: DevFireteamMockScenario;
  pathname: string;
}

function DevFireteamMockBanner({
  scenario,
  pathname,
}: DevFireteamMockBannerProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/10 px-3.5 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-300">
        <FlaskConical className="h-4 w-4 shrink-0" />
        <span>Dev Mock Fireteam ({scenario})</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {DEV_MOCK_SCENARIOS.map((item) => (
          <Link
            key={item.id}
            to={`${pathname}?mock=${item.id}`}
            reloadDocument
            className={cn(
              'rounded px-2 py-1 font-medium transition-colors',
              scenario === item.id
                ? 'bg-amber-500 text-amber-950'
                : 'bg-background/70 text-foreground hover:bg-background',
            )}
          >
            {item.label}
          </Link>
        ))}
        <Link
          to={pathname}
          reloadDocument
          className="rounded px-2 py-1 font-medium text-muted-foreground hover:bg-background hover:text-foreground"
        >
          Exit Mock
        </Link>
      </div>
    </div>
  );
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  log.set({ route: 'routes/fireteam' });

  let members: FireteamMember[] = [];
  let selectedCharacters: Record<string, string> | undefined;
  let devMockScenario: DevFireteamMockScenario | undefined;

  const devMock = import.meta.env.DEV
    ? await loadDevMockFireteam(request)
    : undefined;

  if (devMock) {
    members = devMock.members;
    selectedCharacters = devMock.selectedCharacters;
    devMockScenario = devMock.devMockScenario;
    log.set({
      fireteam: {
        memberCount: members.length,
        devMockScenario,
      },
    });
  } else {
    const response = await getFireteamData(request);
    if (response.status === 'error') {
      return data({
        members: [] as FireteamMember[],
        fireteamMemWithCharacters: {} as Record<string, string>,
        devMockScenario: undefined as DevFireteamMockScenario | undefined,
      });
    }
    members = Array.isArray(response.fireteam) ? response.fireteam : [];
    selectedCharacters = response.selectedCharacters;
    log.set({ fireteam: { memberCount: members.length } });
  }

  const withCharacters = buildFireteamCharacterMap(members, selectedCharacters);

  const headers = await setPreferences(request, {
    fireteam: withCharacters,
  });

  return data(
    {
      members,
      fireteamMemWithCharacters: withCharacters,
      devMockScenario,
    },
    {
      ...headers,
    },
  );
}

export function Fireteam({ loaderData, params }: Route.ComponentProps) {
  const { members, fireteamMemWithCharacters, devMockScenario } = loaderData;
  const location = useLocation();
  const [isNavigating] = useIsNavigating();
  const { id, characterId } = params ?? {};

  const bulkFetcher = useFetcher<StartFireteamSessionsActionData>();
  const [trackComp, setTrackComp] = useState(false);
  const [draftCharacters, setDraftCharacters] = useState<
    Record<string, string>
  >({});
  const [excludedMemberIds, setExcludedMemberIds] = useState<
    Record<string, boolean>
  >({});
  const [dismissedData, setDismissedData] = useState<
    StartFireteamSessionsActionData | undefined
  >(undefined);
  const previousFetcherState = useRef(bulkFetcher.state);

  const isBulkSubmitting = bulkFetcher.state !== 'idle';
  const isSubmitting = isNavigating || isBulkSubmitting;

  useEffect(() => {
    if (
      previousFetcherState.current !== 'idle' &&
      bulkFetcher.state === 'idle' &&
      bulkFetcher.data
    ) {
      if (bulkFetcher.data.ok) {
        const summary = formatBulkStartSummary(bulkFetcher.data.results);
        toast.success(summary.title);
      } else {
        toast.error(bulkFetcher.data.error);
      }
    }
    previousFetcherState.current = bulkFetcher.state;
  }, [bulkFetcher.state, bulkFetcher.data]);

  const origin = getSiteOrigin();
  const pageTitle = 'Fireteam | 1 Trick';
  const pageDescription =
    'View your current fireteam and manage active character selections on 1 Trick.';
  const canonicalUrl =
    id && characterId
      ? `https://d2onetrick.com/profile/${id}/c/${characterId}/fireteam`
      : '';

  const metaTags = (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={`${origin}/og-image.png`} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={`${origin}/twitter-image.png`} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    </>
  );

  if (members.length === 0) {
    return (
      <>
        {metaTags}
        <div className="flex w-full flex-col items-center gap-4">
          <Empty
            title="You are currently offline."
            description="Refresh once you're signed in to Destiny 2 and have chosen your character."
            icon={
              <Users className="h-16 w-16 self-center text-muted-foreground" />
            }
          />
          {import.meta.env.DEV && (
            <Link
              to={`${location.pathname}?mock=mixed`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'gap-2',
              )}
            >
              <FlaskConical className="h-4 w-4" />
              Preview Dev Mock Fireteam
            </Link>
          )}
        </div>
      </>
    );
  }

  const bulkResults = bulkFetcher.data?.ok
    ? bulkFetcher.data.results
    : undefined;
  const visibleResults =
    bulkResults && dismissedData !== bulkFetcher.data ? bulkResults : undefined;
  const errorMessage =
    bulkFetcher.state === 'idle' && bulkFetcher.data?.ok === false
      ? bulkFetcher.data.error
      : undefined;

  const {
    memberViews,
    memberNames,
    selectedTargets,
    readyCount,
    activeHeaderCount,
    activeSelectedCount,
  } = buildFireteamViewModel({
    members,
    fireteamMemWithCharacters,
    draftCharacters,
    excludedMemberIds,
    bulkResults,
    visibleResults,
  });

  const handleBulkStart = () => {
    if (selectedTargets.length === 0 || isBulkSubmitting) return;
    setDismissedData(undefined);
    const formData = new FormData();
    formData.append('members', JSON.stringify(selectedTargets));
    formData.append('trackComp', String(trackComp));
    if (import.meta.env.DEV && devMockScenario) {
      formData.append('mockScenario', devMockScenario);
    }
    bulkFetcher.submit(formData, {
      method: 'post',
      action: '/action/start-fireteam-sessions',
    });
  };

  const handleDismissResults = () => {
    setDismissedData(bulkFetcher.data);
  };

  const handleToggleBulkSelect = (memberKey: string, selected: boolean) => {
    setExcludedMemberIds((prev) => ({
      ...prev,
      [memberKey]: !selected,
    }));
  };

  const handleCharacterSelect = (
    memberKey: string,
    savedCharId: string | undefined,
    nextCharId?: string | null,
  ) => {
    setDraftCharacters((prev) => {
      if (!nextCharId || nextCharId === savedCharId) {
        const next = { ...prev };
        delete next[memberKey];
        return next;
      }
      return {
        ...prev,
        [memberKey]: nextCharId,
      };
    });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {metaTags}

      {import.meta.env.DEV && devMockScenario && (
        <DevFireteamMockBanner
          scenario={devMockScenario}
          pathname={location.pathname}
        />
      )}

      <FireteamHeader
        memberCount={members.length}
        activeCount={activeHeaderCount}
      />

      <StartFireteamBar
        selectedTargets={selectedTargets}
        readyCount={readyCount}
        activeCount={activeSelectedCount}
        trackComp={trackComp}
        onTrackCompChange={setTrackComp}
        onSubmit={handleBulkStart}
        isSubmitting={isBulkSubmitting}
        errorMessage={errorMessage}
      >
        {visibleResults && visibleResults.length > 0 && (
          <BulkStartResultsSummary
            results={visibleResults}
            memberNames={memberNames}
            onDismiss={handleDismissResults}
          />
        )}
      </StartFireteamBar>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
        {memberViews.map((view) => (
          <FireteamMemberCard
            key={view.member.membershipId || view.member.id}
            member={view.member}
            characterId={view.savedCharId}
            selectedCharacterId={view.effectiveCharId}
            isActive={view.isSelectedCharActive}
            isSelectedForBulk={view.isSelectedForBulk}
            onToggleBulkSelect={(selected) =>
              handleToggleBulkSelect(view.memberKey, selected)
            }
            onCharacterSelect={(nextCharId) =>
              handleCharacterSelect(
                view.memberKey,
                view.savedCharId,
                nextCharId,
              )
            }
            isSubmitting={isSubmitting}
          >
            <MemberSessionStatus
              session={view.selectedActiveSession}
              otherActiveSession={view.otherActiveSession}
              otherActiveCharacterClass={view.otherActiveCharacterClass}
              bulkOutcome={view.bulkOutcome}
              userId={view.memberKey}
              characterId={view.effectiveCharId}
              isSubmitting={isSubmitting}
            />
          </FireteamMemberCard>
        ))}
      </div>
    </div>
  );
}

export default Fireteam;
