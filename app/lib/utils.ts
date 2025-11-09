import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ItemSnapshot, Loadout } from '~/api';

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
const Kinetic = 1498876634;
const Energy = 2465295065;
const Power = 953998645;

export function getWeaponsFromLoadout(loadout: Loadout): ItemSnapshot[] {
  const kinetic = loadout[Kinetic];
  const energy = loadout[Energy];
  const power = loadout[Power];
  return [kinetic, energy, power].filter(Boolean);
}
