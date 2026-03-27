import { useEffect, useRef, useState } from 'react';
import { MapService, MILANO_CONFIG } from '../services/MapService';
import { LocationService, type UserLocation } from '../services/LocationService';
import { SpotService } from '../services/SpotService';
import type { Spot } from '../types/spot';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';

interface MapViewProps {
  spots: Spot[];
  highlightedSpotId?: string | null;
  onMapClick: (coords: [number, number]) => void;
  onMarkerClick: (spot: Spot) => void;
  onLongPress?: (coords: [number, number]) => void;
}

interface SpotWithDistance extends Spot {
  distance: number; // km
}

export function MapView({ spots, highlightedSpotId, onMapClick, onMarkerClick, onLongPress }: MapViewProps) {
  const mapServiceRef = useRef<MapService | null>(null);
  const spotIdsRef = useRef<Set<string>>(new Set());
  const locationServiceRef = useRef<LocationService>(new LocationService());
  const spotServiceRef = useRef<SpotService>(new SpotService());
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [_userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [nearbySpots, setNearbySpots] = useState<SpotWithDistance[]>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGpsAvailable] = useState(() => !!navigator.geolocation);
  const [isHeatmapActive, setIsHeatmapActive] = useState(false);

  // Long press state
  const longPressTimerRef = useRef<number | undefined>(undefined);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const [_longPressCoords, setLongPressCoords] = useState<[number, number] | null>(null);
  const [showLongPressIndicator, setShowLongPressIndicator] = useState(false);
  const [longPressIndicatorPos, setLongPressIndicatorPos] = useState<{ x: number; y: number } | null>(null);

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
      const isHighlighted = spot.id === highlightedSpotId;

      if (currentSpotIds.has(spot.id)) {
        // Update existing marker
        mapService.updateMarker(spot, isHighlighted);
      } else {
        // Add new marker
        const marker = mapService.addMarker(spot, isHighlighted);

        // Register click handler - open detail modal instead of edit
        marker.on('click', () => {
          console.log('Marker clicked for spot:', spot.id);
          onMarkerClick(spot);
        });

        currentSpotIds.add(spot.id);
      }
    });

    spotIdsRef.current = currentSpotIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots, highlightedSpotId]); // Re-run when highlightedSpotId changes

  // Update heatmap when toggle changes or spots change
  useEffect(() => {
    const mapService = mapServiceRef.current;
    if (!mapService) return;

    if (isHeatmapActive) {
      mapService.drawHeatmap(spots);
    } else {
      mapService.clearHeatmap();
    }
  }, [isHeatmapActive, spots]);

  // Handle GPS FAB click
  const handleGpsClick = async () => {
    const mapService = mapServiceRef.current;
    if (!mapService) return;

    try {
      setGpsError(null);

      // Get user location
      const location = await locationServiceRef.current.getCurrentLocation();
      setUserLocation(location);

      // Center map on user location
      const map = mapService.getMap();
      if (map) {
        map.setView([location.lat, location.lng], 15);
      }

      // Add/update "you are here" marker
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([location.lat, location.lng]);
      } else {
        const icon = L.divIcon({
          className: 'user-location-marker',
          html: `<div style="
            background-color: var(--accent);
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 20px rgba(200, 255, 0, 0.8);
            animation: pulse 2s infinite;
          "></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([location.lat, location.lng], { icon });
        marker.bindPopup('Tu sei qui');
        marker.addTo(map!);
        userMarkerRef.current = marker;
      }

      // Calculate distances and sort spots
      const spotsWithDistance: SpotWithDistance[] = spots
        .filter((spot) => spotServiceRef.current.isSpotAvailableNow(spot)) // Only available now
        .map((spot) => ({
          ...spot,
          distance: locationServiceRef.current.distanceToSpot(location, spot.coords),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3); // Top 3 nearest

      setNearbySpots(spotsWithDistance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore GPS';
      setGpsError(errorMessage);
      setTimeout(() => setGpsError(null), 3000); // Clear error after 3s
    }
  };

  // Handle nearby spot click
  const handleNearbySpotClick = (spot: Spot) => {
    const mapService = mapServiceRef.current;
    if (!mapService) return;

    // Highlight marker and open detail modal
    onMarkerClick(spot);

    // Center map on spot
    const map = mapService.getMap();
    if (map) {
      map.setView(spot.coords, 16);
    }
  };

  // Long press handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onLongPress) return;

    const touch = e.touches[0];
    const mapElement = document.getElementById('streetmark-map');
    if (!mapElement) return;

    // Store initial touch position
    longPressStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    // Show indicator at touch position
    const rect = mapElement.getBoundingClientRect();
    setLongPressIndicatorPos({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
    setShowLongPressIndicator(true);

    // Start timer (500ms)
    longPressTimerRef.current = window.setTimeout(() => {
      // Get coordinates from map
      const mapService = mapServiceRef.current;
      if (!mapService) return;

      const map = mapService.getMap();
      if (!map) return;

      const point = map.containerPointToLatLng([touch.clientX - rect.left, touch.clientY - rect.top]);
      const coords: [number, number] = [point.lat, point.lng];

      setLongPressCoords(coords);
      setShowLongPressIndicator(false);

      // Trigger callback
      onLongPress(coords);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!longPressStartRef.current || !longPressTimerRef.current) return;

    const touch = e.touches[0];
    const dx = touch.clientX - longPressStartRef.current.x;
    const dy = touch.clientY - longPressStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Cancel if moved more than 10px (it's a pan/drag, not a long press)
    if (distance > 10) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
      longPressStartRef.current = null;
      setShowLongPressIndicator(false);
    }
  };

  const handleTouchEnd = () => {
    // Cancel timer if touch ended before 500ms
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
    longPressStartRef.current = null;
    setShowLongPressIndicator(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        id="streetmark-map"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Long Press Indicator */}
      {showLongPressIndicator && longPressIndicatorPos && (
        <div
          className="long-press-indicator"
          style={{
            left: `${longPressIndicatorPos.x}px`,
            top: `${longPressIndicatorPos.y}px`,
          }}
        />
      )}

      {/* Map Controls */}
      <div className="map-controls">
        {/* Heatmap Toggle */}
        <button
          className={`map-control-btn ${isHeatmapActive ? 'active' : ''}`}
          onClick={() => setIsHeatmapActive(!isHeatmapActive)}
          aria-label="Toggle heatmap"
          title="Toggle density heatmap"
        >
          🔥
        </button>

        {/* GPS FAB */}
        {isGpsAvailable && (
          <button
            className="map-control-btn"
            onClick={handleGpsClick}
            aria-label="Get current location"
            title="Find my location"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
            </svg>
          </button>
        )}
      </div>

      {/* GPS Error Toast */}
      {gpsError && (
        <div className="gps-error-toast">
          {gpsError}
        </div>
      )}

      {/* Nearby Spots Strip */}
      {nearbySpots.length > 0 && (
        <div className="nearby-spots-strip">
          <div className="nearby-spots-header">
            <span>Spot vicini disponibili ora</span>
          </div>
          <div className="nearby-spots-list">
            {nearbySpots.map((spot) => (
              <button
                key={spot.id}
                className="nearby-spot-card"
                onClick={() => handleNearbySpotClick(spot)}
              >
                <span className="nearby-spot-name">
                  {spot.owner || `${spot.type} spot`}
                </span>
                <span className="nearby-spot-distance">
                  {locationServiceRef.current.formatDistance(spot.distance)}
                </span>
                <span className={`nearby-spot-type type-${spot.type}`}>
                  {spot.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
