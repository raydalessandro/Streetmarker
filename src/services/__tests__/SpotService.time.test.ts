// src/services/__tests__/SpotService.time.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SpotService } from '../SpotService';
import type { Spot } from '../../types/spot';

describe('SpotService - Time Filtering', () => {
  let service: SpotService;

  beforeEach(() => {
    service = new SpotService();
  });

  describe('isSpotAvailableNow', () => {
    const createTestSpot = (availability: { from: string; to: string }[]): Spot => ({
      id: '1',
      coords: [45.4642, 9.19],
      type: 'wall',
      status: 'free',
      availability,
      securityLevel: 'low',
      notes: 'Test spot',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    describe('Simple ranges (same day)', () => {
      it('should match when current time is within simple range', () => {
        const spot = createTestSpot([{ from: '14:00', to: '18:00' }]);
        const currentTime = new Date('2024-01-01T15:00:00'); // 15:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(true);
      });

      it('should not match when current time is before simple range', () => {
        const spot = createTestSpot([{ from: '14:00', to: '18:00' }]);
        const currentTime = new Date('2024-01-01T12:00:00'); // 12:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(false);
      });

      it('should not match when current time is after simple range', () => {
        const spot = createTestSpot([{ from: '14:00', to: '18:00' }]);
        const currentTime = new Date('2024-01-01T20:00:00'); // 20:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(false);
      });

      it('should match at exact start boundary', () => {
        const spot = createTestSpot([{ from: '14:00', to: '18:00' }]);
        const currentTime = new Date('2024-01-01T14:00:00'); // 14:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(true);
      });

      it('should match at exact end boundary', () => {
        const spot = createTestSpot([{ from: '14:00', to: '18:00' }]);
        const currentTime = new Date('2024-01-01T18:00:00'); // 18:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(true);
      });
    });

    describe('Overnight ranges (spans midnight)', () => {
      it('should match when current time is in evening of overnight range', () => {
        const spot = createTestSpot([{ from: '22:00', to: '06:00' }]);
        const currentTime = new Date('2024-01-01T23:30:00'); // 23:30

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(true);
      });

      it('should match when current time is in early morning of overnight range', () => {
        const spot = createTestSpot([{ from: '22:00', to: '06:00' }]);
        const currentTime = new Date('2024-01-01T02:00:00'); // 02:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(true);
      });

      it('should not match when current time is in middle of day for overnight range', () => {
        const spot = createTestSpot([{ from: '22:00', to: '06:00' }]);
        const currentTime = new Date('2024-01-01T14:00:00'); // 14:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(false);
      });

      it('should match at overnight range start boundary', () => {
        const spot = createTestSpot([{ from: '22:00', to: '06:00' }]);
        const currentTime = new Date('2024-01-01T22:00:00'); // 22:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(true);
      });

      it('should match at overnight range end boundary', () => {
        const spot = createTestSpot([{ from: '22:00', to: '06:00' }]);
        const currentTime = new Date('2024-01-01T06:00:00'); // 06:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(true);
      });
    });

    describe('Multiple availability ranges', () => {
      it('should match when current time is in first range', () => {
        const spot = createTestSpot([
          { from: '08:00', to: '10:00' },
          { from: '20:00', to: '23:00' },
        ]);
        const currentTime = new Date('2024-01-01T09:00:00'); // 09:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(true);
      });

      it('should match when current time is in second range', () => {
        const spot = createTestSpot([
          { from: '08:00', to: '10:00' },
          { from: '20:00', to: '23:00' },
        ]);
        const currentTime = new Date('2024-01-01T21:00:00'); // 21:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(true);
      });

      it('should not match when current time is between ranges', () => {
        const spot = createTestSpot([
          { from: '08:00', to: '10:00' },
          { from: '20:00', to: '23:00' },
        ]);
        const currentTime = new Date('2024-01-01T15:00:00'); // 15:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(false);
      });

      it('should handle mix of simple and overnight ranges', () => {
        const spot = createTestSpot([
          { from: '08:00', to: '10:00' }, // Simple morning range
          { from: '22:00', to: '02:00' }, // Overnight range
        ]);
        const currentTime = new Date('2024-01-01T23:00:00'); // 23:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(true);
      });
    });

    describe('Edge cases', () => {
      it('should not match when spot has empty availability array', () => {
        const spot = createTestSpot([]);
        const currentTime = new Date('2024-01-01T15:00:00'); // 15:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(false);
      });

      it('should handle midnight (00:00) in overnight range', () => {
        const spot = createTestSpot([{ from: '22:00', to: '06:00' }]);
        const currentTime = new Date('2024-01-01T00:00:00'); // 00:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(true);
      });

      it('should handle midnight (00:00) as range boundary', () => {
        const spot = createTestSpot([{ from: '20:00', to: '00:00' }]);
        const currentTime = new Date('2024-01-01T00:00:00'); // 00:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(true);
      });

      it('should use current Date.now() when no currentTime provided', () => {
        const spot = createTestSpot([{ from: '00:00', to: '23:59' }]); // Always available

        const result = service.isSpotAvailableNow(spot);

        // Should use real time and match 24h range
        expect(result).toBe(true);
      });

      it('should handle single-minute ranges', () => {
        const spot = createTestSpot([{ from: '15:00', to: '15:01' }]);
        const currentTime = new Date('2024-01-01T15:00:00'); // 15:00

        const result = service.isSpotAvailableNow(spot, currentTime);

        expect(result).toBe(true);
      });
    });
  });

  describe('filterSpots with availableNow', () => {
    const spots: Spot[] = [
      {
        id: '1',
        coords: [45.4642, 9.19],
        type: 'wall',
        status: 'free',
        availability: [{ from: '08:00', to: '18:00' }], // Day spot
        securityLevel: 'low',
        notes: 'Day spot',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '2',
        coords: [45.4642, 9.19],
        type: 'train',
        status: 'free',
        availability: [{ from: '22:00', to: '06:00' }], // Night spot
        securityLevel: 'high',
        notes: 'Night spot',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '3',
        coords: [45.4642, 9.19],
        type: 'sign',
        status: 'free',
        availability: [], // Never available
        securityLevel: 'medium',
        notes: 'No availability',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '4',
        coords: [45.4642, 9.19],
        type: 'other',
        status: 'free',
        availability: [
          { from: '08:00', to: '10:00' },
          { from: '20:00', to: '23:00' },
        ], // Multiple ranges
        securityLevel: 'low',
        notes: 'Multiple ranges',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    it('should return all spots when availableNow is not set', () => {
      const result = service.filterSpots(spots, {});

      expect(result).toHaveLength(4);
    });

    it('should return all spots when availableNow is false', () => {
      const result = service.filterSpots(spots, { availableNow: false });

      expect(result).toHaveLength(4);
    });

    it('should filter spots available during daytime', () => {
      const currentTime = new Date('2024-01-01T15:00:00'); // 15:00
      const result = service.filterSpots(spots, { availableNow: true }, currentTime);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1'); // Day spot
    });

    it('should filter spots available during nighttime', () => {
      const currentTime = new Date('2024-01-01T23:00:00'); // 23:00
      const result = service.filterSpots(spots, { availableNow: true }, currentTime);

      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toContain('2'); // Night spot
      expect(result.map((s) => s.id)).toContain('4'); // Multiple ranges spot
    });

    it('should filter spots available early morning (overnight range)', () => {
      const currentTime = new Date('2024-01-01T03:00:00'); // 03:00
      const result = service.filterSpots(spots, { availableNow: true }, currentTime);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2'); // Night spot
    });

    it('should combine availableNow with other filters', () => {
      const currentTime = new Date('2024-01-01T23:00:00'); // 23:00
      const result = service.filterSpots(
        spots,
        {
          availableNow: true,
          type: ['train'],
        },
        currentTime
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
      expect(result[0].type).toBe('train');
    });

    it('should return empty array when no spots available at current time', () => {
      const currentTime = new Date('2024-01-01T19:00:00'); // 19:00 (between ranges, no spots available)
      const result = service.filterSpots(spots, { availableNow: true }, currentTime);

      expect(result).toHaveLength(0);
    });

    it('should work with all filters combined', () => {
      const currentTime = new Date('2024-01-01T15:00:00'); // 15:00
      const result = service.filterSpots(
        spots,
        {
          availableNow: true,
          type: ['wall'],
          status: ['free'],
          securityLevel: ['low'],
        },
        currentTime
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });
});
