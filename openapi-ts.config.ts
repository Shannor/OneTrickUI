import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: '@hey-api/client-fetch',
  input: 'http://localhost:8080/openapi',
  output: {
    format: 'prettier',
    path: './app/client',
  },
});
