import type { Route } from './+types/robots.txt';

export function loader({ request }: Route.LoaderArgs) {
  let origin = 'https://d2onetrick.com';
  try {
    const url = new URL(request.url);
    origin = `${url.protocol}//${url.host}`;
  } catch {
    // Fallback to default origin
  }

  const body = `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
