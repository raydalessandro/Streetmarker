// LocationService - Geolocation wrapper with Haversine distance calculation

export interface UserLocation {
  lat: number;
  lng: number;
}

export class LocationService {
  /**
   * Get current user location via browser geolocation API
   * Returns promise that resolves with coords or rejects with error
   */
  getCurrentLocation(timeout = 10000): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS non disponibile'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Permesso GPS negato'));
              break;
            case error.TIMEOUT:
              reject(new Error('GPS timeout, riprova'));
              break;
            default:
              reject(new Error('Errore GPS'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate distance from user location to spot coordinates
   */
  distanceToSpot(userLocation: UserLocation, spotCoords: [number, number]): number {
    return this.haversineDistance(
      userLocation.lat,
      userLocation.lng,
      spotCoords[0],
      spotCoords[1]
    );
  }

  /**
   * Format distance for display
   * < 1km: "XXX m"
   * >= 1km: "X.X km"
   */
  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }
}
