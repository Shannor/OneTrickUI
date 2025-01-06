import { reactRouter } from '@react-router/dev/vite';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { reactRouterDevTools } from 'react-router-devtools';

import { exec } from 'node:child_process';
import { cwd } from 'node:process';

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
