import type { Route } from './+types/robots.txt';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  const body = `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export default function RobotsTxt() {
  // resource route; no UI
  return null;
}
