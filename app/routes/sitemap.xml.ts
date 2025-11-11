import type { Route } from './+types/sitemap.xml';

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  const urls = [
    '/',
    '/search',
  ];

  const lastmod = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls
      .map((path) =>
        `\n  <url>\n    <loc>${escapeXml(origin + path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${path === '/' ? '1.0' : '0.7'}</priority>\n  </url>`,
      )
      .join('') +
    `\n</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export default function SitemapXml() {
  // resource route; no UI
  return null;
}
