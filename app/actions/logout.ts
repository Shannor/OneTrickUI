import { logout } from '~/.server/auth';

import type { Route } from '../../.react-router/types/app/+types/root';

export async function action({ request }: Route.ClientActionArgs) {
  try {
    return await logout(request);
  } catch (e) {
    console.error('failed to logout user', e);
    return { error: 'cannot log out ' };
  }
}
