import { redirectBack } from '~/.server/auth';
import { Logger } from '~/.server/logger';
import { getPreferences } from '~/.server/preferences';
import { sessionCheckIn } from '~/api';

import type { Route } from '../../.react-router/types/app/+types/root';

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const membershipId = formData.get('membershipId');
  const sessionId = formData.get('sessionId');
  const characterId = formData.get('characterId');

  if (!membershipId) {
    return { error: 'No membership id' };
  }
  if (!sessionId) {
    return { error: 'No session id' };
  }

  const { fireteam } = await getPreferences(request);
  const f = fireteam ?? {};
  if (characterId) {
    f[membershipId.toString()] = characterId.toString();
  }
  Logger.child({ fireteam, sessionId, membershipId, characterId }).info(
    'Session Check-In',
  );
  const response = await sessionCheckIn({
    body: {
      sessionId: sessionId.toString(),
      fireteam: f,
    },
    headers: {
      'X-Membership-ID': membershipId.toString(),
    },
  });
  if (response.error) {
    return { error: response.error };
  }
  return redirectBack(request, { fallback: '/' });
}
