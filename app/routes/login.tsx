import { Button } from '~/components/ui/button';
import { redirect, useNavigate } from 'react-router';
import { getSession } from './auth.server';
import type { Route } from '../../.react-router/types/app/routes/+types/login';

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const auth = session.get('jwt');
  if (auth) {
    // TODO: Check if auth expired and then redo if need be
    return redirect('/');
  }
  return null;
}
export default function Login() {
  const navigate = useNavigate();
  const href = `https://www.bungie.net/en/OAuth/Authorize?client_id=${48722}&response_type=code&state=1234`;
  return (
    <div>
      Login
      <a href={href}>Login With Bungie</a>
      <Button>Login</Button>
    </div>
  );
}
