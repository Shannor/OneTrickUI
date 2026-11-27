import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import * as routeLoaders from '~/hooks/use-route-loaders';

import { AppBreadcrumbs, generateBreadcrumbs } from './breadcrumbs';

const mockUseMatches = vi.fn(() => [] as unknown[]);

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useMatches: () => mockUseMatches(),
  };
});

vi.mock('~/hooks/use-route-loaders', async (importOriginal) => {
  const actual = await importOriginal<typeof routeLoaders>();
  return {
    ...actual,
    useOptionalProfileData: () => ({
      profile: { displayName: 'GuardianOne' },
    }),
  };
});

describe('generateBreadcrumbs', () => {
  it('returns Home crumb for root path', () => {
    const crumbs = generateBreadcrumbs('/', {});
    expect(crumbs).toEqual([{ label: 'Home' }]);
  });

  it('generates breadcrumbs for public sessions path', () => {
    const crumbs = generateBreadcrumbs('/sessions', {});
    expect(crumbs).toEqual([
      { label: 'Home', url: '/' },
      { label: 'Sessions' },
    ]);
  });

  it('generates breadcrumbs for public search path', () => {
    const crumbs = generateBreadcrumbs('/search', {});
    expect(crumbs).toEqual([{ label: 'Home', url: '/' }, { label: 'Search' }]);
  });

  it('generates breadcrumbs for profile overview', () => {
    const crumbs = generateBreadcrumbs(
      '/profile/user-1/c/char-1',
      { id: 'user-1', characterId: 'char-1' },
      { profileDisplayName: 'GuardianOne' },
    );
    expect(crumbs).toEqual([
      { label: 'Home', url: '/' },
      { label: 'GuardianOne', url: '/profile/user-1/c/char-1' },
      { label: 'Overview' },
    ]);
  });

  it('uses session name in breadcrumbs when provided', () => {
    const crumbs = generateBreadcrumbs(
      '/profile/user-1/c/char-1/sessions/sess-1/metrics',
      { id: 'user-1', characterId: 'char-1', sessionId: 'sess-1' },
      { profileDisplayName: 'GuardianOne', sessionName: 'Control Warmup' },
    );
    expect(crumbs).toEqual([
      { label: 'Home', url: '/' },
      { label: 'GuardianOne', url: '/profile/user-1/c/char-1' },
      { label: 'Sessions', url: '/profile/user-1/c/char-1/sessions' },
      {
        label: 'Control Warmup',
        url: '/profile/user-1/c/char-1/sessions/sess-1',
      },
      { label: 'Metrics' },
    ]);
  });

  it('shows originating session as parent when viewing a session-scoped activity', () => {
    const crumbs = generateBreadcrumbs(
      '/profile/user-1/c/char-1/sessions/sess-1/activities/act-1',
      {
        id: 'user-1',
        characterId: 'char-1',
        sessionId: 'sess-1',
        instanceId: 'act-1',
      },
      {
        profileDisplayName: 'GuardianOne',
        sessionName: 'Control Warmup',
        activityName: 'Eternity',
      },
    );
    expect(crumbs).toEqual([
      { label: 'Home', url: '/' },
      { label: 'GuardianOne', url: '/profile/user-1/c/char-1' },
      { label: 'Sessions', url: '/profile/user-1/c/char-1/sessions' },
      {
        label: 'Control Warmup',
        url: '/profile/user-1/c/char-1/sessions/sess-1',
      },
      { label: 'Eternity' },
    ]);
  });

  it('falls back to default Session and Game Details labels on session-scoped activity without names', () => {
    const crumbs = generateBreadcrumbs(
      '/profile/user-1/c/char-1/sessions/sess-1/activities/act-1',
      {
        id: 'user-1',
        characterId: 'char-1',
        sessionId: 'sess-1',
        instanceId: 'act-1',
      },
      { profileDisplayName: 'GuardianOne' },
    );
    expect(crumbs).toEqual([
      { label: 'Home', url: '/' },
      { label: 'GuardianOne', url: '/profile/user-1/c/char-1' },
      { label: 'Sessions', url: '/profile/user-1/c/char-1/sessions' },
      {
        label: 'Session',
        url: '/profile/user-1/c/char-1/sessions/sess-1',
      },
      { label: 'Game Details' },
    ]);
  });

  it('falls back gracefully to profile parent when opening an activity URL directly without session context', () => {
    const crumbs = generateBreadcrumbs(
      '/profile/user-1/c/char-1/activities/act-1',
      { id: 'user-1', characterId: 'char-1', instanceId: 'act-1' },
      { profileDisplayName: 'GuardianOne', activityName: 'Eternity' },
    );
    expect(crumbs).toEqual([
      { label: 'Home', url: '/' },
      { label: 'GuardianOne', url: '/profile/user-1/c/char-1' },
      { label: 'Eternity' },
    ]);
  });

  it('uses loadout name in breadcrumbs when provided', () => {
    const crumbs = generateBreadcrumbs(
      '/profile/user-1/c/char-1/loadouts/snap-1',
      { id: 'user-1', characterId: 'char-1', snapshotId: 'snap-1' },
      { profileDisplayName: 'GuardianOne', loadoutName: 'PvP Main Setup' },
    );
    expect(crumbs).toEqual([
      { label: 'Home', url: '/' },
      { label: 'GuardianOne', url: '/profile/user-1/c/char-1' },
      { label: 'Loadouts', url: '/profile/user-1/c/char-1/loadouts' },
      { label: 'PvP Main Setup' },
    ]);
  });

  it('generates breadcrumbs for character-wide metrics path', () => {
    const crumbs = generateBreadcrumbs(
      '/profile/user-1/c/char-1/metrics',
      { id: 'user-1', characterId: 'char-1' },
      { profileDisplayName: 'GuardianOne' },
    );
    expect(crumbs).toEqual([
      { label: 'Home', url: '/' },
      { label: 'GuardianOne', url: '/profile/user-1/c/char-1' },
      { label: 'Metrics' },
    ]);
  });
});

describe('AppBreadcrumbs Component', () => {
  it('renders breadcrumbs correctly in router context', () => {
    mockUseMatches.mockReturnValue([]);
    render(
      <MemoryRouter initialEntries={['/sessions']}>
        <AppBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
  });

  it('renders originating session link when viewing a session-scoped activity', () => {
    mockUseMatches.mockReturnValue([
      {
        loaderData: {
          session: { id: 'sess-1', name: 'Trials Card' },
          activityDetails: {
            activity: { location: 'Javelin-4' },
          },
        },
      },
    ]);

    render(
      <MemoryRouter
        initialEntries={[
          '/profile/user-1/c/char-1/sessions/sess-1/activities/act-1',
        ]}
      >
        <AppBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sessions' })).toHaveAttribute(
      'href',
      '/profile/user-1/c/char-1/sessions',
    );
    expect(screen.getByRole('link', { name: 'Trials Card' })).toHaveAttribute(
      'href',
      '/profile/user-1/c/char-1/sessions/sess-1',
    );
    expect(screen.getByText('Javelin-4')).toBeInTheDocument();
  });
});
