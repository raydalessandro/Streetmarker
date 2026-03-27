// Tests for temporary status feature in SpotService
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpotService } from '../SpotService';
import type { Spot } from '../../types/spot';

describe('SpotService - Temporary Status', () => {
  let service: SpotService;
  let mockSpot: Spot;

  beforeEach(() => {
    service = new SpotService();
    mockSpot = {
      id: 'test-spot-1',
      coords: [45.4642, 9.19],
      type: 'wall',
      status: 'free',
      availability: [{ from: '00:00', to: '23:59' }],
      securityLevel: 'low',
      notes: 'Test spot',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Mock Date.now() for consistent tests
    vi.spyOn(Date, 'now').mockReturnValue(1609459200000); // 2021-01-01 00:00:00
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setTemporaryStatus', () => {
    it('adds temporary status with 48h expiry', () => {
      const updatedSpot = service.setTemporaryStatus(mockSpot, 'hot');

      expect(updatedSpot.temporaryStatus).toBeDefined();
      expect(updatedSpot.temporaryStatus!.state).toBe('hot');
      expect(updatedSpot.temporaryStatus!.setAt).toBe(1609459200000);
      expect(updatedSpot.temporaryStatus!.expiresAt).toBe(1609459200000 + 48 * 60 * 60 * 1000);
    });

    it('includes optional note', () => {
      const updatedSpot = service.setTemporaryStatus(mockSpot, 'burned', 'Cops everywhere');

      expect(updatedSpot.temporaryStatus!.note).toBe('Cops everywhere');
    });

    it('updates updatedAt timestamp', () => {
      const before = mockSpot.updatedAt;
      const updatedSpot = service.setTemporaryStatus(mockSpot, 'cold');

      expect(updatedSpot.updatedAt).toBeGreaterThan(before);
    });

    it('handles all state types', () => {
      const hot = service.setTemporaryStatus(mockSpot, 'hot');
      expect(hot.temporaryStatus!.state).toBe('hot');

      const cold = service.setTemporaryStatus(mockSpot, 'cold');
      expect(cold.temporaryStatus!.state).toBe('cold');

      const burned = service.setTemporaryStatus(mockSpot, 'burned');
      expect(burned.temporaryStatus!.state).toBe('burned');
    });
  });

  describe('isTemporaryStatusValid', () => {
    it('returns false if no temporary status', () => {
      expect(service.isTemporaryStatusValid(mockSpot)).toBe(false);
    });

    it('returns true if status not expired', () => {
      const spotWithStatus = service.setTemporaryStatus(mockSpot, 'hot');

      // Current time + 24h (still within 48h window)
      vi.spyOn(Date, 'now').mockReturnValue(1609459200000 + 24 * 60 * 60 * 1000);

      expect(service.isTemporaryStatusValid(spotWithStatus)).toBe(true);
    });

    it('returns false if status expired', () => {
      const spotWithStatus = service.setTemporaryStatus(mockSpot, 'hot');

      // Current time + 49h (expired after 48h)
      vi.spyOn(Date, 'now').mockReturnValue(1609459200000 + 49 * 60 * 60 * 1000);

      expect(service.isTemporaryStatusValid(spotWithStatus)).toBe(false);
    });

    it('returns false exactly at expiry time', () => {
      const spotWithStatus = service.setTemporaryStatus(mockSpot, 'hot');

      // Current time exactly at expiry
      vi.spyOn(Date, 'now').mockReturnValue(spotWithStatus.temporaryStatus!.expiresAt);

      expect(service.isTemporaryStatusValid(spotWithStatus)).toBe(false);
    });
  });

  describe('removeTemporaryStatus', () => {
    it('removes temporary status from spot', () => {
      const spotWithStatus = service.setTemporaryStatus(mockSpot, 'hot');
      const spotWithoutStatus = service.removeTemporaryStatus(spotWithStatus);

      expect(spotWithoutStatus.temporaryStatus).toBeUndefined();
    });

    it('preserves other spot properties', () => {
      const spotWithStatus = service.setTemporaryStatus(mockSpot, 'hot');
      const spotWithoutStatus = service.removeTemporaryStatus(spotWithStatus);

      expect(spotWithoutStatus.id).toBe(mockSpot.id);
      expect(spotWithoutStatus.coords).toEqual(mockSpot.coords);
      expect(spotWithoutStatus.type).toBe(mockSpot.type);
    });

    it('updates updatedAt timestamp', () => {
      const spotWithStatus = service.setTemporaryStatus(mockSpot, 'hot');

      // Advance time
      vi.spyOn(Date, 'now').mockReturnValue(1609459200000 + 1000);

      const spotWithoutStatus = service.removeTemporaryStatus(spotWithStatus);

      expect(spotWithoutStatus.updatedAt).toBe(1609459200000 + 1000);
    });
  });

  describe('getTemporaryStateEmoji', () => {
    it('returns correct emoji for each state', () => {
      expect(service.getTemporaryStateEmoji('hot')).toBe('🔥');
      expect(service.getTemporaryStateEmoji('cold')).toBe('❄️');
      expect(service.getTemporaryStateEmoji('burned')).toBe('💀');
    });

    it('returns empty string for unknown state', () => {
      expect(service.getTemporaryStateEmoji('unknown' as any)).toBe('');
    });
  });

  describe('getTemporaryStateColor', () => {
    it('returns correct color for each state', () => {
      expect(service.getTemporaryStateColor('hot')).toBe('var(--accent)');
      expect(service.getTemporaryStateColor('cold')).toBe('var(--blue)');
      expect(service.getTemporaryStateColor('burned')).toBe('var(--red)');
    });

    it('returns default color for unknown state', () => {
      expect(service.getTemporaryStateColor('unknown' as any)).toBe('var(--t3)');
    });
  });

  describe('formatRelativeTime', () => {
    it('formats minutes ago (<60m)', () => {
      const timestamp = Date.now() - 30 * 60 * 1000; // 30 minutes ago
      expect(service.formatRelativeTime(timestamp)).toBe('30m ago');
    });

    it('formats hours ago (>=1h, <24h)', () => {
      const timestamp = Date.now() - 5 * 60 * 60 * 1000; // 5 hours ago
      expect(service.formatRelativeTime(timestamp)).toBe('5h ago');
    });

    it('formats days ago (>=24h)', () => {
      const timestamp = Date.now() - 3 * 24 * 60 * 60 * 1000; // 3 days ago
      expect(service.formatRelativeTime(timestamp)).toBe('3d ago');
    });

    it('handles edge cases', () => {
      // Just now (0 minutes)
      expect(service.formatRelativeTime(Date.now())).toBe('0m ago');

      // 59 minutes
      const timestamp59 = Date.now() - 59 * 60 * 1000;
      expect(service.formatRelativeTime(timestamp59)).toBe('59m ago');

      // Exactly 1 hour
      const timestamp1h = Date.now() - 60 * 60 * 1000;
      expect(service.formatRelativeTime(timestamp1h)).toBe('1h ago');

      // Exactly 24 hours
      const timestamp24h = Date.now() - 24 * 60 * 60 * 1000;
      expect(service.formatRelativeTime(timestamp24h)).toBe('1d ago');
    });
  });
});
