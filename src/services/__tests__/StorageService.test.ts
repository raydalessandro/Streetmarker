import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageService } from '../StorageService';
import type { Spot } from '../../types/spot';

// Mock IndexedDB using fake-indexeddb
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

describe('StorageService', () => {
  let service: StorageService;

  const mockSpot: Spot = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    coords: [45.4642, 9.1900],
    type: 'wall',
    status: 'free',
    availability: [{ from: '08:00', to: '22:00' }],
    securityLevel: 'low',
    notes: 'Test spot near Duomo',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const mockSpot2: Spot = {
    id: '223e4567-e89b-12d3-a456-426614174001',
    coords: [45.4700, 9.2000],
    type: 'train',
    status: 'occupied',
    availability: [{ from: '20:00', to: '04:00' }],
    securityLevel: 'high',
    owner: 'TestCrew',
    notes: 'Train yard spot',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  beforeEach(async () => {
    // Reset IndexedDB before each test
    globalThis.indexedDB = new IDBFactory();
    service = new StorageService();
    await service.init();
  });

  afterEach(async () => {
    // Clean up after each test
    await service.clearAllSpots();
  });

  describe('init', () => {
    it('should initialize database successfully', async () => {
      const newService = new StorageService();
      await expect(newService.init()).resolves.not.toThrow();
    });
  });

  describe('addSpot', () => {
    it('should add a spot successfully', async () => {
      await service.addSpot(mockSpot);
      const retrieved = await service.getSpot(mockSpot.id);
      expect(retrieved).toEqual(mockSpot);
    });

    it('should throw error when adding duplicate spot', async () => {
      await service.addSpot(mockSpot);
      await expect(service.addSpot(mockSpot)).rejects.toThrow();
    });
  });

  describe('getSpot', () => {
    it('should retrieve existing spot by id', async () => {
      await service.addSpot(mockSpot);
      const retrieved = await service.getSpot(mockSpot.id);
      expect(retrieved).toEqual(mockSpot);
    });

    it('should return null for non-existent spot', async () => {
      const retrieved = await service.getSpot('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('getAllSpots', () => {
    it('should return empty array when no spots exist', async () => {
      const spots = await service.getAllSpots();
      expect(spots).toEqual([]);
    });

    it('should return all stored spots', async () => {
      await service.addSpot(mockSpot);
      await service.addSpot(mockSpot2);

      const spots = await service.getAllSpots();
      expect(spots).toHaveLength(2);
      expect(spots).toContainEqual(mockSpot);
      expect(spots).toContainEqual(mockSpot2);
    });
  });

  describe('updateSpot', () => {
    it('should update existing spot', async () => {
      await service.addSpot(mockSpot);

      const updatedSpot = {
        ...mockSpot,
        notes: 'Updated notes',
        updatedAt: Date.now()
      };

      await service.updateSpot(updatedSpot);
      const retrieved = await service.getSpot(mockSpot.id);
      expect(retrieved?.notes).toBe('Updated notes');
    });

    it('should throw error when updating non-existent spot', async () => {
      await expect(service.updateSpot(mockSpot)).rejects.toThrow();
    });
  });

  describe('deleteSpot', () => {
    it('should delete existing spot', async () => {
      await service.addSpot(mockSpot);
      await service.deleteSpot(mockSpot.id);

      const retrieved = await service.getSpot(mockSpot.id);
      expect(retrieved).toBeNull();
    });

    it('should not throw when deleting non-existent spot', async () => {
      await expect(service.deleteSpot('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('clearAllSpots', () => {
    it('should clear all spots', async () => {
      await service.addSpot(mockSpot);
      await service.addSpot(mockSpot2);

      await service.clearAllSpots();

      const spots = await service.getAllSpots();
      expect(spots).toEqual([]);
    });
  });

  describe('bulkAddSpots', () => {
    it('should add multiple spots at once', async () => {
      const spots = [mockSpot, mockSpot2];
      await service.bulkAddSpots(spots);

      const allSpots = await service.getAllSpots();
      expect(allSpots).toHaveLength(2);
      expect(allSpots).toContainEqual(mockSpot);
      expect(allSpots).toContainEqual(mockSpot2);
    });

    it('should handle empty array', async () => {
      await expect(service.bulkAddSpots([])).resolves.not.toThrow();
      const spots = await service.getAllSpots();
      expect(spots).toEqual([]);
    });

    it('should rollback on error if any spot fails', async () => {
      await service.addSpot(mockSpot); // Pre-add one spot

      // Try to bulk add including the duplicate
      await expect(service.bulkAddSpots([mockSpot, mockSpot2])).rejects.toThrow();

      // Original spot should still exist, but mockSpot2 should not be added
      const spots = await service.getAllSpots();
      expect(spots).toHaveLength(1);
      expect(spots[0]).toEqual(mockSpot);
    });
  });
});
