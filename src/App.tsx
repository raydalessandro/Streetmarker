import { useState, useEffect, useMemo } from 'react';
import { MapView } from './components/MapView';
import { SpotForm } from './components/SpotForm';
import { SpotList } from './components/SpotList';
import { SpotFilters } from './components/SpotFilters';
import { BottomNav, ViewType } from './components/BottomNav';
import { Gallery } from './components/Gallery';
import { Feed } from './components/Feed';
import { SpotListView } from './components/SpotListView';
import { SettingsView } from './components/SettingsView';
import { StorageService } from './services/StorageService';
import { SpotService } from './services/SpotService';
import type { Spot } from './types/spot';
import type { SpotFilters as SpotFiltersType } from './services/SpotService';
import './App.css';

interface MergeResult {
  added: Spot[];
  updated: Spot[];
  conflicts: Spot[];
}

function App() {
  // State management
  const [spots, setSpots] = useState<Spot[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newSpotCoords, setNewSpotCoords] = useState<[number, number] | null>(null);
  const [filters, setFilters] = useState<SpotFiltersType>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<ViewType>('map');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Services (memoized to prevent recreation on every render)
  const storageService = useMemo(() => new StorageService(), []);
  const spotService = useMemo(() => new SpotService(), []);

  // Helper to refresh spots from storage
  const refreshSpots = async () => {
    const allSpots = await storageService.getAllSpots();
    setSpots(allSpots);
  };

  // Load spots on mount
  useEffect(() => {
    const init = async () => {
      try {
        await storageService.init();

        // Seed initial iconic Milano spots if database is empty
        const seededCount = await storageService.seedInitialSpots();
        if (seededCount > 0) {
          console.log(`[App] Seeded ${seededCount} iconic Milano spots on first launch`);
        }

        const allSpots = await storageService.getAllSpots();
        console.log('[App] Loaded spots from IndexedDB:', allSpots.length);
        allSpots.forEach(spot => {
          if (spot.photos && spot.photos.length > 0) {
            console.log(`[App] Spot ${spot.id} has ${spot.photos.length} photos`);
          }
        });
        setSpots(allSpots);
      } catch (error) {
        console.error('Failed to load spots:', error);
      }
    };
    init();
  }, []); // Run only once on mount

  // Apply filters and search when spots/filters/query change
  useEffect(() => {
    let result = [...spots];

    // Apply filters
    result = spotService.filterSpots(result, filters);

    // Apply search
    result = spotService.searchSpots(result, searchQuery);

    setFilteredSpots(result);
  }, [spots, filters, searchQuery]); // No service dependencies

  /**
   * Handle map click - open form for new spot
   */
  const handleMapClick = (coords: [number, number]) => {
    setNewSpotCoords(coords);
    setSelectedSpot(null);
    setIsFormOpen(true);
  };

  /**
   * Handle marker click - open form for editing
   */
  const handleMarkerClick = (spot: Spot) => {
    setSelectedSpot(spot);
    setNewSpotCoords(null);
    setIsFormOpen(true);
  };

  /**
   * Handle form submit - add or update spot
   */
  const handleFormSubmit = async (spotData: Omit<Spot, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('[App] Submitting spot with photos:', spotData.photos?.length || 0);

      if (selectedSpot) {
        // Update existing spot
        const updatedSpot: Spot = {
          ...spotData,
          id: selectedSpot.id,
          createdAt: selectedSpot.createdAt,
          updatedAt: Date.now(),
        };
        console.log('[App] Updating spot:', updatedSpot.id, 'with photos:', updatedSpot.photos?.length || 0);
        await storageService.updateSpot(updatedSpot);
      } else {
        // Add new spot
        const newSpot = spotService.createSpot(spotData);
        console.log('[App] Creating new spot:', newSpot.id, 'with photos:', newSpot.photos?.length || 0);
        await storageService.addSpot(newSpot);
      }

      // Refresh spots and close form
      await refreshSpots();
      console.log('[App] Spots refreshed, total:', spots.length);
      handleFormCancel();
    } catch (error) {
      console.error('Failed to save spot:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to save spot'}`);
    }
  };

  /**
   * Handle form cancel - close form and clear state
   */
  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedSpot(null);
    setNewSpotCoords(null);
  };

  /**
   * Handle spot edit from list
   */
  const handleEdit = (spot: Spot) => {
    setSelectedSpot(spot);
    setNewSpotCoords(null);
    setIsFormOpen(true);
  };

  /**
   * Handle spot delete
   */
  const handleDelete = async (id: string) => {
    try {
      await storageService.deleteSpot(id);
      await refreshSpots();
    } catch (error) {
      console.error('Failed to delete spot:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete spot'}`);
    }
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (newFilters: SpotFiltersType) => {
    setFilters(newFilters);
  };

  /**
   * Handle search change
   */
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  /**
   * Handle view change from BottomNav
   */
  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  /**
   * Handle spot click from views - switch to map and open spot
   */
  const handleSpotClickFromView = (spot: Spot) => {
    setCurrentView('map');
    setSelectedSpot(spot);
    setNewSpotCoords(null);
    setIsFormOpen(true);
  };

  /**
   * Handle import - bulk add/update spots
   */
  const handleImport = async (mergeResult: MergeResult) => {
    try {
      // Add new spots
      if (mergeResult.added.length > 0) {
        await storageService.bulkAddSpots(mergeResult.added);
      }

      // Update existing spots
      for (const spot of mergeResult.updated) {
        await storageService.updateSpot(spot);
      }

      // Refresh spots
      await refreshSpots();
    } catch (error) {
      console.error('Failed to import spots:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to import spots'}`);
    }
  };

  return (
    <div className="app">
      {/* Header - Only on Map View */}
      {currentView === 'map' && (
        <header className="app-header">
          <div className="header-content">
            <button
              className="hamburger-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div className="logo-container">
              <img src="/assets/logo.jpg" alt="StreetMark" className="logo-image" />
              <h1>
                STREET<span className="neon-text">MARK</span>
                <span className="logo-subtitle">MILAN</span>
              </h1>
            </div>
            <div className="status-badge">REC // LOCAL</div>
          </div>
        </header>
      )}

      <div className="main">
        {/* Map View with Sidebar */}
        {currentView === 'map' && (
          <>
            {/* Sidebar Overlay */}
            {isSidebarOpen && (
              <div
                className="sidebar-overlay visible"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar Drawer */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
              <button
                className="sidebar-close"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <SpotFilters
                onFilterChange={handleFilterChange}
                onSearchChange={handleSearchChange}
              />
              <SpotList
                spots={filteredSpots}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </aside>

            <div className="map-container">
              <MapView
                spots={filteredSpots}
                onMapClick={handleMapClick}
                onMarkerClick={handleMarkerClick}
              />
            </div>
          </>
        )}

        {/* Spots View */}
        {currentView === 'spots' && (
          <SpotListView
            spots={filteredSpots}
            onSpotClick={handleSpotClickFromView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {/* Gallery View */}
        {currentView === 'gallery' && (
          <Gallery
            spots={filteredSpots}
            onSpotClick={handleSpotClickFromView}
          />
        )}

        {/* Feed View */}
        {currentView === 'feed' && (
          <Feed
            spots={filteredSpots}
            onSpotClick={handleSpotClickFromView}
          />
        )}

        {/* Settings View */}
        {currentView === 'settings' && (
          <SettingsView
            spots={spots}
            onImport={handleImport}
          />
        )}
      </div>

      {isFormOpen && (
        <div className="modal-overlay" onClick={handleFormCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <SpotForm
              spot={selectedSpot || undefined}
              initialCoords={newSpotCoords || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav
        currentView={currentView}
        onViewChange={handleViewChange}
      />
    </div>
  );
}

export default App;
