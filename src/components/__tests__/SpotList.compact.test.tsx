// Test for compact spot card layout in SpotList
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpotList } from '../SpotList';
import type { Spot } from '../../types/spot';

describe('SpotList - Compact Card Layout', () => {
  const mockSpot: Spot = {
    id: 'test-spot-1',
    coords: [45.4642, 9.1900],
    type: 'wall',
    status: 'free',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'low',
    owner: 'Leoncavallo CSOA',
    notes: 'Via Watteau 7, Greco',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it('renders compact card with correct fields', () => {
    render(
      <SpotList
        spots={[mockSpot]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSpotClick={vi.fn()}
      />
    );

    // Name should be visible
    expect(screen.getByText('Leoncavallo CSOA')).toBeInTheDocument();

    // Type badge should be visible
    expect(screen.getByText('wall')).toBeInTheDocument();

    // Location (first line of notes) should be visible
    expect(screen.getByText('Via Watteau 7, Greco')).toBeInTheDocument();

    // Availability hours should be visible
    expect(screen.getByText('00:00-23:59')).toBeInTheDocument();

    // Security level should be visible
    expect(screen.getByText(/LOW/i)).toBeInTheDocument();
  });

  it('does not render notes field (removed for compactness)', () => {
    const spotWithLongNotes = {
      ...mockSpot,
      notes: 'This is a very long note that should not appear in the compact card because we removed it to save space and make scrolling easier in the sidebar.',
    };

    const { container } = render(
      <SpotList
        spots={[spotWithLongNotes]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Should not find a dedicated "notes" paragraph element
    // The notes text is used for location extraction, not displayed separately
    const spotCard = container.querySelector('.spot-card-compact');
    expect(spotCard).toBeInTheDocument();

    // The full notes text should not appear (only first line used for location)
    expect(screen.queryByText(/very long note/i)).not.toBeInTheDocument();
  });

  it('displays fallback name when owner is missing', () => {
    const spotWithoutOwner = {
      ...mockSpot,
      owner: undefined,
    };

    render(
      <SpotList
        spots={[spotWithoutOwner]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Wall Spot')).toBeInTheDocument();
  });

  it('displays "No hours set" when availability is empty', () => {
    const spotWithoutHours = {
      ...mockSpot,
      availability: [],
    };

    render(
      <SpotList
        spots={[spotWithoutHours]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('No hours set')).toBeInTheDocument();
  });

  it('applies correct security badge color', () => {
    const { container } = render(
      <SpotList
        spots={[mockSpot]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const securityBadge = container.querySelector('.spot-card-compact-security');
    expect(securityBadge).toHaveStyle({ color: 'var(--free)' }); // low = green
  });

  it('renders multiple spots compactly', () => {
    const spots = [
      mockSpot,
      { ...mockSpot, id: 'spot-2', owner: 'Spot 2' },
      { ...mockSpot, id: 'spot-3', owner: 'Spot 3' },
    ];

    render(
      <SpotList
        spots={spots}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getAllByTestId(/spot-card-/)).toHaveLength(3);
  });

  it('compact card has appropriate height constraint (~80px)', () => {
    const { container } = render(
      <SpotList
        spots={[mockSpot]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const card = container.querySelector('.spot-card-compact');
    expect(card).toHaveStyle({ minHeight: '80px' });
  });
});
