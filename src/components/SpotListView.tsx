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
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'type' | 'status'>('recent');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

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

  // Helper functions for grid display
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

  return (
    <div className="spot-list-view">
      {/* Header with Hamburger */}
      <div className="spot-list-view-header">
        <button
          className="hamburger-btn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle filters"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
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
          {sortedSpots.map(spot => (
            <article
              key={spot.id}
              className="spot-card"
              onClick={() => handleCardClick(spot)}
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
              </div>
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
