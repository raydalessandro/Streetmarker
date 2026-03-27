// src/components/SpotListView.tsx
import { useState } from 'react';
import type { Spot } from '../types/spot';
import './SpotListView.css';

interface SpotListViewProps {
  spots: Spot[];
  onSpotClick: (spot: Spot) => void;
  onEdit: (spot: Spot) => void;
  onDelete: (id: string) => void;
}

export function SpotListView({ spots, onSpotClick, onEdit, onDelete }: SpotListViewProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'type' | 'status'>('recent');

  const getSortedSpots = () => {
    const sorted = [...spots];
    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
      case 'name':
        return sorted.sort((a, b) => getSpotName(a).localeCompare(getSpotName(b)));
      case 'type':
        return sorted.sort((a, b) => a.type.localeCompare(b.type));
      case 'status':
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return sorted;
    }
  };

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

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this spot?')) {
      onDelete(id);
    }
  };

  const sortedSpots = getSortedSpots();

  return (
    <div className="spot-list-view">
      <div className="spot-list-view-header">
        <h2>Spots</h2>
        <div className="spot-list-view-controls">
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="recent">Recent</option>
            <option value="name">Name</option>
            <option value="type">Type</option>
            <option value="status">Status</option>
          </select>
          <div className="spot-list-view-count">{spots.length} spots</div>
        </div>
      </div>

      {sortedSpots.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📍</div>
          <p>No spots yet</p>
          <p className="empty-hint">Add your first spot to see it here</p>
        </div>
      ) : (
        <div className="spot-list-view-grid">
          {sortedSpots.map(spot => (
            <article
              key={spot.id}
              className="spot-card"
              onClick={() => onSpotClick(spot)}
            >
              {/* Card Photo */}
              {spot.photos && spot.photos.length > 0 ? (
                <div className="spot-card-photo">
                  <img src={spot.photos[0]} alt={getSpotName(spot)} />
                  {spot.photos.length > 1 && (
                    <div className="spot-card-photo-count">
                      +{spot.photos.length - 1}
                    </div>
                  )}
                </div>
              ) : (
                <div className="spot-card-photo-placeholder">
                  <div className="spot-card-photo-placeholder-icon">📍</div>
                </div>
              )}

              {/* Card Content */}
              <div className="spot-card-content">
                <div className="spot-card-header">
                  <h3 className="spot-card-title">{getSpotName(spot)}</h3>
                  <span className="spot-card-type">{spot.type}</span>
                </div>

                {spot.notes && (
                  <p className="spot-card-notes">{spot.notes}</p>
                )}

                {/* Card Tags */}
                <div className="spot-card-tags">
                  <span
                    className="spot-card-tag status"
                    style={{ color: getStatusColor(spot.status) }}
                  >
                    {spot.status}
                  </span>
                  <span className="spot-card-tag security">
                    {getSecurityIcon(spot.securityLevel)} {spot.securityLevel}
                  </span>
                </div>

                {/* Card Actions */}
                <div className="spot-card-actions">
                  <button
                    className="spot-card-action-btn edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(spot);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                  </button>
                  <button
                    className="spot-card-action-btn delete"
                    onClick={(e) => handleDelete(e, spot.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
