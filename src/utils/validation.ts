import type { Spot, TimeRange, SpotType, SpotStatus, SecurityLevel } from '../types/spot';

// UUID v4 regex pattern
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// HH:MM time format regex (24h)
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const VALID_SPOT_TYPES: SpotType[] = ['wall', 'train', 'sign', 'other'];
const VALID_SPOT_STATUSES: SpotStatus[] = ['free', 'occupied', 'protected'];
const VALID_SECURITY_LEVELS: SecurityLevel[] = ['low', 'medium', 'high'];

/**
 * Validates geographic coordinates
 * @param coords [latitude, longitude]
 * @returns true if valid, false otherwise
 */
export function isValidCoords(coords: any): coords is [number, number] {
  if (!Array.isArray(coords)) return false;
  if (coords.length !== 2) return false;

  const [lat, lng] = coords;

  // Check if both are numbers and not NaN/Infinity
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  // Validate ranges
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;

  return true;
}

/**
 * Validates time range in HH:MM format (24h)
 * @param range TimeRange object
 * @returns true if valid, false otherwise
 */
export function isValidTimeRange(range: any): range is TimeRange {
  if (!range || typeof range !== 'object') return false;
  if (!range.from || !range.to) return false;
  if (typeof range.from !== 'string' || typeof range.to !== 'string') return false;

  return TIME_PATTERN.test(range.from) && TIME_PATTERN.test(range.to);
}

/**
 * Validates a complete Spot object
 * @param spot Partial Spot object to validate
 * @returns true if valid, false otherwise
 */
export function isValidSpot(spot: any): spot is Spot {
  if (!spot || typeof spot !== 'object') return false;

  // Validate required fields
  if (!spot.id || typeof spot.id !== 'string' || !UUID_V4_PATTERN.test(spot.id)) {
    return false;
  }

  if (!isValidCoords(spot.coords)) {
    return false;
  }

  if (!VALID_SPOT_TYPES.includes(spot.type)) {
    return false;
  }

  if (!VALID_SPOT_STATUSES.includes(spot.status)) {
    return false;
  }

  if (!VALID_SECURITY_LEVELS.includes(spot.securityLevel)) {
    return false;
  }

  // Validate availability array
  if (!Array.isArray(spot.availability)) {
    return false;
  }

  for (const timeRange of spot.availability) {
    if (!isValidTimeRange(timeRange)) {
      return false;
    }
  }

  // Validate notes
  if (typeof spot.notes !== 'string') {
    return false;
  }

  // Validate timestamps
  if (typeof spot.createdAt !== 'number' || !Number.isFinite(spot.createdAt) || spot.createdAt < 0) {
    return false;
  }

  if (typeof spot.updatedAt !== 'number' || !Number.isFinite(spot.updatedAt) || spot.updatedAt < 0) {
    return false;
  }

  // Validate optional owner
  if (spot.owner !== undefined && typeof spot.owner !== 'string') {
    return false;
  }

  // Validate optional photos
  if (spot.photos !== undefined) {
    if (!Array.isArray(spot.photos)) {
      return false;
    }

    for (const photo of spot.photos) {
      if (typeof photo !== 'string' || photo.length === 0) {
        return false;
      }
    }
  }

  return true;
}
