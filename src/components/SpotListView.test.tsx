// src/components/SpotListView.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpotListView } from './SpotListView';
import type { Spot } from '../types/spot';

describe('SpotListView', () => {
  const mockSpot: Spot = {
    id: '1',
    type: 'wall',
    status: 'free',
    securityLevel: 'low',
    coords: [45.4642, 9.1900],
    notes: 'Test spot notes',
    owner: 'Test Owner',
    photos: ['data:image/png;base64,test'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
  };

  const defaultProps = {
    spots: [mockSpot],
    onSpotClick: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onFilterChange: vi.fn(),
    onSearchChange: vi.fn(),
    onToggleFavorite: vi.fn(),
  };

  it('renders spot grid with spot cards', () => {
    render(<SpotListView {...defaultProps} />);

    expect(screen.getByText('Test Owner')).toBeInTheDocument();
    expect(screen.getByText('Test spot notes')).toBeInTheDocument();
  });

  it('shows empty state when no spots', () => {
    render(<SpotListView {...defaultProps} spots={[]} />);

    expect(screen.getByText('No spots yet')).toBeInTheDocument();
  });

  it('opens SpotDetailModal when spot card is clicked', () => {
    render(<SpotListView {...defaultProps} />);

    // Click on spot card
    const spotCard = screen.getByText('Test Owner').closest('article');
    fireEvent.click(spotCard!);

    // Modal should be open (check for modal content)
    expect(screen.getAllByText('Test Owner')).toHaveLength(2); // One in card, one in modal
  });

  it('calls onSpotClick when "View on Map" clicked in modal', () => {
    const mockOnSpotClick = vi.fn();

    render(<SpotListView {...defaultProps} onSpotClick={mockOnSpotClick} />);

    // Open modal
    const spotCard = screen.getByText('Test Owner').closest('article');
    fireEvent.click(spotCard!);

    // Click "View on Map"
    const viewOnMapButton = screen.getByText('View on Map');
    fireEvent.click(viewOnMapButton);

    expect(mockOnSpotClick).toHaveBeenCalledWith(mockSpot);
  });

  it('calls onEdit when "Edit" clicked in modal', () => {
    const mockOnEdit = vi.fn();

    render(<SpotListView {...defaultProps} onEdit={mockOnEdit} />);

    // Open modal
    const spotCard = screen.getByText('Test Owner').closest('article');
    fireEvent.click(spotCard!);

    // Click "Edit"
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockSpot);
  });

  it('calls onToggleFavorite when favorite button clicked in modal', () => {
    const mockOnToggleFavorite = vi.fn();

    render(<SpotListView {...defaultProps} onToggleFavorite={mockOnToggleFavorite} />);

    // Open modal
    const spotCard = screen.getByText('Test Owner').closest('article');
    fireEvent.click(spotCard!);

    // Click "Add to Favorites"
    const favoriteButton = screen.getByText('Add to Favorites');
    fireEvent.click(favoriteButton);

    expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockSpot);
  });

  it('uses shared SpotDetailModal component', () => {
    render(<SpotListView {...defaultProps} />);

    // Open modal
    const spotCard = screen.getByText('Test Owner').closest('article');
    fireEvent.click(spotCard!);

    // Check for SpotDetailModal CSS class (not duplicate inline modal)
    const modal = document.querySelector('.spot-detail-modal');
    expect(modal).toBeInTheDocument();
  });
});
