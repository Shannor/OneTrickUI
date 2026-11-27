import type { ItemProperties, ItemSnapshot, Socket } from '~/api';

export const EMPTY_ENHANCEMENT_SOCKET_HASH = 253922071;
export const EMPTY_GEAR_TIER_UPGRADE_SOCKET_HASH = 780815822;
export const EMPTY_CATALYST_SOCKET_HASH = 1498917124;
export const EMPTY_CRAFTED_CATALYST_SOCKET_HASH = 1649663920;

export const ENHANCEMENT_UPGRADE_PLUG_HASHES = new Set<number>([
  2728416798, // Enhancement 1
  2728416797, // Enhancement 2
  2728416796, // Enhancement 3
]);

const EMPTY_UPGRADE_SOCKET_HASHES = new Set<number>([
  EMPTY_ENHANCEMENT_SOCKET_HASH,
  EMPTY_GEAR_TIER_UPGRADE_SOCKET_HASH,
]);

const EMPTY_CATALYST_SOCKET_HASHES = new Set<number>([
  EMPTY_CATALYST_SOCKET_HASH,
  EMPTY_CRAFTED_CATALYST_SOCKET_HASH,
]);

const NON_WEAPON_BUCKETS = new Set<number>([
  3284755031, // Subclass
  3448274439, // Helmet
  3551918588, // Gauntlets
  14239492, // Chest
  20886954, // Leg
  1585787867, // Class Armor
]);

const EXOTIC_TIER_TYPE = 6;

const ENHANCED_TYPE_PATTERN = /\benhanced\b/i;
const ENHANCEMENT_LEVEL_NAME_PATTERN = /^enhancement\s+[1-3]\b/i;
const TIER_UPGRADE_NAME_PATTERN = /^tier\s+[2-5]\s+upgrade\b/i;

const EMPTY_CATALYST_NAME_PATTERN = /^empty\s+catalyst\b/i;
const CATALYST_PATTERN = /\bcatalyst\b/i;
const EXOTIC_REFIT_NAME_PATTERN = /\brefit$/i;
const EXOTIC_CATALYST_MASTERWORK_NAME_PATTERN =
  /^(?:upgrade\s+|upgraded\s+|exotic\s+)?masterwork(?:ed)?$/i;

export type EnhancedWeaponInput =
  ItemSnapshot | ItemProperties | null | undefined;

export type ExoticCatalystState = 'active' | 'empty' | 'none';

function isEnhancementUpgradePlug(socket: Socket): boolean {
  if (ENHANCEMENT_UPGRADE_PLUG_HASHES.has(socket.plugHash)) {
    return true;
  }

  const normalizedName = socket.name?.trim() ?? '';
  if (!normalizedName) {
    return false;
  }

  return (
    ENHANCEMENT_LEVEL_NAME_PATTERN.test(normalizedName) ||
    TIER_UPGRADE_NAME_PATTERN.test(normalizedName)
  );
}

function getWeaponProperties(
  source?: EnhancedWeaponInput,
): ItemProperties | undefined {
  if (!source) {
    return undefined;
  }

  const properties = 'details' in source ? source.details : source;
  if (!properties) {
    return undefined;
  }

  const bucketHash =
    properties.baseInfo?.bucketHash ??
    ('bucketHash' in source ? source.bucketHash : undefined);
  if (bucketHash !== undefined && NON_WEAPON_BUCKETS.has(Number(bucketHash))) {
    return undefined;
  }

  return properties;
}

function isExoticProperties(properties: ItemProperties): boolean {
  const baseInfo = properties.baseInfo;
  if (!baseInfo) {
    return false;
  }

  return (
    baseInfo.tierType === EXOTIC_TIER_TYPE ||
    baseInfo.tierTypeName?.toLowerCase() === 'exotic'
  );
}

export function isEnhancedSocket(socket?: Socket | null): boolean {
  if (!socket || !socket.isEnabled) {
    return false;
  }

  if (EMPTY_UPGRADE_SOCKET_HASHES.has(socket.plugHash)) {
    return false;
  }

  if (
    ENHANCED_TYPE_PATTERN.test(socket.itemTypeDisplayName ?? '') ||
    ENHANCED_TYPE_PATTERN.test(socket.itemTypeTieredDisplayName ?? '')
  ) {
    return true;
  }

  return isEnhancementUpgradePlug(socket);
}

export function isEmptyCatalystSocket(socket?: Socket | null): boolean {
  if (!socket || !socket.isEnabled) {
    return false;
  }

  if (EMPTY_CATALYST_SOCKET_HASHES.has(socket.plugHash)) {
    return true;
  }

  return EMPTY_CATALYST_NAME_PATTERN.test(socket.name?.trim() ?? '');
}

export function isExoticCatalystSocket(
  socket?: Socket | null,
  options?: { isExotic?: boolean },
): boolean {
  if (!socket || !socket.isEnabled || isEmptyCatalystSocket(socket)) {
    return false;
  }

  if (
    CATALYST_PATTERN.test(socket.itemTypeDisplayName ?? '') ||
    CATALYST_PATTERN.test(socket.itemTypeTieredDisplayName ?? '')
  ) {
    return true;
  }

  const normalizedName = socket.name?.trim() ?? '';
  if (!normalizedName) {
    return false;
  }

  if (CATALYST_PATTERN.test(normalizedName)) {
    return true;
  }

  if (!options?.isExotic) {
    return false;
  }

  return (
    EXOTIC_CATALYST_MASTERWORK_NAME_PATTERN.test(normalizedName) ||
    EXOTIC_REFIT_NAME_PATTERN.test(normalizedName)
  );
}

export function findEnhancedSocket(
  sockets?: Socket[] | null,
): Socket | undefined {
  if (!sockets || sockets.length === 0) {
    return undefined;
  }

  return sockets.find(isEnhancedSocket);
}

export function findCatalystMarkerSocket(
  sockets?: Socket[] | null,
  isExotic = false,
): Socket | undefined {
  if (!isExotic || !sockets || sockets.length === 0) {
    return undefined;
  }

  const activeCatalyst = sockets.find((socket) =>
    isExoticCatalystSocket(socket, { isExotic: true }),
  );
  if (activeCatalyst) {
    return activeCatalyst;
  }

  return sockets.find(isEmptyCatalystSocket);
}

export function toSlimEnhancedSocket(socket: Socket): Socket {
  return {
    plugHash: socket.plugHash,
    name: socket.name,
    description: '',
    icon: '',
    isEnabled: Boolean(socket.isEnabled),
    isVisible: Boolean(socket.isVisible),
    itemTypeDisplayName: socket.itemTypeDisplayName ?? '',
    itemTypeTieredDisplayName: socket.itemTypeTieredDisplayName ?? '',
  };
}

export function isEnhancedWeapon(source?: EnhancedWeaponInput): boolean {
  const properties = getWeaponProperties(source);
  if (!properties) {
    return false;
  }

  return Boolean(findEnhancedSocket(properties.sockets));
}

export function getExoticCatalystState(
  source?: EnhancedWeaponInput,
): ExoticCatalystState {
  const properties = getWeaponProperties(source);
  if (!properties || !isExoticProperties(properties)) {
    return 'none';
  }

  const sockets = properties.sockets;
  if (!sockets || sockets.length === 0) {
    return 'none';
  }

  if (
    sockets.some((socket) => isExoticCatalystSocket(socket, { isExotic: true }))
  ) {
    return 'active';
  }

  if (sockets.some(isEmptyCatalystSocket)) {
    return 'empty';
  }

  return 'none';
}
