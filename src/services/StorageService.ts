import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Spot } from '../types/spot';

// Database schema definition
interface StreetMarkDB extends DBSchema {
  spots: {
    key: string;
    value: Spot;
  };
}

const DB_NAME = 'streetmark-db';
const DB_VERSION = 1;
const STORE_NAME = 'spots';

/**
 * StorageService - IndexedDB wrapper for spot persistence
 * Implements the StorageService interface from ARCHITECTURE.md
 */
export class StorageService {
  private db: IDBPDatabase<StreetMarkDB> | null = null;

  /**
   * Initialize the IndexedDB database
   * Must be called before any other operations
   */
  async init(): Promise<void> {
    if (this.db) return; // Already initialized

    this.db = await openDB<StreetMarkDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create object store with 'id' as keyPath
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }

  /**
   * Ensure database is initialized
   * @throws Error if database is not initialized
   */
  private ensureInitialized(): IDBPDatabase<StreetMarkDB> {
    if (!this.db) {
      throw new Error('StorageService not initialized. Call init() first.');
    }
    return this.db;
  }

  /**
   * Get a spot by ID
   * @param id Spot UUID
   * @returns Spot object or null if not found
   */
  async getSpot(id: string): Promise<Spot | null> {
    const db = this.ensureInitialized();
    const spot = await db.get(STORE_NAME, id);
    return spot || null;
  }

  /**
   * Get all spots from storage
   * @returns Array of all spots
   */
  async getAllSpots(): Promise<Spot[]> {
    const db = this.ensureInitialized();
    return await db.getAll(STORE_NAME);
  }

  /**
   * Add a new spot to storage
   * @param spot Spot object to add
   * @throws Error if spot with same ID already exists
   */
  async addSpot(spot: Spot): Promise<void> {
    const db = this.ensureInitialized();
    
    // Check if spot already exists
    const existing = await db.get(STORE_NAME, spot.id);
    if (existing) {
      throw new Error(`Spot with id ${spot.id} already exists`);
    }

    await db.add(STORE_NAME, spot);
  }

  /**
   * Update an existing spot
   * @param spot Updated spot object
   * @throws Error if spot doesn't exist
   */
  async updateSpot(spot: Spot): Promise<void> {
    const db = this.ensureInitialized();

    // Check if spot exists
    const existing = await db.get(STORE_NAME, spot.id);
    if (!existing) {
      throw new Error(`Spot with id ${spot.id} not found`);
    }

    await db.put(STORE_NAME, spot);
  }

  /**
   * Delete a spot by ID
   * @param id Spot UUID
   */
  async deleteSpot(id: string): Promise<void> {
    const db = this.ensureInitialized();
    await db.delete(STORE_NAME, id);
  }

  /**
   * Clear all spots from storage
   */
  async clearAllSpots(): Promise<void> {
    const db = this.ensureInitialized();
    await db.clear(STORE_NAME);
  }

  /**
   * Bulk add multiple spots
   * @param spots Array of spots to add
   * @throws Error if any spot already exists (rollback transaction)
   */
  async bulkAddSpots(spots: Spot[]): Promise<void> {
    const db = this.ensureInitialized();

    // Use a transaction for atomicity
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    try {
      for (const spot of spots) {
        // Check if spot already exists
        const existing = await store.get(spot.id);
        if (existing) {
          // Skip duplicates silently (for seed data idempotence)
          continue;
        }
        await store.add(spot);
      }

      await tx.done;
    } catch (error) {
      // Transaction will automatically rollback on error
      throw error;
    }
  }

  /**
   * Seed initial iconic Milano spots if database is empty
   * This method is called on first app launch to populate
   * the map with famous graffiti/street art locations.
   *
   * @returns Number of spots seeded (0 if database was not empty)
   */
  async seedInitialSpots(): Promise<number> {
    const existing = await this.getAllSpots();

    if (existing.length > 0) {
      // Database already has spots, skip seeding
      return 0;
    }

    // Import seed spots dynamically (code splitting)
    const { MILANO_SEED_SPOTS } = await import('../data/seedSpots');

    // Add all seed spots
    await this.bulkAddSpots(MILANO_SEED_SPOTS);

    console.log(`[StorageService] Seeded ${MILANO_SEED_SPOTS.length} iconic Milano spots`);
    return MILANO_SEED_SPOTS.length;
  }
}
