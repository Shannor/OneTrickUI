import type { Route } from './+types/oauth';
import { login } from '~/api';
import { redirect } from 'react-router';
import { commitSession, getSession } from '~/routes/auth.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url); // Parse the request URL
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code) {
    return { message: 'No code' };
  }
  try {
    const { data, error } = await login({ body: { code } });
    if (!data) {
      return { message: 'No data' };
    }
    if (error) {
      throw error;
    }
    const session = await getSession(request.headers.get('Cookie'));
    session.set('jwt', data);
    return redirect('/', {
      headers: {
        'Set-Cookie': await commitSession(session, {
          // httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: data.expiresIn, // 7 days
        }),
      },
    });
  } catch (e) {
    console.error(e);
  }
}

export default function OAuth() {
  return <div>OAuth</div>;
}
