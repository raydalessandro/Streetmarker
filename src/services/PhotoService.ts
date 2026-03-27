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
  static readonly MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  static readonly MAX_PHOTOS_PER_SPOT = 10; // 10 photos max
  static readonly MAX_VIDEOS_PER_SPOT = 5;  // 5 videos max
  static readonly MAX_MEDIA_PER_SPOT = 15;  // 15 total (photos + videos)
  static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  static readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
  static readonly COMPRESSION_THRESHOLD_KB = 1024; // 1MB - compress if larger

  /**
   * Check if file is video
   */
  isVideo(file: File): boolean {
    return file.type.startsWith('video/');
  }

  /**
   * Check if file is image
   */
  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Validate media file (photo or video)
   */
  validatePhoto(file: File): PhotoValidationResult {
    const errors: string[] = [];

    // Check if file is empty
    if (file.size === 0) {
      errors.push('File is empty');
    }

    const isVideo = this.isVideo(file);
    const isImage = this.isImage(file);

    // Check if it's a supported media type
    if (!isVideo && !isImage) {
      errors.push('Invalid file type. Only images (JPEG, PNG, WebP) and videos (MP4, WebM, MOV) are allowed');
      return { valid: false, errors };
    }

    // Check file size based on type
    if (isImage && file.size > PhotoService.MAX_PHOTO_SIZE) {
      errors.push('Photo size exceeds 5MB limit');
    }

    if (isVideo && file.size > PhotoService.MAX_VIDEO_SIZE) {
      errors.push('Video size exceeds 10MB limit');
    }

    // Check MIME type
    if (isImage && !PhotoService.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      errors.push('Invalid image type. Only JPEG, PNG, and WebP are allowed');
    }

    if (isVideo && !PhotoService.ALLOWED_VIDEO_TYPES.includes(file.type)) {
      errors.push('Invalid video type. Only MP4, WebM, and MOV are allowed');
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
   * Validate media count (max 10 photos + 5 videos = 15 total per spot)
   */
  validatePhotoCount(photos: string[]): PhotoCountResult {
    const count = photos.length;
    const max = PhotoService.MAX_MEDIA_PER_SPOT;

    if (count > max) {
      return {
        valid: false,
        canAddMore: false,
        remaining: 0,
        error: `Maximum ${max} media files per spot`,
      };
    }

    return {
      valid: true,
      canAddMore: count < max,
      remaining: max - count,
    };
  }

  /**
   * Count photos and videos separately in media array
   */
  countMediaTypes(photos: string[]): { photoCount: number; videoCount: number } {
    let photoCount = 0;
    let videoCount = 0;

    photos.forEach(base64 => {
      if (base64.startsWith('data:video/')) {
        videoCount++;
      } else if (base64.startsWith('data:image/')) {
        photoCount++;
      }
    });

    return { photoCount, videoCount };
  }

  /**
   * Validate media count with separate photo/video limits
   */
  validateMediaLimits(photos: string[]): PhotoCountResult {
    const { photoCount, videoCount } = this.countMediaTypes(photos);
    const totalCount = photos.length;

    const errors: string[] = [];

    if (photoCount > PhotoService.MAX_PHOTOS_PER_SPOT) {
      errors.push(`Maximum ${PhotoService.MAX_PHOTOS_PER_SPOT} photos allowed (current: ${photoCount})`);
    }

    if (videoCount > PhotoService.MAX_VIDEOS_PER_SPOT) {
      errors.push(`Maximum ${PhotoService.MAX_VIDEOS_PER_SPOT} videos allowed (current: ${videoCount})`);
    }

    if (totalCount > PhotoService.MAX_MEDIA_PER_SPOT) {
      errors.push(`Maximum ${PhotoService.MAX_MEDIA_PER_SPOT} total media files allowed (current: ${totalCount})`);
    }

    return {
      valid: errors.length === 0,
      canAddMore: totalCount < PhotoService.MAX_MEDIA_PER_SPOT,
      remaining: PhotoService.MAX_MEDIA_PER_SPOT - totalCount,
      error: errors.length > 0 ? errors.join(', ') : undefined,
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
