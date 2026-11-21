import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  CompDivisionSnapshot,
  SessionCompTrackingBanner,
  formatCompPointDelta,
  formatCompPoints,
  getCompPointDelta,
  getDivisionChangeStatus,
} from './comp-tracking';

describe('comp-tracking helpers', () => {
  it('formats Competitive points and point deltas cleanly', () => {
    expect(formatCompPoints(5820)).toBe('5,820');
    expect(formatCompPoints(0)).toBe('0');

    expect(formatCompPointDelta(225)).toBe('+225 pts');
    expect(formatCompPointDelta(-1250)).toBe('-1,250 pts');
    expect(formatCompPointDelta(0)).toBe('0 pts');
  });

  it('computes getCompPointDelta from explicit pointDelta or start/end fallback', () => {
    expect(getCompPointDelta(undefined)).toBeUndefined();
    expect(
      getCompPointDelta({ enabled: false, pointDelta: 200 }),
    ).toBeUndefined();
    expect(getCompPointDelta({ enabled: true, pointDelta: -95 })).toBe(-95);
    expect(getCompPointDelta({ enabled: true, pointDelta: 0 })).toBe(0);
    expect(
      getCompPointDelta({
        enabled: true,
        start: { points: 5820 },
        end: { points: 6045 },
      }),
    ).toBe(225);
    expect(
      getCompPointDelta({
        enabled: true,
        start: { points: 5820 },
      }),
    ).toBeUndefined();
  });

  it('determines division change status via stepIndex and falls back to point delta or changed', () => {
    expect(
      getDivisionChangeStatus({
        enabled: true,
        start: { divisionName: 'Platinum II', points: 6000, stepIndex: 22 },
        end: { divisionName: 'Platinum II', points: 6150, stepIndex: 22 },
      }),
    ).toBeNull();

    expect(
      getDivisionChangeStatus({
        enabled: true,
        start: { divisionName: 'Platinum III', points: 5820, stepIndex: 21 },
        end: { divisionName: 'Platinum II', points: 6045, stepIndex: 22 },
      }),
    ).toBe('promoted');

    expect(
      getDivisionChangeStatus({
        enabled: true,
        start: { divisionName: 'Platinum III', points: 5510, stepIndex: 21 },
        end: { divisionName: 'Gold I', points: 5400, stepIndex: 20 },
      }),
    ).toBe('relegated');

    expect(
      getDivisionChangeStatus({
        enabled: true,
        start: { divisionName: 'Gold I', points: 5400 },
        end: { divisionName: 'Platinum III', points: 5550 },
      }),
    ).toBe('promoted');

    expect(
      getDivisionChangeStatus({
        enabled: true,
        start: { divisionName: 'Platinum III', points: 5550 },
        end: { divisionName: 'Gold I', points: 5400 },
      }),
    ).toBe('relegated');

    expect(
      getDivisionChangeStatus({
        enabled: true,
        start: { divisionName: 'Platinum III', points: 5500 },
        end: { divisionName: 'Platinum II', points: 5500 },
      }),
    ).toBe('changed');
  });
});

describe('CompDivisionSnapshot & SessionCompTrackingBanner', () => {
  it('falls back to Competitive label and SwordsIcon when divisionName and icon are absent', () => {
    const { container } = render(
      <CompDivisionSnapshot
        snapshot={{ points: 4200 }}
        prefix="Start"
        showPointsWithUnit
      />,
    );

    expect(
      screen.getByText('Start: Competitive · 4,200 pts'),
    ).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('returns null when compTracking is disabled', () => {
    const { container } = render(
      <SessionCompTrackingBanner
        compTracking={{ enabled: false }}
        isPending={false}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders Division Changed badge, end-only fallback, and pending snapshot fallback on completed sessions', () => {
    const { rerender } = render(
      <SessionCompTrackingBanner
        compTracking={{
          enabled: true,
          start: { divisionName: 'Platinum III', points: 5500 },
          end: { divisionName: 'Platinum II', points: 5500 },
        }}
        isPending={false}
      />,
    );

    expect(screen.getByText('Division Changed')).toBeInTheDocument();
    expect(screen.getByText('0 pts')).toBeInTheDocument();

    rerender(
      <SessionCompTrackingBanner
        compTracking={{
          enabled: true,
          end: { divisionName: 'Adept I', points: 8100 },
        }}
        isPending={false}
      />,
    );
    expect(screen.getByText('End: Adept I · 8,100 pts')).toBeInTheDocument();

    rerender(
      <SessionCompTrackingBanner
        compTracking={{ enabled: true }}
        isPending={false}
      />,
    );
    expect(
      screen.getByText('Competitive score snapshot pending'),
    ).toBeInTheDocument();
  });
});
