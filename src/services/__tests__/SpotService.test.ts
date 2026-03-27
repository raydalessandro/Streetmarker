// src/services/__tests__/SpotService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SpotService } from '../SpotService';
import type { Spot, SpotType, SpotStatus, SecurityLevel } from '../../types/spot';

describe('SpotService', () => {
  let service: SpotService;

  beforeEach(() => {
    service = new SpotService();
  });

  describe('createSpot', () => {
    it('should create a spot with valid id', () => {
      const spotData = {
        coords: [45.4642, 9.19] as [number, number],
        type: 'wall' as SpotType,
        status: 'free' as SpotStatus,
        availability: [{ from: '09:00', to: '18:00' }],
        securityLevel: 'medium' as SecurityLevel,
        notes: 'Test spot',
      };

      const spot = service.createSpot(spotData);

      expect(spot.id).toBeDefined();
      expect(spot.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should create a spot with timestamps', () => {
      const spotData = {
        coords: [45.4642, 9.19] as [number, number],
        type: 'wall' as SpotType,
        status: 'free' as SpotStatus,
        availability: [],
        securityLevel: 'low' as SecurityLevel,
        notes: 'Test spot',
      };

      const before = Date.now();
      const spot = service.createSpot(spotData);
      const after = Date.now();

      expect(spot.createdAt).toBeGreaterThanOrEqual(before);
      expect(spot.createdAt).toBeLessThanOrEqual(after);
      expect(spot.updatedAt).toEqual(spot.createdAt);
    });

    it('should preserve all provided data', () => {
      const spotData = {
        coords: [45.4642, 9.19] as [number, number],
        type: 'train' as SpotType,
        status: 'occupied' as SpotStatus,
        availability: [{ from: '22:00', to: '06:00' }],
        securityLevel: 'high' as SecurityLevel,
        owner: 'TestCrew',
        notes: 'Near the station',
        photos: ['data:image/png;base64,test'],
      };

      const spot = service.createSpot(spotData);

      expect(spot.coords).toEqual(spotData.coords);
      expect(spot.type).toBe(spotData.type);
      expect(spot.status).toBe(spotData.status);
      expect(spot.availability).toEqual(spotData.availability);
      expect(spot.securityLevel).toBe(spotData.securityLevel);
      expect(spot.owner).toBe(spotData.owner);
      expect(spot.notes).toBe(spotData.notes);
      expect(spot.photos).toEqual(spotData.photos);
    });
  });

  describe('validateSpot', () => {
    it('should validate a valid spot', () => {
      const validSpot: Partial<Spot> = {
        coords: [45.4642, 9.19],
        type: 'wall',
        status: 'free',
        availability: [{ from: '09:00', to: '18:00' }],
        securityLevel: 'medium',
        notes: 'Valid spot',
      };

      const result = service.validateSpot(validSpot);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid coordinates', () => {
      const invalidSpot: Partial<Spot> = {
        coords: [100, 200],
        type: 'wall',
        status: 'free',
        availability: [],
        securityLevel: 'low',
        notes: 'Invalid coords',
      };

      const result = service.validateSpot(invalidSpot);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid coordinates');
    });

    it('should reject missing coordinates', () => {
      const invalidSpot: Partial<Spot> = {
        type: 'wall',
        status: 'free',
        availability: [],
        securityLevel: 'low',
        notes: 'No coords',
      };

      const result = service.validateSpot(invalidSpot);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid coordinates');
    });

    it('should reject invalid type', () => {
      const invalidSpot: any = {
        coords: [45.4642, 9.19],
        type: 'invalid_type',
        status: 'free',
        availability: [],
        securityLevel: 'low',
        notes: 'Invalid type',
      };

      const result = service.validateSpot(invalidSpot);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid type');
    });

    it('should reject invalid status', () => {
      const invalidSpot: any = {
        coords: [45.4642, 9.19],
        type: 'wall',
        status: 'invalid_status',
        availability: [],
        securityLevel: 'low',
        notes: 'Invalid status',
      };

      const result = service.validateSpot(invalidSpot);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid status');
    });

    it('should reject invalid security level', () => {
      const invalidSpot: any = {
        coords: [45.4642, 9.19],
        type: 'wall',
        status: 'free',
        availability: [],
        securityLevel: 'invalid_level',
        notes: 'Invalid security',
      };

      const result = service.validateSpot(invalidSpot);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid security level');
    });

    it('should reject invalid time range format', () => {
      const invalidSpot: Partial<Spot> = {
        coords: [45.4642, 9.19],
        type: 'wall',
        status: 'free',
        availability: [{ from: '25:00', to: '18:00' }],
        securityLevel: 'low',
        notes: 'Invalid time',
      };

      const result = service.validateSpot(invalidSpot);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid time range format');
    });

    it('should reject notes exceeding 500 characters', () => {
      const longNotes = 'a'.repeat(501);
      const invalidSpot: Partial<Spot> = {
        coords: [45.4642, 9.19],
        type: 'wall',
        status: 'free',
        availability: [],
        securityLevel: 'low',
        notes: longNotes,
      };

      const result = service.validateSpot(invalidSpot);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Notes exceed 500 characters');
    });

    it('should collect multiple validation errors', () => {
      const invalidSpot: any = {
        coords: [100, 200],
        type: 'invalid',
        status: 'free',
        availability: [{ from: '25:00', to: '18:00' }],
        securityLevel: 'low',
        notes: 'a'.repeat(501),
      };

      const result = service.validateSpot(invalidSpot);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('filterSpots', () => {
    const spots: Spot[] = [
      {
        id: '1',
        coords: [45.4642, 9.19],
        type: 'wall',
        status: 'free',
        availability: [],
        securityLevel: 'low',
        notes: 'Wall spot',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '2',
        coords: [45.4642, 9.19],
        type: 'train',
        status: 'occupied',
        availability: [],
        securityLevel: 'high',
        notes: 'Train spot',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '3',
        coords: [45.4642, 9.19],
        type: 'sign',
        status: 'protected',
        availability: [],
        securityLevel: 'medium',
        notes: 'Sign spot',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    it('should return all spots when no filters applied', () => {
      const result = service.filterSpots(spots, {});

      expect(result).toHaveLength(3);
    });

    it('should filter by single type', () => {
      const result = service.filterSpots(spots, { type: ['wall'] });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('wall');
    });

    it('should filter by multiple types', () => {
      const result = service.filterSpots(spots, { type: ['wall', 'train'] });

      expect(result).toHaveLength(2);
      expect(result.map(s => s.type)).toContain('wall');
      expect(result.map(s => s.type)).toContain('train');
    });

    it('should filter by status', () => {
      const result = service.filterSpots(spots, { status: ['free'] });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('free');
    });

    it('should filter by security level', () => {
      const result = service.filterSpots(spots, { securityLevel: ['high'] });

      expect(result).toHaveLength(1);
      expect(result[0].securityLevel).toBe('high');
    });

    it('should combine multiple filters (AND logic)', () => {
      const result = service.filterSpots(spots, {
        type: ['train'],
        status: ['occupied'],
      });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('train');
      expect(result[0].status).toBe('occupied');
    });
  });

  describe('searchSpots', () => {
    const spots: Spot[] = [
      {
        id: '1',
        coords: [45.4642, 9.19],
        type: 'wall',
        status: 'free',
        availability: [],
        securityLevel: 'low',
        owner: 'CrewA',
        notes: 'Near the station',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '2',
        coords: [45.4642, 9.19],
        type: 'train',
        status: 'occupied',
        availability: [],
        securityLevel: 'high',
        owner: 'CrewB',
        notes: 'Under the bridge',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '3',
        coords: [45.4642, 9.19],
        type: 'sign',
        status: 'protected',
        availability: [],
        securityLevel: 'medium',
        notes: 'City center',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    it('should return all spots for empty query', () => {
      const result = service.searchSpots(spots, '');

      expect(result).toHaveLength(3);
    });

    it('should search in notes (case-insensitive)', () => {
      const result = service.searchSpots(spots, 'station');

      expect(result).toHaveLength(1);
      expect(result[0].notes).toContain('station');
    });

    it('should search in owner (case-insensitive)', () => {
      const result = service.searchSpots(spots, 'crewb');

      expect(result).toHaveLength(1);
      expect(result[0].owner).toBe('CrewB');
    });

    it('should search in type', () => {
      const result = service.searchSpots(spots, 'train');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('train');
    });

    it('should return multiple matches', () => {
      const result = service.searchSpots(spots, 'crew');

      expect(result).toHaveLength(2);
    });

    it('should handle no matches', () => {
      const result = service.searchSpots(spots, 'nonexistent');

      expect(result).toHaveLength(0);
    });
  });
});
