import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { BaseItemInfo, Socket } from '~/api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isDev() {
  return import.meta.env.MODE === 'development';
}

export function getSiteOrigin(): string {
  if (
    import.meta.env.MODE === 'development' &&
    typeof window !== 'undefined' &&
    window.location?.origin
  ) {
    return window.location.origin;
  }
  return 'https://d2onetrick.com';
}

export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

const DestinyURL = 'https://www.bungie.net';
export function setBungieUrl(url?: string) {
  if (!url || url === DestinyURL) return '';
  return url.includes(DestinyURL) ? url : `${DestinyURL}${url}`;
}

export function getItemIconUrl(
  properties?: {
    baseInfo?: Partial<
      Pick<BaseItemInfo, 'icon' | 'itemTypeDisplayName' | 'styleBasicInfo'>
    >;
    sockets?: Socket[];
  } | null,
  fallbackIcon?: string,
): string {
  const baseInfo = properties?.baseInfo;
  const styleIcon = setBungieUrl(baseInfo?.styleBasicInfo?.icon);
  if (styleIcon) {
    return styleIcon;
  }

  const ornamentSocket = properties?.sockets?.find((socket) => {
    if (!socket.isEnabled || !socket.isVisible) return false;
    if (!setBungieUrl(socket.icon)) return false;
    const socketType = socket.itemTypeDisplayName ?? '';
    if (socketType.toLowerCase().includes('ornament')) return true;
    return Boolean(
      baseInfo?.itemTypeDisplayName &&
        socketType === baseInfo.itemTypeDisplayName,
    );
  });

  if (ornamentSocket?.icon) {
    return setBungieUrl(ornamentSocket.icon);
  }

  return setBungieUrl(baseInfo?.icon) || setBungieUrl(fallbackIcon);
}
