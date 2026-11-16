import { getRequestLogger } from '~/.server/logger';
import { getSimilarSnapshots } from '~/api';
import { Empty } from '~/components/empty';
import { SimilarLoadoutsView } from '~/components/similar-loadouts';
import { slimSimilarSnapshotPage } from '~/hooks/use-loadout';
import {
  useLoadoutData,
  useOptionalProfileData,
} from '~/hooks/use-route-loaders';

import type { Route } from './+types/loadout-similar';

export async function loader({ params, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const { snapshotId } = params;
  log.set({ route: 'routes/loadout-similar', snapshot: { id: snapshotId } });

  const { data, error } = await getSimilarSnapshots({
    path: { snapshotId },
    query: { includeStats: true },
  });

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
}

export function LoadoutSimilar({ loaderData, params }: Route.ComponentProps) {
  const { similarData, error } = loaderData;
  const { id, characterId, snapshotId } = params;
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
        snapshotId={snapshotId}
        initialData={similarData}
        initialError={error}
        showPageHeader={true}
        userId={id}
        characterId={characterId}
        isDetailPage={true}
      />
    </div>
  );
}

export default LoadoutSimilar;
