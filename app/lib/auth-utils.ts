import { isDev } from '~/lib/utils';

export function getBungieAuthUrl(): string {
  const clientId = isDev() ? 48883 : 48722;
  return `https://www.bungie.net/en/OAuth/Authorize?client_id=${clientId}&response_type=code&state=1234`;
}
