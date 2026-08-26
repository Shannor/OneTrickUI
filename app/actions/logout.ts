import { logout } from '~/.server/auth';
import { Logger } from '~/lib/logger';

import type { Route } from '../../.react-router/types/app/+types/root';

export async function action({ request }: Route.ClientActionArgs) {
  try {
    return await logout(request);
  } catch (e) {
    Logger.error(e, 'failed to logout user');
    return { error: 'cannot log out ' };
  }
}
