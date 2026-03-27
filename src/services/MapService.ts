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
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
} as const;

export class MapService {
  private map: L.Map | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private clusterGroup: L.MarkerClusterGroup | null = null;

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
   * @returns Leaflet Marker instance
   */
  addMarker(spot: Spot): L.Marker {
    if (!this.map) {
      throw new Error('Map not initialized. Call initMap() first.');
    }

    // Create marker with colored icon
    const color = MARKER_COLORS[spot.type];
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div data-spot-id="${spot.id}" style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

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
   */
  updateMarker(spot: Spot): void {
    // Remove old marker if exists
    this.removeMarker(spot.id);
    // Add updated marker
    this.addMarker(spot);
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
    const photosHTML = spot.photos && spot.photos.length > 0
      ? `
        <div style="margin: 8px 0;">
          <strong>Photos (${spot.photos.length}):</strong>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; margin-top: 8px;">
            ${spot.photos.map((photo, index) => {
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
            }).join('')}
          </div>
        </div>
      `
      : '';

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
   * Cleanup and destroy map instance
   */
  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers.clear();
    this.clusterGroup = null;
  }
}
