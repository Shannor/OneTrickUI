import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ClassStats } from './ClassStats';

describe('ClassStats', () => {
  const mockData = [
    { stat: 'Mobility', value: 70 },
    { stat: 'Resilience', value: 100 },
    { stat: 'Recovery', value: 80 },
  ];

  it('renders stats as compact pills by default', () => {
    render(<ClassStats data={mockData} />);
    expect(screen.getByText('Mobility')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('Resilience')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Recovery')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('renders stats when compact is false', () => {
    render(<ClassStats data={mockData} compact={false} />);
    expect(screen.getByText('Mobility')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
  });

  it('returns null when data is empty or missing', () => {
    const { container } = render(<ClassStats data={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
