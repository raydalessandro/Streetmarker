// src/services/SpotService.ts
import type { Spot, SpotType, SpotStatus, SecurityLevel, TimeRange } from '../types/spot';
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
    const currentTimeString = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

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
}
