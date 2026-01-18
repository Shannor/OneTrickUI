import { redirect } from 'react-router';
import { getAuth } from '~/.server/auth';
import { Logo } from '~/components/logo';
import { Button } from '~/components/ui/button';
import { cn, isDev } from '~/lib/utils';

import type { Route } from './+types/login';

const CLIENT_ID = isDev() ? 48883 : 48722;
export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (auth) {
    return redirect(`/profile/${auth.id}`);
  }
  return null;
}
export default function Login() {
  const href = `https://www.bungie.net/en/OAuth/Authorize?client_id=${CLIENT_ID}&response_type=code&state=1234`;
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
          <div className="flex items-center gap-2 font-medium">
            <Logo
              className="mx-auto mb-4 h-16 w-auto"
              alt="D2 One Trick logo"
            />
            One Trick
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form className={cn('flex flex-col gap-6')}>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome to One Trick!</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Follow Bungie SSO to login to your account.
                </p>
              </div>
              <div className="grid gap-6">
                <Button className="w-full" asChild>
                  <a href={href}>Login with Bungie</a>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="https://oyster.ignimgs.com/mediawiki/apis.ign.com/destiny/3/36/Traveler_s_rest_desktop.jpg?width=1920"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
