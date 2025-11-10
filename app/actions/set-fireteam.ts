import { redirectBack } from '~/.server/auth';
import { getPreferences, setPreferences } from '~/.server/preferences';

import type { Route } from '../../.react-router/types/app/+types/root';

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const characterId = formData.get('characterId');
  const userId = formData.get('userId');
  const redirectLocation = formData.get('redirect');

  if (!characterId || !userId) {
    return null;
  }

  const { fireteam } = await getPreferences(request);
  const headers = await setPreferences(request, {
    fireteam: {
      ...fireteam,
      [userId.toString()]: characterId.toString(),
    },
  });

  return redirectBack(request, {
    fallback: redirectLocation?.toString() ?? '/',
    response: {
      ...headers,
    },
  });
}
