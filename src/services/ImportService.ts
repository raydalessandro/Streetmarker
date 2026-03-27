import type { Spot, ExportData } from '../types/spot';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface MergeResult {
  added: Spot[];
  updated: Spot[];
  conflicts: Spot[];
}

export class ImportService {
  /**
   * Validate import data structure and content
   */
  validateImportData(data: unknown): ValidationResult {
    const errors: string[] = [];

    // Type guard
    if (typeof data !== 'object' || data === null) {
      return { valid: false, errors: ['Data must be an object'] };
    }

    const exportData = data as Partial<ExportData>;

    // Check required fields
    if (!exportData.version) {
      errors.push('Missing required field: version');
    }
    if (exportData.exportedAt === undefined) {
      errors.push('Missing required field: exportedAt');
    }
    if (!exportData.spots) {
      errors.push('Missing required field: spots');
    }
    if (!exportData.metadata) {
      errors.push('Missing required field: metadata');
    }

    // Validate spots is an array
    if (exportData.spots && !Array.isArray(exportData.spots)) {
      errors.push('spots must be an array');
    }

    // Validate version format and compatibility
    if (exportData.version) {
      const versionRegex = /^\d+\.\d+\.\d+$/;
      if (!versionRegex.test(exportData.version)) {
        errors.push(`Invalid version format: ${exportData.version}`);
      } else {
        const [major] = exportData.version.split('.').map(Number);
        if (major !== 1) {
          errors.push(`Incompatible version: ${exportData.version} (only 1.x.x supported)`);
        }
      }
    }

    // Validate each spot
    if (Array.isArray(exportData.spots)) {
      exportData.spots.forEach((spot, index) => {
        const spotErrors = this.validateSpot(spot);
        if (spotErrors.length > 0) {
          errors.push(`Spot ${index}: ${spotErrors.join(', ')}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a single spot
   */
  private validateSpot(spot: any): string[] {
    const errors: string[] = [];

    if (!spot.id) errors.push('missing id');
    if (!spot.coords || !Array.isArray(spot.coords) || spot.coords.length !== 2) {
      errors.push('invalid coords');
    }
    if (!spot.type || !['wall', 'train', 'sign', 'other'].includes(spot.type)) {
      errors.push('invalid type');
    }
    if (!spot.status || !['free', 'occupied', 'protected'].includes(spot.status)) {
      errors.push('invalid status');
    }
    if (!spot.availability || !Array.isArray(spot.availability)) {
      errors.push('invalid availability');
    }
    if (!spot.securityLevel || !['low', 'medium', 'high'].includes(spot.securityLevel)) {
      errors.push('invalid securityLevel');
    }
    if (spot.notes === undefined || typeof spot.notes !== 'string') {
      errors.push('invalid notes');
    }
    if (!spot.createdAt || typeof spot.createdAt !== 'number') {
      errors.push('invalid createdAt');
    }
    if (!spot.updatedAt || typeof spot.updatedAt !== 'number') {
      errors.push('invalid updatedAt');
    }

    return errors;
  }

  /**
   * Parse import file and return ExportData
   */
  async parseImportFile(file: File): Promise<ExportData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          if (!text || text.trim() === '') {
            reject(new Error('Empty file'));
            return;
          }

          const data = JSON.parse(text);
          resolve(data as ExportData);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Merge imported spots with existing spots
   * Strategy:
   * - New spots (id not in existing) → added
   * - Existing spots with newer timestamp → updated
   * - Existing spots with older/same timestamp → conflicts (keep existing)
   */
  mergeSpots(existing: Spot[], imported: Spot[]): MergeResult {
    const added: Spot[] = [];
    const updated: Spot[] = [];
    const conflicts: Spot[] = [];

    // Create map of existing spots by id
    const existingMap = new Map<string, Spot>();
    existing.forEach((spot) => {
      existingMap.set(spot.id, spot);
    });

    // Process each imported spot
    imported.forEach((importedSpot) => {
      const existingSpot = existingMap.get(importedSpot.id);

      if (!existingSpot) {
        // New spot
        added.push(importedSpot);
      } else if (importedSpot.updatedAt > existingSpot.updatedAt) {
        // Newer version
        updated.push(importedSpot);
      } else {
        // Older or same timestamp - conflict
        conflicts.push(importedSpot);
      }
    });

    return { added, updated, conflicts };
  }
}
