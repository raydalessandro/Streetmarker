// src/components/SpotDetailModal.tsx
import type { Spot } from '../types/spot';
import './SpotDetailModal.css';

interface SpotDetailModalProps {
  spot: Spot;
  onClose: () => void;
  onViewOnMap?: () => void;
  onEdit: () => void;
  onOpenInMaps: () => void;
  onToggleFavorite: () => void;
}

export function SpotDetailModal({ spot, onClose, onViewOnMap, onEdit, onOpenInMaps, onToggleFavorite }: SpotDetailModalProps) {
  const getSpotName = (spot: Spot) => {
    return spot.owner || `${spot.type.charAt(0).toUpperCase() + spot.type.slice(1)} Spot`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'free': return 'var(--status-free)';
      case 'occupied': return 'var(--status-occupied)';
      case 'protected': return 'var(--status-protected)';
      default: return 'var(--text-muted)';
    }
  };

  const getSecurityIcon = (level: string) => {
    switch (level) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="spot-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="spot-detail-close"
          onClick={onClose}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="spot-detail-content">
          {/* Photo */}
          {spot.photos && spot.photos.length > 0 ? (
            <div className="spot-detail-photo">
              <img src={spot.photos[0]} alt={getSpotName(spot)} />
              {spot.photos.length > 1 && (
                <div className="spot-detail-photo-count">
                  +{spot.photos.length - 1} photos
                </div>
              )}
            </div>
          ) : (
            <div className="spot-detail-photo-placeholder">
              <div className="spot-detail-photo-placeholder-icon">📍</div>
            </div>
          )}

          {/* Info */}
          <div className="spot-detail-info">
            <div className="spot-detail-header">
              <h2>{getSpotName(spot)}</h2>
              <span className="spot-detail-type">{spot.type}</span>
            </div>

            {spot.notes && (
              <p className="spot-detail-notes">{spot.notes}</p>
            )}

            {/* Tags */}
            <div className="spot-detail-tags">
              <span
                className="spot-detail-tag status"
                style={{ color: getStatusColor(spot.status) }}
              >
                {spot.status}
              </span>
              <span className="spot-detail-tag security">
                {getSecurityIcon(spot.securityLevel)} {spot.securityLevel}
              </span>
            </div>

            {/* Location */}
            <div className="spot-detail-location">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{spot.coords[0].toFixed(4)}, {spot.coords[1].toFixed(4)}</span>
            </div>

            {/* Actions */}
            <div className="spot-detail-actions">
              {onViewOnMap && (
                <button
                  className="spot-detail-action-btn primary"
                  onClick={onViewOnMap}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  View on Map
                </button>
              )}
              <button
                className="spot-detail-action-btn secondary"
                onClick={onEdit}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
              <button
                className="spot-detail-action-btn secondary"
                onClick={onOpenInMaps}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"></path>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
                Open in Maps
              </button>
              <button
                className={`spot-detail-action-btn ${spot.isFavorite ? 'favorite-active' : 'secondary'}`}
                onClick={onToggleFavorite}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={spot.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                {spot.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
