// src/components/SpotList.tsx
import type { Spot } from '../types/spot';

export interface SpotListProps {
  spots: Spot[];
  onSpotClick?: (spot: Spot) => void;
  onEdit?: (spot: Spot) => void;
  onDelete?: (id: string) => void;
}

export function SpotList({ spots, onSpotClick }: SpotListProps) {
  if (spots.length === 0) {
    return (
      <div className="spot-list-empty">
        <p>Nessun spot trovato</p>
      </div>
    );
  }

  const getSpotName = (spot: Spot) => {
    return spot.owner || `${spot.type.charAt(0).toUpperCase() + spot.type.slice(1)} Spot`;
  };

  const getLocationText = (spot: Spot) => {
    // Format: "Via/Address" or coords as fallback
    if (spot.notes) {
      // Extract first line if multi-line notes
      const firstLine = spot.notes.split('\n')[0];
      if (firstLine.length > 30) {
        return firstLine.slice(0, 30) + '...';
      }
      return firstLine;
    }
    return `${spot.coords[0].toFixed(4)}, ${spot.coords[1].toFixed(4)}`;
  };

  const getAvailabilityText = (spot: Spot) => {
    if (!spot.availability || spot.availability.length === 0) {
      return 'No hours set';
    }
    const firstRange = spot.availability[0];
    return `${firstRange.from}-${firstRange.to}`;
  };

  const getSecurityBadgeColor = (level: string) => {
    switch (level) {
      case 'low': return 'var(--free)';
      case 'medium': return 'var(--orange)';
      case 'high': return 'var(--red)';
      default: return 'var(--t3)';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    return `type-badge type-badge-${type}`;
  };

  return (
    <div className="spot-list">
      {spots.map((spot) => (
        <div
          key={spot.id}
          className="spot-card-compact"
          data-spot-id={spot.id}
          data-testid={`spot-card-${spot.id}`}
          onClick={() => onSpotClick?.(spot)}
          style={{ cursor: onSpotClick ? 'pointer' : 'default' }}
        >
          <div className="spot-card-compact-header">
            <h4 className="spot-card-compact-name">{getSpotName(spot)}</h4>
            <span className={getTypeBadgeClass(spot.type)}>{spot.type}</span>
          </div>

          <p className="spot-card-compact-location">{getLocationText(spot)}</p>

          <div className="spot-card-compact-footer">
            <span className="spot-card-compact-hours">{getAvailabilityText(spot)}</span>
            <span
              className="spot-card-compact-security"
              style={{ color: getSecurityBadgeColor(spot.securityLevel) }}
            >
              • {spot.securityLevel.toUpperCase()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
