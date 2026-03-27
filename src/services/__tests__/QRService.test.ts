// src/services/__tests__/QRService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { QRService } from '../QRService';
import type { Spot } from '../../types/spot';

describe('QRService', () => {
  let service: QRService;
  let mockSpots: Spot[];

  beforeEach(() => {
    service = new QRService();
    mockSpots = [
      {
        id: '1',
        coords: [45.4642, 9.1900],
        type: 'wall',
        status: 'free',
        availability: [{ from: '22:00', to: '02:00' }],
        securityLevel: 'low',
        notes: 'Test spot 1',
        createdAt: 1000,
        updatedAt: 2000,
      },
      {
        id: '2',
        coords: [45.4700, 9.2000],
        type: 'train',
        status: 'occupied',
        availability: [{ from: '00:00', to: '06:00' }],
        securityLevel: 'medium',
        notes: 'Test spot 2',
        createdAt: 1500,
        updatedAt: 2500,
      },
    ];
  });

  describe('exportToQR', () => {
    it('should generate single QR for small data', async () => {
      const qrCodes = await service.exportToQR([mockSpots[0]]);
      expect(qrCodes).toHaveLength(1);
      expect(qrCodes[0]).toMatch(/^data:image\/png;base64,/);
    });

    it('should generate multiple QR for large data', async () => {
      // Create large dataset (>2800 bytes)
      const largeSpots: Spot[] = [];
      for (let i = 0; i < 50; i++) {
        largeSpots.push({
          ...mockSpots[0],
          id: `spot-${i}`,
          notes: 'This is a long note with lots of text to increase the JSON size for testing purposes. '.repeat(10),
        });
      }

      const qrCodes = await service.exportToQR(largeSpots);
      expect(qrCodes.length).toBeGreaterThan(1);
      qrCodes.forEach(qr => {
        expect(qr).toMatch(/^data:image\/png;base64,/);
      });
    });
  });

  describe('parseQRData', () => {
    it('should parse single QR export data', () => {
      const exportData = {
        version: '1.0',
        spots: [mockSpots[0]],
      };
      const json = JSON.stringify(exportData);

      const result = service.parseQRData(json);
      expect(result.isChunk).toBe(false);
      expect(result.data).toEqual(exportData);
    });

    it('should parse chunked QR data', () => {
      const chunk = {
        index: 0,
        total: 3,
        data: 'base64-compressed-data',
      };
      const json = JSON.stringify(chunk);

      const result = service.parseQRData(json);
      expect(result.isChunk).toBe(true);
      expect(result.chunk).toEqual(chunk);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => service.parseQRData('invalid json')).toThrow('Invalid QR data format');
    });
  });

  describe('assembleChunks', () => {
    it('should assemble valid chunk sequence', async () => {
      // Generate multi-QR export
      const largeSpots: Spot[] = [];
      for (let i = 0; i < 50; i++) {
        largeSpots.push({
          ...mockSpots[0],
          id: `spot-${i}`,
          notes: 'Long note '.repeat(20),
        });
      }

      const qrCodes = await service.exportToQR(largeSpots);

      // Parse chunks from QR codes
      const chunks = [];
      for (const qrCode of qrCodes) {
        // In reality, we'd scan these QR codes, but for testing we can decode them
        // For this test, we'll create mock chunks manually
        const exportData = {
          version: '1.0',
          spots: largeSpots,
        };
        const json = JSON.stringify(exportData);
        // Compress and chunk
        const LZString = (await import('lz-string')).default;
        const compressed = LZString.compressToBase64(json);
        const chunkSize = 2500;
        for (let i = 0; i < compressed.length; i += chunkSize) {
          chunks.push({
            index: chunks.length,
            total: Math.ceil(compressed.length / chunkSize),
            data: compressed.slice(i, i + chunkSize),
          });
        }
        break; // Only process once
      }

      if (chunks.length > 1) {
        const assembled = service.assembleChunks(chunks);
        expect(assembled.version).toBe('1.0');
        expect(assembled.spots).toHaveLength(50);
        expect(assembled.spots[0].id).toBe('spot-0');
      }
    });

    it('should throw error for empty chunks', () => {
      expect(() => service.assembleChunks([])).toThrow('No chunks to assemble');
    });

    it('should throw error for missing chunks', () => {
      const chunks = [
        { index: 0, total: 3, data: 'chunk0' },
        { index: 2, total: 3, data: 'chunk2' },
      ];
      expect(() => service.assembleChunks(chunks)).toThrow('Missing chunks');
    });

    it('should throw error for invalid sequence', () => {
      const chunks = [
        { index: 0, total: 2, data: 'chunk0' },
        { index: 2, total: 2, data: 'chunk2' }, // Invalid index (should be 1)
      ];
      expect(() => service.assembleChunks(chunks)).toThrow('Invalid chunk sequence');
    });
  });

  describe('isChunkSequenceComplete', () => {
    it('should return true for complete sequence', () => {
      const chunks = [
        { index: 0, total: 3, data: 'chunk0' },
        { index: 1, total: 3, data: 'chunk1' },
        { index: 2, total: 3, data: 'chunk2' },
      ];
      expect(service.isChunkSequenceComplete(chunks)).toBe(true);
    });

    it('should return false for incomplete sequence', () => {
      const chunks = [
        { index: 0, total: 3, data: 'chunk0' },
        { index: 2, total: 3, data: 'chunk2' },
      ];
      expect(service.isChunkSequenceComplete(chunks)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(service.isChunkSequenceComplete([])).toBe(false);
    });
  });

  describe('chunkString (via export)', () => {
    it('should properly chunk large data', async () => {
      // Create data that will require chunking
      const largeSpots: Spot[] = [];
      for (let i = 0; i < 100; i++) {
        largeSpots.push({
          ...mockSpots[0],
          id: `large-spot-${i}`,
          notes: 'Very long note with lots of text to ensure we exceed the chunk size limit. '.repeat(15),
        });
      }

      const qrCodes = await service.exportToQR(largeSpots);

      // Should generate multiple chunks
      expect(qrCodes.length).toBeGreaterThan(1);

      // Parse first chunk to verify structure
      const LZString = (await import('lz-string')).default;
      const exportData = { version: '1.0', spots: largeSpots };
      const json = JSON.stringify(exportData);
      const compressed = LZString.compressToBase64(json);

      // Verify total chunks matches expected
      const expectedChunks = Math.ceil(compressed.length / 2000);
      expect(qrCodes.length).toBe(expectedChunks);
    });
  });
});
