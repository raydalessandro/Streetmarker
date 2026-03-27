import { describe, it, expect, beforeEach } from 'vitest';
import { ImportService } from '../ImportService';
import type { Spot, ExportData } from '../../types/spot';

describe('ImportService', () => {
  let importService: ImportService;

  beforeEach(() => {
    importService = new ImportService();
  });

  describe('validateImportData', () => {
    const validExportData: ExportData = {
      version: '1.0.0',
      exportedAt: Date.now(),
      spots: [
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
      ],
      metadata: {
        appVersion: '1.0.0',
        deviceId: 'test-device-id',
      },
    };

    it('should validate correct ExportData', () => {
      const result = importService.validateImportData(validExportData);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject data without version', () => {
      const invalidData = { ...validExportData };
      delete (invalidData as any).version;

      const result = importService.validateImportData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: version');
    });

    it('should reject data without exportedAt', () => {
      const invalidData = { ...validExportData };
      delete (invalidData as any).exportedAt;

      const result = importService.validateImportData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: exportedAt');
    });

    it('should reject data without spots', () => {
      const invalidData = { ...validExportData };
      delete (invalidData as any).spots;

      const result = importService.validateImportData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: spots');
    });

    it('should reject data without metadata', () => {
      const invalidData = { ...validExportData };
      delete (invalidData as any).metadata;

      const result = importService.validateImportData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: metadata');
    });

    it('should reject data with spots not being an array', () => {
      const invalidData = { ...validExportData, spots: 'not-an-array' };

      const result = importService.validateImportData(invalidData as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('spots must be an array');
    });

    it('should reject incompatible version (2.x.x)', () => {
      const invalidData = { ...validExportData, version: '2.0.0' };

      const result = importService.validateImportData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Incompatible version: 2.0.0 (only 1.x.x supported)');
    });

    it('should accept compatible version (1.x.x)', () => {
      const data1 = { ...validExportData, version: '1.0.0' };
      const data2 = { ...validExportData, version: '1.5.3' };
      const data3 = { ...validExportData, version: '1.99.99' };

      expect(importService.validateImportData(data1).valid).toBe(true);
      expect(importService.validateImportData(data2).valid).toBe(true);
      expect(importService.validateImportData(data3).valid).toBe(true);
    });

    it('should reject malformed version', () => {
      const invalidData = { ...validExportData, version: 'invalid-version' };

      const result = importService.validateImportData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid version format: invalid-version');
    });

    it('should reject invalid spot data', () => {
      const invalidSpot = {
        id: 'test-id',
        // Missing required fields
      };

      const invalidData = {
        ...validExportData,
        spots: [invalidSpot],
      };

      const result = importService.validateImportData(invalidData as any);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate all spots and collect multiple errors', () => {
      const invalidData = {
        ...validExportData,
        spots: [
          { id: 'test-1' }, // Missing fields
          { id: 'test-2' }, // Missing fields
        ],
      };

      const result = importService.validateImportData(invalidData as any);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('parseImportFile', () => {
    it('should parse valid JSON file', async () => {
      const exportData: ExportData = {
        version: '1.0.0',
        exportedAt: Date.now(),
        spots: [],
        metadata: {
          appVersion: '1.0.0',
          deviceId: 'test-device-id',
        },
      };

      const jsonString = JSON.stringify(exportData);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], 'test-export.json', { type: 'application/json' });

      const result = await importService.parseImportFile(file);

      expect(result).toEqual(exportData);
    });

    it('should reject invalid JSON', async () => {
      const invalidJson = '{ invalid json }';
      const blob = new Blob([invalidJson], { type: 'application/json' });
      const file = new File([blob], 'test-export.json', { type: 'application/json' });

      await expect(importService.parseImportFile(file)).rejects.toThrow('Invalid JSON file');
    });

    it('should reject empty file', async () => {
      const blob = new Blob([''], { type: 'application/json' });
      const file = new File([blob], 'test-export.json', { type: 'application/json' });

      await expect(importService.parseImportFile(file)).rejects.toThrow();
    });
  });

  describe('mergeSpots', () => {
    const baseTime = Date.now();

    const existingSpot1: Spot = {
      id: 'spot-1',
      coords: [45.4642, 9.1900],
      type: 'wall',
      status: 'free',
      availability: [{ from: '08:00', to: '18:00' }],
      securityLevel: 'low',
      notes: 'Existing spot 1',
      createdAt: baseTime - 10000,
      updatedAt: baseTime,
    };

    const existingSpot2: Spot = {
      id: 'spot-2',
      coords: [45.4700, 9.2000],
      type: 'train',
      status: 'occupied',
      availability: [],
      securityLevel: 'high',
      notes: 'Existing spot 2',
      createdAt: baseTime - 5000,
      updatedAt: baseTime,
    };

    it('should add new spots that do not exist', () => {
      const existing: Spot[] = [existingSpot1];
      const imported: Spot[] = [
        {
          id: 'new-spot-1',
          coords: [45.5000, 9.2500],
          type: 'sign',
          status: 'free',
          availability: [],
          securityLevel: 'medium',
          notes: 'New spot',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
      ];

      const result = importService.mergeSpots(existing, imported);

      expect(result.added.length).toBe(1);
      expect(result.added[0].id).toBe('new-spot-1');
      expect(result.updated.length).toBe(0);
      expect(result.conflicts.length).toBe(0);
    });

    it('should update existing spots with newer timestamps', () => {
      const existing: Spot[] = [existingSpot1];
      const imported: Spot[] = [
        {
          ...existingSpot1,
          notes: 'Updated notes',
          updatedAt: baseTime + 5000, // Newer
        },
      ];

      const result = importService.mergeSpots(existing, imported);

      expect(result.added.length).toBe(0);
      expect(result.updated.length).toBe(1);
      expect(result.updated[0].notes).toBe('Updated notes');
      expect(result.conflicts.length).toBe(0);
    });

    it('should flag conflicts for older timestamps', () => {
      const existing: Spot[] = [existingSpot1];
      const imported: Spot[] = [
        {
          ...existingSpot1,
          notes: 'Older notes',
          updatedAt: baseTime - 5000, // Older
        },
      ];

      const result = importService.mergeSpots(existing, imported);

      expect(result.added.length).toBe(0);
      expect(result.updated.length).toBe(0);
      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0].id).toBe('spot-1');
    });

    it('should handle mixed scenario correctly', () => {
      const existing: Spot[] = [existingSpot1, existingSpot2];
      const imported: Spot[] = [
        // New spot
        {
          id: 'new-spot-1',
          coords: [45.5000, 9.2500],
          type: 'sign',
          status: 'free',
          availability: [],
          securityLevel: 'medium',
          notes: 'New spot',
          createdAt: baseTime,
          updatedAt: baseTime,
        },
        // Updated spot (newer)
        {
          ...existingSpot1,
          notes: 'Updated spot 1',
          updatedAt: baseTime + 5000,
        },
        // Conflict spot (older)
        {
          ...existingSpot2,
          notes: 'Older spot 2',
          updatedAt: baseTime - 2000,
        },
      ];

      const result = importService.mergeSpots(existing, imported);

      expect(result.added.length).toBe(1);
      expect(result.added[0].id).toBe('new-spot-1');
      expect(result.updated.length).toBe(1);
      expect(result.updated[0].id).toBe('spot-1');
      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0].id).toBe('spot-2');
    });

    it('should handle empty existing array', () => {
      const existing: Spot[] = [];
      const imported: Spot[] = [existingSpot1, existingSpot2];

      const result = importService.mergeSpots(existing, imported);

      expect(result.added.length).toBe(2);
      expect(result.updated.length).toBe(0);
      expect(result.conflicts.length).toBe(0);
    });

    it('should handle empty imported array', () => {
      const existing: Spot[] = [existingSpot1, existingSpot2];
      const imported: Spot[] = [];

      const result = importService.mergeSpots(existing, imported);

      expect(result.added.length).toBe(0);
      expect(result.updated.length).toBe(0);
      expect(result.conflicts.length).toBe(0);
    });

    it('should update spot with same timestamp (edge case)', () => {
      const existing: Spot[] = [existingSpot1];
      const imported: Spot[] = [
        {
          ...existingSpot1,
          notes: 'Same timestamp notes',
          updatedAt: baseTime, // Same time
        },
      ];

      const result = importService.mergeSpots(existing, imported);

      expect(result.added.length).toBe(0);
      expect(result.updated.length).toBe(0);
      expect(result.conflicts.length).toBe(1); // Treat same timestamp as conflict
    });
  });
});
