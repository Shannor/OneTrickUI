import fs from 'node:fs/promises';
import path from 'node:path';
import { getRequestLogger } from '~/.server/logger';

import type { Route } from './+types/favicon.ico';

export async function loader({ context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  log.set({ route: 'routes/favicon.ico' });
  const filePath = path.join(process.cwd(), 'public', 'favicon.ico');
  try {
    const file = await fs.readFile(filePath);
    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
