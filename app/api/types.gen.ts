// This file is auto-generated by @hey-api/openapi-ts

export type InternalError =
  | 'DestinyServerDown'
  | 'InternalSystemDown'
  | 'UnknownError';

export type Profile = {
  id: string;
  membershipId: string;
  displayName: string;
  uniqueName: string;
  characters: Array<Character>;
};

export type DetailActivity = {
  activity: ActivityHistory;
  aggregate?: Aggregate;
};

export type CharacterSnapshot = {
  /**
   * Id of the snapshot
   */
  id: string;
  /**
   * Name of the snapshot, will probably be generated by default by the system but can be changed by a user
   */
  name: string;
  /**
   * Id of the user it belongs to
   */
  userId: string;
  /**
   * Hash of all the items to give us a unique key
   */
  hash: string;
  /**
   * Id of the character being recorded
   */
  characterId: string;
  stats?: {
    [key: string]: ClassStat;
  };
  /**
   * Timestamp for when the snapshot was first created
   */
  createdAt: Date;
  /**
   * Timestamp for when the snapshot was last updated or when a history entry was made for it.
   */
  updatedAt: Date;
  loadout: Loadout;
};

export type ItemSnapshot = {
  /**
   * Specific instance id for the item
   */
  instanceId: string;
  /**
   * Name of the particular item
   */
  name: string;
  /**
   * Id used to find the definition of the item
   */
  itemHash: number;
  /**
   * Hash of which bucket this item can be equipped in
   */
  bucketHash?: number;
  details: ItemProperties;
};

/**
 * All buckets that we currently care about, Kinetic, Energy, Heavy and Class for now. Each will be a key in the items.
 */
export type Loadout = {
  [key: string]: ItemSnapshot;
};

export type ActivityHistory = {
  location: string;
  activity: string;
  description: string;
  period: Date;
  referenceId: number;
  /**
   * Hash id of the type of activity: Strike, Competitive, QuickPlay, etc.
   */
  activityHash: number;
  /**
   * URL to the icon for the type of activity, IB, Crucible, etc.
   */
  activityIcon: string;
  /**
   * Id to get more details about the particular game
   */
  instanceId: string;
  isPrivate?: boolean;
  /**
   * URL for the image of the destination activity
   */
  imageUrl: string;
  /**
   * Name
   */
  mode?: string;
  personalValues?: PlayerStats;
};

export type Pong = {
  ping: string;
};

/**
 * Known errors for the one trick API
 */
export type OneTrickError = {
  /**
   * User friendly description of the error
   */
  message: string;
  status: InternalError;
};

export type ConfidenceSource = 'system' | 'user';

export type ConfidenceLevel =
  | 'notFound'
  | 'noMatch'
  | 'low'
  | 'medium'
  | 'high';

export type SnapshotLink = {
  characterId: string;
  /**
   * ID of the snapshot for the particular player
   */
  snapshotId?: string;
  /**
   * Optional ID of a session if this Snapshot link was added by a session check-in. Will be null in the case, where the link is added after the fact
   */
  sessionId?: string;
  confidenceLevel: ConfidenceLevel;
  confidenceSource: ConfidenceSource;
  createdAt: Date;
};

export type Aggregate = {
  id: string;
  activityId: string;
  activityDetails: ActivityHistory;
  snapshotLinks: {
    [key: string]: SnapshotLink;
  };
  performance: {
    [key: string]: InstancePerformance;
  };
  createdAt: Date;
};

export type AuthResponse = {
  id: string;
  /**
   * Access token value.
   */
  accessToken: string;
  /**
   * Type of the access token.
   */
  tokenType: string;
  /**
   * The time duration in which the access token will be expired.
   */
  expiresIn: number;
  /**
   * Refresh token for acquiring new access token after it is expired.
   */
  refreshToken: string;
  /**
   * The time duration in which the refresh token will be expired.
   */
  refreshExpiresIn: number;
  /**
   * Membership identification value.
   */
  membershipId: string;
  /**
   * Membership that is mainly used
   */
  primaryMembershipId: string;
  timestamp: Date;
};

export type WeaponInstanceMetrics = {
  /**
   * The hash ID of the item definition that describes the weapon.
   */
  referenceId?: number;
  display?: Display;
  properties?: ItemProperties;
  stats?: {
    [key: string]: UniqueStatValue;
  };
};

export type Display = {
  name: string;
  hasIcon: boolean;
  description: string;
  icon?: string;
};

export type InstancePerformance = {
  playerStats: PlayerStats;
  weapons: {
    [key: string]: WeaponInstanceMetrics;
  };
  extra?: {
    [key: string]: UniqueStatValue;
  };
};

export type UniqueStatValue = {
  name?: string;
  /**
   * Basic stat value.
   */
  basic: StatsValuePair;
  /**
   * Per game average for the statistic, if applicable
   */
  pga?: StatsValuePair;
  /**
   * Weighted value of the stat if a weight greater than 1 has been assigned.
   */
  weighted?: StatsValuePair;
  /**
   * When a stat represents the best, most, longest, fastest or some other personal best, the actual activity ID where that personal best was established is available on this property.
   */
  activityId?: number | null;
};

export type ActivityMode =
  | 'competitive'
  | 'quickplay'
  | 'allPvP'
  | 'ironBanner';

export type StatsValuePair = {
  /**
   * Raw value of the statistic
   */
  value?: number;
  /**
   * Localized formatted version of the value.
   */
  displayValue?: string;
};

export type Perk = {
  name: string;
  description?: string;
  /**
   * The hash ID of the perk
   */
  hash: number;
  /**
   * link to icon
   */
  iconPath?: string;
};

export type Stats = {
  [key: string]: GunStat;
};

export type GunStat = {
  /**
   * The hash ID of the stat.
   */
  hash: number;
  /**
   * The value of the stat.
   */
  value: number;
  name: string;
  description: string;
};

export type Socket = {
  /**
   * The hash ID of the socket plug.
   */
  plugHash: number;
  /**
   * Whether the socket plug is enabled or not.
   */
  isEnabled?: boolean;
  /**
   * Whether the socket plug is visible or not.
   */
  isVisible?: boolean;
  name: string;
  description: string;
  icon?: string;
  itemTypeDisplayName?: string;
  itemTypeTieredDisplayName?: string;
};

export type BaseItemInfo = {
  name: string;
  itemHash: number;
  instanceId: string;
  bucketHash: number;
  damage?: DamageInfo;
};

export type DamageInfo = {
  damageType: string;
  damageIcon: string;
  transparentIcon: string;
  color: Color;
};

export type Color = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
};

export type Character = {
  id: string;
  light: number;
  emblemURL: string;
  emblemBackgroundURL: string;
  currentTitle: string;
  race: string;
  class: string;
  stats?: {
    [key: string]: ClassStat;
  };
};

export type Team = {
  id: string;
  standing: string;
  score: string;
  teamName?: string;
};

/**
 * The response object for retrieving an individual instanced item. None of these components are relevant for an item that doesn't have an "itemInstanceId": for those, get your information from the DestinyInventoryDefinition.
 */
export type ItemProperties = {
  /**
   * If the item is on a character, this will return the ID of the character that is holding the item.
   */
  characterId?: string | null;
  baseInfo: BaseItemInfo;
  /**
   * Information specifically about the perks currently active on the item. COMPONENT TYPE: ItemPerks
   */
  perks: Array<Perk>;
  /**
   * Information about the computed stats of the item: power, defense, etc... COMPONENT TYPE: ItemStats
   */
  stats: Stats;
  /**
   * Information about the sockets of the item: which are currently active, what potential sockets you could have and the stats/abilities/perks you can gain from them. COMPONENT TYPE: ItemSockets
   */
  sockets?: Array<Socket>;
};

/**
 * All Player Stats from a match that we currently care about
 */
export type PlayerStats = {
  /**
   * Number of kills done in the match
   */
  kills?: StatsValuePair;
  /**
   * Number of assists done in the match
   */
  assists?: StatsValuePair;
  /**
   * Number of deaths done in the match
   */
  deaths?: StatsValuePair;
  /**
   * ratio of kill / deaths in the match
   */
  kd?: StatsValuePair;
  /**
   * ratio of kills + assists/ deaths in the match
   */
  kda?: StatsValuePair;
  /**
   * Win or lose in the match
   */
  standing?: StatsValuePair;
  /**
   * Id for the team the player was on this match
   */
  team?: StatsValuePair;
  /**
   * ID for the fireteam player was on. If the same as another player then they were together
   */
  fireTeamId?: StatsValuePair;
  /**
   * Time in seconds the player was in the match
   */
  timePlayed?: StatsValuePair;
};

export type PostGameEntry = {
  characterId?: string;
  standing?: number;
};

export type ClassStat = {
  name: string;
  icon: string;
  hasIcon: boolean;
  description: string;
  statCategory: number;
  aggregationType: number;
  value: number;
};

export type Session = {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  userId: string;
  characterId: string;
  name?: string;
  status?: 'pending' | 'complete';
  /**
   * List of aggregates linked to this session
   */
  aggregateIds: Array<string>;
  lastSeenActivityId?: string;
  lastSeenTimestamp?: Date;
};

export type SearchUserResult = {
  displayName: string;
  nameCode: string;
  bungieMembershipId: string;
  memberships: Array<DestinyMembership>;
};

export type DestinyMembership = {
  displayName: string;
  membershipId: string;
  membershipType: SourceSystem;
  iconPath?: string;
};

export type SourceSystem =
  | 'playstation'
  | 'xbox'
  | 'steam'
  | 'stadia'
  | 'unknown';

export type XUserId = string;

export type XMembershipId = string;

export type GetPingData = {
  body?: never;
  path?: never;
  query?: never;
  url: '/ping';
};

export type GetPingResponses = {
  /**
   * ping response
   */
  200: Pong;
};

export type GetPingResponse = GetPingResponses[keyof GetPingResponses];

export type SearchData = {
  body?: {
    prefix: string;
    page: number;
  };
  path?: never;
  query?: never;
  url: '/search';
};

export type SearchResponses = {
  /**
   * Return a list of search results found
   */
  200: {
    results: Array<SearchUserResult>;
    hasMore: boolean;
  };
};

export type SearchResponse = SearchResponses[keyof SearchResponses];

export type UpdateManifestData = {
  body?: never;
  path?: never;
  query?: never;
  url: '/manifest';
};

export type UpdateManifestResponses = {
  /**
   * Return of success of updating manifest if needed
   */
  200: {
    success: boolean;
  };
};

export type UpdateManifestResponse =
  UpdateManifestResponses[keyof UpdateManifestResponses];

export type ProfileData = {
  body?: never;
  headers: {
    'X-User-ID': string;
    'X-Membership-ID': string;
  };
  path?: never;
  query?: never;
  url: '/profile';
};

export type ProfileErrors = {
  /**
   * Server is down
   */
  503: {
    /**
     * User friendly description of the error
     */
    message: string;
    status: InternalError;
  };
};

export type ProfileError = ProfileErrors[keyof ProfileErrors];

export type ProfileResponses = {
  /**
   * Current user info
   */
  200: Profile;
};

export type ProfileResponse = ProfileResponses[keyof ProfileResponses];

export type LoginData = {
  body?: {
    code: string;
  };
  path?: never;
  query?: never;
  url: '/login';
};

export type LoginResponses = {
  /**
   * Logging in
   */
  200: AuthResponse;
};

export type LoginResponse = LoginResponses[keyof LoginResponses];

export type RefreshTokenData = {
  body?: {
    code: string;
  };
  path?: never;
  query?: never;
  url: '/refresh';
};

export type RefreshTokenResponses = {
  /**
   * Refreshing token
   */
  200: AuthResponse;
};

export type RefreshTokenResponse =
  RefreshTokenResponses[keyof RefreshTokenResponses];

export type GetSnapshotsData = {
  body?: never;
  headers: {
    'X-User-ID': string;
  };
  path?: never;
  query: {
    count: number;
    page: number;
    characterId: string;
  };
  url: '/snapshots';
};

export type GetSnapshotsResponses = {
  /**
   * Returns an array of all snapshots for a character
   */
  200: Array<CharacterSnapshot>;
};

export type GetSnapshotsResponse =
  GetSnapshotsResponses[keyof GetSnapshotsResponses];

export type CreateSnapshotData = {
  /**
   * Provide the character to take the snapshot of
   */
  body: {
    characterId: string;
  };
  headers: {
    'X-User-ID': string;
    'X-Membership-ID': string;
  };
  path?: never;
  query?: never;
  url: '/snapshots';
};

export type CreateSnapshotResponses = {
  /**
   * Return the created snapshot
   */
  201: CharacterSnapshot;
};

export type CreateSnapshotResponse =
  CreateSnapshotResponses[keyof CreateSnapshotResponses];

export type GetSnapshotData = {
  body?: never;
  headers: {
    'X-User-ID': string;
  };
  path: {
    /**
     * The unique identifier for the snapshot.
     */
    snapshotId: string;
  };
  query: {
    characterId: string;
  };
  url: '/snapshots/{snapshotId}';
};

export type GetSnapshotResponses = {
  /**
   * Specific character snapshot
   */
  200: CharacterSnapshot;
};

export type GetSnapshotResponse =
  GetSnapshotResponses[keyof GetSnapshotResponses];

export type GetActivitiesData = {
  body?: never;
  headers: {
    'X-User-ID': string;
    'X-Membership-ID': string;
  };
  path?: never;
  query: {
    count: number;
    page: number;
    characterId: string;
    mode?: ActivityMode;
  };
  url: '/activities';
};

export type GetActivitiesResponses = {
  /**
   * List of Activities that have past
   */
  200: Array<DetailActivity>;
};

export type GetActivitiesResponse =
  GetActivitiesResponses[keyof GetActivitiesResponses];

export type GetActivityData = {
  body?: never;
  headers: {
    'X-User-ID': string;
    'X-Membership-ID': string;
  };
  path: {
    /**
     * The unique identifier for the activity.
     */
    activityId: string;
  };
  query: {
    characterId: string;
  };
  url: '/activities/{activityId}';
};

export type GetActivityResponses = {
  /**
   * Array of used guns during an activity
   */
  200: {
    activity: ActivityHistory;
    teams: Array<Team>;
    aggregate?: Aggregate;
    postGameEntries?: Array<{
      [key: string]: unknown;
    }>;
  };
};

export type GetActivityResponse =
  GetActivityResponses[keyof GetActivityResponses];

export type GetSessionsData = {
  body?: never;
  headers: {
    'X-User-ID': string;
    'X-Membership-ID': string;
  };
  path?: never;
  query: {
    count: number;
    page: number;
    characterId: string;
    status?: 'pending' | 'complete';
  };
  url: '/sessions';
};

export type GetSessionsResponses = {
  /**
   * List of Sessions
   */
  200: Array<Session>;
};

export type GetSessionsResponse =
  GetSessionsResponses[keyof GetSessionsResponses];

export type StartSessionData = {
  /**
   * Provide the character to start the session for
   */
  body: {
    characterId: string;
  };
  headers: {
    'X-User-ID': string;
    'X-Membership-ID': string;
  };
  path?: never;
  query?: never;
  url: '/sessions';
};

export type StartSessionErrors = {
  /**
   * Request is invalid
   */
  400: {
    message: string;
  };
};

export type StartSessionError = StartSessionErrors[keyof StartSessionErrors];

export type StartSessionResponses = {
  /**
   * Return the created session
   */
  201: Session;
};

export type StartSessionResponse =
  StartSessionResponses[keyof StartSessionResponses];

export type GetSessionData = {
  body?: never;
  path: {
    sessionId: string;
  };
  query?: never;
  url: '/sessions/{sessionId}';
};

export type GetSessionResponses = {
  /**
   * Return a session
   */
  200: Session;
};

export type GetSessionResponse = GetSessionResponses[keyof GetSessionResponses];

export type UpdateSessionData = {
  /**
   * Provide the character to start the session for
   */
  body: {
    characterId: string;
    name?: string;
    completedAt?: string;
  };
  headers: {
    'X-User-ID': string;
    'X-Membership-ID': string;
  };
  path: {
    sessionId: string;
  };
  query?: never;
  url: '/sessions/{sessionId}';
};

export type UpdateSessionResponses = {
  /**
   * Return the completed session
   */
  201: Session;
};

export type UpdateSessionResponse =
  UpdateSessionResponses[keyof UpdateSessionResponses];

export type GetSessionAggregatesData = {
  body?: never;
  path: {
    sessionId: string;
  };
  query?: never;
  url: '/sessions/{sessionId}/aggregates';
};

export type GetSessionAggregatesResponses = {
  /**
   * Array of aggregates
   */
  200: {
    aggregates: Array<Aggregate>;
    snapshots: {
      [key: string]: CharacterSnapshot;
    };
  };
};

export type GetSessionAggregatesResponse =
  GetSessionAggregatesResponses[keyof GetSessionAggregatesResponses];

export type GetPublicSessionsData = {
  body?: never;
  path?: never;
  query: {
    count: number;
    page: number;
    characterId?: string;
    status?: 'pending' | 'complete';
  };
  url: '/public/sessions';
};

export type GetPublicSessionsResponses = {
  /**
   * List of Sessions
   */
  200: Array<Session>;
};

export type GetPublicSessionsResponse =
  GetPublicSessionsResponses[keyof GetPublicSessionsResponses];

export type GetPublicSessionData = {
  body?: never;
  path: {
    sessionId: string;
  };
  query?: never;
  url: '/public/sessions/{sessionId}';
};

export type GetPublicSessionResponses = {
  /**
   * Return a session
   */
  200: Session;
};

export type GetPublicSessionResponse =
  GetPublicSessionResponses[keyof GetPublicSessionResponses];

export type GetPublicSessionAggregatesData = {
  body?: never;
  path: {
    sessionId: string;
  };
  query?: never;
  url: '/public/sessions/{sessionId}/aggregates';
};

export type GetPublicSessionAggregatesResponses = {
  /**
   * Array of aggregates
   */
  200: {
    aggregates: Array<Aggregate>;
    snapshots: {
      [key: string]: CharacterSnapshot;
    };
  };
};

export type GetPublicSessionAggregatesResponse =
  GetPublicSessionAggregatesResponses[keyof GetPublicSessionAggregatesResponses];

export type GetPublicProfileData = {
  body?: never;
  path?: never;
  query: {
    id: string;
  };
  url: '/public/profile';
};

export type GetPublicProfileErrors = {
  /**
   * Server is down
   */
  503: {
    /**
     * User friendly description of the error
     */
    message: string;
    status: InternalError;
  };
};

export type GetPublicProfileError =
  GetPublicProfileErrors[keyof GetPublicProfileErrors];

export type GetPublicProfileResponses = {
  /**
   * User Profile Info
   */
  200: Profile;
};

export type GetPublicProfileResponse =
  GetPublicProfileResponses[keyof GetPublicProfileResponses];

export type SessionCheckInData = {
  body: {
    sessionId: string;
  };
  headers: {
    'X-Membership-ID': string;
  };
  path?: never;
  query?: never;
  url: '/actions/session-checkin';
};

export type SessionCheckInResponses = {
  /**
   * Return the created session
   */
  200: boolean;
};

export type SessionCheckInResponse =
  SessionCheckInResponses[keyof SessionCheckInResponses];
