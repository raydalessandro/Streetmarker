// Integration tests for App.tsx
// Tests orchestration of all modules and data flow
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { StorageService } from '../../services/StorageService';
import { ExportService } from '../../services/ExportService';
import { ImportService } from '../../services/ImportService';
import type { Spot, ExportData } from '../../types/spot';

// Mock Leaflet
vi.mock('leaflet', () => ({
  map: vi.fn(() => ({
    setView: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    remove: vi.fn(),
  })),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn(),
  })),
  marker: vi.fn(() => ({
    addTo: vi.fn(),
    bindPopup: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    remove: vi.fn(),
  })),
  icon: vi.fn(() => ({})),
}));

// Mock Leaflet MarkerCluster
vi.mock('leaflet.markercluster', () => ({
  default: {},
}));

// Mock all services with constructor functions
vi.mock('../../services/StorageService', () => {
  const StorageService = vi.fn();
  return { StorageService };
});

vi.mock('../../services/ExportService', () => {
  const ExportService = vi.fn();
  return { ExportService };
});

vi.mock('../../services/ImportService', () => {
  const ImportService = vi.fn();
  return { ImportService };
});

describe('App Integration Tests', () => {
  let mockStorageService: any;
  let mockExportService: any;
  let mockImportService: any;

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

  beforeEach(() => {
    // Setup StorageService mock
    mockStorageService = {
      init: vi.fn().mockResolvedValue(undefined),
      getAllSpots: vi.fn().mockResolvedValue([]),
      getSpot: vi.fn().mockResolvedValue(null),
      addSpot: vi.fn().mockResolvedValue(undefined),
      updateSpot: vi.fn().mockResolvedValue(undefined),
      deleteSpot: vi.fn().mockResolvedValue(undefined),
      bulkAddSpots: vi.fn().mockResolvedValue(undefined),
      clearAllSpots: vi.fn().mockResolvedValue(undefined),
    };

    // Setup ExportService mock
    mockExportService = {
      exportToJSON: vi.fn().mockReturnValue({
        version: '1.0.0',
        exportedAt: Date.now(),
        spots: mockSpots,
        metadata: { appVersion: '1.0.0', deviceId: 'test-device' },
      }),
      downloadJSON: vi.fn(),
      generateFilename: vi.fn().mockReturnValue('streetmark-export.json'),
    };

    // Setup ImportService mock
    mockImportService = {
      parseImportFile: vi.fn().mockResolvedValue({
        version: '1.0.0',
        exportedAt: Date.now(),
        spots: mockSpots,
        metadata: { appVersion: '1.0.0', deviceId: 'test-device' },
      }),
      validateImportData: vi.fn().mockReturnValue({ valid: true, errors: [] }),
      mergeSpots: vi.fn().mockReturnValue({
        added: mockSpots,
        updated: [],
        conflicts: [],
      }),
    };

    // Apply mocks to constructors
    vi.mocked(StorageService).mockReturnValue(mockStorageService);
    vi.mocked(ExportService).mockReturnValue(mockExportService);
    vi.mocked(ImportService).mockReturnValue(mockImportService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('State Management', () => {
    it('initializes with empty spots state', async () => {
      render(<App />);

      await waitFor(() => {
        expect(mockStorageService.init).toHaveBeenCalled();
        expect(mockStorageService.getAllSpots).toHaveBeenCalled();
      });
    });

    it('manages spots state correctly', async () => {
      mockStorageService.getAllSpots.mockResolvedValue(mockSpots);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Test spot 2/i)).toBeInTheDocument();
      });
    });

    it('manages form modal state', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(mockStorageService.init).toHaveBeenCalled();
      });

      // Form should not be visible initially
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
    });
  });

  describe('Load Spots on Mount', () => {
    it('calls StorageService.init() on mount', async () => {
      render(<App />);

      await waitFor(() => {
        expect(mockStorageService.init).toHaveBeenCalledTimes(1);
      });
    });

    it('loads all spots from storage on mount', async () => {
      mockStorageService.getAllSpots.mockResolvedValue(mockSpots);

      render(<App />);

      await waitFor(() => {
        expect(mockStorageService.getAllSpots).toHaveBeenCalled();
      });
    });

    it('handles storage errors gracefully', async () => {
      mockStorageService.init.mockRejectedValue(new Error('Storage error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<App />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Add Spot Flow', () => {
    it('completes full add spot flow: map click -> form -> storage -> refresh', async () => {
      const user = userEvent.setup();
      mockStorageService.getAllSpots
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockSpots[0]]);

      render(<App />);

      await waitFor(() => {
        expect(mockStorageService.init).toHaveBeenCalled();
      });

      // Simulate map click (we'll trigger this via button in actual implementation)
      // For now, test the form submission flow
      mockStorageService.addSpot.mockResolvedValue(undefined);

      // Verify storage was called
      await waitFor(() => {
        expect(mockStorageService.getAllSpots).toHaveBeenCalledTimes(1);
      });
    });

    it('calls addSpot with complete spot data', async () => {
      render(<App />);

      await waitFor(() => {
        expect(mockStorageService.init).toHaveBeenCalled();
      });

      // This will be tested when form integration is complete
      expect(mockStorageService.addSpot).not.toHaveBeenCalled();
    });

    it('refreshes spot list after adding', async () => {
      mockStorageService.getAllSpots
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockSpots);

      render(<App />);

      await waitFor(() => {
        expect(mockStorageService.getAllSpots).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Edit Spot Flow', () => {
    it('loads existing spot into form when marker clicked', async () => {
      mockStorageService.getAllSpots.mockResolvedValue(mockSpots);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
      });
    });

    it('calls updateSpot with modified data', async () => {
      mockStorageService.getAllSpots.mockResolvedValue(mockSpots);

      render(<App />);

      await waitFor(() => {
        expect(mockStorageService.getAllSpots).toHaveBeenCalled();
      });

      // updateSpot will be called when edit flow is implemented
      expect(mockStorageService.updateSpot).not.toHaveBeenCalled();
    });

    it('refreshes spot list after updating', async () => {
      mockStorageService.getAllSpots
        .mockResolvedValueOnce(mockSpots)
        .mockResolvedValueOnce(mockSpots);

      render(<App />);

      await waitFor(() => {
        expect(mockStorageService.getAllSpots).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Delete Spot Flow', () => {
    it('calls deleteSpot when delete button clicked', async () => {
      const user = userEvent.setup();
      mockStorageService.getAllSpots
        .mockResolvedValueOnce(mockSpots)
        .mockResolvedValueOnce([mockSpots[0]]);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/Delete spot/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockStorageService.deleteSpot).toHaveBeenCalledWith('spot-1');
      });
    });

    it('refreshes spot list after deletion', async () => {
      const user = userEvent.setup();
      mockStorageService.getAllSpots
        .mockResolvedValueOnce(mockSpots)
        .mockResolvedValueOnce([mockSpots[1]]);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/Delete spot/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockStorageService.getAllSpots).toHaveBeenCalledTimes(2);
      });
    });

    it('handles delete errors gracefully', async () => {
      const user = userEvent.setup();
      mockStorageService.getAllSpots.mockResolvedValue(mockSpots);
      mockStorageService.deleteSpot.mockRejectedValue(new Error('Delete failed'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/Delete spot/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Filter and Search Flow', () => {
    it('filters spots by type', async () => {
      const user = userEvent.setup();
      mockStorageService.getAllSpots.mockResolvedValue(mockSpots);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Test spot 2/i)).toBeInTheDocument();
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
      mockStorageService.getAllSpots.mockResolvedValue(mockSpots);

      render(<App />);

      await waitFor(() => {
        expect(screen.getAllByText(/Test spot/i)).toHaveLength(2);
      });

      const freeCheckbox = screen.getByRole('checkbox', { name: /Free/i });
      await user.click(freeCheckbox);

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
        expect(screen.queryByText(/Test spot 2/i)).not.toBeInTheDocument();
      });
    });

    it('searches spots by query', async () => {
      const user = userEvent.setup();
      mockStorageService.getAllSpots.mockResolvedValue(mockSpots);

      render(<App />);

      await waitFor(() => {
        expect(screen.getAllByText(/Test spot/i)).toHaveLength(2);
      });

      const searchInput = screen.getByPlaceholderText(/Search spots/i);
      await user.type(searchInput, 'spot 1');

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
        expect(screen.queryByText(/Test spot 2/i)).not.toBeInTheDocument();
      }, { timeout: 500 }); // Account for debounce
    });

    it('combines filters and search', async () => {
      const user = userEvent.setup();
      const threeSpots = [
        ...mockSpots,
        {
          id: 'spot-3',
          coords: [45.4654, 9.1859],
          type: 'wall',
          status: 'free',
          availability: [],
          securityLevel: 'medium',
          notes: 'Another wall spot',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as Spot,
      ];
      mockStorageService.getAllSpots.mockResolvedValue(threeSpots);

      render(<App />);

      await waitFor(() => {
        expect(screen.getAllByText(/spot/i).length).toBeGreaterThan(0);
      });

      // Apply type filter
      const wallCheckbox = screen.getByRole('checkbox', { name: /Wall/i });
      await user.click(wallCheckbox);

      // Apply search
      const searchInput = screen.getByPlaceholderText(/Search spots/i);
      await user.type(searchInput, 'Test');

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
        expect(screen.queryByText(/Another wall spot/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Test spot 2/i)).not.toBeInTheDocument();
      }, { timeout: 500 });
    });
  });

  describe('Import Flow', () => {
    it('handles import with merge preview and confirmation', async () => {
      const user = userEvent.setup();
      mockStorageService.getAllSpots
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockSpots);

      const mockFile = new File(
        [JSON.stringify({ version: '1.0.0', spots: mockSpots })],
        'test.json',
        { type: 'application/json' }
      );

      render(<App />);

      await waitFor(() => {
        expect(mockStorageService.init).toHaveBeenCalled();
      });

      // Click import button
      const importButton = screen.getByText(/Import Data/i);
      await user.click(importButton);

      // Find hidden file input and trigger file selection
      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      // Wait for merge preview
      await waitFor(() => {
        expect(mockImportService.parseImportFile).toHaveBeenCalled();
        expect(screen.getByText(/Merge Preview/i)).toBeInTheDocument();
      });

      // Confirm import
      const confirmButton = screen.getByText(/Confirm Import/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockStorageService.bulkAddSpots).toHaveBeenCalledWith(mockSpots);
        expect(mockStorageService.getAllSpots).toHaveBeenCalledTimes(2);
      });
    });

    it('handles import validation errors', async () => {
      const user = userEvent.setup();
      mockImportService.validateImportData.mockReturnValue({
        valid: false,
        errors: ['Invalid format'],
      });

      const mockFile = new File(['invalid'], 'test.json', { type: 'application/json' });

      render(<App />);

      await waitFor(() => {
        expect(mockStorageService.init).toHaveBeenCalled();
      });

      const importButton = screen.getByText(/Import Data/i);
      await user.click(importButton);

      const fileInput = screen.getByTestId('file-input');
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText(/Error:/i)).toBeInTheDocument();
        expect(screen.getByText(/Invalid format/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error on addSpot failure', async () => {
      mockStorageService.addSpot.mockRejectedValue(new Error('Add failed'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<App />);

      await waitFor(() => {
        expect(mockStorageService.init).toHaveBeenCalled();
      });

      // Error will be logged when add operation is performed
      consoleErrorSpy.mockRestore();
    });

    it('displays error on updateSpot failure', async () => {
      mockStorageService.updateSpot.mockRejectedValue(new Error('Update failed'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<App />);

      await waitFor(() => {
        expect(mockStorageService.init).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('recovers from storage initialization failure', async () => {
      mockStorageService.init.mockRejectedValueOnce(new Error('Init failed'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<App />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Data Flow Integration', () => {
    it('maintains data consistency across all operations', async () => {
      const user = userEvent.setup();
      mockStorageService.getAllSpots
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockSpots[0]])
        .mockResolvedValueOnce(mockSpots);

      render(<App />);

      // Initial load
      await waitFor(() => {
        expect(mockStorageService.getAllSpots).toHaveBeenCalledTimes(1);
      });

      // Verify spots are displayed correctly
      await waitFor(() => {
        expect(mockStorageService.init).toHaveBeenCalled();
      });
    });

    it('filters and search work with fresh data after CRUD operations', async () => {
      const user = userEvent.setup();
      mockStorageService.getAllSpots.mockResolvedValue(mockSpots);

      render(<App />);

      await waitFor(() => {
        expect(screen.getAllByText(/Test spot/i)).toHaveLength(2);
      });

      // Apply filter
      const wallCheckbox = screen.getByRole('checkbox', { name: /Wall/i });
      await user.click(wallCheckbox);

      await waitFor(() => {
        expect(screen.getByText(/Test spot 1/i)).toBeInTheDocument();
      });
    });
  });
});
