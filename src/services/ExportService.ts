import type { Spot, ExportData } from '../types/spot';

const APP_VERSION = '1.0.0';
const DEVICE_ID_KEY = 'streetmark-device-id';

export class ExportService {
  private deviceId: string;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  /**
   * Get or create a persistent device ID (UUID v4)
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      deviceId = this.generateUUIDv4();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  }

  /**
   * Generate a UUID v4
   */
  private generateUUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Export spots to ExportData format
   */
  exportToJSON(spots: Spot[]): ExportData {
    return {
      version: APP_VERSION,
      exportedAt: Date.now(),
      spots,
      metadata: {
        appVersion: APP_VERSION,
        deviceId: this.deviceId,
      },
    };
  }

  /**
   * Generate filename with current timestamp
   * Format: streetmark-export-YYYY-MM-DD-HHmmss.json
   */
  generateFilename(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `streetmark-export-${year}-${month}-${day}-${hours}${minutes}${seconds}.json`;
  }

  /**
   * Download ExportData as JSON file
   */
  downloadJSON(data: ExportData, filename: string): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  }
}
