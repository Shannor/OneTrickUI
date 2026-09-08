import { redirect } from 'react-router';
import { getPreferences, setPreferences } from '~/.server/preferences';

import type { Route } from '../../.react-router/types/app/+types/root.ts';

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const characterId = formData.get('characterId');
  const userId = formData.get('userId');
  const redirectLocation = formData.get('redirect');

  if (!characterId || !userId) {
    return null;
  }

  const userIdStr = userId.toString();
  const charIdStr = characterId.toString();

  const { fireteam } = await getPreferences(request);
  const headers = await setPreferences(request, {
    fireteam: {
      ...fireteam,
      [userIdStr]: charIdStr,
    },
  });

  let targetRedirect = redirectLocation?.toString() ?? '/';
  const profilePrefix = `/profile/${userIdStr}/c/`;
  const prefixIndex = targetRedirect.indexOf(profilePrefix);
  if (prefixIndex !== -1) {
    const afterPrefix = targetRedirect.slice(
      prefixIndex + profilePrefix.length,
    );
    const nextSlash = afterPrefix.indexOf('/');
    const rest = nextSlash === -1 ? '' : afterPrefix.slice(nextSlash);
    targetRedirect = `${targetRedirect.slice(0, prefixIndex)}${profilePrefix}${charIdStr}${rest}`;
  }

  return redirect(targetRedirect, {
    ...headers,
  });
}
