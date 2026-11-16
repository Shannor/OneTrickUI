import { getCachedUser } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import {
  generateLoadoutOgPng,
  getFallbackOgPng,
} from '~/.server/og-image';
import { getSnapshot } from '~/api';

import type { Route } from './+types/og.loadout.$snapshotId.png';

export async function loader({
  request,
  params,
  context,
}: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const { snapshotId } = params;
  log.set({
    route: 'routes/og.loadout.$snapshotId.png',
    snapshot: { id: snapshotId },
  });

  try {
    const { data: snapshot } = await getSnapshot({ path: { snapshotId } });
    if (!snapshot) {
      const fallback = await getFallbackOgPng();
      return new Response(new Uint8Array(fallback), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    const { data: profile } = await getCachedUser(
      request,
      snapshot.userId,
    ).catch(() => ({ data: undefined }));

    const pngBuffer = await generateLoadoutOgPng({
      snapshot,
      profile,
    });

    return new Response(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (err) {
    log.error(err instanceof Error ? err : String(err), {
      step: 'generate_loadout_og_image',
      snapshotId,
    });
    const fallback = await getFallbackOgPng();
    return new Response(new Uint8Array(fallback), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }
}
