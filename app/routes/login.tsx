import { ArrowLeft } from 'lucide-react';
import { Link, redirect, useLoaderData } from 'react-router';
import { getAuth } from '~/.server/auth';
import { Logo } from '~/components/logo';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { buttonVariants } from '~/components/ui/button';
import { getBungieAuthUrl } from '~/lib/auth-utils';
import { cn } from '~/lib/utils';

import type { Route } from './+types/login';

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (auth) {
    return redirect(`/profile/${auth.id}`);
  }
  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  return { error };
}

export default function Login() {
  const loaderData = useLoaderData<typeof loader>();
  const error = loaderData?.error;
  const href = getBungieAuthUrl();

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <title>Login - One Trick</title>
      <meta property="og:title" content="Login - One Trick" />
      <meta
        name="description"
        content="Sign in to One Trick using Bungie SSO to view your Destiny 2 stats and sessions."
      />
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
          <div className="w-full max-w-xs">
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
                <Alert variant="destructive">
                  <AlertTitle>Sign In Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-3">
                <Link
                  to={href}
                  reloadDocument
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    'w-full',
                  )}
                >
                  {error ? 'Retry Sign In with Bungie' : 'Login with Bungie'}
                </Link>

                <Link
                  to="/"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-full gap-2 text-muted-foreground hover:text-foreground',
                  )}
                >
                  <ArrowLeft className="h-4 w-4" />
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
