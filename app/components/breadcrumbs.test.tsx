import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import * as routeLoaders from '~/hooks/use-route-loaders';

import { AppBreadcrumbs, generateBreadcrumbs } from './breadcrumbs';

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useMatches: () => [],
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
      { label: 'Overview', url: '/profile/user-1/c/char-1' },
      { label: 'Sessions', url: '/profile/user-1/c/char-1/sessions' },
      {
        label: 'Control Warmup',
        url: '/profile/user-1/c/char-1/sessions/sess-1',
      },
      { label: 'Metrics' },
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
      { label: 'Overview', url: '/profile/user-1/c/char-1' },
      { label: 'Loadouts', url: '/profile/user-1/c/char-1/loadouts' },
      { label: 'PvP Main Setup' },
    ]);
  });
});

describe('AppBreadcrumbs Component', () => {
  it('renders breadcrumbs correctly in router context', () => {
    render(
      <MemoryRouter initialEntries={['/sessions']}>
        <AppBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
  });
});
