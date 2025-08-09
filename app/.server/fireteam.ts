import { getAuth } from '~/.server/auth';
import { Logger } from '~/.server/logger';
import { getPreferences } from '~/.server/preferences';
import {
  type Character,
  type FireteamMember,
  getFireteam,
  getPublicProfile,
} from '~/api';

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
  charactersPromise: Promise<MembershipCharacters[]>;
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
  const charactersPromise = Promise.all(
    fireteam.map(async (member): Promise<MembershipCharacters> => {
      const { data, error } = await getPublicProfile({
        query: {
          id: member.membershipId,
        },
      });
      if (error) {
        Logger.error(
          { error, membershipId: member.membershipId },
          'failed to get profile for user',
        );

        return {
          membershipId: member.membershipId,
          userId: member.id,
          characters: [],
        };
      }
      return {
        membershipId: member.membershipId,
        userId: member.id,
        characters: data?.characters ?? [],
      };
    }),
  );
  return { fireteam, charactersPromise, selectedCharacters, status: 'success' };
}
