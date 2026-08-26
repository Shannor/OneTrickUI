import { describe, expect, it } from 'vitest';
import { loader } from './sitemap.xml';

describe('sitemap.xml loader', () => {
  it('returns valid XML response with correct content-type header', async () => {
    const request = new Request('https://d2onetrick.com/sitemap.xml');
    const response = loader({ request, params: {} } as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/xml');

    const text = await response.text();
    expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(text).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');
    expect(text).toContain('https://d2onetrick.com/sessions');
  });
});
