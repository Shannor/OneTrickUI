import { data, isRouteErrorResponse } from 'react-router';
import { getAuth } from '~/.server/auth';
import {
  buildDevMockBulkStartResults,
  parseDevFireteamMockScenario,
} from '~/.server/dev-fireteam-mock';
import { getRequestLogger } from '~/.server/logger';
import { getPreferences, setPreferences } from '~/.server/preferences';
import { type FireteamSessionMemberTarget, startFireteamSessions } from '~/api';
import type {
  BulkFireteamSessionResult,
  StartFireteamSessionsActionData,
} from '~/lib/fireteam-sessions';

import type { Route } from './+types/start-fireteam-sessions';

function parseMemberTargets(
  rawMembers: FormDataEntryValue | null,
): FireteamSessionMemberTarget[] {
  if (typeof rawMembers !== 'string' || rawMembers.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawMembers);
    if (!Array.isArray(parsed)) return [];

    const seen = new Set<string>();
    const targets: FireteamSessionMemberTarget[] = [];

    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const userId =
        'userId' in item && typeof item.userId === 'string'
          ? item.userId.trim()
          : '';
      const characterId =
        'characterId' in item && typeof item.characterId === 'string'
          ? item.characterId.trim()
          : '';

      if (!userId || !characterId) continue;

      const dedupeKey = `${userId}:${characterId}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      targets.push({ userId, characterId });
    }

    return targets;
  } catch {
    return [];
  }
}

function getApiErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  if (error && typeof error === 'object') {
    if (
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.trim().length > 0
    ) {
      return error.message;
    }
    if (
      'error' in error &&
      typeof error.error === 'string' &&
      error.error.trim().length > 0
    ) {
      return error.error;
    }
  }
  return 'Failed to start fireteam sessions. Please try again.';
}

export async function action({
  request,
  context,
}: Route.ActionArgs): Promise<
  | StartFireteamSessionsActionData
  | ReturnType<typeof data<StartFireteamSessionsActionData>>
> {
  const log = getRequestLogger(context);
  log.set({
    action: 'startFireteamSessions',
    route: 'actions/start-fireteam-sessions',
  });

  const formData = await request.formData();
  const members = parseMemberTargets(formData.get('members'));
  const trackComp = formData.get('trackComp') === 'true';
  const mockScenario = parseDevFireteamMockScenario(
    formData.get('mockScenario')?.toString(),
  );

  if (members.length === 0) {
    return {
      ok: false,
      error: 'Select at least one fireteam member to start.',
    };
  }
  if (members.length > 12) {
    return {
      ok: false,
      error: 'You can start sessions for at most 12 fireteam members at once.',
    };
  }

  if (mockScenario) {
    const results = buildDevMockBulkStartResults(
      mockScenario,
      members,
      trackComp,
    );
    const { fireteam: existingPreferences } = await getPreferences(request);
    const updatedFireteamPrefs: Record<string, string> = {
      ...existingPreferences,
    };
    for (const target of members) {
      updatedFireteamPrefs[target.userId] = target.characterId;
    }
    const headers = await setPreferences(request, {
      fireteam: updatedFireteamPrefs,
    });
    return data({ ok: true as const, results }, { ...headers });
  }

  const auth = await getAuth(request);
  if (!auth) {
    return { ok: false, error: 'No auth token' };
  }

  log.set({
    user: { id: auth.id },
    fireteamBulkStart: {
      memberCount: members.length,
      trackComp,
    },
  });

  try {
    const { data: responseData, error } = await startFireteamSessions({
      body: {
        members,
        trackComp,
      },
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'X-Membership-ID': auth.primaryMembershipId || auth.membershipId,
        'X-User-ID': auth.id,
      },
    });

    if (error) {
      const errorMessage = getApiErrorMessage(error);
      log.error('Failed to start fireteam sessions', {
        fireteamBulkStart: {
          memberCount: members.length,
          trackComp,
          error: errorMessage,
        },
      });
      return { ok: false, error: errorMessage };
    }

    if (!responseData?.results) {
      return { ok: false, error: 'No results returned from server.' };
    }

    const results: BulkFireteamSessionResult[] = responseData.results.map(
      (item) => ({
        userId: item.userId,
        characterId: item.characterId,
        outcome: item.outcome,
        session: {
          id: item.session.id,
          userId: item.session.userId,
          characterId: item.session.characterId,
          startedAt:
            item.session.startedAt instanceof Date
              ? item.session.startedAt.toISOString()
              : String(item.session.startedAt),
          status: item.session.status,
          name: item.session.name,
          aggregateIds: Array.isArray(item.session.aggregateIds)
            ? [...item.session.aggregateIds]
            : [],
          compTracking: item.session.compTracking,
        },
      }),
    );

    const startedCount = results.filter((r) => r.outcome === 'started').length;
    const skippedCount = results.filter(
      (r) => r.outcome === 'skipped_active',
    ).length;

    log.set({
      fireteamBulkStart: {
        memberCount: members.length,
        trackComp,
        startedCount,
        skippedCount,
      },
    });

    const { fireteam: existingPreferences } = await getPreferences(request);
    const updatedFireteamPrefs: Record<string, string> = {
      ...existingPreferences,
    };
    for (const target of members) {
      updatedFireteamPrefs[target.userId] = target.characterId;
    }

    const headers = await setPreferences(request, {
      fireteam: updatedFireteamPrefs,
    });

    return data(
      {
        ok: true as const,
        results,
      },
      {
        ...headers,
      },
    );
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : 'Failed to start fireteam sessions. Please try again.';
    log.error(err instanceof Error ? err : errorMessage, {
      fireteamBulkStart: {
        memberCount: members.length,
        trackComp,
      },
    });
    return {
      ok: false,
      error: errorMessage,
    };
  }
}

export async function clientAction({
  serverAction,
}: Route.ClientActionArgs): Promise<StartFireteamSessionsActionData> {
  try {
    return (await serverAction()) as StartFireteamSessionsActionData;
  } catch (err) {
    if (isRouteErrorResponse(err)) {
      const statusDetail = err.statusText
        ? `${err.status} ${err.statusText}`
        : String(err.status);
      return {
        ok: false,
        error: `Failed to start fireteam sessions (${statusDetail}). Please try again.`,
      };
    }
    return {
      ok: false,
      error:
        'Network error while starting fireteam sessions. Please check your connection and try again.',
    };
  }
}
