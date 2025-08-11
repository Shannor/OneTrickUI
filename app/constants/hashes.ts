// Converted from Go to TypeScript
// Weapon and Armor bucket hash constants used for identifying equipment buckets

export type WeaponBucket = number;
export type ArmorBucket = number;

// Individual weapon bucket constants
export const KineticBucket: WeaponBucket = 1498876634;
export const EnergyBucket: WeaponBucket = 2465295065;
export const PowerBucket: WeaponBucket = 953998645;

// Individual armor bucket constants
export const HelmetArmor: ArmorBucket = 3448274439;
export const GauntletsArmor: ArmorBucket = 3551918588;
export const ChestArmor: ArmorBucket = 14239492;
export const LegArmor: ArmorBucket = 20886954;
export const ClassArmor: ArmorBucket = 1585787867;

// Grouped, readonly maps for convenience
export const WeaponBuckets = {
  Kinetic: KineticBucket,
  Energy: EnergyBucket,
  Power: PowerBucket,
} as const;

export const ArmorBuckets = {
  Helmet: HelmetArmor,
  Gauntlets: GauntletsArmor,
  Chest: ChestArmor,
  Legs: LegArmor,
  ClassItem: ClassArmor,
} as const;

export const PrecisionKills = 'uniqueWeaponPrecisionKills';
export const UniqueKills = 'uniqueWeaponKills';
