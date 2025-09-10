import { redirect } from 'react-router';
import { Logger } from '~/.server/logger';
import { getPreferences, setPreferences } from '~/.server/preferences';

import type { Route } from '../../.react-router/types/app/+types/root';

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const characterId = formData.get('characterId');
  const membershipId = formData.get('membershipId');

  Logger.child({ membershipId, characterId }).info('passed in data');
  if (!characterId || !membershipId) {
    return redirect('/dashboard/fireteam');
  }

  const { fireteam } = await getPreferences(request);
  const headers = await setPreferences(request, {
    fireteam: {
      ...fireteam,
      [membershipId.toString()]: characterId.toString(),
    },
  });

  // const redirectLocation = formData.get('redirect');
  return redirect('/dashboard/fireteam', {
    ...headers,
  });
}
