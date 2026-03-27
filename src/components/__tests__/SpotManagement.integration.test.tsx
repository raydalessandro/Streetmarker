// src/components/__tests__/SpotManagement.integration.test.tsx
// Integration test showing SpotService + Components working together

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpotService } from '../../services/SpotService';
import { SpotForm } from '../SpotForm';
import { SpotList } from '../SpotList';
import { SpotFilters } from '../SpotFilters';
import type { Spot } from '../../types/spot';
import React, { useState } from 'react';

// Simple spot manager component that integrates all pieces
function SpotManager() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<Spot[]>([]);
  const [editingSpot, setEditingSpot] = useState<Spot | undefined>();
  const [showForm, setShowForm] = useState(false);

  const spotService = new SpotService();

  const handleSubmit = (spotData: Omit<Spot, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSpot = spotService.createSpot(spotData);
    setSpots([...spots, newSpot]);
    setFilteredSpots([...spots, newSpot]);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    const newSpots = spots.filter(s => s.id !== id);
    setSpots(newSpots);
    setFilteredSpots(newSpots);
  };

  const handleFilterChange = (filters: any) => {
    const filtered = spotService.filterSpots(spots, filters);
    setFilteredSpots(filtered);
  };

  const handleSearchChange = (query: string) => {
    const searched = spotService.searchSpots(spots, query);
    setFilteredSpots(searched);
  };

  return (
    <div>
      <button onClick={() => setShowForm(true)}>Add Spot</button>

      {showForm && (
        <SpotForm
          spot={editingSpot}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      <SpotFilters
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
      />

      <SpotList
        spots={filteredSpots}
        onEdit={setEditingSpot}
        onDelete={handleDelete}
      />
    </div>
  );
}

describe('Spot Management Integration', () => {
  it('should create and display a spot', async () => {
    const user = userEvent.setup();
    render(<SpotManager />);

    // Click add spot button
    await user.click(screen.getByRole('button', { name: /add spot/i }));

    // Fill in the form
    await user.type(screen.getByLabelText(/latitude/i), '45.4642');
    await user.type(screen.getByLabelText(/longitude/i), '9.19');
    await user.selectOptions(screen.getByLabelText(/type/i), 'wall');
    await user.selectOptions(screen.getByLabelText(/status/i), 'free');
    await user.selectOptions(screen.getByLabelText(/security level/i), 'medium');

    const notesInput = screen.getByLabelText(/notes/i);
    await user.type(notesInput, 'Test spot near station');

    // Submit
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Check spot is displayed
    await waitFor(() => {
      expect(screen.getByText(/Test spot near station/i)).toBeInTheDocument();
    });
  });

  it('should filter spots by type', async () => {
    const user = userEvent.setup();
    render(<SpotManager />);

    // Add two spots of different types
    await user.click(screen.getByRole('button', { name: /add spot/i }));
    await user.type(screen.getByLabelText(/latitude/i), '45.4642');
    await user.type(screen.getByLabelText(/longitude/i), '9.19');
    await user.selectOptions(screen.getByLabelText(/type/i), 'wall');
    await user.selectOptions(screen.getByLabelText(/status/i), 'free');
    await user.selectOptions(screen.getByLabelText(/security level/i), 'low');
    await user.type(screen.getByLabelText(/notes/i), 'Wall spot');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/Wall spot/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /add spot/i }));
    await user.type(screen.getByLabelText(/latitude/i), '45.4642');
    await user.type(screen.getByLabelText(/longitude/i), '9.19');
    await user.selectOptions(screen.getByLabelText(/type/i), 'train');
    await user.selectOptions(screen.getByLabelText(/status/i), 'free');
    await user.selectOptions(screen.getByLabelText(/security level/i), 'low');
    await user.type(screen.getByLabelText(/notes/i), 'Train spot');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/Train spot/i)).toBeInTheDocument();
    });

    // Filter by wall type only
    const wallCheckbox = screen.getByLabelText(/^wall$/i);
    await user.click(wallCheckbox);

    // Should see wall spot but not train spot
    await waitFor(() => {
      expect(screen.getByText(/Wall spot/i)).toBeInTheDocument();
      expect(screen.queryByText(/Train spot/i)).not.toBeInTheDocument();
    });
  });

  it('should delete a spot', async () => {
    const user = userEvent.setup();
    render(<SpotManager />);

    // Add a spot
    await user.click(screen.getByRole('button', { name: /add spot/i }));
    await user.type(screen.getByLabelText(/latitude/i), '45.4642');
    await user.type(screen.getByLabelText(/longitude/i), '9.19');
    await user.selectOptions(screen.getByLabelText(/type/i), 'wall');
    await user.selectOptions(screen.getByLabelText(/status/i), 'free');
    await user.selectOptions(screen.getByLabelText(/security level/i), 'low');
    await user.type(screen.getByLabelText(/notes/i), 'Spot to delete');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/Spot to delete/i)).toBeInTheDocument();
    });

    // Delete the spot
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Spot should be gone
    await waitFor(() => {
      expect(screen.queryByText(/Spot to delete/i)).not.toBeInTheDocument();
    });
  });
});
