// Test for long press quick add feature in MapView
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MapView } from '../MapView';
import type { Spot } from '../../types/spot';

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn(),
      on: vi.fn(),
      remove: vi.fn(),
      containerPointToLatLng: vi.fn((point) => ({
        lat: 45.4642 + point[0] * 0.0001,
        lng: 9.19 + point[1] * 0.0001,
      })),
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

describe('MapView - Long Press', () => {
  const mockSpot: Spot = {
    id: 'spot-1',
    coords: [45.4642, 9.19],
    type: 'wall',
    status: 'free',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'low',
    owner: 'Test Spot',
    notes: 'Test location',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    // Mock DOM container
    const mapContainer = document.createElement('div');
    mapContainer.id = 'streetmark-map';
    document.body.appendChild(mapContainer);

    // Mock getBoundingClientRect
    mapContainer.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 1000,
      width: 1000,
      height: 1000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('shows long press indicator on touch start', () => {
    const onLongPress = vi.fn();

    const { container } = render(
      <MapView
        spots={[mockSpot]}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
        onLongPress={onLongPress}
      />
    );

    const mapElement = container.querySelector('#streetmark-map');
    expect(mapElement).toBeInTheDocument();

    // Simulate touch start
    fireEvent.touchStart(mapElement!, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    // Indicator should appear
    const indicator = container.querySelector('.long-press-indicator');
    expect(indicator).toBeInTheDocument();
  });

  it('triggers onLongPress after 500ms hold', async () => {
    const onLongPress = vi.fn();

    const { container } = render(
      <MapView
        spots={[mockSpot]}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
        onLongPress={onLongPress}
      />
    );

    const mapElement = container.querySelector('#streetmark-map');

    // Simulate touch start
    fireEvent.touchStart(mapElement!, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    // Advance timer to 500ms
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(onLongPress).toHaveBeenCalledWith(expect.any(Array));
      const coords = onLongPress.mock.calls[0][0];
      expect(coords).toHaveLength(2);
      expect(typeof coords[0]).toBe('number');
      expect(typeof coords[1]).toBe('number');
    });
  });

  it('cancels long press on touch move (pan/drag)', () => {
    const onLongPress = vi.fn();

    const { container } = render(
      <MapView
        spots={[mockSpot]}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
        onLongPress={onLongPress}
      />
    );

    const mapElement = container.querySelector('#streetmark-map');

    // Simulate touch start
    fireEvent.touchStart(mapElement!, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    // Simulate touch move (drag > 10px)
    fireEvent.touchMove(mapElement!, {
      touches: [{ clientX: 120, clientY: 120 }], // ~28px distance
    });

    // Advance timer to 500ms
    vi.advanceTimersByTime(500);

    // Long press should NOT trigger
    expect(onLongPress).not.toHaveBeenCalled();

    // Indicator should disappear
    const indicator = container.querySelector('.long-press-indicator');
    expect(indicator).not.toBeInTheDocument();
  });

  it('cancels long press on touch end before 500ms', () => {
    const onLongPress = vi.fn();

    const { container } = render(
      <MapView
        spots={[mockSpot]}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
        onLongPress={onLongPress}
      />
    );

    const mapElement = container.querySelector('#streetmark-map');

    // Simulate touch start
    fireEvent.touchStart(mapElement!, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    // Advance timer to 300ms (not enough)
    vi.advanceTimersByTime(300);

    // Simulate touch end
    fireEvent.touchEnd(mapElement!);

    // Advance timer to complete 500ms
    vi.advanceTimersByTime(200);

    // Long press should NOT trigger
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('does not show indicator when onLongPress is not provided', () => {
    const { container } = render(
      <MapView
        spots={[mockSpot]}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
      />
    );

    const mapElement = container.querySelector('#streetmark-map');

    // Simulate touch start
    fireEvent.touchStart(mapElement!, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    // Indicator should NOT appear
    const indicator = container.querySelector('.long-press-indicator');
    expect(indicator).not.toBeInTheDocument();
  });

  it('positions indicator at touch coordinates', () => {
    const onLongPress = vi.fn();

    const { container } = render(
      <MapView
        spots={[mockSpot]}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
        onLongPress={onLongPress}
      />
    );

    const mapElement = container.querySelector('#streetmark-map');

    // Simulate touch start at specific position
    fireEvent.touchStart(mapElement!, {
      touches: [{ clientX: 250, clientY: 350 }],
    });

    // Indicator should be positioned correctly (relative to map container)
    const indicator = container.querySelector('.long-press-indicator') as HTMLElement;
    expect(indicator).toBeInTheDocument();
    expect(indicator.style.left).toBe('250px');
    expect(indicator.style.top).toBe('350px');
  });

  it('allows small movement (<10px) without canceling', async () => {
    const onLongPress = vi.fn();

    const { container } = render(
      <MapView
        spots={[mockSpot]}
        onMapClick={vi.fn()}
        onMarkerClick={vi.fn()}
        onLongPress={onLongPress}
      />
    );

    const mapElement = container.querySelector('#streetmark-map');

    // Simulate touch start
    fireEvent.touchStart(mapElement!, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    // Simulate small touch move (< 10px)
    fireEvent.touchMove(mapElement!, {
      touches: [{ clientX: 105, clientY: 105 }], // ~7px distance
    });

    // Advance timer to 500ms
    vi.advanceTimersByTime(500);

    // Long press should STILL trigger
    await waitFor(() => {
      expect(onLongPress).toHaveBeenCalled();
    });
  });
});
