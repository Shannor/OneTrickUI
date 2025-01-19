// This file is auto-generated by @hey-api/openapi-ts

import {
  createClient,
  createConfig,
  type Options,
} from '@hey-api/client-fetch';
import type {
  GetPingData,
  GetPingResponse,
  ProfileData,
  ProfileResponse,
  LoginData,
  LoginResponse,
  RefreshTokenData,
  RefreshTokenResponse,
  GetSnapshotsData,
  GetSnapshotsResponse,
  CreateSnapshotData,
  CreateSnapshotResponse,
  GetActivitiesData,
  GetActivitiesResponse,
  GetActivityData,
  GetActivityResponse,
} from './types.gen';
import {
  getSnapshotsResponseTransformer,
  createSnapshotResponseTransformer,
} from './transformers.gen';

export const client = createClient(createConfig());

export const getPing = <ThrowOnError extends boolean = false>(
  options?: Options<GetPingData, ThrowOnError>,
) => {
  return (options?.client ?? client).get<
    GetPingResponse,
    unknown,
    ThrowOnError
  >({
    ...options,
    url: '/ping',
  });
};

export const profile = <ThrowOnError extends boolean = false>(
  options: Options<ProfileData, ThrowOnError>,
) => {
  return (options?.client ?? client).get<
    ProfileResponse,
    unknown,
    ThrowOnError
  >({
    ...options,
    url: '/profile',
  });
};

export const login = <ThrowOnError extends boolean = false>(
  options?: Options<LoginData, ThrowOnError>,
) => {
  return (options?.client ?? client).post<LoginResponse, unknown, ThrowOnError>(
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      url: '/login',
    },
  );
};

export const refreshToken = <ThrowOnError extends boolean = false>(
  options?: Options<RefreshTokenData, ThrowOnError>,
) => {
  return (options?.client ?? client).post<
    RefreshTokenResponse,
    unknown,
    ThrowOnError
  >({
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    url: '/refresh',
  });
};

/**
 * Returns a list of snapshots in the system for a character
 */
export const getSnapshots = <ThrowOnError extends boolean = false>(
  options: Options<GetSnapshotsData, ThrowOnError>,
) => {
  return (options?.client ?? client).get<
    GetSnapshotsResponse,
    unknown,
    ThrowOnError
  >({
    ...options,
    responseTransformer: getSnapshotsResponseTransformer,
    url: '/snapshots',
  });
};

/**
 * Creates a new snapshot in the system and returns a list of
 */
export const createSnapshot = <ThrowOnError extends boolean = false>(
  options: Options<CreateSnapshotData, ThrowOnError>,
) => {
  return (options?.client ?? client).post<
    CreateSnapshotResponse,
    unknown,
    ThrowOnError
  >({
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    responseTransformer: createSnapshotResponseTransformer,
    url: '/snapshots',
  });
};

export const getActivities = <ThrowOnError extends boolean = false>(
  options: Options<GetActivitiesData, ThrowOnError>,
) => {
  return (options?.client ?? client).get<
    GetActivitiesResponse,
    unknown,
    ThrowOnError
  >({
    ...options,
    url: '/activities',
  });
};

export const getActivity = <ThrowOnError extends boolean = false>(
  options: Options<GetActivityData, ThrowOnError>,
) => {
  return (options?.client ?? client).get<
    GetActivityResponse,
    unknown,
    ThrowOnError
  >({
    ...options,
    url: '/activities/{activityId}',
  });
};
