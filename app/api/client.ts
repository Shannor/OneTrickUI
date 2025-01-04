import { createClient } from '@hey-api/client-fetch';

export const apiClient = createClient({
  baseUrl: 'http://localhost:8080',
});
