import { getAuth } from '~/.server/auth';
import { getPreferences } from '~/.server/preferences';
import { type Character, type FireteamMember, getFireteam } from '~/api';

// Create properly tagged union types
interface MembershipCharacters {
  membershipId: string;
  userId: string;
  characters: Character[];
}

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
    throw new Error('Not authenticated');
  }
  const { data: fireteam, error } = await getFireteam({
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Membership-ID': auth.membershipId,
      'X-User-ID': auth.id,
    },
  });
  if (error) {
    return {
      status: 'error',
      error: error.message,
    };
  }
  const { fireteam: selectedCharacters } = await getPreferences(request);
  return { fireteam, selectedCharacters, status: 'success' };
}
