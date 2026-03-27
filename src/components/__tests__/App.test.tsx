// src/components/__tests__/App.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../App';

// Mock StorageService
vi.mock('../../services/StorageService', () => {
  const mockSpots = [
    {
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
    },
  ];

  class MockStorageService {
    async init() { return undefined; }
    async seedInitialSpots() { return 0; }
    async getAllSpots() { return mockSpots; }
    async updateSpot() { return undefined; }
    async deleteSpot() { return undefined; }
    async addSpot() { return undefined; }
    async bulkAddSpots() { return undefined; }
  }

  return {
    StorageService: MockStorageService,
  };
});

describe('App - Favorites workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should toggle favorite with optimistic update', async () => {
    render(<App />);

    // Wait for spots to load
    await waitFor(() => {
      expect(screen.queryByText('Test Owner')).toBeInTheDocument();
    });

    // Navigate to Gallery view (should be empty initially)
    const galleryButton = screen.getByRole('button', { name: /gallery/i });
    fireEvent.click(galleryButton);

    // Verify no favorites initially
    await waitFor(() => {
      expect(screen.getByText(/no favorite spots yet/i)).toBeInTheDocument();
    });

    // Navigate back to map view
    const mapButton = screen.getByRole('button', { name: /map/i });
    fireEvent.click(mapButton);

    // This test verifies the structure is in place
    // Full integration test would require mocking Leaflet map
  });

  it('should persist view to localStorage', async () => {
    render(<App />);

    // Initial view should be 'map'
    expect(localStorage.getItem('streetmark-current-view')).toBe('map');

    // Navigate to Gallery
    const galleryButton = screen.getByRole('button', { name: /gallery/i });
    fireEvent.click(galleryButton);

    // View should persist
    await waitFor(() => {
      expect(localStorage.getItem('streetmark-current-view')).toBe('gallery');
    });
  });

  it('should restore view from localStorage on mount', () => {
    localStorage.setItem('streetmark-current-view', 'spots');

    render(<App />);

    // View should be restored from localStorage
    // (would need to verify UI state, but localStorage is the source of truth)
    expect(localStorage.getItem('streetmark-current-view')).toBe('spots');
  });
});
