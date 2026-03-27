// GalleryService - Manage favorite spots for personal gallery
import type { Spot } from '../types/spot';

export class GalleryService {
  /**
   * Get only favorite spots (isFavorite === true)
   */
  getFavoriteSpots(spots: Spot[]): Spot[] {
    return spots.filter(spot => spot.isFavorite === true);
  }

  /**
   * Toggle favorite status (true ↔ false)
   * Returns new spot object (does not mutate original)
   */
  toggleFavorite(spot: Spot): Spot {
    return {
      ...spot,
      isFavorite: !spot.isFavorite,
      updatedAt: Date.now(),
    };
  }

  /**
   * Set favorite to specific value
   * Returns new spot object (does not mutate original)
   */
  setFavorite(spot: Spot, isFavorite: boolean): Spot {
    return {
      ...spot,
      isFavorite,
      updatedAt: Date.now(),
    };
  }

  /**
   * Check if spot is favorite
   */
  isFavorite(spot: Spot): boolean {
    return spot.isFavorite === true;
  }

  /**
   * Sort favorite spots by most recently updated (newest first)
   * Returns new array (does not mutate original)
   */
  sortFavoritesByRecent(favorites: Spot[]): Spot[] {
    return [...favorites].sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
