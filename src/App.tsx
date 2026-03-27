import { useState, useEffect, useMemo } from 'react';
import { MapView } from './components/MapView';
import { SpotForm } from './components/SpotForm';
import { SpotList } from './components/SpotList';
import { SpotFilters } from './components/SpotFilters';
import { ImportExport } from './components/ImportExport';
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
      <header className="app-header">
        <div className="header-content">
          <h1>StreetMark Milano</h1>
          <ImportExport spots={spots} onImport={handleImport} />
        </div>
      </header>

      <div className="main">
        <aside className="sidebar">
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
    </div>
  );
}

export default App;
