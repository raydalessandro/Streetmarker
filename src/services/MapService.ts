// src/services/MapService.ts
// Leaflet.js wrapper for StreetMark PWA

import L from 'leaflet';
import 'leaflet.markercluster';
import type { Spot } from '../types/spot';

// Marker color mapping based on spot type
const MARKER_COLORS = {
  wall: '#3b82f6',   // blue
  train: '#ef4444',  // red
  sign: '#22c55e',   // green
  other: '#6b7280',  // gray
} as const;

// Milano default configuration
export const MILANO_CONFIG = {
  center: [45.4642, 9.1900] as [number, number],
  zoom: 13,
  minZoom: 10,
  maxZoom: 18,
  tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '© OpenStreetMap contributors | © CartoDB',
} as const;

export class MapService {
  private map: L.Map | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private clusterGroup: L.MarkerClusterGroup | null = null;
  private heatmapCircles: L.Circle[] = [];

  /**
   * Initialize Leaflet map
   * @param containerId - DOM container ID
   * @param center - Initial map center [lat, lng]
   * @param zoom - Initial zoom level
   */
  initMap(containerId: string, center: [number, number], zoom: number): void {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    // Initialize map
    this.map = L.map(containerId).setView(center, zoom);

    // Add OSM tile layer
    L.tileLayer(MILANO_CONFIG.tileUrl, {
      attribution: MILANO_CONFIG.attribution,
      minZoom: MILANO_CONFIG.minZoom,
      maxZoom: MILANO_CONFIG.maxZoom,
    }).addTo(this.map);

    // Initialize marker cluster group
    this.clusterGroup = L.markerClusterGroup({
      disableClusteringAtZoom: 15, // Decluster at zoom 15+
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });
    this.clusterGroup.addTo(this.map);
  }

  /**
   * Add marker for a spot
   * @param spot - Spot data
   * @param isHighlighted - Whether this marker should be highlighted
   * @returns Leaflet Marker instance
   */
  addMarker(spot: Spot, isHighlighted: boolean = false): L.Marker {
    if (!this.map) {
      throw new Error('Map not initialized. Call initMap() first.');
    }

    // Create marker with colored icon
    const color = MARKER_COLORS[spot.type];
    const size = isHighlighted ? 32 : 24;
    const borderWidth = isHighlighted ? 3 : 2;
    const borderColor = isHighlighted ? '#ccff00' : 'white';
    const boxShadow = isHighlighted
      ? '0 0 20px rgba(204, 255, 0, 0.8), 0 2px 4px rgba(0,0,0,0.3)'
      : '0 2px 4px rgba(0,0,0,0.3)';

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div data-spot-id="${spot.id}" style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${borderWidth}px solid ${borderColor};
        box-shadow: ${boxShadow};
        transition: all 0.3s ease;
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });

    try {
      const marker = L.marker(spot.coords, { icon }).bindPopup(this.createPopupContent(spot));

      // Add data-spot-id to marker element for E2E testing
      marker.on('add', () => {
        const element = marker.getElement();
        if (element) {
          element.setAttribute('data-spot-id', spot.id);
        }
      });

      // Add to cluster group
      if (this.clusterGroup) {
        this.clusterGroup.addLayer(marker);
      } else {
        marker.addTo(this.map);
      }

      // Store marker reference
      this.markers.set(spot.id, marker);

      return marker;
    } catch (err) {
      console.error('Error creating marker for spot:', spot.id, err);
      // Create a basic marker without popup as fallback
      const fallbackMarker = L.marker(spot.coords, { icon }).bindPopup(`
        <div>
          <h3>${this.getSpotTypeLabel(spot.type)}</h3>
          <p>Error loading spot details</p>
        </div>
      `);
      if (this.clusterGroup) {
        this.clusterGroup.addLayer(fallbackMarker);
      } else {
        fallbackMarker.addTo(this.map);
      }
      this.markers.set(spot.id, fallbackMarker);
      return fallbackMarker;
    }
  }

  /**
   * Remove marker by spot ID
   * @param spotId - Spot ID
   */
  removeMarker(spotId: string): void {
    const marker = this.markers.get(spotId);
    if (marker) {
      if (this.clusterGroup) {
        this.clusterGroup.removeLayer(marker);
      } else {
        marker.remove();
      }
      this.markers.delete(spotId);
    }
  }

  /**
   * Update existing marker or add new one
   * @param spot - Updated spot data
   * @param isHighlighted - Whether this marker should be highlighted
   */
  updateMarker(spot: Spot, isHighlighted: boolean = false): void {
    // Remove old marker if exists
    this.removeMarker(spot.id);
    // Add updated marker
    this.addMarker(spot, isHighlighted);
  }

  /**
   * Get marker by spot ID
   * @param spotId - Spot ID
   * @returns Leaflet Marker or null
   */
  getMarker(spotId: string): L.Marker | null {
    return this.markers.get(spotId) || null;
  }

  /**
   * Set map view (center and zoom)
   * @param center - New center [lat, lng]
   * @param zoom - New zoom level
   */
  setView(center: [number, number], zoom: number): void {
    if (!this.map) {
      throw new Error('Map not initialized. Call initMap() first.');
    }
    this.map.setView(center, zoom);
  }

  /**
   * Register callback for map click events
   * @param callback - Callback function receiving clicked coordinates
   */
  onMapClick(callback: (coords: [number, number]) => void): void {
    if (!this.map) {
      throw new Error('Map not initialized. Call initMap() first.');
    }
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      callback([e.latlng.lat, e.latlng.lng]);
    });
  }

  /**
   * Create popup HTML content for marker with photos and edit button
   * @param spot - Spot data
   * @returns HTML string
   */
  private createPopupContent(spot: Spot): string {
    let photosHTML = '';

    try {
      if (spot.photos && spot.photos.length > 0) {
        const validPhotos = spot.photos.filter(photo =>
          photo && (photo.startsWith('data:image/') || photo.startsWith('data:video/'))
        );

        if (validPhotos.length > 0) {
          photosHTML = `
            <div style="margin: 8px 0;">
              <strong>Photos (${validPhotos.length}):</strong>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; margin-top: 8px;">
                ${validPhotos.map((photo, index) => {
                  try {
                    const isVideo = photo.startsWith('data:video/');
                    if (isVideo) {
                      return `
                        <video
                          src="${photo}"
                          style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px; cursor: pointer;"
                          controls
                        ></video>
                      `;
                    } else {
                      return `
                        <img
                          src="${photo}"
                          alt="Photo ${index + 1}"
                          style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px; cursor: pointer;"
                          onclick="window.open(this.src, '_blank')"
                        />
                      `;
                    }
                  } catch (err) {
                    console.error('Error rendering photo/video:', err);
                    return ''; // Skip invalid media
                  }
                }).join('')}
              </div>
            </div>
          `;
        }
      }
    } catch (err) {
      console.error('Error rendering photos in popup:', err);
      photosHTML = ''; // Silently skip photos if there's an error
    }

    return `
      <div style="min-width: 200px; max-width: 300px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
          ${this.getSpotTypeLabel(spot.type)}
        </h3>
        <p style="margin: 4px 0;"><strong>Status:</strong> ${spot.status}</p>
        <p style="margin: 4px 0;"><strong>Security:</strong> ${spot.securityLevel}</p>
        ${spot.owner ? `<p style="margin: 4px 0;"><strong>Owner:</strong> ${spot.owner}</p>` : ''}
        ${spot.notes ? `<p style="margin: 4px 0;"><strong>Notes:</strong> ${spot.notes}</p>` : ''}
        ${photosHTML}
        <button
          data-spot-id="${spot.id}"
          style="
            width: 100%;
            margin-top: 12px;
            padding: 8px 16px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            font-size: 14px;
          "
          onmouseover="this.style.background='#5568d3'"
          onmouseout="this.style.background='#667eea'"
        >
          Edit Spot
        </button>
      </div>
    `;
  }

  /**
   * Get human-readable label for spot type
   * @param type - Spot type
   * @returns Label string
   */
  private getSpotTypeLabel(type: Spot['type']): string {
    const labels = {
      wall: 'Wall',
      train: 'Train',
      sign: 'Sign',
      other: 'Other',
    };
    return labels[type];
  }

  /**
   * Get the Leaflet map instance (for testing)
   * @returns Leaflet Map instance or null
   */
  getMap(): L.Map | null {
    return this.map;
  }

  /**
   * Calculate Haversine distance between two coordinates in km
   */
  private haversineDistance(coords1: [number, number], coords2: [number, number]): number {
    const R = 6371; // Earth radius in km
    const dLat = (coords2[0] - coords1[0]) * Math.PI / 180;
    const dLon = (coords2[1] - coords1[1]) * Math.PI / 180;
    const lat1 = coords1[0] * Math.PI / 180;
    const lat2 = coords2[0] * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate density of spots in 500m radius
   */
  private calculateDensity(spot: Spot, allSpots: Spot[]): number {
    return allSpots.filter(s =>
      s.id !== spot.id &&
      this.haversineDistance(spot.coords, s.coords) < 0.5
    ).length;
  }

  /**
   * Get color based on density level
   */
  private getDensityColor(density: number): string {
    if (density >= 5) return '#c8ff00';  // accent (high density)
    if (density >= 2) return '#6db8d1';  // mix (medium density)
    return '#3db4f2';                     // blue (low density)
  }

  /**
   * Get opacity based on density level
   */
  private getDensityOpacity(density: number): number {
    if (density >= 5) return 0.25;
    if (density >= 2) return 0.18;
    return 0.12;
  }

  /**
   * Draw heatmap overlay on the map
   * @param spots - All spots to visualize
   */
  drawHeatmap(spots: Spot[]): void {
    if (!this.map) {
      throw new Error('Map not initialized. Call initMap() first.');
    }

    // Clear existing heatmap
    this.clearHeatmap();

    // Limit to 100 circles for performance
    const spotsToVisualize = spots.length > 100
      ? spots.slice().sort((a, b) => {
          const densityA = this.calculateDensity(a, spots);
          const densityB = this.calculateDensity(b, spots);
          return densityB - densityA; // Sort by density descending
        }).slice(0, 100)
      : spots;

    // Draw circles for each spot
    spotsToVisualize.forEach(spot => {
      const density = this.calculateDensity(spot, spots);
      const color = this.getDensityColor(density);
      const opacity = this.getDensityOpacity(density);

      const circle = L.circle(spot.coords, {
        radius: 200, // meters
        fillColor: color,
        fillOpacity: opacity,
        stroke: false,
        interactive: false,
      });

      circle.addTo(this.map!);
      this.heatmapCircles.push(circle);
    });
  }

  /**
   * Clear heatmap overlay
   */
  clearHeatmap(): void {
    if (!this.map) return;

    this.heatmapCircles.forEach(circle => {
      circle.remove();
    });
    this.heatmapCircles = [];
  }

  /**
   * Cleanup and destroy map instance
   */
  destroy(): void {
    this.clearHeatmap();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers.clear();
    this.clusterGroup = null;
  }
}
