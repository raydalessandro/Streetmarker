// src/services/__tests__/SpotService.pattern.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SpotService } from '../SpotService';
import type { Spot } from '../../types/spot';

describe('SpotService - Time Pattern Analysis', () => {
  let service: SpotService;

  beforeEach(() => {
    service = new SpotService();
  });

  describe('getBestTimeWindow', () => {
    it('should return null if less than 3 spots with availability', () => {
      const spot: Spot = {
        id: '1',
        coords: [45.4642, 9.1900],
        type: 'wall',
        status: 'free',
        availability: [{ from: '22:00', to: '02:00' }],
        securityLevel: 'low',
        notes: '',
        createdAt: 1000,
        updatedAt: 2000,
      };

      const nearbySpot: Spot = {
        ...spot,
        id: '2',
        coords: [45.4650, 9.1910], // ~1km away
      };

      const result = service.getBestTimeWindow(spot, [spot, nearbySpot]);
      expect(result).toBeNull(); // Only 2 spots total
    });

    it('should find overlap window for spots with same availability', () => {
      const baseSpot: Spot = {
        id: '1',
        coords: [45.4642, 9.1900],
        type: 'wall',
        status: 'free',
        availability: [{ from: '08:00', to: '18:00' }], // Daytime to avoid overnight complexity
        securityLevel: 'low',
        notes: '',
        createdAt: 1000,
        updatedAt: 2000,
      };

      const spots: Spot[] = [
        baseSpot,
        { ...baseSpot, id: '2', coords: [45.4650, 9.1910] },
        { ...baseSpot, id: '3', coords: [45.4660, 9.1920] },
        { ...baseSpot, id: '4', coords: [45.4670, 9.1930] },
        { ...baseSpot, id: '5', coords: [45.4680, 9.1940] },
      ];

      const result = service.getBestTimeWindow(baseSpot, spots);
      expect(result).not.toBeNull();
      expect(result?.from).toBe('08:00');
      expect(result?.to).toBe('18:00');
      expect(result?.spotCount).toBe(5);
    });

    it('should find partial overlap window', () => {
      const baseSpot: Spot = {
        id: '1',
        coords: [45.4642, 9.1900],
        type: 'wall',
        status: 'free',
        availability: [{ from: '22:00', to: '02:00' }],
        securityLevel: 'low',
        notes: '',
        createdAt: 1000,
        updatedAt: 2000,
      };

      const spots: Spot[] = [
        baseSpot,
        { ...baseSpot, id: '2', coords: [45.4650, 9.1910], availability: [{ from: '21:00', to: '01:00' }] },
        { ...baseSpot, id: '3', coords: [45.4660, 9.1920], availability: [{ from: '23:00', to: '03:00' }] },
        { ...baseSpot, id: '4', coords: [45.4670, 9.1930], availability: [{ from: '22:00', to: '02:00' }] },
        { ...baseSpot, id: '5', coords: [45.4680, 9.1940], availability: [{ from: '22:30', to: '01:30' }] },
      ];

      const result = service.getBestTimeWindow(baseSpot, spots);
      expect(result).not.toBeNull();
      // Should find the window with most overlaps (22:00-01:00 or similar)
      expect(result?.spotCount).toBeGreaterThanOrEqual(3);
    });

    it('should return null if window duration is less than 2 hours', () => {
      const baseSpot: Spot = {
        id: '1',
        coords: [45.4642, 9.1900],
        type: 'wall',
        status: 'free',
        availability: [{ from: '22:00', to: '23:00' }], // Only 1 hour
        securityLevel: 'low',
        notes: '',
        createdAt: 1000,
        updatedAt: 2000,
      };

      const spots: Spot[] = [
        baseSpot,
        { ...baseSpot, id: '2', coords: [45.4650, 9.1910] },
        { ...baseSpot, id: '3', coords: [45.4660, 9.1920] },
        { ...baseSpot, id: '4', coords: [45.4670, 9.1930] },
      ];

      const result = service.getBestTimeWindow(baseSpot, spots);
      expect(result).toBeNull(); // Window too short
    });

    it('should ignore spots of different types', () => {
      const wallSpot: Spot = {
        id: '1',
        coords: [45.4642, 9.1900],
        type: 'wall',
        status: 'free',
        availability: [{ from: '22:00', to: '02:00' }],
        securityLevel: 'low',
        notes: '',
        createdAt: 1000,
        updatedAt: 2000,
      };

      const spots: Spot[] = [
        wallSpot,
        { ...wallSpot, id: '2', coords: [45.4650, 9.1910] },
        { ...wallSpot, id: '3', coords: [45.4660, 9.1920], type: 'train' }, // Different type
        { ...wallSpot, id: '4', coords: [45.4670, 9.1930], type: 'sign' },  // Different type
      ];

      const result = service.getBestTimeWindow(wallSpot, spots);
      expect(result).toBeNull(); // Only 2 wall spots
    });

    it('should ignore spots beyond 1km radius', () => {
      const baseSpot: Spot = {
        id: '1',
        coords: [45.4642, 9.1900],
        type: 'wall',
        status: 'free',
        availability: [{ from: '22:00', to: '02:00' }],
        securityLevel: 'low',
        notes: '',
        createdAt: 1000,
        updatedAt: 2000,
      };

      const spots: Spot[] = [
        baseSpot,
        { ...baseSpot, id: '2', coords: [45.4650, 9.1910] },  // Within 1km
        { ...baseSpot, id: '3', coords: [45.5000, 9.2500] },  // Far away (>1km)
        { ...baseSpot, id: '4', coords: [45.3000, 9.1000] },  // Far away (>1km)
      ];

      const result = service.getBestTimeWindow(baseSpot, spots);
      expect(result).toBeNull(); // Only 2 spots within 1km
    });

    it('should ignore spots without availability data', () => {
      const baseSpot: Spot = {
        id: '1',
        coords: [45.4642, 9.1900],
        type: 'wall',
        status: 'free',
        availability: [{ from: '22:00', to: '02:00' }],
        securityLevel: 'low',
        notes: '',
        createdAt: 1000,
        updatedAt: 2000,
      };

      const spots: Spot[] = [
        baseSpot,
        { ...baseSpot, id: '2', coords: [45.4650, 9.1910] },
        { ...baseSpot, id: '3', coords: [45.4660, 9.1920], availability: [] }, // No availability
        { ...baseSpot, id: '4', coords: [45.4670, 9.1930], availability: [] }, // No availability
      ];

      const result = service.getBestTimeWindow(baseSpot, spots);
      expect(result).toBeNull(); // Only 2 spots with availability
    });

    it('should handle multiple availability ranges per spot', () => {
      const baseSpot: Spot = {
        id: '1',
        coords: [45.4642, 9.1900],
        type: 'wall',
        status: 'free',
        availability: [
          { from: '06:00', to: '10:00' },
          { from: '22:00', to: '02:00' }
        ],
        securityLevel: 'low',
        notes: '',
        createdAt: 1000,
        updatedAt: 2000,
      };

      const spots: Spot[] = [
        baseSpot,
        {
          ...baseSpot,
          id: '2',
          coords: [45.4650, 9.1910],
          availability: [
            { from: '07:00', to: '11:00' },
            { from: '21:00', to: '01:00' }
          ]
        },
        {
          ...baseSpot,
          id: '3',
          coords: [45.4660, 9.1920],
          availability: [
            { from: '08:00', to: '12:00' },
            { from: '23:00', to: '03:00' }
          ]
        },
      ];

      const result = service.getBestTimeWindow(baseSpot, spots);
      expect(result).not.toBeNull();
      // Should find either morning (08:00-10:00) or night (23:00-01:00) overlap
      expect(result?.spotCount).toBeGreaterThanOrEqual(3);
    });

    it('should calculate correct spot count in result', () => {
      const baseSpot: Spot = {
        id: '1',
        coords: [45.4642, 9.1900],
        type: 'wall',
        status: 'free',
        availability: [{ from: '22:00', to: '02:00' }],
        securityLevel: 'low',
        notes: '',
        createdAt: 1000,
        updatedAt: 2000,
      };

      const spots: Spot[] = [
        baseSpot,
        { ...baseSpot, id: '2', coords: [45.4650, 9.1910] },
        { ...baseSpot, id: '3', coords: [45.4660, 9.1920] },
        { ...baseSpot, id: '4', coords: [45.4670, 9.1930] },
        { ...baseSpot, id: '5', coords: [45.4680, 9.1940] },
      ];

      const result = service.getBestTimeWindow(baseSpot, spots);
      expect(result).not.toBeNull();
      expect(result?.spotCount).toBe(5); // All 5 spots overlap
    });
  });
});
