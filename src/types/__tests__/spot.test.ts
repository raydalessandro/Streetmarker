import { describe, it, expect } from 'vitest';
import type { Spot, SpotType, SpotStatus, SecurityLevel, TimeRange, ExportData } from '../spot';

describe('Spot Types', () => {
  it('should compile valid Spot object', () => {
    const validSpot: Spot = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      coords: [45.4642, 9.1900],
      type: 'wall',
      status: 'free',
      availability: [{ from: '08:00', to: '22:00' }],
      securityLevel: 'low',
      notes: 'Test spot',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    expect(validSpot.id).toBeDefined();
    expect(validSpot.coords).toHaveLength(2);
    expect(validSpot.type).toBe('wall');
  });

  it('should compile Spot with optional fields', () => {
    const spotWithOptionals: Spot = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      coords: [45.4642, 9.1900],
      type: 'train',
      status: 'occupied',
      availability: [],
      securityLevel: 'high',
      owner: 'CrewName',
      notes: 'Spot with owner',
      photos: ['data:image/png;base64,abc123'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    expect(spotWithOptionals.owner).toBe('CrewName');
    expect(spotWithOptionals.photos).toHaveLength(1);
  });

  it('should enforce SpotType union', () => {
    const validTypes: SpotType[] = ['wall', 'train', 'sign', 'other'];
    expect(validTypes).toHaveLength(4);
  });

  it('should enforce SpotStatus union', () => {
    const validStatuses: SpotStatus[] = ['free', 'occupied', 'protected'];
    expect(validStatuses).toHaveLength(3);
  });

  it('should enforce SecurityLevel union', () => {
    const validLevels: SecurityLevel[] = ['low', 'medium', 'high'];
    expect(validLevels).toHaveLength(3);
  });

  it('should compile valid TimeRange', () => {
    const timeRange: TimeRange = {
      from: '09:00',
      to: '18:00'
    };

    expect(timeRange.from).toMatch(/^\d{2}:\d{2}$/);
    expect(timeRange.to).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should compile valid ExportData', () => {
    const exportData: ExportData = {
      version: '1.0.0',
      exportedAt: Date.now(),
      spots: [],
      metadata: {
        appVersion: '1.0.0',
        deviceId: '550e8400-e29b-41d4-a716-446655440000'
      }
    };

    expect(exportData.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(exportData.metadata.deviceId).toBeDefined();
  });
});
