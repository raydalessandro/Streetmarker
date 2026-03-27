// Unit tests for GalleryService - TDD RED phase
import { describe, it, expect, beforeEach } from 'vitest';
import { GalleryService } from '../GalleryService';
import type { Spot } from '../../types/spot';

describe('GalleryService', () => {
  let service: GalleryService;
  let mockSpots: Spot[];

  beforeEach(() => {
    service = new GalleryService();

    // Mock spot data
    mockSpots = [
      {
        id: 'spot-1',
        coords: [45.4642, 9.19],
        type: 'wall',
        status: 'free',
        availability: [],
        securityLevel: 'low',
        notes: 'Favorite spot 1',
        isFavorite: true,
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 1000,
      },
      {
        id: 'spot-2',
        coords: [45.465, 9.191],
        type: 'train',
        status: 'occupied',
        availability: [],
        securityLevel: 'medium',
        notes: 'Regular spot 2',
        isFavorite: false,
        createdAt: Date.now() - 2000,
        updatedAt: Date.now() - 2000,
      },
      {
        id: 'spot-3',
        coords: [45.466, 9.192],
        type: 'sign',
        status: 'free',
        availability: [],
        securityLevel: 'high',
        notes: 'Regular spot 3',
        // No isFavorite field (undefined)
        createdAt: Date.now() - 3000,
        updatedAt: Date.now() - 3000,
      },
      {
        id: 'spot-4',
        coords: [45.467, 9.193],
        type: 'wall',
        status: 'protected',
        availability: [],
        securityLevel: 'low',
        notes: 'Favorite spot 4',
        isFavorite: true,
        createdAt: Date.now() - 4000,
        updatedAt: Date.now() - 4000,
      },
    ];
  });

  describe('getFavoriteSpots', () => {
    it('should return only spots marked as favorite', () => {
      const favorites = service.getFavoriteSpots(mockSpots);

      expect(favorites).toHaveLength(2);
      expect(favorites[0].id).toBe('spot-1');
      expect(favorites[1].id).toBe('spot-4');
      expect(favorites.every(spot => spot.isFavorite === true)).toBe(true);
    });

    it('should return empty array when no favorites', () => {
      const spotsWithoutFavorites: Spot[] = [
        { ...mockSpots[1], isFavorite: false },
        { ...mockSpots[2], isFavorite: false },
      ];

      const favorites = service.getFavoriteSpots(spotsWithoutFavorites);

      expect(favorites).toHaveLength(0);
    });

    it('should handle empty spots array', () => {
      const favorites = service.getFavoriteSpots([]);

      expect(favorites).toHaveLength(0);
    });

    it('should exclude spots with isFavorite=false', () => {
      const favorites = service.getFavoriteSpots(mockSpots);

      const hasSpot2 = favorites.some(spot => spot.id === 'spot-2');
      expect(hasSpot2).toBe(false);
    });

    it('should exclude spots with undefined isFavorite', () => {
      const favorites = service.getFavoriteSpots(mockSpots);

      const hasSpot3 = favorites.some(spot => spot.id === 'spot-3');
      expect(hasSpot3).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite from false to true', () => {
      const spot = mockSpots[1]; // isFavorite: false

      const updated = service.toggleFavorite(spot);

      expect(updated.isFavorite).toBe(true);
      expect(updated.id).toBe(spot.id);
      expect(updated.coords).toEqual(spot.coords);
    });

    it('should toggle favorite from true to false', () => {
      const spot = mockSpots[0]; // isFavorite: true

      const updated = service.toggleFavorite(spot);

      expect(updated.isFavorite).toBe(false);
      expect(updated.id).toBe(spot.id);
    });

    it('should toggle undefined isFavorite to true', () => {
      const spot = mockSpots[2]; // isFavorite: undefined

      const updated = service.toggleFavorite(spot);

      expect(updated.isFavorite).toBe(true);
    });

    it('should update updatedAt timestamp', () => {
      const spot = mockSpots[0];
      const beforeToggle = spot.updatedAt;

      // Wait a tiny bit to ensure timestamp difference
      const updated = service.toggleFavorite(spot);

      expect(updated.updatedAt).toBeGreaterThanOrEqual(beforeToggle);
    });

    it('should not mutate original spot', () => {
      const spot = mockSpots[0];
      const originalFavorite = spot.isFavorite;

      service.toggleFavorite(spot);

      expect(spot.isFavorite).toBe(originalFavorite); // Original unchanged
    });

    it('should preserve all other spot properties', () => {
      const spot = mockSpots[0];

      const updated = service.toggleFavorite(spot);

      expect(updated.id).toBe(spot.id);
      expect(updated.coords).toEqual(spot.coords);
      expect(updated.type).toBe(spot.type);
      expect(updated.status).toBe(spot.status);
      expect(updated.securityLevel).toBe(spot.securityLevel);
      expect(updated.notes).toBe(spot.notes);
      expect(updated.createdAt).toBe(spot.createdAt);
    });
  });

  describe('setFavorite', () => {
    it('should set favorite to true', () => {
      const spot = mockSpots[1]; // isFavorite: false

      const updated = service.setFavorite(spot, true);

      expect(updated.isFavorite).toBe(true);
      expect(updated.updatedAt).toBeGreaterThanOrEqual(spot.updatedAt);
    });

    it('should set favorite to false', () => {
      const spot = mockSpots[0]; // isFavorite: true

      const updated = service.setFavorite(spot, false);

      expect(updated.isFavorite).toBe(false);
    });

    it('should not mutate original spot', () => {
      const spot = mockSpots[0];
      const originalFavorite = spot.isFavorite;

      service.setFavorite(spot, false);

      expect(spot.isFavorite).toBe(originalFavorite);
    });
  });

  describe('isFavorite', () => {
    it('should return true for favorite spot', () => {
      const spot = mockSpots[0]; // isFavorite: true

      const result = service.isFavorite(spot);

      expect(result).toBe(true);
    });

    it('should return false for non-favorite spot', () => {
      const spot = mockSpots[1]; // isFavorite: false

      const result = service.isFavorite(spot);

      expect(result).toBe(false);
    });

    it('should return false for undefined isFavorite', () => {
      const spot = mockSpots[2]; // isFavorite: undefined

      const result = service.isFavorite(spot);

      expect(result).toBe(false);
    });
  });

  describe('sortFavoritesByRecent', () => {
    it('should sort favorites by updatedAt descending (newest first)', () => {
      const favorites = service.getFavoriteSpots(mockSpots);

      const sorted = service.sortFavoritesByRecent(favorites);

      // spot-1 (updatedAt: now - 1000) should be first
      // spot-4 (updatedAt: now - 4000) should be second
      expect(sorted[0].id).toBe('spot-1');
      expect(sorted[1].id).toBe('spot-4');
    });

    it('should not mutate original array', () => {
      const favorites = service.getFavoriteSpots(mockSpots);
      const originalOrder = favorites.map(s => s.id);

      service.sortFavoritesByRecent(favorites);

      const currentOrder = favorites.map(s => s.id);
      expect(currentOrder).toEqual(originalOrder); // Original unchanged
    });

    it('should handle empty array', () => {
      const sorted = service.sortFavoritesByRecent([]);

      expect(sorted).toHaveLength(0);
    });
  });
});
