import './BottomNav.css';

export type ViewType = 'map' | 'spots' | 'gallery' | 'feed';

interface BottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onAddClick: () => void;
}

export function BottomNav({ currentView, onViewChange, onAddClick }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${currentView === 'map' ? 'active' : ''}`}
        onClick={() => onViewChange('map')}
        aria-label="Map view"
      >
        <svg viewBox="0 0 24 24" className="nav-icon">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span className="nav-label">Mappa</span>
      </button>

      <button
        className={`nav-item ${currentView === 'spots' ? 'active' : ''}`}
        onClick={() => onViewChange('spots')}
        aria-label="Spots list view"
      >
        <svg viewBox="0 0 24 24" className="nav-icon">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
        <span className="nav-label">Spot</span>
      </button>

      {/* FAB - Floating Action Button (centered) */}
      <button
        className="fab"
        onClick={onAddClick}
        aria-label="Add new spot"
      >
        <svg viewBox="0 0 24 24" className="fab-icon">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <button
        className={`nav-item ${currentView === 'gallery' ? 'active' : ''}`}
        onClick={() => onViewChange('gallery')}
        aria-label="Gallery view"
      >
        <svg viewBox="0 0 24 24" className="nav-icon">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span className="nav-label">Gallery</span>
      </button>

      <button
        className={`nav-item ${currentView === 'feed' ? 'active' : ''}`}
        onClick={() => onViewChange('feed')}
        aria-label="Feed view"
      >
        <svg viewBox="0 0 24 24" className="nav-icon">
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
          <polyline points="17 2 12 7 7 2"></polyline>
        </svg>
        <span className="nav-label">Feed</span>
      </button>
    </nav>
  );
}
