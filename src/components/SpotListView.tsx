// src/components/SpotListView.tsx
import { useState } from 'react';
import type { Spot } from '../types/spot';
import { SpotFilters } from './SpotFilters';
import { SpotDetailModal } from './SpotDetailModal';
import type { SpotFilters as SpotFiltersType } from '../services/SpotService';
import './SpotListView.css';

interface SpotListViewProps {
  spots: Spot[];
  onSpotClick: (spot: Spot) => void;
  onEdit: (spot: Spot) => void;
  onDelete: (id: string) => void;
  onFilterChange: (filters: SpotFiltersType) => void;
  onSearchChange: (query: string) => void;
  onToggleFavorite: (spot: Spot) => void;
}

export function SpotListView({ spots, onSpotClick, onEdit, onFilterChange, onSearchChange, onToggleFavorite }: SpotListViewProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  const getSortedSpots = () => {
    // Sort by recent (most recently updated/created first)
    return [...spots].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  };

  // Helper functions for grid display
  const getSpotName = (spot: Spot) => {
    return spot.owner || `${spot.type.charAt(0).toUpperCase() + spot.type.slice(1)} Spot`;
  };

  const handleCardClick = (spot: Spot) => {
    setSelectedSpot(spot);
  };

  const handleViewOnMap = () => {
    if (selectedSpot) {
      onSpotClick(selectedSpot);
      setSelectedSpot(null);
    }
  };

  const handleEdit = () => {
    if (selectedSpot) {
      onEdit(selectedSpot);
      setSelectedSpot(null);
    }
  };

  const handleOpenInMaps = () => {
    if (selectedSpot) {
      const [lat, lng] = selectedSpot.coords;
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  const sortedSpots = getSortedSpots();

  // Type icon SVGs
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'wall':
        return (
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="6" width="8" height="4" rx="1"/>
            <rect x="14" y="6" width="8" height="4" rx="1"/>
            <rect x="2" y="14" width="8" height="4" rx="1"/>
            <rect x="14" y="14" width="8" height="4" rx="1"/>
          </svg>
        );
      case 'train':
        return (
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="8" width="16" height="12" rx="2"/>
            <path d="M8 20v2M16 20v2"/>
            <circle cx="8" cy="16" r="1.5"/>
            <circle cx="16" cy="16" r="1.5"/>
            <path d="M4 12h16"/>
          </svg>
        );
      case 'sign':
        return (
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20"/>
            <path d="M5 8h14l-2 4 2 4H5l2-4-2-4z"/>
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2c-4.4 0-8 3.6-8 8 0 5.4 8 14 8 14s8-8.6 8-14c0-4.4-3.6-8-8-8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        );
    }
  };

  const getTypeBadgeClass = (type: string) => {
    return `spot-card-type-badge ${type}`;
  };

  return (
    <div className="spot-list-view">
      {/* Header Minimal - No Hamburger */}
      <div className="spot-list-view-header">
        <h2>SPOT</h2>
        <div className="spot-list-view-count">{spots.length}</div>
        <button
          className="filter-btn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Filters"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer with Filters */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button
          className="sidebar-close"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close filters"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <SpotFilters
          onFilterChange={onFilterChange}
          onSearchChange={onSearchChange}
        />
      </aside>

      {sortedSpots.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📍</div>
          <p>No spots yet</p>
          <p className="empty-hint">Add your first spot to see it here</p>
        </div>
      ) : (
        <div className="spot-list-view-grid">
          {sortedSpots.map((spot, index) => (
            <article
              key={spot.id}
              className="spot-card"
              onClick={() => handleCardClick(spot)}
              style={{ '--index': index } as React.CSSProperties}
            >
              {/* Card Photo or Gradient Placeholder */}
              {spot.photos && spot.photos.length > 0 ? (
                <div className="spot-card-photo">
                  <img src={spot.photos[0]} alt={getSpotName(spot)} loading="lazy" />
                  {/* Overlay Gradient */}
                  <div className="spot-card-overlay">
                    <div className="spot-card-overlay-content">
                      <h3 className="spot-card-title">{getSpotName(spot)}</h3>
                      <span className={getTypeBadgeClass(spot.type)}>{spot.type}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`spot-card-photo-placeholder ${spot.type}`}>
                  <div className="spot-card-photo-placeholder-icon">
                    {getTypeIcon(spot.type)}
                  </div>
                  {/* Overlay for placeholder too */}
                  <div className="spot-card-overlay">
                    <div className="spot-card-overlay-content">
                      <h3 className="spot-card-title">{getSpotName(spot)}</h3>
                      <span className={getTypeBadgeClass(spot.type)}>{spot.type}</span>
                    </div>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Spot Detail Modal */}
      {selectedSpot && (
        <SpotDetailModal
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          onViewOnMap={handleViewOnMap}
          onEdit={handleEdit}
          onOpenInMaps={handleOpenInMaps}
          onToggleFavorite={() => {
            onToggleFavorite(selectedSpot);
            setSelectedSpot(null);
          }}
        />
      )}
    </div>
  );
}
