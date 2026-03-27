// Tests for LocationService
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationService } from '../LocationService';

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(() => {
    service = new LocationService();
  });

  describe('haversineDistance', () => {
    it('calculates distance correctly between Milan and Rome (~477km)', () => {
      // Milan coords: 45.4642, 9.1900
      // Rome coords: 41.9028, 12.4964
      const distance = service.haversineDistance(45.4642, 9.19, 41.9028, 12.4964);

      // Should be approximately 477 km (allow 5% tolerance)
      expect(distance).toBeGreaterThan(450);
      expect(distance).toBeLessThan(500);
    });

    it('returns 0 for same coordinates', () => {
      const distance = service.haversineDistance(45.4642, 9.19, 45.4642, 9.19);
      expect(distance).toBe(0);
    });

    it('calculates short distances accurately (<1km)', () => {
      // Two points ~500m apart in Milan
      const distance = service.haversineDistance(45.4642, 9.19, 45.469, 9.195);

      // Should be approximately 0.6 km
      expect(distance).toBeGreaterThan(0.5);
      expect(distance).toBeLessThan(0.8);
    });

    it('handles negative coordinates (southern/western hemisphere)', () => {
      // Sydney to Melbourne (~714 km)
      const distance = service.haversineDistance(-33.8688, 151.2093, -37.8136, 144.9631);

      expect(distance).toBeGreaterThan(700);
      expect(distance).toBeLessThan(750);
    });
  });

  describe('distanceToSpot', () => {
    it('calculates distance from user location to spot', () => {
      const userLocation = { lat: 45.4642, lng: 9.19 };
      const spotCoords: [number, number] = [45.469, 9.195];

      const distance = service.distanceToSpot(userLocation, spotCoords);

      expect(distance).toBeGreaterThan(0.5);
      expect(distance).toBeLessThan(0.8);
    });
  });

  describe('formatDistance', () => {
    it('formats distances < 1km in meters', () => {
      expect(service.formatDistance(0.5)).toBe('500 m');
      expect(service.formatDistance(0.123)).toBe('123 m');
      expect(service.formatDistance(0.999)).toBe('999 m');
    });

    it('formats distances >= 1km in kilometers with 1 decimal', () => {
      expect(service.formatDistance(1.0)).toBe('1.0 km');
      expect(service.formatDistance(1.234)).toBe('1.2 km');
      expect(service.formatDistance(10.567)).toBe('10.6 km');
      expect(service.formatDistance(477.123)).toBe('477.1 km');
    });

    it('rounds meters to nearest integer', () => {
      expect(service.formatDistance(0.1234)).toBe('123 m'); // 123.4 → 123
      expect(service.formatDistance(0.1235)).toBe('124 m'); // 123.5 → 124
    });
  });

  describe('getCurrentLocation', () => {
    it('resolves with user location on success', async () => {
      // Mock navigator.geolocation
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) =>
          success({
            coords: {
              latitude: 45.4642,
              longitude: 9.19,
            },
          })
        ),
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
        configurable: true,
      });

      const location = await service.getCurrentLocation();

      expect(location).toEqual({ lat: 45.4642, lng: 9.19 });
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      );
    });

    it('rejects with error when geolocation is not available', async () => {
      // Mock navigator.geolocation as undefined
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(service.getCurrentLocation()).rejects.toThrow('GPS non disponibile');
    });

    it('rejects with "Permesso GPS negato" on permission denied', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, error) =>
          error({
            code: 1, // PERMISSION_DENIED
            PERMISSION_DENIED: 1,
            message: 'User denied geolocation',
          })
        ),
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
        configurable: true,
      });

      await expect(service.getCurrentLocation()).rejects.toThrow('Permesso GPS negato');
    });

    it('rejects with "GPS timeout" on timeout', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, error) =>
          error({
            code: 3, // TIMEOUT
            TIMEOUT: 3,
            message: 'Timeout',
          })
        ),
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
        configurable: true,
      });

      await expect(service.getCurrentLocation()).rejects.toThrow('GPS timeout, riprova');
    });

    it('uses custom timeout parameter', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn(),
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
        configurable: true,
      });

      service.getCurrentLocation(5000);

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });
  });
});
