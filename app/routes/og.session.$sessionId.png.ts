import { getCachedUser } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import {
  generateSessionOgPng,
  getFallbackOgPng,
} from '~/.server/og-image';
import { getSession, getSessionAggregates } from '~/api';

import type { Route } from './+types/og.session.$sessionId.png';

export async function loader({
  request,
  params,
  context,
}: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const { sessionId } = params;
  log.set({
    route: 'routes/og.session.$sessionId.png',
    session: { id: sessionId },
  });

  try {
    const [sessionRes, aggRes] = await Promise.all([
      getSession({ path: { sessionId } }),
      getSessionAggregates({ path: { sessionId } }),
    ]);

    const session = sessionRes.data;
    if (!session) {
      const fallback = await getFallbackOgPng();
      return new Response(new Uint8Array(fallback), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    const { data: profile } = await getCachedUser(request, session.userId).catch(
      () => ({ data: undefined }),
    );

    const pngBuffer = await generateSessionOgPng({
      session,
      aggregates: aggRes.data?.aggregates ?? [],
      profile,
    });

    const cacheControl =
      session.status === 'pending'
        ? 'public, max-age=60, s-maxage=120'
        : 'public, max-age=3600, s-maxage=86400';

    return new Response(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': cacheControl,
      },
    });
  } catch (err) {
    log.error(err instanceof Error ? err : String(err), {
      step: 'generate_session_og_image',
      sessionId,
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
