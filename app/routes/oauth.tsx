import { useLoaderData } from 'react-router';
import { setAuth } from '~/.server/auth';
import { login } from '~/api';
import { AuthRetryCard } from '~/components/auth-retry';
import { Logger } from '~/lib/logger';

import type { Route } from './+types/oauth';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const oauthError = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  const l = Logger.child({ request: url });

  if (oauthError) {
    l.error({ oauthError, errorDescription }, 'OAuth error from Bungie');
    return {
      error:
        errorDescription ||
        oauthError ||
        'Authentication was cancelled or failed with Bungie.',
    };
  }

  if (!code) {
    l.error('Missing Code');
    return { error: 'Missing authorization code from Bungie.' };
  }

  try {
    const { data, error: apiError } = await login({ body: { code } });
    if (apiError || !data) {
      l.error({ apiError }, 'Missing data from login or API error');
      const errorMessage =
        typeof apiError === 'object' &&
        apiError !== null &&
        'message' in apiError &&
        typeof (apiError as { message?: unknown }).message === 'string'
          ? (apiError as { message: string }).message
          : 'Failed to authenticate with Bungie server. Please try again.';
      return { error: errorMessage };
    }
    return setAuth(request, data);
  } catch (e) {
    l.error(e, 'Failed to set cookies');
    return { error: 'An unexpected error occurred while saving your session.' };
  }
}

export default function OAuth() {
  const loaderData = useLoaderData<typeof loader>();
  const error = loaderData?.error;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <title>Sign In Status — One Trick</title>
      <meta name="description" content="Sign in status page for One Trick." />
      <div className="w-full max-w-md">
        <AuthRetryCard error={error} />
      </div>
    </div>
  );
}
