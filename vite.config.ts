import { reactRouter } from '@react-router/dev/vite';
import autoprefixer from 'autoprefixer';
import evlog from 'evlog/vite';
import { exec } from 'node:child_process';
import { reactRouterDevTools } from 'react-router-devtools';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

import { resolveDevWorktreeConfig } from './app/lib/dev-worktree.server';

const editor = {
  name: 'WebStorm',
  open(path: any, lineNumber: any) {
    exec(
      `webstorm "${process.cwd()}/${path}" --line ${lineNumber ? `--line ${lineNumber}` : ''}`.replace(
        /\$/g,
        '\\$',
      ),
    );
  },
};

export default defineConfig(({ command }) => {
  const worktree =
    command === 'serve'
      ? resolveDevWorktreeConfig()
      : { branch: null, port: 5173, hmr: undefined };

  return {
    define: {
      'import.meta.env.VITE_DEV_GIT_BRANCH': JSON.stringify(
        worktree.branch ?? '',
      ),
    },
    server: {
      port: worktree.port,
      allowedHosts: ['local.d2onetrick.ngrok.app'],
      ...(worktree.hmr ? { hmr: worktree.hmr } : {}),
    },
    css: {
      postcss: {
        plugins: [tailwindcss, autoprefixer],
      },
    },
    plugins: [
      evlog(),
      reactRouterDevTools({
        editor,
      } as any),
      reactRouter(),
      tsconfigPaths(),
    ],
  };
});
