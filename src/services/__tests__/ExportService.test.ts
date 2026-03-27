import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportService } from '../ExportService';
import type { Spot } from '../../types/spot';

describe('ExportService', () => {
  let exportService: ExportService;

  beforeEach(() => {
    localStorage.clear();
    exportService = new ExportService();
  });

  describe('exportToJSON', () => {
    it('should create valid ExportData with all required fields', () => {
      const spots: Spot[] = [
        {
          id: 'test-id-1',
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

      const exportData = exportService.exportToJSON(spots);

      expect(exportData).toHaveProperty('version');
      expect(exportData.version).toBe('1.0.0');
      expect(exportData).toHaveProperty('exportedAt');
      expect(typeof exportData.exportedAt).toBe('number');
      expect(exportData).toHaveProperty('spots');
      expect(exportData.spots).toEqual(spots);
      expect(exportData).toHaveProperty('metadata');
      expect(exportData.metadata).toHaveProperty('appVersion');
      expect(exportData.metadata).toHaveProperty('deviceId');
    });

    it('should include current timestamp in exportedAt', () => {
      const before = Date.now();
      const exportData = exportService.exportToJSON([]);
      const after = Date.now();

      expect(exportData.exportedAt).toBeGreaterThanOrEqual(before);
      expect(exportData.exportedAt).toBeLessThanOrEqual(after);
    });

    it('should handle empty spots array', () => {
      const exportData = exportService.exportToJSON([]);

      expect(exportData.spots).toEqual([]);
      expect(exportData.version).toBe('1.0.0');
      expect(exportData.metadata.deviceId).toBeTruthy();
    });

    it('should persist deviceId in localStorage', () => {
      const exportData1 = exportService.exportToJSON([]);
      const deviceId1 = exportData1.metadata.deviceId;

      expect(localStorage.getItem('streetmark-device-id')).toBe(deviceId1);

      const exportService2 = new ExportService();
      const exportData2 = exportService2.exportToJSON([]);
      const deviceId2 = exportData2.metadata.deviceId;

      expect(deviceId2).toBe(deviceId1);
    });

    it('should generate UUID v4 for deviceId', () => {
      const exportData = exportService.exportToJSON([]);
      const deviceId = exportData.metadata.deviceId;

      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(deviceId).toMatch(uuidV4Regex);
    });

    it('should include appVersion in metadata', () => {
      const exportData = exportService.exportToJSON([]);
      expect(exportData.metadata.appVersion).toBe('1.0.0');
    });
  });

  describe('downloadJSON', () => {
    it('should create blob with correct JSON data', () => {
      const mockExportData = {
        version: '1.0.0',
        exportedAt: Date.now(),
        spots: [],
        metadata: {
          appVersion: '1.0.0',
          deviceId: 'test-device-id',
        },
      };

      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      const anchorElement = document.createElement('a');
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchorElement);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchorElement);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => anchorElement);

      let clickCalled = false;
      anchorElement.click = () => {
        clickCalled = true;
      };

      exportService.downloadJSON(mockExportData, 'test-export.json');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(anchorElement.href).toBe('blob:test-url');
      expect(anchorElement.download).toBe('test-export.json');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickCalled).toBe(true);
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url');

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should use correct filename format for current timestamp', () => {
      const now = new Date('2026-03-26T14:30:45');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const mockExportData = {
        version: '1.0.0',
        exportedAt: now.getTime(),
        spots: [],
        metadata: {
          appVersion: '1.0.0',
          deviceId: 'test-device-id',
        },
      };

      const anchorElement = document.createElement('a');
      vi.spyOn(document, 'createElement').mockReturnValue(anchorElement);
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchorElement);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => anchorElement);
      anchorElement.click = vi.fn();

      const filename = exportService.generateFilename();
      expect(filename).toBe('streetmark-export-2026-03-26-143045.json');

      vi.useRealTimers();
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with correct date format', () => {
      const now = new Date('2026-03-26T09:05:03');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const filename = exportService.generateFilename();
      expect(filename).toBe('streetmark-export-2026-03-26-090503.json');

      vi.useRealTimers();
    });

    it('should pad single-digit values with zeros', () => {
      const now = new Date('2026-01-05T03:02:01');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const filename = exportService.generateFilename();
      expect(filename).toBe('streetmark-export-2026-01-05-030201.json');

      vi.useRealTimers();
    });
  });
});
