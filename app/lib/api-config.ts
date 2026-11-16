import type { CreateClientConfig } from '~/api/client.gen';
import { isDev } from '~/lib/utils';

export function getDefaultBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env?.API_URL) {
    return process.env.API_URL;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (isDev()) {
    return 'http://localhost:8080';
  }
  return 'https://api.d2onetrick.com';
}

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: config?.baseUrl ?? getDefaultBaseUrl(),
});
