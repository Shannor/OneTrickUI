import { defaultPlugins, defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:8080/openapi',
  output: {
    postProcess: ['prettier'],
    path: './app/api',
  },
  plugins: [
    ...defaultPlugins,
    {
      name: '@hey-api/client-fetch',
      baseUrl: false,
    },
    {
      dates: true,
      name: '@hey-api/transformers',
    },
    {
      name: '@hey-api/sdk',
      transformer: true,
    },
  ],
});
