import { Link, redirect } from 'react-router';
import { getAuth } from '~/.server/auth';
import { LoadingButton } from '~/components/loading-button';
import { useIsNavigating } from '~/lib/hooks';

import type { Route } from '../../.react-router/types/app/routes/+types/login';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'One Trick' },
    { name: 'description', content: 'Welcome to One Trick!' },
  ];
}
export async function loader({ request }: Route.LoaderArgs) {
  const auth = await getAuth(request);
  if (auth) {
    return redirect('/dashboard');
  }
  return null;
}

export default function Landing() {
  const [isLoading] = useIsNavigating();
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="scroll-m-20 text-balance text-4xl font-extrabold tracking-tight">
          Welcome to One Trick!
        </h1>
        <div className="mt-8 flex flex-col gap-4">
          <LoadingButton isLoading={isLoading}>
            <Link to="/login">Sign In</Link>
          </LoadingButton>
          <LoadingButton variant="outline" isLoading={isLoading}>
            <Link to="/search"> Search For A Friend</Link>
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
