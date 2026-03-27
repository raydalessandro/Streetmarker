// src/components/SpotListView.tsx
import { useState } from 'react';
import type { Spot } from '../types/spot';
import { SpotFilters } from './SpotFilters';
import type { SpotFilters as SpotFiltersType } from '../services/SpotService';
import './SpotListView.css';

interface SpotListViewProps {
  spots: Spot[];
  onSpotClick: (spot: Spot) => void;
  onEdit: (spot: Spot) => void;
  onDelete: (id: string) => void;
  onFilterChange: (filters: SpotFiltersType) => void;
  onSearchChange: (query: string) => void;
}

export function SpotListView({ spots, onSpotClick, onEdit, onFilterChange, onSearchChange }: SpotListViewProps) {
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
        <div className="modal-overlay" onClick={() => setSelectedSpot(null)}>
          <div className="spot-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="spot-detail-close"
              onClick={() => setSelectedSpot(null)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="spot-detail-content">
              {/* Photo */}
              {selectedSpot.photos && selectedSpot.photos.length > 0 ? (
                <div className="spot-detail-photo">
                  <img src={selectedSpot.photos[0]} alt={getSpotName(selectedSpot)} />
                  {selectedSpot.photos.length > 1 && (
                    <div className="spot-detail-photo-count">
                      +{selectedSpot.photos.length - 1} photos
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
                  <h2>{getSpotName(selectedSpot)}</h2>
                  <span className="spot-detail-type">{selectedSpot.type}</span>
                </div>

                {selectedSpot.notes && (
                  <p className="spot-detail-notes">{selectedSpot.notes}</p>
                )}

                {/* Tags */}
                <div className="spot-detail-tags">
                  <span
                    className="spot-detail-tag status"
                    style={{ color: getStatusColor(selectedSpot.status) }}
                  >
                    {selectedSpot.status}
                  </span>
                  <span className="spot-detail-tag security">
                    {getSecurityIcon(selectedSpot.securityLevel)} {selectedSpot.securityLevel}
                  </span>
                </div>

                {/* Location */}
                <div className="spot-detail-location">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{selectedSpot.coords[0].toFixed(4)}, {selectedSpot.coords[1].toFixed(4)}</span>
                </div>

                {/* Actions */}
                <div className="spot-detail-actions">
                  <button
                    className="spot-detail-action-btn primary"
                    onClick={handleViewOnMap}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    View on Map
                  </button>
                  <button
                    className="spot-detail-action-btn secondary"
                    onClick={handleEdit}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                  </button>
                  <button
                    className="spot-detail-action-btn secondary"
                    onClick={handleOpenInMaps}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"></path>
                      <line x1="8" y1="2" x2="8" y2="18"></line>
                      <line x1="16" y1="6" x2="16" y2="22"></line>
                    </svg>
                    Open in Maps
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
