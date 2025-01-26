import { Link, useLoaderData } from 'react-router';
import { setAuth } from '~/.server/auth';
import { Logger } from '~/.server/logger';
import { login } from '~/api';
import { Button } from '~/components/ui/button';

import type { Route } from './+types/oauth';

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  // TODO: Add support for state values
  const state = url.searchParams.get('state');
  const l = Logger.child({ request: url });
  if (!code) {
    l.error('Missing Code');
    return { error: 'Missing Code' };
  }
  try {
    const { data } = await login({ body: { code } });
    if (!data) {
      l.error('Missing data from login');
      return { error: 'Missing data from login' };
    }
    return setAuth(request, data);
  } catch (e) {
    l.error('Failed to set cookies', e);
    return { error: 'Failed to set cookies' };
  }
}

export default function OAuth() {
  const { error } = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="font-bold text-2xl">Failed SignIn</div>
          {error && (
            <p className="text-xl">
              There was an error during sign in. Please try again!
            </p>
          )}
          <Button
            asChild
            className="w-full border-red-500 text-red-500"
            variant="outline"
          >
            <Link to="/login">Try Again</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
