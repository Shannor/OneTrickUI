import { useLoaderData } from 'react-router';
import { setAuth } from '~/.server/auth';
import { login } from '~/api';
import { AuthRetryCard } from '~/components/auth-retry';
import { Logger } from '~/lib/logger';
import { extractRequestMeta, maskCode } from '~/lib/request-logger';

import type { Route } from './+types/oauth';

export async function loader({ request }: Route.LoaderArgs) {
  const meta = extractRequestMeta(request);
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const oauthError = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  const state = url.searchParams.get('state');

  const maskedCode = maskCode(code);
  const codeLength = code ? code.length : 0;

  const l = Logger.child({
    flow: 'oauth_callback',
    ...meta,
    codePrefix: maskedCode,
    codeLength,
    state,
  });

  l.info('OAuth callback loader received request');

  if (oauthError) {
    l.warn(
      { oauthError, errorDescription },
      'OAuth error parameter received from Bungie redirect',
    );
    return {
      error:
        errorDescription ||
        oauthError ||
        'Authentication was cancelled or failed with Bungie.',
    };
  }

  if (!code) {
    l.warn('Missing authorization code in Bungie OAuth callback');
    return { error: 'Missing authorization code from Bungie.' };
  }

  try {
    l.info(
      { codePrefix: maskedCode },
      'Sending authorization code to backend login endpoint',
    );
    const { data, error: apiError, response } = await login({ body: { code } });

    if (apiError || !data) {
      l.error(
        {
          apiError,
          backendStatus: response?.status,
          backendStatusText: response?.statusText,
          codePrefix: maskedCode,
        },
        'Missing data from login or API error',
      );
      const errorMessage =
        typeof apiError === 'object' &&
        apiError !== null &&
        'message' in apiError &&
        typeof (apiError as { message?: unknown }).message === 'string'
          ? (apiError as { message: string }).message
          : 'Failed to authenticate with Bungie server. Please try again.';
      return { error: errorMessage };
    }

    l.info(
      { userId: data.id, codePrefix: maskedCode },
      'Backend login succeeded, setting auth session',
    );
    return setAuth(request, data);
  } catch (e) {
    l.error(
      { err: e, codePrefix: maskedCode },
      'Unexpected error occurred while setting session during OAuth callback',
    );
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
