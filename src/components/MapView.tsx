import { useEffect, useRef } from 'react';
import { MapService, MILANO_CONFIG } from '../services/MapService';
import type { Spot } from '../types/spot';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

interface MapViewProps {
  spots: Spot[];
  onMapClick: (coords: [number, number]) => void;
  onMarkerClick: (spot: Spot) => void;
}

export function MapView({ spots, onMapClick, onMarkerClick }: MapViewProps) {
  const mapServiceRef = useRef<MapService | null>(null);
  const spotIdsRef = useRef<Set<string>>(new Set());

  // Initialize map on mount
  useEffect(() => {
    const mapService = new MapService();
    mapServiceRef.current = mapService;

    try {
      mapService.initMap('streetmark-map', MILANO_CONFIG.center, MILANO_CONFIG.zoom);

      // Register map click handler
      mapService.onMapClick((coords) => {
        onMapClick(coords);
      });

      // Expose map instance for E2E testing
      if (typeof window !== 'undefined') {
        (window as any).leafletMap = mapService.getMap();
      }
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    // Cleanup on unmount
    return () => {
      if (mapServiceRef.current) {
        mapServiceRef.current.destroy();
        mapServiceRef.current = null;
      }
      spotIdsRef.current.clear();

      // Clean up window reference
      if (typeof window !== 'undefined') {
        delete (window as any).leafletMap;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once - onMapClick is captured in closure

  // Sync markers when spots change
  useEffect(() => {
    const mapService = mapServiceRef.current;
    if (!mapService) return;

    const newSpotIds = new Set(spots.map(s => s.id));
    const currentSpotIds = spotIdsRef.current;

    // Remove markers that are no longer in spots array
    currentSpotIds.forEach(id => {
      if (!newSpotIds.has(id)) {
        mapService.removeMarker(id);
        currentSpotIds.delete(id);
      }
    });

    // Add or update markers
    spots.forEach(spot => {
      if (currentSpotIds.has(spot.id)) {
        // Update existing marker
        mapService.updateMarker(spot);
      } else {
        // Add new marker
        const marker = mapService.addMarker(spot);

        // Register click handler for "Edit" button in popup
        marker.on('popupopen', () => {
          console.log('Popup opened for spot:', spot.id);
          const editButton = document.querySelector(`button[data-spot-id="${spot.id}"]`);
          if (editButton) {
            console.log('Edit button found, attaching click handler');
            editButton.addEventListener('click', () => {
              console.log('Edit button clicked for spot:', spot.id);
              onMarkerClick(spot);
            });
          } else {
            console.warn('Edit button not found for spot:', spot.id);
          }
        });

        currentSpotIds.add(spot.id);
      }
    });

    spotIdsRef.current = currentSpotIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots]); // onMarkerClick is captured in closure, don't re-run on its change

  return (
    <div 
      id="streetmark-map" 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px',
      }}
    />
  );
}
