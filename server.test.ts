import fs from 'node:fs';
import { builtinModules } from 'node:module';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const mockRequestHandler = vi.fn((_req, res) => {
  res.status(200).send('react-router');
});

vi.mock('@react-router/express', () => ({
  createRequestHandler: vi.fn(() => mockRequestHandler),
}));

const NODE_BUILTINS = new Set([
  ...builtinModules,
  ...builtinModules.map((mod) => `node:${mod}`),
]);

function extractExternalPackages(source: string): string[] {
  const packages = new Set<string>();
  const staticImportRe =
    /(?:^|\n)import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  const dynamicImportRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const regex of [staticImportRe, dynamicImportRe]) {
    for (const match of source.matchAll(regex)) {
      const specifier = match[1];
      if (
        !specifier ||
        specifier.startsWith('.') ||
        specifier.startsWith('/') ||
        NODE_BUILTINS.has(specifier)
      ) {
        continue;
      }
      const pkgName = specifier.startsWith('@')
        ? specifier.split('/').slice(0, 2).join('/')
        : specifier.split('/')[0];
      packages.add(pkgName);
    }
  }

  return [...packages].sort();
}

describe('createServerApp', () => {
  it('serves GET /healthz with 200 ok before invoking React Router', async () => {
    const { createServerApp } = await import('./server.js');
    const app = createServerApp({} as never, 'production');

    const server = await new Promise<ReturnType<typeof app.listen>>(
      (resolve) => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
      },
    );

    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${port}/healthz`);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/plain');
      expect(text).toBe('ok');
      expect(mockRequestHandler).not.toHaveBeenCalled();
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err?: Error) => (err ? reject(err) : resolve()));
      });
    }
  });

  it('only imports non-dev root production packages in server.js and built server bundle', () => {
    const lockfilePath = path.join(process.cwd(), 'package-lock.json');
    const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8')) as {
      packages: Record<string, { dev?: boolean }>;
    };

    const filesToCheck = [path.join(process.cwd(), 'server.js')];
    const serverBuildPath = path.join(
      process.cwd(),
      'build',
      'server',
      'index.js',
    );
    if (fs.existsSync(serverBuildPath)) {
      filesToCheck.push(serverBuildPath);
    }

    const missingOrDevPackages: string[] = [];
    for (const filePath of filesToCheck) {
      const source = fs.readFileSync(filePath, 'utf8');
      for (const pkg of extractExternalPackages(source)) {
        const lockEntry = lockfile.packages[`node_modules/${pkg}`];
        if (!lockEntry || lockEntry.dev) {
          missingOrDevPackages.push(`${path.basename(filePath)} -> ${pkg}`);
        }
      }
    }

    expect(missingOrDevPackages).toEqual([]);
  });
});
