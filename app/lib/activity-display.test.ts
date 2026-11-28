import { describe, expect, it } from 'vitest';

import { formatActivityLabel } from './activity-display';

describe('formatActivityLabel', () => {
  it('returns Iron Banner activity without duplicate mode suffix', () => {
    expect(formatActivityLabel('Iron Banner: Control', 'Control')).toEqual({
      label: 'Iron Banner: Control',
    });
  });

  it('normalizes Control to Quickplay and strips Quickplay from mode', () => {
    expect(formatActivityLabel('Control', 'Clash Quickplay')).toEqual({
      label: 'Quickplay',
      modeLabel: 'Clash',
    });
  });

  it('normalizes Competitive and strips redundant prefixes from mode', () => {
    expect(
      formatActivityLabel('Competitive Division', 'Competitive Collision'),
    ).toEqual({
      label: 'Competitive',
      modeLabel: 'Collision',
    });
  });

  it('normalizes Trials of Osiris and omits empty stripped mode', () => {
    expect(
      formatActivityLabel('Trials of Osiris', 'Trials of OsirisDominion'),
    ).toEqual({
      label: 'Trials of Osiris',
      modeLabel: 'Dominion',
    });
    expect(formatActivityLabel('Trials of Osiris', 'Trials of Osiris')).toEqual(
      {
        label: 'Trials of Osiris',
        modeLabel: undefined,
      },
    );
  });

  it('preserves other activities and modes unchanged', () => {
    expect(formatActivityLabel('Rumble', 'Rumble')).toEqual({
      label: 'Rumble',
      modeLabel: 'Rumble',
    });
  });
});
