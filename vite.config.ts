import { reactRouter } from '@react-router/dev/vite';
import autoprefixer from 'autoprefixer';
import { exec } from 'node:child_process';
import { reactRouterDevTools } from 'react-router-devtools';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

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
export default defineConfig({
  server: {
    allowedHosts: ['local.d2onetrick.ngrok.app'],
    hmr: {
      clientPort: 443,
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  plugins: [
    reactRouterDevTools({
      editor,
    }),
    reactRouter(),
    tsconfigPaths(),
  ],
});
