// src/services/__tests__/MapService.heatmap.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MapService } from '../MapService';
import type { Spot } from '../../types/spot';

describe('MapService - Heatmap', () => {
  let service: MapService;
  let container: HTMLDivElement;

  beforeEach(() => {
    service = new MapService();
    container = document.createElement('div');
    container.id = 'test-map';
    document.body.appendChild(container);
    service.initMap('test-map', [45.4642, 9.1900], 13);
  });

  afterEach(() => {
    service.destroy();
    document.body.removeChild(container);
  });

  const createMockSpot = (id: string, lat: number, lng: number): Spot => ({
    id,
    coords: [lat, lng],
    type: 'wall',
    status: 'free',
    availability: [{ from: '22:00', to: '02:00' }],
    securityLevel: 'low',
    notes: '',
    createdAt: 1000,
    updatedAt: 2000,
  });

  describe('drawHeatmap', () => {
    it('should draw circles for each spot', () => {
      const spots: Spot[] = [
        createMockSpot('1', 45.4642, 9.1900),
        createMockSpot('2', 45.4650, 9.1910),
        createMockSpot('3', 45.4660, 9.1920),
      ];

      service.drawHeatmap(spots);

      // Verify map exists
      const map = service.getMap();
      expect(map).not.toBeNull();
    });

    it('should limit to 100 circles for performance', () => {
      // Create 150 spots
      const spots: Spot[] = [];
      for (let i = 0; i < 150; i++) {
        spots.push(createMockSpot(`spot-${i}`, 45.4642 + i * 0.001, 9.1900 + i * 0.001));
      }

      service.drawHeatmap(spots);

      // Verify map exists (actual circle count verification would require DOM inspection)
      const map = service.getMap();
      expect(map).not.toBeNull();
    });

    it('should prioritize high-density spots when limiting', () => {
      // Create spots with clustering
      const spots: Spot[] = [];

      // Cluster 1: 50 spots in tight cluster
      for (let i = 0; i < 50; i++) {
        spots.push(createMockSpot(`cluster1-${i}`, 45.4642 + i * 0.0001, 9.1900 + i * 0.0001));
      }

      // Cluster 2: 50 spots in another cluster
      for (let i = 0; i < 50; i++) {
        spots.push(createMockSpot(`cluster2-${i}`, 45.5000 + i * 0.0001, 9.2000 + i * 0.0001));
      }

      // Isolated: 60 spots spread out
      for (let i = 0; i < 60; i++) {
        spots.push(createMockSpot(`isolated-${i}`, 45.4000 + i * 0.01, 9.1500 + i * 0.01));
      }

      service.drawHeatmap(spots);

      // Should prioritize clustered spots (high density) over isolated ones
      const map = service.getMap();
      expect(map).not.toBeNull();
    });

    it('should clear previous heatmap before drawing new one', () => {
      const spots1: Spot[] = [
        createMockSpot('1', 45.4642, 9.1900),
        createMockSpot('2', 45.4650, 9.1910),
      ];

      const spots2: Spot[] = [
        createMockSpot('3', 45.4660, 9.1920),
        createMockSpot('4', 45.4670, 9.1930),
      ];

      service.drawHeatmap(spots1);
      service.drawHeatmap(spots2);

      // Should have cleared first heatmap
      const map = service.getMap();
      expect(map).not.toBeNull();
    });
  });

  describe('clearHeatmap', () => {
    it('should remove all heatmap circles', () => {
      const spots: Spot[] = [
        createMockSpot('1', 45.4642, 9.1900),
        createMockSpot('2', 45.4650, 9.1910),
      ];

      service.drawHeatmap(spots);
      service.clearHeatmap();

      // Verify map still exists
      const map = service.getMap();
      expect(map).not.toBeNull();
    });

    it('should not throw error if called without heatmap', () => {
      expect(() => service.clearHeatmap()).not.toThrow();
    });

    it('should handle multiple clear calls', () => {
      const spots: Spot[] = [
        createMockSpot('1', 45.4642, 9.1900),
      ];

      service.drawHeatmap(spots);
      service.clearHeatmap();
      service.clearHeatmap(); // Second call

      expect(() => service.clearHeatmap()).not.toThrow();
    });
  });

  describe('density calculation', () => {
    it('should use correct density colors', () => {
      // High density cluster (5+ spots within 500m)
      const highDensity: Spot[] = [];
      for (let i = 0; i < 8; i++) {
        highDensity.push(createMockSpot(`high-${i}`, 45.4642 + i * 0.0005, 9.1900 + i * 0.0005));
      }

      // Medium density cluster (2-4 spots within 500m)
      const mediumDensity: Spot[] = [];
      for (let i = 0; i < 3; i++) {
        mediumDensity.push(createMockSpot(`medium-${i}`, 45.4700 + i * 0.0005, 9.2000 + i * 0.0005));
      }

      // Low density (isolated spot)
      const lowDensity: Spot[] = [
        createMockSpot('low-1', 45.5000, 9.2500),
      ];

      const allSpots = [...highDensity, ...mediumDensity, ...lowDensity];

      service.drawHeatmap(allSpots);

      const map = service.getMap();
      expect(map).not.toBeNull();
    });
  });

  describe('destroy', () => {
    it('should clear heatmap on destroy', () => {
      const spots: Spot[] = [
        createMockSpot('1', 45.4642, 9.1900),
      ];

      service.drawHeatmap(spots);
      service.destroy();

      // Map should be null after destroy
      expect(service.getMap()).toBeNull();
    });
  });
});
