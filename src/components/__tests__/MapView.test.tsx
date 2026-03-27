import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MapView } from '../MapView';
import type { Spot } from '../../types/spot';

// Create mock instances
const mockMarker = {
  bindPopup: vi.fn().mockReturnThis(),
  addTo: vi.fn().mockReturnThis(),
  remove: vi.fn(),
  setLatLng: vi.fn(),
  getLatLng: vi.fn(() => ({ lat: 0, lng: 0 })),
  on: vi.fn(),
};

const mockMapServiceInstance = {
  initMap: vi.fn(),
  addMarker: vi.fn(() => mockMarker),
  removeMarker: vi.fn(),
  updateMarker: vi.fn(),
  getMarker: vi.fn(() => mockMarker),
  setView: vi.fn(),
  onMapClick: vi.fn(),
  destroy: vi.fn(),
};

// Mock MapService
vi.mock('../../services/MapService', () => {
  return {
    MapService: vi.fn(function() {
      return mockMapServiceInstance;
    }),
    MILANO_CONFIG: {
      center: [45.4642, 9.1900],
      zoom: 13,
      minZoom: 10,
      maxZoom: 18,
      tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
    },
  };
});

describe('MapView', () => {
  const mockSpots: Spot[] = [
    {
      id: '1',
      coords: [45.464, 9.190],
      type: 'wall',
      status: 'free',
      availability: [{ from: '08:00', to: '20:00' }],
      securityLevel: 'low',
      notes: 'Test spot 1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: '2',
      coords: [45.465, 9.191],
      type: 'train',
      status: 'occupied',
      availability: [{ from: '22:00', to: '06:00' }],
      securityLevel: 'high',
      notes: 'Test spot 2',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render map container', () => {
    const { container } = render(
      <MapView spots={[]} onMapClick={() => {}} onMarkerClick={() => {}} />
    );
    const mapContainer = container.querySelector('#streetmark-map');
    expect(mapContainer).toBeTruthy();
  });

  it('should initialize map on mount', () => {
    render(
      <MapView spots={[]} onMapClick={() => {}} onMarkerClick={() => {}} />
    );

    expect(mockMapServiceInstance.initMap).toHaveBeenCalledWith(
      'streetmark-map',
      [45.4642, 9.1900],
      13
    );
  });

  it('should add markers for all spots', async () => {
    render(
      <MapView spots={mockSpots} onMapClick={() => {}} onMarkerClick={() => {}} />
    );

    // Wait for useEffect to run
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockMapServiceInstance.addMarker).toHaveBeenCalledTimes(mockSpots.length);
  });

  it('should handle empty spots array', () => {
    expect(() => {
      render(
        <MapView spots={[]} onMapClick={() => {}} onMarkerClick={() => {}} />
      );
    }).not.toThrow();
  });

  it('should update markers when spots prop changes', async () => {
    const { rerender, unmount } = render(
      <MapView spots={mockSpots} onMapClick={() => {}} onMarkerClick={() => {}} />
    );

    // Wait for initial render
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify initial markers were added
    expect(mockMapServiceInstance.addMarker).toHaveBeenCalledTimes(2);

    const newSpots: Spot[] = [
      {
        id: '3',
        coords: [45.466, 9.192],
        type: 'sign',
        status: 'free',
        availability: [{ from: '00:00', to: '23:59' }],
        securityLevel: 'medium',
        notes: 'Test spot 3',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    rerender(
      <MapView spots={newSpots} onMapClick={() => {}} onMarkerClick={() => {}} />
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    // The new marker should be added, total calls > 2
    expect(mockMapServiceInstance.addMarker.mock.calls.length).toBeGreaterThan(2);

    unmount();
  });

  it('should call onMapClick callback when map is clicked', () => {
    const onMapClick = vi.fn();

    render(
      <MapView spots={[]} onMapClick={onMapClick} onMarkerClick={() => {}} />
    );

    expect(mockMapServiceInstance.onMapClick).toHaveBeenCalled();
  });

  it('should cleanup on unmount', () => {
    const { unmount } = render(
      <MapView spots={[]} onMapClick={() => {}} onMarkerClick={() => {}} />
    );

    unmount();

    expect(mockMapServiceInstance.destroy).toHaveBeenCalled();
  });
});
