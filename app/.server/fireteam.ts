import { getAuth } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import { getPreferences } from '~/.server/preferences';
import { type FireteamMember, getFireteam } from '~/api';

// The failure response
interface FailureResponse {
  status: 'error';
  error: string;
  fireteam?: never;
  characters?: never;
  selectedCharacters?: never;
}

// The success response
interface SuccessResponse {
  status: 'success';
  error?: never;
  fireteam: FireteamMember[];
  selectedCharacters: Record<string, string> | undefined;
}

type Response = SuccessResponse | FailureResponse;

export async function getFireteamData(request: Request): Promise<Response> {
  const log = getRequestLogger();
  log.set({ fn: 'getFireteamData' });
  const auth = await getAuth(request);
  if (!auth) {
    log.set({ fireteam: { status: 'unauthenticated' } });
    return {
      status: 'error',
      error: 'Not authenticated',
    };
  }
  log.set({ user: { id: auth.id } });
  try {
    const { data: fireteam, error } = await getFireteam({
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'X-Membership-ID': auth.primaryMembershipId || auth.membershipId,
        'X-User-ID': auth.id,
      },
    });
    if (error) {
      const errorMessage =
        typeof error === 'string'
          ? error
          : ((error as { message?: string })?.message ??
            'Failed to fetch fireteam');
      log.error(errorMessage, { fireteam: { status: 'error' } });
      return {
        status: 'error',
        error: errorMessage,
      };
    }
    const { fireteam: selectedCharacters } = await getPreferences(request);
    const fireteamMembers = Array.isArray(fireteam) ? fireteam : [];
    log.set({ fireteam: { count: fireteamMembers.length } });
    return {
      fireteam: fireteamMembers,
      selectedCharacters,
      status: 'success',
    };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to fetch fireteam';
    log.error(err instanceof Error ? err : errorMessage, {
      fireteam: { status: 'error' },
    });
    return {
      status: 'error',
      error: errorMessage,
    };
  }
}
