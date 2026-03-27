// src/components/__tests__/SpotList.new.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpotList } from '../SpotList';
import type { Spot } from '../../types/spot';

describe('SpotList', () => {
  const mockSpot: Spot = {
    id: '1',
    type: 'wall',
    status: 'free',
    securityLevel: 'low',
    coords: [45.4642, 9.1900],
    availability: [],
    notes: 'Test spot',
    owner: 'Test Owner',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
  };

  it('renders empty state when no spots provided', () => {
    render(
      <SpotList
        spots={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Nessun spot trovato')).toBeInTheDocument();
  });

  it('renders spot list when spots provided', () => {
    render(
      <SpotList
        spots={[mockSpot]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Test Owner')).toBeInTheDocument();
    expect(screen.getByText('Test spot')).toBeInTheDocument();
  });

  it('calls onEdit when Edit button clicked', () => {
    const mockOnEdit = vi.fn();

    render(
      <SpotList
        spots={[mockSpot]}
        onEdit={mockOnEdit}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Edit spot'));

    expect(mockOnEdit).toHaveBeenCalledWith(mockSpot);
  });

  it('calls onDelete when Delete button clicked', () => {
    const mockOnDelete = vi.fn();

    render(
      <SpotList
        spots={[mockSpot]}
        onEdit={vi.fn()}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByLabelText('Delete spot'));

    expect(mockOnDelete).toHaveBeenCalledWith(mockSpot.id);
  });

  it('calls onSpotClick when spot card is clicked', () => {
    const mockOnSpotClick = vi.fn();

    render(
      <SpotList
        spots={[mockSpot]}
        onSpotClick={mockOnSpotClick}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Click on the spot card (not on the buttons)
    const spotCard = screen.getByTestId('spot-card-1');
    fireEvent.click(spotCard);

    expect(mockOnSpotClick).toHaveBeenCalledWith(mockSpot);
  });

  it('does not call onSpotClick when onSpotClick is not provided', () => {
    // Should not throw error when onSpotClick is undefined
    render(
      <SpotList
        spots={[mockSpot]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const spotCard = screen.getByTestId('spot-card-1');
    expect(() => fireEvent.click(spotCard)).not.toThrow();
  });
});
