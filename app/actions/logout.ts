import { logout } from '~/.server/auth';
import { getRequestLogger } from '~/.server/logger';

import type { Route } from '../../.react-router/types/app/+types/root';

export async function action({ request, context }: Route.ActionArgs) {
  const log = getRequestLogger(context);
  log.set({ action: 'logout', route: 'actions/logout' });
  try {
    return await logout(request);
  } catch (e) {
    log.error(e instanceof Error ? e : String(e), { action: 'logout' });
    return { error: 'cannot log out ' };
  }
}
