import { describe, it, expect } from 'vitest';
import { isValidCoords, isValidTimeRange, isValidSpot } from '../validation';
import type { Spot } from '../../types/spot';

describe('Validation Utils', () => {
  describe('isValidCoords', () => {
    it('should accept valid Milano coordinates', () => {
      expect(isValidCoords([45.4642, 9.1900])).toBe(true);
    });

    it('should accept coordinates at latitude boundaries', () => {
      expect(isValidCoords([-90, 0])).toBe(true);
      expect(isValidCoords([90, 0])).toBe(true);
    });

    it('should accept coordinates at longitude boundaries', () => {
      expect(isValidCoords([0, -180])).toBe(true);
      expect(isValidCoords([0, 180])).toBe(true);
    });

    it('should reject latitude out of range', () => {
      expect(isValidCoords([-91, 0])).toBe(false);
      expect(isValidCoords([91, 0])).toBe(false);
    });

    it('should reject longitude out of range', () => {
      expect(isValidCoords([0, -181])).toBe(false);
      expect(isValidCoords([0, 181])).toBe(false);
    });

    it('should reject invalid array length', () => {
      expect(isValidCoords([45.4642] as any)).toBe(false);
      expect(isValidCoords([45.4642, 9.1900, 100] as any)).toBe(false);
    });

    it('should reject non-numeric values', () => {
      expect(isValidCoords(['45.4642', '9.1900'] as any)).toBe(false);
      expect(isValidCoords([NaN, 9.1900])).toBe(false);
      expect(isValidCoords([45.4642, Infinity])).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(isValidCoords(null as any)).toBe(false);
      expect(isValidCoords(undefined as any)).toBe(false);
    });
  });

  describe('isValidTimeRange', () => {
    it('should accept valid HH:MM format', () => {
      expect(isValidTimeRange({ from: '08:00', to: '22:00' })).toBe(true);
      expect(isValidTimeRange({ from: '00:00', to: '23:59' })).toBe(true);
    });

    it('should reject invalid hour values', () => {
      expect(isValidTimeRange({ from: '24:00', to: '12:00' })).toBe(false);
      expect(isValidTimeRange({ from: '08:00', to: '25:00' })).toBe(false);
      expect(isValidTimeRange({ from: '-01:00', to: '12:00' })).toBe(false);
    });

    it('should reject invalid minute values', () => {
      expect(isValidTimeRange({ from: '08:60', to: '12:00' })).toBe(false);
      expect(isValidTimeRange({ from: '08:00', to: '12:61' })).toBe(false);
      expect(isValidTimeRange({ from: '08:-01', to: '12:00' })).toBe(false);
    });

    it('should reject invalid format', () => {
      expect(isValidTimeRange({ from: '8:00', to: '22:00' })).toBe(false);
      expect(isValidTimeRange({ from: '08:0', to: '22:00' })).toBe(false);
      expect(isValidTimeRange({ from: '08-00', to: '22:00' })).toBe(false);
      expect(isValidTimeRange({ from: '0800', to: '2200' })).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(isValidTimeRange({ from: '', to: '22:00' })).toBe(false);
      expect(isValidTimeRange({ from: '08:00', to: '' })).toBe(false);
    });

    it('should reject null/undefined fields', () => {
      expect(isValidTimeRange({ from: null as any, to: '22:00' })).toBe(false);
      expect(isValidTimeRange({ from: '08:00', to: undefined as any })).toBe(false);
    });
  });

  describe('isValidSpot', () => {
    const validSpot: Spot = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      coords: [45.4642, 9.1900],
      type: 'wall',
      status: 'free',
      availability: [{ from: '08:00', to: '22:00' }],
      securityLevel: 'low',
      notes: 'Valid spot',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    it('should accept valid spot', () => {
      expect(isValidSpot(validSpot)).toBe(true);
    });

    it('should accept spot with optional fields', () => {
      const spotWithOptionals: Spot = {
        ...validSpot,
        owner: 'CrewName',
        photos: ['data:image/png;base64,abc123']
      };
      expect(isValidSpot(spotWithOptionals)).toBe(true);
    });

    it('should reject spot with invalid UUID', () => {
      expect(isValidSpot({ ...validSpot, id: 'not-a-uuid' })).toBe(false);
      expect(isValidSpot({ ...validSpot, id: '' })).toBe(false);
    });

    it('should reject spot with invalid coords', () => {
      expect(isValidSpot({ ...validSpot, coords: [91, 0] })).toBe(false);
      expect(isValidSpot({ ...validSpot, coords: [45.4642] as any })).toBe(false);
    });

    it('should reject spot with invalid type', () => {
      expect(isValidSpot({ ...validSpot, type: 'invalid' as any })).toBe(false);
    });

    it('should reject spot with invalid status', () => {
      expect(isValidSpot({ ...validSpot, status: 'invalid' as any })).toBe(false);
    });

    it('should reject spot with invalid securityLevel', () => {
      expect(isValidSpot({ ...validSpot, securityLevel: 'invalid' as any })).toBe(false);
    });

    it('should reject spot with invalid availability', () => {
      expect(isValidSpot({ ...validSpot, availability: [{ from: '25:00', to: '12:00' }] })).toBe(false);
      expect(isValidSpot({ ...validSpot, availability: [{ from: '08:00', to: 'invalid' }] })).toBe(false);
    });

    it('should reject spot with missing required fields', () => {
      expect(isValidSpot({ ...validSpot, notes: undefined as any })).toBe(false);
      expect(isValidSpot({ ...validSpot, createdAt: undefined as any })).toBe(false);
      expect(isValidSpot({ ...validSpot, updatedAt: undefined as any })).toBe(false);
    });

    it('should reject spot with invalid timestamp', () => {
      expect(isValidSpot({ ...validSpot, createdAt: -1 })).toBe(false);
      expect(isValidSpot({ ...validSpot, updatedAt: NaN })).toBe(false);
    });

    it('should reject spot with invalid photos array', () => {
      expect(isValidSpot({ ...validSpot, photos: [''] })).toBe(false);
      expect(isValidSpot({ ...validSpot, photos: [123] as any })).toBe(false);
    });

    it('should reject null/undefined spot', () => {
      expect(isValidSpot(null as any)).toBe(false);
      expect(isValidSpot(undefined as any)).toBe(false);
    });
  });
});
