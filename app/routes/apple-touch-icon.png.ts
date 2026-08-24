import fs from 'node:fs/promises';
import path from 'node:path';

import type { Route } from './+types/apple-touch-icon.png';

export async function loader({}: Route.LoaderArgs) {
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

export default function AppleTouchIcon() {
  return null;
}
