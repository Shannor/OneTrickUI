import reactHooks from 'eslint-plugin-react-hooks';
import reactYouMightNotNeedAnEffect from 'eslint-plugin-react-you-might-not-need-an-effect';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    'build/**',
    '.react-router/**',
    '.worktrees/**',
    'coverage/**',
    'public/**',
    'app/api/**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  reactHooks.configs.flat.recommended,
  reactYouMightNotNeedAnEffect.configs.recommended,
  {
    files: ['app/.server/**', 'app/actions/**', '**/*.server.ts'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
]);
