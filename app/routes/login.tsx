import { ArrowLeft } from 'lucide-react';
import { Link, redirect, useLoaderData } from 'react-router';
import { getAuth } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';
import { Logo } from '~/components/logo';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { buttonVariants } from '~/components/ui/button';
import { getBungieAuthUrl } from '~/lib/auth-utils';
import { extractRequestMeta } from '~/lib/request-logger';
import { cn, getSiteOrigin, isDev } from '~/lib/utils';

import type { Route } from './+types/login';

export async function loader({ request, context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  const meta = extractRequestMeta(request);
  const url = new URL(request.url);
  const error = url.searchParams.get('error');

  log.set({
    route: 'routes/login',
    login: { flow: 'login_page', errorParam: error },
    requestMeta: meta,
  });

  const auth = await getAuth(request);
  if (auth) {
    log.set({
      user: { id: auth.id },
      login: { status: 'already_authenticated' },
    });
    return redirect(`/profile/${auth.id}`);
  }

  if (error) {
    log.warn('Login page rendered with error query parameter', {
      login: { error },
    });
  }

  return { error, showDevLogin: isDev() };
}

export default function Login() {
  const loaderData = useLoaderData<typeof loader>();
  const error = loaderData?.error;
  const showDevLogin = loaderData?.showDevLogin;
  const href = getBungieAuthUrl();

  const origin = getSiteOrigin();
  const pageTitle = 'Login | 1 Trick';
  const pageDescription =
    'Sign in to 1 Trick using Bungie SSO to view your Destiny 2 stats and sessions.';
  const canonicalUrl = 'https://d2onetrick.com/login';

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${origin}/og-image.png`} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={`${origin}/twitter-image.png`} />
      <link rel="canonical" href={canonicalUrl} />
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-8 w-auto" alt="D2 One Trick logo" />
            <span className="text-xl font-extrabold uppercase tracking-wider text-foreground">
              <span className="text-primary"> 1</span> Trick
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <div className={cn('flex flex-col gap-6')}>
              <div className="flex flex-col items-center gap-2 text-center">
                <Logo
                  className="mx-auto mb-4 h-16 w-auto"
                  alt="D2 One Trick logo"
                />
                <h1 className="mx-auto text-balance text-4xl font-extrabold uppercase tracking-wider text-foreground drop-shadow-sm md:text-5xl">
                  <span className="text-primary"> 1</span> Trick
                </h1>
                <p className="mt-2 text-balance text-sm text-muted-foreground">
                  Follow Bungie SSO to login to your account.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="break-words">
                  <AlertTitle>Sign In Failed</AlertTitle>
                  <AlertDescription className="break-words text-xs">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-3">
                <Link
                  to={href}
                  reloadDocument
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    'h-auto min-h-[2.5rem] w-full justify-center whitespace-normal px-4 py-2 text-center',
                  )}
                >
                  {error ? 'Retry Sign In with Bungie' : 'Login with Bungie'}
                </Link>

                {showDevLogin && (
                  <Link
                    to="/action/dev-login"
                    reloadDocument
                    className={cn(
                      buttonVariants({ variant: 'secondary' }),
                      'h-auto min-h-[2.5rem] w-full justify-center whitespace-normal border border-dashed px-4 py-2 text-center',
                    )}
                  >
                    Dev Login (Local Test User)
                  </Link>
                )}

                <Link
                  to="/"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'h-auto min-h-[2.5rem] w-full justify-center gap-2 whitespace-normal px-4 py-2 text-center text-muted-foreground hover:text-foreground',
                  )}
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  <span>Back to Home</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="https://oyster.ignimgs.com/mediawiki/apis.ign.com/destiny/3/36/Traveler_s_rest_desktop.jpg?width=1920"
          alt="Destiny 2 background"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
