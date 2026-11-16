import type { ShouldRevalidateFunctionArgs } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import { getCachedSimilarSnapshots } from '~/.server/snapshots';
import { Empty } from '~/components/empty';
import { SimilarLoadoutsView } from '~/components/similar-loadouts';
import { slimSimilarSnapshotPage } from '~/hooks/use-loadout';
import {
  useLoadoutData,
  useOptionalProfileData,
} from '~/hooks/use-route-loaders';

import type { Route } from './+types/loadout-similar';

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const { id, snapshotId } = params;
  log.set({ route: 'routes/loadout-similar', snapshot: { id: snapshotId } });

  if (request) {
    const auth = await getAuth(request);
    if (!auth?.id || auth.id !== id) {
      log.set({ snapshot: { id: snapshotId, skippedNonOwner: true } });
      return {
        similarData: null,
        error: null,
      };
    }
  }

  try {
    const { data, error } = await getCachedSimilarSnapshots(
      request,
      snapshotId,
      { includeStats: true },
    );

    if (error || !data) {
      log.error('Failed to fetch similar snapshots in loader', {
        snapshot: { id: snapshotId, error },
      });
      return {
        similarData: null,
        error:
          (error as { message?: string })?.message ||
          'Failed to load similar loadouts',
      };
    }

    log.set({
      snapshot: { id: snapshotId, similarCount: data.items?.length ?? 0 },
    });

    return {
      similarData: slimSimilarSnapshotPage(data),
      error: null,
    };
  } catch (err) {
    log.error(
      err instanceof Error ? err : 'Failed to fetch similar snapshots in loader',
      { snapshot: { id: snapshotId } },
    );
    return {
      similarData: null,
      error:
        err instanceof Error ? err.message : 'Failed to load similar loadouts',
    };
  }
}

export function shouldRevalidate({
  actionResult,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (
    actionResult &&
    typeof actionResult === 'object' &&
    'ok' in actionResult &&
    actionResult.ok === false
  ) {
    return false;
  }
  return defaultShouldRevalidate;
}

export function LoadoutSimilar({ loaderData, params }: Route.ComponentProps) {
  const { similarData, error } = loaderData;
  const { id, characterId } = params;
  const { profile, type } = useOptionalProfileData() ?? {};
  const { snapshot, path } = useLoadoutData();
  const isOwner = type === 'owner';

  const loadoutName = snapshot?.name || 'Loadout';
  const displayName = profile?.displayName;
  const pageTitle = displayName
    ? `${loadoutName} Similar Loadouts - ${displayName} | 1 Trick`
    : `${loadoutName} Similar Loadouts | 1 Trick`;
  const pageDescription = `Compare and merge similar loadouts into ${loadoutName} on 1 Trick.`;
  const canonicalUrl = path ? `${path}/similar` : '';

  if (!isOwner) {
    return (
      <div className="flex flex-col gap-4">
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        <Empty
          title="Owner Access Required"
          description="Only the owner of this profile can compare and merge similar loadouts."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      <SimilarLoadoutsView
        initialData={similarData}
        initialError={error}
        showPageHeader={true}
        userId={id}
        characterId={characterId}
      />
    </div>
  );
}

export default LoadoutSimilar;
