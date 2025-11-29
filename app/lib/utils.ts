import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isDev() {
  return import.meta.env.MODE === 'development';
}

export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

const DestinyURL = 'https://www.bungie.net';
export function setBungieUrl(url?: string) {
  if (!url) return '';
  return url.includes(DestinyURL) ? url : `${DestinyURL}${url}`;
}
