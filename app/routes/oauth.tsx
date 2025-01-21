import { setAuth } from '~/.server/auth';
import { login } from '~/api';

import type { Route } from './+types/oauth';

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url); // Parse the request URL
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code) {
    return { message: 'No code' };
  }
  try {
    const { data } = await login({ body: { code } });
    if (!data) {
      return { message: 'No data' };
    }
    return setAuth(request, data);
  } catch (e) {
    console.error(e);
  }
}

export default function OAuth() {
  return <div>OAuth</div>;
}
