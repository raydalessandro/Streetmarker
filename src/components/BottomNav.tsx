import './BottomNav.css';

export type ViewType = 'map' | 'spots' | 'gallery' | 'feed' | 'settings';

interface BottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function BottomNav({ currentView, onViewChange }: BottomNavProps) {
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

      {/* FAB - Settings Button (centered) */}
      <button
        className="fab"
        onClick={() => onViewChange('settings')}
        aria-label="Settings"
      >
        <svg viewBox="0 0 24 24" className="fab-icon">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m8.66-15.66l-4.24 4.24m-4.24 4.24l-4.24 4.24M23 12h-6m-6 0H1m20.66 8.66l-4.24-4.24m-4.24-4.24l-4.24-4.24"></path>
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
