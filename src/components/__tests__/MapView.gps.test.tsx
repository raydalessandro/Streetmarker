// Test for GPS "Sono qui ora" feature in MapView
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MapView } from '../MapView';
import type { Spot } from '../../types/spot';

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn(),
      on: vi.fn(),
      remove: vi.fn(),
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn(),
    })),
    marker: vi.fn(() => ({
      addTo: vi.fn(),
      bindPopup: vi.fn(() => ({
        openPopup: vi.fn(),
      })),
      on: vi.fn(),
      setLatLng: vi.fn(),
    })),
    divIcon: vi.fn(() => ({})),
    markerClusterGroup: vi.fn(() => ({
      addTo: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      clearLayers: vi.fn(),
      hasLayer: vi.fn(() => false),
    })),
  },
}));

vi.mock('leaflet.markercluster', () => ({}));

describe('MapView - GPS Feature', () => {
  const mockSpot: Spot = {
    id: 'spot-1',
    coords: [45.4642, 9.19], // Milan
    type: 'wall',
    status: 'free',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'low',
    owner: 'Test Spot',
    notes: 'Test location',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockNearbySpot: Spot = {
    ...mockSpot,
    id: 'spot-nearby',
    coords: [45.469, 9.195], // ~600m from Milan center
    owner: 'Nearby Spot',
  };

  beforeEach(() => {
    // Mock DOM container
    const mapContainer = document.createElement('div');
    mapContainer.id = 'streetmark-map';
    document.body.appendChild(mapContainer);

    // Reset geolocation mock
    delete (global.navigator as any).geolocation;
  });

  it('shows GPS FAB when geolocation is available', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn() },
      writable: true,
      configurable: true,
    });

    render(
      <MapView
        spots={[mockSpot]}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
      />
    );

    const gpsFab = screen.getByRole('button', { name: /get current location/i });
    expect(gpsFab).toBeInTheDocument();
    expect(gpsFab).toHaveClass('gps-fab');
  });

  it('hides GPS FAB when geolocation is not available', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    render(
      <MapView
        spots={[mockSpot]}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
      />
    );

    const gpsFab = screen.queryByRole('button', { name: /get current location/i });
    expect(gpsFab).not.toBeInTheDocument();
  });

  it('requests user location when GPS FAB is clicked', async () => {
    const mockGetCurrentPosition = vi.fn((success) =>
      success({
        coords: {
          latitude: 45.4642,
          longitude: 9.19,
        },
      })
    );

    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    render(
      <MapView
        spots={[mockSpot]}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
      />
    );

    const gpsFab = screen.getByRole('button', { name: /get current location/i });
    fireEvent.click(gpsFab);

    await waitFor(() => {
      expect(mockGetCurrentPosition).toHaveBeenCalled();
    });
  });

  it('shows nearby spots strip when location is obtained', async () => {
    const mockGetCurrentPosition = vi.fn((success) =>
      success({
        coords: {
          latitude: 45.4642,
          longitude: 9.19,
        },
      })
    );

    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    render(
      <MapView
        spots={[mockNearbySpot]}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
      />
    );

    const gpsFab = screen.getByRole('button', { name: /get current location/i });
    fireEvent.click(gpsFab);

    await waitFor(() => {
      expect(screen.getByText(/spot vicini disponibili ora/i)).toBeInTheDocument();
      expect(screen.getByText('Nearby Spot')).toBeInTheDocument();
    });
  });

  it('shows error toast when GPS permission is denied', async () => {
    const mockGetCurrentPosition = vi.fn((success, error) =>
      error({
        code: 1, // PERMISSION_DENIED
        message: 'User denied geolocation',
      })
    );

    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    render(
      <MapView
        spots={[mockSpot]}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
      />
    );

    const gpsFab = screen.getByRole('button', { name: /get current location/i });
    fireEvent.click(gpsFab);

    await waitFor(() => {
      expect(screen.getByText(/permesso gps negato/i)).toBeInTheDocument();
    });
  });

  it('shows error toast on GPS timeout', async () => {
    const mockGetCurrentPosition = vi.fn((success, error) =>
      error({
        code: 3, // TIMEOUT
        message: 'Timeout',
      })
    );

    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    render(
      <MapView
        spots={[mockSpot]}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
      />
    );

    const gpsFab = screen.getByRole('button', { name: /get current location/i });
    fireEvent.click(gpsFab);

    await waitFor(() => {
      expect(screen.getByText(/gps timeout, riprova/i)).toBeInTheDocument();
    });
  });

  it('filters and sorts nearby spots by distance', async () => {
    const mockGetCurrentPosition = vi.fn((success) =>
      success({
        coords: {
          latitude: 45.4642,
          longitude: 9.19,
        },
      })
    );

    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    const spots = [
      { ...mockSpot, id: 'spot-1', coords: [45.5, 9.3] as [number, number], owner: 'Far Spot' }, // ~15km
      mockNearbySpot, // ~600m
      { ...mockSpot, id: 'spot-3', coords: [45.465, 9.191] as [number, number], owner: 'Closest Spot' }, // ~100m
    ];

    render(
      <MapView
        spots={spots}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
      />
    );

    const gpsFab = screen.getByRole('button', { name: /get current location/i });
    fireEvent.click(gpsFab);

    await waitFor(() => {
      const nearbySpotCards = screen.getAllByRole('button', {
        name: (content, element) => element?.classList.contains('nearby-spot-card') || false,
      });

      // Should show max 3 spots, sorted by distance
      expect(nearbySpotCards.length).toBeLessThanOrEqual(3);

      // Closest spot should appear first
      const firstSpotName = nearbySpotCards[0].querySelector('.nearby-spot-name');
      expect(firstSpotName?.textContent).toBe('Closest Spot');
    });
  });

  it('only shows spots available now in nearby strip', async () => {
    const mockGetCurrentPosition = vi.fn((success) =>
      success({
        coords: {
          latitude: 45.4642,
          longitude: 9.19,
        },
      })
    );

    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    const unavailableSpot = {
      ...mockNearbySpot,
      id: 'spot-unavailable',
      availability: [{ from: '22:00', to: '06:00' }], // Night only
    };

    render(
      <MapView
        spots={[mockNearbySpot, unavailableSpot]}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
      />
    );

    const gpsFab = screen.getByRole('button', { name: /get current location/i });
    fireEvent.click(gpsFab);

    await waitFor(() => {
      // Should only show available spot
      expect(screen.getByText('Nearby Spot')).toBeInTheDocument();
      expect(screen.queryByText(/unavailable/i)).not.toBeInTheDocument();
    });
  });
});
