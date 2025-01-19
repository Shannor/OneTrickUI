import type { Route } from '../../.react-router/types/app/+types/root';
import { commitPreferences, getPreferences } from '~/.server/preferences';
import { data, redirect } from 'react-router';

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const characterId = formData.get('characterId');
  if (!characterId) {
    return { message: 'No character id' };
  }
  const session = await getPreferences(request.headers.get('Cookie'));
  session.set('characterId', characterId.toString());
  console.log(characterId.toString());
  return redirect('/', {
    headers: { 'Set-Cookie': await commitPreferences(session) },
  });
}
