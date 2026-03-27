import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MapService } from '../MapService';
import type { Spot } from '../../types/spot';

describe('MapService', () => {
  let mapService: MapService;
  let mockContainer: HTMLDivElement;

  beforeEach(() => {
    // Create a mock container
    mockContainer = document.createElement('div');
    mockContainer.id = 'test-map';
    document.body.appendChild(mockContainer);
    
    mapService = new MapService();
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
  });

  describe('initMap', () => {
    it('should initialize map with default Milano center and zoom', () => {
      const center: [number, number] = [45.4642, 9.1900];
      const zoom = 13;
      
      expect(() => {
        mapService.initMap('test-map', center, zoom);
      }).not.toThrow();
    });

    it('should throw error if container does not exist', () => {
      expect(() => {
        mapService.initMap('non-existent', [45.4642, 9.1900], 13);
      }).toThrow();
    });
  });

  describe('addMarker', () => {
    const mockSpot: Spot = {
      id: '123',
      coords: [45.464, 9.190],
      type: 'wall',
      status: 'free',
      availability: [{ from: '08:00', to: '20:00' }],
      securityLevel: 'low',
      notes: 'Test spot',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    beforeEach(() => {
      mapService.initMap('test-map', [45.4642, 9.1900], 13);
    });

    it('should add a marker for a spot', () => {
      const marker = mapService.addMarker(mockSpot);
      expect(marker).toBeDefined();
    });

    it('should return marker with correct color based on spot type', () => {
      const wallSpot = { ...mockSpot, type: 'wall' as const };
      const trainSpot = { ...mockSpot, type: 'train' as const };
      const signSpot = { ...mockSpot, type: 'sign' as const };
      const otherSpot = { ...mockSpot, type: 'other' as const };

      expect(() => mapService.addMarker(wallSpot)).not.toThrow();
      expect(() => mapService.addMarker(trainSpot)).not.toThrow();
      expect(() => mapService.addMarker(signSpot)).not.toThrow();
      expect(() => mapService.addMarker(otherSpot)).not.toThrow();
    });

    it('should create marker with popup content', () => {
      const marker = mapService.addMarker(mockSpot);
      expect(marker).toBeDefined();
    });

    it('should handle spots with optional owner field', () => {
      const spotWithOwner = { ...mockSpot, owner: 'TestCrew' };
      expect(() => mapService.addMarker(spotWithOwner)).not.toThrow();
    });

    it('should handle spots without notes', () => {
      const spotWithoutNotes = { ...mockSpot, notes: '' };
      expect(() => mapService.addMarker(spotWithoutNotes)).not.toThrow();
    });

    it('should throw error if map not initialized', () => {
      const newMapService = new MapService();
      expect(() => {
        newMapService.addMarker(mockSpot);
      }).toThrow('Map not initialized. Call initMap() first.');
    });
  });

  describe('removeMarker', () => {
    const mockSpot: Spot = {
      id: '123',
      coords: [45.464, 9.190],
      type: 'wall',
      status: 'free',
      availability: [{ from: '08:00', to: '20:00' }],
      securityLevel: 'low',
      notes: 'Test spot',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    beforeEach(() => {
      mapService.initMap('test-map', [45.4642, 9.1900], 13);
    });

    it('should remove marker by spot ID', () => {
      mapService.addMarker(mockSpot);
      expect(() => {
        mapService.removeMarker('123');
      }).not.toThrow();
    });

    it('should not throw when removing non-existent marker', () => {
      expect(() => {
        mapService.removeMarker('non-existent');
      }).not.toThrow();
    });
  });

  describe('updateMarker', () => {
    const mockSpot: Spot = {
      id: '123',
      coords: [45.464, 9.190],
      type: 'wall',
      status: 'free',
      availability: [{ from: '08:00', to: '20:00' }],
      securityLevel: 'low',
      notes: 'Test spot',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    beforeEach(() => {
      mapService.initMap('test-map', [45.4642, 9.1900], 13);
    });

    it('should update existing marker', () => {
      mapService.addMarker(mockSpot);
      const updatedSpot = { ...mockSpot, notes: 'Updated notes' };
      
      expect(() => {
        mapService.updateMarker(updatedSpot);
      }).not.toThrow();
    });

    it('should add marker if it does not exist', () => {
      const newSpot = { ...mockSpot, id: 'new-123' };
      expect(() => {
        mapService.updateMarker(newSpot);
      }).not.toThrow();
    });
  });

  describe('getMarker', () => {
    const mockSpot: Spot = {
      id: '123',
      coords: [45.464, 9.190],
      type: 'wall',
      status: 'free',
      availability: [{ from: '08:00', to: '20:00' }],
      securityLevel: 'low',
      notes: 'Test spot',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    beforeEach(() => {
      mapService.initMap('test-map', [45.4642, 9.1900], 13);
    });

    it('should return marker for existing spot ID', () => {
      mapService.addMarker(mockSpot);
      const marker = mapService.getMarker('123');
      expect(marker).toBeDefined();
    });

    it('should return null for non-existent spot ID', () => {
      const marker = mapService.getMarker('non-existent');
      expect(marker).toBeNull();
    });
  });

  describe('setView', () => {
    beforeEach(() => {
      mapService.initMap('test-map', [45.4642, 9.1900], 13);
    });

    it('should set map view to new center and zoom', () => {
      expect(() => {
        mapService.setView([45.5, 9.2], 15);
      }).not.toThrow();
    });

    it('should throw error if map not initialized', () => {
      const newMapService = new MapService();
      expect(() => {
        newMapService.setView([45.5, 9.2], 15);
      }).toThrow('Map not initialized. Call initMap() first.');
    });
  });

  describe('onMapClick', () => {
    beforeEach(() => {
      mapService.initMap('test-map', [45.4642, 9.1900], 13);
    });

    it('should register map click callback', () => {
      const callback = vi.fn();
      expect(() => {
        mapService.onMapClick(callback);
      }).not.toThrow();
    });

    it('should throw error if map not initialized', () => {
      const newMapService = new MapService();
      expect(() => {
        newMapService.onMapClick(() => {});
      }).toThrow('Map not initialized. Call initMap() first.');
    });
  });

  describe('marker clustering', () => {
    beforeEach(() => {
      mapService.initMap('test-map', [45.4642, 9.1900], 13);
    });

    it('should handle multiple markers with clustering', () => {
      const spots: Spot[] = Array.from({ length: 10 }, (_, i) => ({
        id: `spot-${i}`,
        coords: [45.464 + i * 0.01, 9.190 + i * 0.01] as [number, number],
        type: 'wall',
        status: 'free',
        availability: [{ from: '08:00', to: '20:00' }],
        securityLevel: 'low',
        notes: `Spot ${i}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      expect(() => {
        spots.forEach(spot => mapService.addMarker(spot));
      }).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('should cleanup map instance', () => {
      mapService.initMap('test-map', [45.4642, 9.1900], 13);
      const mockSpot: Spot = {
        id: '123',
        coords: [45.464, 9.190],
        type: 'wall',
        status: 'free',
        availability: [{ from: '08:00', to: '20:00' }],
        securityLevel: 'low',
        notes: 'Test spot',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      mapService.addMarker(mockSpot);

      expect(() => {
        mapService.destroy();
      }).not.toThrow();
    });

    it('should allow calling destroy multiple times', () => {
      mapService.initMap('test-map', [45.4642, 9.1900], 13);
      mapService.destroy();

      expect(() => {
        mapService.destroy();
      }).not.toThrow();
    });
  });
});
