import { getAuth } from '~/.server/auth';
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
  const auth = await getAuth(request);
  if (!auth) {
    return {
      status: 'error',
      error: 'Not authenticated',
    };
  }
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
      return {
        status: 'error',
        error: errorMessage,
      };
    }
    const { fireteam: selectedCharacters } = await getPreferences(request);
    return {
      fireteam: Array.isArray(fireteam) ? fireteam : [],
      selectedCharacters,
      status: 'success',
    };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to fetch fireteam';
    return {
      status: 'error',
      error: errorMessage,
    };
  }
}
