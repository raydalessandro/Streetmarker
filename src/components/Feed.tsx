// src/components/Feed.tsx
import { useState, useEffect } from 'react';
import type { Spot } from '../types/spot';
import './Feed.css';

interface FeedProps {
  spots: Spot[];
  onSpotClick: (spot: Spot) => void;
}

export function Feed({ spots, onSpotClick }: FeedProps) {
  const [sortedSpots, setSortedSpots] = useState<Spot[]>([]);

  useEffect(() => {
    // Sort by most recently updated/created
    const sorted = [...spots].sort((a, b) => {
      const timeA = a.updatedAt || a.createdAt;
      const timeB = b.updatedAt || b.createdAt;
      return timeB - timeA;
    });
    setSortedSpots(sorted);
  }, [spots]);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
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

  const getSpotName = (spot: Spot) => {
    return spot.owner || `${spot.type.charAt(0).toUpperCase() + spot.type.slice(1)} Spot`;
  };

  return (
    <div className="feed-view">
      <div className="feed-header">
        <h2>Feed</h2>
        <div className="feed-stats">
          <span>{sortedSpots.length} spots</span>
        </div>
      </div>

      {sortedSpots.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📍</div>
          <p>No spots yet</p>
          <p className="empty-hint">Add your first spot to see it here</p>
        </div>
      ) : (
        <div className="feed-list">
          {sortedSpots.map(spot => (
            <article
              key={spot.id}
              className="feed-card"
              onClick={() => onSpotClick(spot)}
            >
              {/* Card Header */}
              <div className="feed-card-header">
                <div className="feed-card-type">{spot.type}</div>
                <div className="feed-card-time">{formatTime(spot.updatedAt || spot.createdAt)}</div>
              </div>

              {/* Card Photo */}
              {spot.photos && spot.photos.length > 0 && (
                <div className="feed-card-photo">
                  <img src={spot.photos[0]} alt={getSpotName(spot)} />
                  {spot.photos.length > 1 && (
                    <div className="feed-card-photo-count">
                      +{spot.photos.length - 1}
                    </div>
                  )}
                </div>
              )}

              {/* Card Content */}
              <div className="feed-card-content">
                <h3 className="feed-card-title">{getSpotName(spot)}</h3>
                {spot.notes && (
                  <p className="feed-card-description">{spot.notes}</p>
                )}

                {/* Card Tags */}
                <div className="feed-card-tags">
                  <span
                    className="feed-card-tag status"
                    style={{ color: getStatusColor(spot.status) }}
                  >
                    {spot.status}
                  </span>
                  <span className="feed-card-tag security">
                    {getSecurityIcon(spot.securityLevel)} {spot.securityLevel}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="feed-card-footer">
                <div className="feed-card-location">
                  📍 {spot.coords[0].toFixed(4)}, {spot.coords[1].toFixed(4)}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
