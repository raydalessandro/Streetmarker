// src/services/SpotService.ts
import type { Spot, SpotType, SpotStatus, SecurityLevel, TemporaryState } from '../types/spot';
import { isValidCoords, isValidTimeRange } from '../utils/validation';

export interface SpotFilters {
  type?: SpotType[];
  status?: SpotStatus[];
  securityLevel?: SecurityLevel[];
  availableNow?: boolean;
}

export class SpotService {
  /**
   * Create a new spot with auto-generated id and timestamps
   */
  createSpot(data: Omit<Spot, 'id' | 'createdAt' | 'updatedAt'>): Spot {
    const now = Date.now();

    return {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Validate a spot object
   * Returns validation result with errors array
   */
  validateSpot(spot: Partial<Spot>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate coordinates
    if (!spot.coords || !isValidCoords(spot.coords)) {
      errors.push('Invalid coordinates');
    }

    // Validate type
    const validTypes: SpotType[] = ['wall', 'train', 'sign', 'other'];
    if (!spot.type || !validTypes.includes(spot.type)) {
      errors.push('Invalid type');
    }

    // Validate status
    const validStatuses: SpotStatus[] = ['free', 'occupied', 'protected'];
    if (!spot.status || !validStatuses.includes(spot.status)) {
      errors.push('Invalid status');
    }

    // Validate security level
    const validSecurityLevels: SecurityLevel[] = ['low', 'medium', 'high'];
    if (!spot.securityLevel || !validSecurityLevels.includes(spot.securityLevel)) {
      errors.push('Invalid security level');
    }

    // Validate availability time ranges
    if (spot.availability) {
      for (const range of spot.availability) {
        if (!isValidTimeRange(range)) {
          errors.push('Invalid time range format');
          break;
        }
      }
    }

    // Validate notes length
    if (spot.notes && spot.notes.length > 500) {
      errors.push('Notes exceed 500 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if a spot is available at a given time
   * Handles both simple ranges (e.g., 08:00-18:00) and overnight ranges (e.g., 22:00-06:00)
   */
  isSpotAvailableNow(spot: Spot, currentTime?: Date): boolean {
    const now = currentTime || new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    // If no availability ranges, spot is not available
    if (!spot.availability || spot.availability.length === 0) {
      return false;
    }

    // Check if current time falls within any availability range
    return spot.availability.some((range) => {
      const [fromHours, fromMinutes] = range.from.split(':').map(Number);
      const [toHours, toMinutes] = range.to.split(':').map(Number);

      const fromTotalMinutes = fromHours * 60 + fromMinutes;
      const toTotalMinutes = toHours * 60 + toMinutes;
      const currentTotalMinutes = currentHours * 60 + currentMinutes;

      if (fromTotalMinutes <= toTotalMinutes) {
        // Simple range (same day): from <= current <= to
        return currentTotalMinutes >= fromTotalMinutes && currentTotalMinutes <= toTotalMinutes;
      } else {
        // Overnight range (spans midnight): current >= from OR current <= to
        return currentTotalMinutes >= fromTotalMinutes || currentTotalMinutes <= toTotalMinutes;
      }
    });
  }

  /**
   * Filter spots by type, status, security level, and time availability
   * Returns spots matching ALL specified filters (AND logic)
   */
  filterSpots(spots: Spot[], filters: SpotFilters, currentTime?: Date): Spot[] {
    return spots.filter(spot => {
      // Filter by type
      if (filters.type && filters.type.length > 0) {
        if (!filters.type.includes(spot.type)) {
          return false;
        }
      }

      // Filter by status
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(spot.status)) {
          return false;
        }
      }

      // Filter by security level
      if (filters.securityLevel && filters.securityLevel.length > 0) {
        if (!filters.securityLevel.includes(spot.securityLevel)) {
          return false;
        }
      }

      // Filter by time availability
      if (filters.availableNow) {
        if (!this.isSpotAvailableNow(spot, currentTime)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Search spots by query string
   * Searches in: notes, owner, type
   * Case-insensitive
   */
  searchSpots(spots: Spot[], query: string): Spot[] {
    if (!query || query.trim() === '') {
      return spots;
    }

    const lowerQuery = query.toLowerCase();

    return spots.filter(spot => {
      // Search in notes
      if (spot.notes && spot.notes.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in owner
      if (spot.owner && spot.owner.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in type
      if (spot.type.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Calculate Haversine distance between two coordinates in km
   */
  private haversineDistance(coords1: [number, number], coords2: [number, number]): number {
    const R = 6371; // Earth radius in km
    const dLat = (coords2[0] - coords1[0]) * Math.PI / 180;
    const dLon = (coords2[1] - coords1[1]) * Math.PI / 180;
    const lat1 = coords1[0] * Math.PI / 180;
    const lat2 = coords2[0] * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Convert time string (HH:MM) to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Convert minutes since midnight to time string (HH:MM)
   */
  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * Find best time window for a spot based on nearby spots of same type
   * Returns time window with highest activity in the area, or null if insufficient data
   */
  getBestTimeWindow(spot: Spot, allSpots: Spot[]): { from: string; to: string; spotCount: number } | null {
    // 1. Filter spots: same type + within 1km radius + have availability data
    const nearbySpots = allSpots.filter(s =>
      s.type === spot.type &&
      s.id !== spot.id &&
      this.haversineDistance(spot.coords, s.coords) < 1.0 &&
      s.availability.length > 0
    );

    // Need at least 2 nearby spots (plus current spot = 3 total)
    if (nearbySpots.length < 2) {
      return null;
    }

    // 2. Collect all availability ranges from current spot + nearby spots
    const allRanges = [spot, ...nearbySpots]
      .flatMap(s => s.availability.map(avail => ({
        from: this.timeToMinutes(avail.from),
        to: this.timeToMinutes(avail.to),
        overnight: this.timeToMinutes(avail.from) > this.timeToMinutes(avail.to),
      })));

    if (allRanges.length === 0) {
      return null;
    }

    // 3. Find the time window with maximum overlaps
    // Create events for each range start/end
    interface TimeEvent {
      time: number;
      type: 'start' | 'end';
    }

    const events: TimeEvent[] = [];
    allRanges.forEach(range => {
      if (range.overnight) {
        // Overnight range: split into two ranges (start->midnight, midnight->end)
        events.push({ time: range.from, type: 'start' });
        events.push({ time: 1440, type: 'end' }); // End at midnight (1440 minutes)
        events.push({ time: 0, type: 'start' }); // Start at midnight (0 minutes)
        events.push({ time: range.to, type: 'end' });
      } else {
        events.push({ time: range.from, type: 'start' });
        events.push({ time: range.to, type: 'end' });
      }
    });

    // Sort events by time
    events.sort((a, b) => a.time - b.time);

    // Sweep through events to find window with max concurrent ranges
    let currentCount = 0;
    let maxCount = 0;
    let maxStart = 0;
    let maxEnd = 0;
    let windowStart = 0;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      if (event.type === 'start') {
        currentCount++;
        if (currentCount > maxCount) {
          maxCount = currentCount;
          windowStart = event.time;
        }
      } else {
        if (currentCount === maxCount && maxCount > 0) {
          // End of max window
          maxStart = windowStart;
          maxEnd = event.time;
        }
        currentCount--;
      }
    }

    // 4. Return window only if:
    //    - At least 3 spots overlap (including current spot)
    //    - Window is at least 2 hours (120 minutes)
    const windowDuration = maxEnd - maxStart;
    if (maxCount < 3 || windowDuration < 120) {
      return null;
    }

    return {
      from: this.minutesToTime(maxStart),
      to: this.minutesToTime(maxEnd),
      spotCount: maxCount,
    };
  }

  /**
   * Check if temporary status is still valid (not expired)
   */
  isTemporaryStatusValid(spot: Spot): boolean {
    if (!spot.temporaryStatus) return false;
    return Date.now() < spot.temporaryStatus.expiresAt;
  }

  /**
   * Set temporary status on a spot
   * Expiry is 48 hours from now
   */
  setTemporaryStatus(spot: Spot, state: TemporaryState, note?: string): Spot {
    const now = Date.now();
    const expiresAt = now + (48 * 60 * 60 * 1000); // 48 hours in milliseconds

    return {
      ...spot,
      temporaryStatus: {
        state,
        setAt: now,
        expiresAt,
        note,
      },
      updatedAt: now,
    };
  }

  /**
   * Remove temporary status from a spot
   */
  removeTemporaryStatus(spot: Spot): Spot {
    const { temporaryStatus, ...spotWithoutStatus } = spot;
    return {
      ...spotWithoutStatus,
      updatedAt: Date.now(),
    };
  }

  /**
   * Get emoji for temporary state
   */
  getTemporaryStateEmoji(state: TemporaryState): string {
    switch (state) {
      case 'hot': return '🔥';
      case 'cold': return '❄️';
      case 'burned': return '💀';
      default: return '';
    }
  }

  /**
   * Get color for temporary state
   */
  getTemporaryStateColor(state: TemporaryState): string {
    switch (state) {
      case 'hot': return 'var(--accent)';
      case 'cold': return 'var(--blue)';
      case 'burned': return 'var(--red)';
      default: return 'var(--t3)';
    }
  }

  /**
   * Format relative timestamp (e.g., "3h ago", "2 days ago")
   */
  formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  }
}
