import { createThemeAction } from 'remix-themes';
import { getRequestLogger } from '~/.server/logger';
import { themeSessionResolver } from '~/.server/sessions';

import type { Route } from './+types/set-theme';

const themeAction = createThemeAction(themeSessionResolver);

export function action(args: Route.ActionArgs) {
  const log = getRequestLogger(args.context);
  log.set({ action: 'setTheme', route: 'actions/set-theme' });
  return themeAction(args);
}
