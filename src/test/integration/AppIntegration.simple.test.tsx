// Simplified Integration tests for App.tsx using fake-indexeddb
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import type { Spot } from '../../types/spot';
import { StorageService } from '../../services/StorageService';

// Use fake-indexeddb for real storage interactions
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

// Mock Leaflet
vi.mock('leaflet', () => ({
  map: vi.fn(() => ({
    setView: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
  })),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
  })),
  marker: vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
  })),
  icon: vi.fn(() => ({})),
}));

// Mock Leaflet MarkerCluster
vi.mock('leaflet.markercluster', () => ({
  default: {},
}));

describe('App Integration Tests (Simplified)', () => {
  let storageService: StorageService;

  const mockSpots: Spot[] = [
    {
      id: 'spot-1',
      coords: [45.4642, 9.1900],
      type: 'wall',
      status: 'free',
      availability: [{ from: '08:00', to: '20:00' }],
      securityLevel: 'low',
      notes: 'Test spot 1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'spot-2',
      coords: [45.4785, 9.1946],
      type: 'train',
      status: 'occupied',
      availability: [],
      securityLevel: 'high',
      owner: 'Test Crew',
      notes: 'Test spot 2',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  beforeEach(async () => {
    // Reset IndexedDB
    globalThis.indexedDB = new IDBFactory();

    // Initialize storage and add test spots
    storageService = new StorageService();
    await storageService.init();

    for (const spot of mockSpots) {
      await storageService.addSpot(spot);
    }
  });

  afterEach(async () => {
    await storageService.clearAllSpots();
  });

  describe('Basic Rendering', () => {
    it('renders app header', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/StreetMark Milano/i)).toBeInTheDocument();
      });
    });

    it('loads spots from storage on mount', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Test spot 2/i)).toBeInTheDocument();
      });
    });

    it('displays import/export buttons', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Export Data/i)).toBeInTheDocument();
        expect(screen.getByText(/Import Data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Spot List', () => {
    it('displays all spots in the list', async () => {
      render(<App />);

      await waitFor(() => {
        const spotCards = screen.getAllByText(/Test spot/i);
        expect(spotCards.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('shows edit and delete buttons for each spot', async () => {
      render(<App />);

      await waitFor(() => {
        const editButtons = screen.getAllByLabelText(/Edit spot/i);
        const deleteButtons = screen.getAllByLabelText(/Delete spot/i);

        expect(editButtons.length).toBe(2);
        expect(deleteButtons.length).toBe(2);
      });
    });
  });

  describe('Delete Flow', () => {
    it('removes spot when delete is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/Delete spot/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText(/Test spot 1/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Test spot 2/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filters', () => {
    it('filters spots by type', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getAllByText(/Test spot/i).length).toBeGreaterThanOrEqual(2);
      });

      // Click "Wall" filter
      const wallCheckbox = screen.getByRole('checkbox', { name: /Wall/i });
      await user.click(wallCheckbox);

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
        expect(screen.queryByText(/Test spot 2/i)).not.toBeInTheDocument();
      });
    });

    it('filters spots by status', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getAllByText(/Test spot/i).length).toBeGreaterThanOrEqual(2);
      });

      const freeCheckbox = screen.getByRole('checkbox', { name: /Free/i });
      await user.click(freeCheckbox);

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
        expect(screen.queryByText(/Test spot 2/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Search', () => {
    it('filters spots by search query', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getAllByText(/Test spot/i).length).toBeGreaterThanOrEqual(2);
      });

      const searchInput = screen.getByPlaceholderText(/Search spots/i);
      await user.type(searchInput, 'spot 1');

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
        expect(screen.queryByText(/Test spot 2/i)).not.toBeInTheDocument();
      }, { timeout: 500 }); // Account for debounce
    });
  });

  describe('Data Consistency', () => {
    it('maintains filtered view after operations', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getAllByText(/Test spot/i).length).toBeGreaterThanOrEqual(2);
      });

      // Apply filter
      const wallCheckbox = screen.getByRole('checkbox', { name: /Wall/i });
      await user.click(wallCheckbox);

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
        expect(screen.queryByText(/Test spot 2/i)).not.toBeInTheDocument();
      });

      // Filter should persist after operations
      expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
    });
  });
});
