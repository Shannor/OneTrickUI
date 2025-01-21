import { redirect } from 'react-router';
import { setPreferences } from '~/.server/preferences';

import type { Route } from '../../.react-router/types/app/+types/root';

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const characterId = formData.get('characterId');

  if (!characterId) {
    return { message: 'No character id' };
  }

  const headers = await setPreferences(request, {
    characterId: characterId.toString(),
  });

  const redirectLocation = formData.get('redirect');
  return redirect(redirectLocation?.toString() || '/', {
    ...headers,
  });
}
