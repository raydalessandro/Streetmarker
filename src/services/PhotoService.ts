// PhotoService - Handle photo upload, validation, compression
export interface PhotoValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PhotoCountResult {
  valid: boolean;
  canAddMore: boolean;
  remaining: number;
  error?: string;
}

export class PhotoService {
  // Constants
  static readonly MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  static readonly MAX_PHOTOS_PER_SPOT = 5;
  static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  static readonly COMPRESSION_THRESHOLD_KB = 1024; // 1MB - compress if larger

  /**
   * Validate photo file (size, type, empty check)
   */
  validatePhoto(file: File): PhotoValidationResult {
    const errors: string[] = [];

    // Check if file is empty
    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Check file size (max 5MB)
    if (file.size > PhotoService.MAX_PHOTO_SIZE) {
      errors.push('Photo size exceeds 5MB limit');
    }

    // Check MIME type
    if (!PhotoService.ALLOWED_TYPES.includes(file.type)) {
      errors.push('Invalid file type. Only JPEG, PNG, and WebP are allowed');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert File to base64 data URL
   */
  async fileToBase64(file: File): Promise<string> {
    if (file.size === 0) {
      throw new Error('Cannot convert empty file');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate photo count (max 5 photos per spot)
   */
  validatePhotoCount(photos: string[]): PhotoCountResult {
    const count = photos.length;
    const max = PhotoService.MAX_PHOTOS_PER_SPOT;

    if (count > max) {
      return {
        valid: false,
        canAddMore: false,
        remaining: 0,
        error: `Maximum ${max} photos per spot`,
      };
    }

    return {
      valid: true,
      canAddMore: count < max,
      remaining: max - count,
    };
  }

  /**
   * Compress image if larger than threshold (1MB)
   * Returns compressed base64 or original if under threshold
   */
  async compressImage(base64: string, maxSizeKB: number): Promise<string> {
    // Validate base64 format
    if (!base64.startsWith('data:image/')) {
      throw new Error('Invalid base64 format');
    }

    const currentSizeKB = this.getPhotoSizeKB(base64);

    // If under threshold, return as-is
    if (currentSizeKB <= maxSizeKB) {
      return base64;
    }

    // TODO: Implement actual compression using canvas API
    // For now, return original (compression requires canvas which needs browser environment)
    // In production, this would:
    // 1. Create Image from base64
    // 2. Draw to canvas with reduced dimensions
    // 3. Convert canvas to compressed base64

    return base64;
  }

  /**
   * Calculate size of base64 photo in KB
   * Base64 encoding: 4 chars = 3 bytes (33% overhead)
   */
  getPhotoSizeKB(base64: string): number {
    // Remove data URL prefix (data:image/jpeg;base64,)
    const base64Data = base64.split(',')[1] || base64;

    // Calculate actual bytes from base64
    // Base64: every 4 chars = 3 bytes
    const bytes = (base64Data.length * 3) / 4;

    // Account for padding (= chars at end)
    const padding = (base64Data.match(/=/g) || []).length;
    const actualBytes = bytes - padding;

    // Convert to KB
    return actualBytes / 1024;
  }

  /**
   * Upload photo: validate + convert to base64
   * Returns base64 string ready for storage
   */
  async uploadPhoto(file: File): Promise<string> {
    // Validate file
    const validation = this.validatePhoto(file);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Convert to base64
    const base64 = await this.fileToBase64(file);

    // Compress if needed (> 1MB)
    const compressed = await this.compressImage(
      base64,
      PhotoService.COMPRESSION_THRESHOLD_KB
    );

    return compressed;
  }
}
