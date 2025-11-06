import { Link, redirect } from 'react-router';
import { getAuth } from '~/.server/auth';
import { LoadingButton } from '~/components/loading-button';
import { useIsNavigating } from '~/lib/hooks';

import type { Route } from './+types/landing';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'One Trick' },
    { name: 'description', content: 'Welcome to One Trick!' },
  ];
}
export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (auth) {
    return redirect(`/profile/${auth.id}`);
  }
  return null;
}

export default function Landing() {
  const [isLoading] = useIsNavigating();
  return (
    <div className="flex h-screen items-center justify-center">
      <title>One Trick - Destiny 2 Performance Tracker</title>
      <meta
        name="description"
        content="Track your Destiny 2 performance, loadouts, and gameplay sessions. Analyze your stats and improve your game."
      />
      <meta
        name="keywords"
        content="Destiny 2, tracker, stats, performance, loadouts, PvP, gaming"
      />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta
        property="og:title"
        content="One Trick - Destiny 2 Performance Tracker"
      />
      <meta
        property="og:description"
        content="Track your Destiny 2 performance, loadouts, and gameplay sessions."
      />
      <meta property="og:url" content="https://d2onetrick.com" />
      <meta property="og:image" content="https://d2onetrick.com/og-image.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="One Trick - Destiny 2 Performance Tracker"
      />
      <meta
        name="twitter:description"
        content="Track your Destiny 2 performance, loadouts, and gameplay sessions."
      />
      <meta
        name="twitter:image"
        content="https://d2onetrick.com/twitter-image.png"
      />

      <div className="text-center">
        <h1 className="scroll-m-20 text-balance text-4xl font-extrabold tracking-tight">
          Welcome to One Trick!
        </h1>
        <div className="mt-8 flex flex-col gap-4">
          <LoadingButton isLoading={isLoading}>
            <Link to="/login">Sign In</Link>
          </LoadingButton>
          <LoadingButton variant="outline" isLoading={isLoading}>
            <Link to="/search"> Search for a Friend</Link>
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
