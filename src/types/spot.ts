// Shared types contract for StreetMark PWA
// DO NOT MODIFY - Other agents depend on this contract

export type SpotType = 'wall' | 'train' | 'sign' | 'other';
export type SpotStatus = 'free' | 'occupied' | 'protected';
export type SecurityLevel = 'low' | 'medium' | 'high';

export interface TimeRange {
  from: string; // HH:MM format (24h)
  to: string;   // HH:MM format (24h)
}

export type TemporaryState = 'hot' | 'cold' | 'burned';

export interface TemporaryStatus {
  state: TemporaryState;
  setAt: number;       // Unix timestamp
  expiresAt: number;   // Unix timestamp (setAt + 48h)
  note?: string;       // optional user note
}

export interface Spot {
  id: string;                    // UUID v4
  coords: [number, number];      // [lat, lng]
  type: SpotType;
  status: SpotStatus;
  availability: TimeRange[];
  securityLevel: SecurityLevel;
  owner?: string;                // crew/writer name (optional)
  notes: string;
  photos?: string[];             // base64 or blob URLs (optional)
  isFavorite?: boolean;          // marked as favorite for personal gallery
  temporaryStatus?: TemporaryStatus; // temporary state (hot/cold/burned) with expiry
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
}

export interface ExportData {
  version: string;               // Semver (e.g., '1.0.0')
  exportedAt: number;            // Unix timestamp
  spots: Spot[];
  metadata: {
    appVersion: string;
    deviceId: string;            // UUID persistent in localStorage
  };
}
