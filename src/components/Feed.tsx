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

  const getSpotName = (spot: Spot) => {
    return spot.owner || `${spot.type.charAt(0).toUpperCase() + spot.type.slice(1)} Spot`;
  };

  // Avatar SVG icons per type
  const getAvatarIcon = (type: string) => {
    switch (type) {
      case 'wall':
        return (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="6" width="8" height="4" rx="1"/>
            <rect x="14" y="6" width="8" height="4" rx="1"/>
            <rect x="2" y="14" width="8" height="4" rx="1"/>
            <rect x="14" y="14" width="8" height="4" rx="1"/>
          </svg>
        );
      case 'train':
        return (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="8" width="16" height="12" rx="2"/>
            <path d="M8 20v2M16 20v2"/>
            <circle cx="8" cy="16" r="1.5"/>
            <circle cx="16" cy="16" r="1.5"/>
            <path d="M4 12h16"/>
          </svg>
        );
      case 'sign':
        return (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20"/>
            <path d="M5 8h14l-2 4 2 4H5l2-4-2-4z"/>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2c-4.4 0-8 3.6-8 8 0 5.4 8 14 8 14s8-8.6 8-14c0-4.4-3.6-8-8-8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        );
    }
  };

  const getAvatarClass = (type: string) => {
    return `feed-avatar ${type}`;
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
            >
              {/* Card Header - Avatar + Name + Badge + Time */}
              <div className="feed-card-header">
                <div className={getAvatarClass(spot.type)}>
                  {getAvatarIcon(spot.type)}
                </div>
                <div className="feed-card-header-info">
                  <h3 className="feed-card-name">{getSpotName(spot)}</h3>
                  <div className="feed-card-time">{formatTime(spot.updatedAt || spot.createdAt)}</div>
                </div>
                <span className={`feed-card-type-badge ${spot.type}`}>{spot.type}</span>
              </div>

              {/* Card Photo */}
              {spot.photos && spot.photos.length > 0 ? (
                <div className="feed-card-photo" onClick={() => onSpotClick(spot)}>
                  <img src={spot.photos[0]} alt={getSpotName(spot)} loading="lazy" />
                </div>
              ) : (
                <div className={`feed-card-photo-placeholder ${spot.type}`} onClick={() => onSpotClick(spot)}>
                  <div className="feed-card-photo-placeholder-icon">
                    {getAvatarIcon(spot.type)}
                  </div>
                </div>
              )}

              {/* Action Row */}
              <div className="feed-card-actions">
                <button className="feed-action-btn" aria-label="Bookmark">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                <button className="feed-action-btn" aria-label="Share">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                </button>
                <button className="feed-action-btn" aria-label="Navigate" onClick={() => onSpotClick(spot)}>
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="10" r="3"/>
                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                  </svg>
                </button>
              </div>

              {/* Card Content */}
              <div className="feed-card-content">
                {spot.notes && (
                  <p className="feed-card-description">{spot.notes}</p>
                )}

                {/* Tags as Hashtags */}
                <div className="feed-card-tags">
                  <span className="feed-card-hashtag">#{spot.status}</span>
                  <span className="feed-card-hashtag">#{spot.securityLevel}sec</span>
                  <span className="feed-card-hashtag">#{spot.type}</span>
                </div>

                {/* Coordinates */}
                <div className="feed-card-coords">
                  {spot.coords[0].toFixed(4)}, {spot.coords[1].toFixed(4)}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
