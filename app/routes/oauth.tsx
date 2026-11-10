import { redirect, useLoaderData } from 'react-router';
import { getAuth, setAuth } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import { login } from '~/api';
import { AuthRetryCard } from '~/components/auth-retry';
import { extractRequestMeta, maskCode } from '~/lib/request-logger';

import type { Route } from './+types/oauth';

export async function loader({ request, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const meta = extractRequestMeta(request);
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const oauthError = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  const state = url.searchParams.get('state');

  const maskedCode = maskCode(code);
  const codeLength = code ? code.length : 0;

  log.set({
    route: 'routes/oauth',
    oauth: {
      flow: 'oauth_callback',
      codePrefix: maskedCode,
      codeLength,
      state,
    },
    requestMeta: meta,
  });

  const existingAuth = await getAuth(request);
  if (existingAuth) {
    log.set({
      user: { id: existingAuth.id },
      oauth: { status: 'already_authenticated' },
    });
    return redirect(`/profile/${existingAuth.id}`);
  }

  if (oauthError) {
    log.warn('OAuth error parameter received from Bungie redirect', {
      oauth: { oauthError, errorDescription },
    });
    return {
      error:
        errorDescription ||
        oauthError ||
        'Authentication was cancelled or failed with Bungie.',
    };
  }

  if (!code) {
    log.warn('Missing authorization code in Bungie OAuth callback');
    return { error: 'Missing authorization code from Bungie.' };
  }

  try {
    const { data, error: apiError, response } = await login({ body: { code } });

    if (apiError || !data) {
      log.error('Missing data from login or API error', {
        oauth: {
          apiError,
          backendStatus: response?.status,
          backendStatusText: response?.statusText,
          codePrefix: maskedCode,
        },
      });

      const fallbackAuth = await getAuth(request);
      if (fallbackAuth) {
        log.set({
          user: { id: fallbackAuth.id },
          oauth: { status: 'fallback_auth_redirect' },
        });
        return redirect(`/profile/${fallbackAuth.id}`);
      }

      const errorMessage =
        typeof apiError === 'object' &&
        apiError !== null &&
        'message' in apiError &&
        typeof (apiError as { message?: unknown }).message === 'string'
          ? (apiError as { message: string }).message
          : 'Failed to authenticate with Bungie server. Please try again.';
      return { error: errorMessage };
    }

    log.set({
      user: { id: data.id },
      oauth: { status: 'succeeded', codePrefix: maskedCode },
    });
    return setAuth(request, data);
  } catch (e) {
    log.error(e instanceof Error ? e : String(e), {
      oauth: { codePrefix: maskedCode },
    });
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
