import fs from 'node:fs/promises';
import path from 'node:path';
import { getRequestLogger } from '~/.server/logger';

import type { Route } from './+types/apple-touch-icon.png';

export async function loader({ context }: Route.LoaderArgs) {
  const log = getRequestLogger(context);
  log.set({ route: 'routes/apple-touch-icon.png' });
  const filePath = path.join(process.cwd(), 'public', 'apple-touch-icon.png');
  try {
    const file = await fs.readFile(filePath);
    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
