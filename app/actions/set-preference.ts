import { redirectBack } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import { setPreferences } from '~/.server/preferences';

import type { Route } from './+types/set-preference';

export async function action({ request, context }: Route.ActionArgs) {
  const log = getRequestLogger(context);
  log.set({ action: 'setPreference', route: 'actions/set-preference' });
  const formData = await request.formData();
  const characterId = formData.get('characterId');
  const emblemURL = formData.get('emblemUrl');
  const background = formData.get('backgroundUrl');
  const currentTitle = formData.get('title');
  const className = formData.get('class');
  const light = formData.get('light');
  const race = formData.get('race');

  const profileId = formData.get('profileId');
  const displayName = formData.get('displayName');
  const uniqueName = formData.get('uniqueName');
  const membershipId = formData.get('membershipId');

  if (!characterId) {
    return { message: 'No character id' };
  }
  log.set({
    preference: {
      characterId: characterId.toString(),
      profileId: profileId?.toString(),
    },
  });
  let l: number = 0;
  if (light) {
    l = parseInt(light.toString(), 10);
  }

  const headers = await setPreferences(request, {
    character: {
      id: characterId.toString(),
      emblemURL: emblemURL?.toString() ?? '',
      light: BigInt(l),
      class: className?.toString() ?? '',
      currentTitle: currentTitle?.toString() ?? '',
      race: race?.toString() ?? '',
      emblemBackgroundURL: background?.toString() ?? '',
      emblemColor: {
        red: 0,
        green: 0,
        blue: 0,
        alpha: 0,
      },
    },
    profile: {
      id: profileId?.toString() ?? '',
      displayName: displayName?.toString() ?? '',
      uniqueName: uniqueName?.toString() ?? '',
      membershipId: membershipId?.toString() ?? '',
    },
  });

  const redirectTo = formData.get('redirectTo');
  return redirectBack(request, {
    fallback: redirectTo?.toString() ?? '/',
    response: {
      ...headers,
    },
  });
}
