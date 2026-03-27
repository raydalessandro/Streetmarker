import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportExport } from '../ImportExport';
import type { Spot } from '../../types/spot';

// Mock services with proper constructors
const mockExportService = {
  exportToJSON: vi.fn(),
  generateFilename: vi.fn(),
  downloadJSON: vi.fn(),
};

const mockImportService = {
  validateImportData: vi.fn(),
  parseImportFile: vi.fn(),
  mergeSpots: vi.fn(),
};

vi.mock('../../services/ExportService', () => ({
  ExportService: vi.fn(function(this: any) {
    return mockExportService;
  }),
}));

vi.mock('../../services/ImportService', () => ({
  ImportService: vi.fn(function(this: any) {
    return mockImportService;
  }),
}));

describe('ImportExport', () => {
  const mockSpots: Spot[] = [
    {
      id: 'test-spot-1',
      coords: [45.4642, 9.1900],
      type: 'wall',
      status: 'free',
      availability: [{ from: '08:00', to: '18:00' }],
      securityLevel: 'low',
      notes: 'Test spot',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  let mockOnImport: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnImport = vi.fn();

    // Reset all mocks
    vi.clearAllMocks();

    // Setup ExportService mock returns
    mockExportService.exportToJSON.mockReturnValue({
      version: '1.0.0',
      exportedAt: Date.now(),
      spots: mockSpots,
      metadata: {
        appVersion: '1.0.0',
        deviceId: 'test-device-id',
      },
    });
    mockExportService.generateFilename.mockReturnValue('streetmark-export-2026-03-26-140000.json');

    // Setup ImportService mock returns
    mockImportService.validateImportData.mockReturnValue({ valid: true, errors: [] });
    mockImportService.parseImportFile.mockResolvedValue({
      version: '1.0.0',
      exportedAt: Date.now(),
      spots: mockSpots,
      metadata: {
        appVersion: '1.0.0',
        deviceId: 'test-device-id',
      },
    });
    mockImportService.mergeSpots.mockReturnValue({
      added: [mockSpots[0]],
      updated: [],
      conflicts: [],
    });
  });

  describe('Export functionality', () => {
    it('should render export button', () => {
      render(<ImportExport spots={mockSpots} onImport={mockOnImport} />);

      const exportButton = screen.getByRole('button', { name: /export/i });
      expect(exportButton).toBeDefined();
    });

    it('should call exportService when export button is clicked', () => {
      render(<ImportExport spots={mockSpots} onImport={mockOnImport} />);

      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);

      expect(mockExportService.exportToJSON).toHaveBeenCalledWith(mockSpots);
      expect(mockExportService.generateFilename).toHaveBeenCalled();
      expect(mockExportService.downloadJSON).toHaveBeenCalled();
    });
  });

  describe('Import functionality', () => {
    it('should render import button', () => {
      render(<ImportExport spots={mockSpots} onImport={mockOnImport} />);

      const importButton = screen.getByRole('button', { name: /import/i });
      expect(importButton).toBeDefined();
    });

    it('should trigger file picker when import button is clicked', () => {
      render(<ImportExport spots={mockSpots} onImport={mockOnImport} />);

      const importButton = screen.getByRole('button', { name: /import/i });
      const fileInput = screen.getByTestId('file-input');

      const clickSpy = vi.spyOn(fileInput, 'click');
      fireEvent.click(importButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should parse and validate file on selection', async () => {
      render(<ImportExport spots={mockSpots} onImport={mockOnImport} />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const file = new File(['{}'], 'test.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockImportService.parseImportFile).toHaveBeenCalledWith(file);
        expect(mockImportService.validateImportData).toHaveBeenCalled();
      });
    });

    it('should show merge preview modal after successful parse', async () => {
      render(<ImportExport spots={mockSpots} onImport={mockOnImport} />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const file = new File(['{}'], 'test.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/merge preview/i)).toBeDefined();
      });
    });

    it('should display correct merge counts in preview', async () => {
      mockImportService.mergeSpots.mockReturnValue({
        added: [mockSpots[0]],
        updated: [],
        conflicts: [],
      });

      render(<ImportExport spots={mockSpots} onImport={mockOnImport} />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const file = new File(['{}'], 'test.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return element?.textContent === '1 spots will be added';
        })).toBeDefined();
        expect(screen.getByText((content, element) => {
          return element?.textContent === '0 spots will be updated';
        })).toBeDefined();
        expect(screen.getByText((content, element) => {
          return element?.textContent === '0 spots have conflicts';
        })).toBeDefined();
      });
    });

    it('should show conflicts list when conflicts exist', async () => {
      const conflictSpot = { ...mockSpots[0], id: 'conflict-spot' };
      mockImportService.mergeSpots.mockReturnValue({
        added: [],
        updated: [],
        conflicts: [conflictSpot],
      });

      render(<ImportExport spots={mockSpots} onImport={mockOnImport} />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const file = new File(['{}'], 'test.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/conflicts detected/i)).toBeDefined();
        expect(screen.getByText(/conflict-spot/i)).toBeDefined();
      });
    });

    it('should call onImport when confirm button is clicked', async () => {
      const mergeResult = {
        added: [mockSpots[0]],
        updated: [],
        conflicts: [],
      };
      mockImportService.mergeSpots.mockReturnValue(mergeResult);

      render(<ImportExport spots={mockSpots} onImport={mockOnImport} />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const file = new File(['{}'], 'test.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        fireEvent.click(confirmButton);
      });

      expect(mockOnImport).toHaveBeenCalledWith(mergeResult);
    });

    it('should close modal when cancel button is clicked', async () => {
      render(<ImportExport spots={mockSpots} onImport={mockOnImport} />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const file = new File(['{}'], 'test.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);
      });

      expect(screen.queryByText(/merge preview/i)).toBeNull();
      expect(mockOnImport).not.toHaveBeenCalled();
    });

    it('should show error message when validation fails', async () => {
      mockImportService.validateImportData.mockReturnValue({
        valid: false,
        errors: ['Invalid version'],
      });

      render(<ImportExport spots={mockSpots} onImport={mockOnImport} />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const file = new File(['{}'], 'test.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/invalid version/i)).toBeDefined();
      });

      expect(mockOnImport).not.toHaveBeenCalled();
    });

    it('should show error message when file parsing fails', async () => {
      mockImportService.parseImportFile.mockRejectedValue(new Error('Invalid JSON'));

      render(<ImportExport spots={mockSpots} onImport={mockOnImport} />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const file = new File(['invalid'], 'test.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/invalid json/i)).toBeDefined();
      });

      expect(mockOnImport).not.toHaveBeenCalled();
    });
  });
});
