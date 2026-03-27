// Unit tests for PhotoService - TDD RED phase
import { describe, it, expect, beforeEach } from 'vitest';
import { PhotoService } from '../PhotoService';

describe('PhotoService', () => {
  let service: PhotoService;

  beforeEach(() => {
    service = new PhotoService();
  });

  describe('validatePhoto', () => {
    it('should accept valid JPEG photo under 5MB', () => {
      const validFile = new File(
        ['x'.repeat(1000000)], // 1MB
        'photo.jpg',
        { type: 'image/jpeg' }
      );

      const result = service.validatePhoto(validFile);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid PNG photo', () => {
      const validFile = new File(
        ['x'.repeat(500000)], // 500KB
        'photo.png',
        { type: 'image/png' }
      );

      const result = service.validatePhoto(validFile);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid WebP photo', () => {
      const validFile = new File(
        ['x'.repeat(500000)],
        'photo.webp',
        { type: 'image/webp' }
      );

      const result = service.validatePhoto(validFile);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject photo exceeding 5MB', () => {
      const largeFile = new File(
        ['x'.repeat(6000000)], // 6MB
        'large.jpg',
        { type: 'image/jpeg' }
      );

      const result = service.validatePhoto(largeFile);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Photo size exceeds 5MB limit');
    });

    it('should reject non-image/video file types', () => {
      const invalidFile = new File(
        ['test content'],
        'document.pdf',
        { type: 'application/pdf' }
      );

      const result = service.validatePhoto(invalidFile);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid file type. Only images (JPEG, PNG, WebP) and videos (MP4, WebM, MOV) are allowed');
    });

    it('should reject empty file', () => {
      const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });

      const result = service.validatePhoto(emptyFile);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File is empty');
    });

    it('should collect multiple validation errors', () => {
      const invalidFile = new File(
        [], // empty + wrong type
        'test.txt',
        { type: 'text/plain' }
      );

      const result = service.validatePhoto(invalidFile);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('fileToBase64', () => {
    it('should convert File to base64 string', async () => {
      const file = new File(
        ['test image data'],
        'test.jpg',
        { type: 'image/jpeg' }
      );

      const base64 = await service.fileToBase64(file);

      expect(base64).toMatch(/^data:image\/jpeg;base64,/);
      expect(base64.length).toBeGreaterThan(30); // data URL prefix + some content
    });

    it('should preserve image MIME type in data URL', async () => {
      const pngFile = new File(['png data'], 'test.png', { type: 'image/png' });

      const base64 = await service.fileToBase64(pngFile);

      expect(base64).toMatch(/^data:image\/png;base64,/);
    });

    it('should handle WebP files', async () => {
      const webpFile = new File(['webp data'], 'test.webp', { type: 'image/webp' });

      const base64 = await service.fileToBase64(webpFile);

      expect(base64).toMatch(/^data:image\/webp;base64,/);
    });

    it('should throw error for empty file', async () => {
      const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });

      await expect(service.fileToBase64(emptyFile)).rejects.toThrow('Cannot convert empty file');
    });
  });

  describe('validatePhotoCount', () => {
    it('should accept array with fewer than 15 media', () => {
      const photos = ['photo1', 'photo2', 'photo3'];

      const result = service.validatePhotoCount(photos);

      expect(result.valid).toBe(true);
      expect(result.canAddMore).toBe(true);
      expect(result.remaining).toBe(12); // 15 - 3
    });

    it('should accept array with exactly 15 media', () => {
      const photos = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'v1', 'v2', 'v3', 'v4', 'v5'];

      const result = service.validatePhotoCount(photos);

      expect(result.valid).toBe(true);
      expect(result.canAddMore).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reject array exceeding 15 media', () => {
      const photos = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6'];

      const result = service.validatePhotoCount(photos);

      expect(result.valid).toBe(false);
      expect(result.canAddMore).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.error).toBe('Maximum 15 media files per spot');
    });

    it('should accept empty array', () => {
      const photos: string[] = [];

      const result = service.validatePhotoCount(photos);

      expect(result.valid).toBe(true);
      expect(result.canAddMore).toBe(true);
      expect(result.remaining).toBe(15);
    });
  });

  describe('compressImage', () => {
    it('should return original base64 if under 1MB', async () => {
      // Small image (< 1MB encoded) - no compression needed
      const smallBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='; // Tiny sample

      const result = await service.compressImage(smallBase64, 1024); // 1MB threshold

      expect(result).toBe(smallBase64); // Should return as-is
    });

    // Note: Actual compression tests would require canvas mocking
    // For now, we test the API contract
    it('should accept base64 string and return base64 string', async () => {
      const base64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

      const result = await service.compressImage(base64, 500);

      expect(result).toMatch(/^data:image\/(jpeg|png|webp);base64,/);
    });

    it('should throw error for invalid base64 format', async () => {
      const invalidBase64 = 'not-a-valid-base64-string';

      await expect(service.compressImage(invalidBase64, 1024)).rejects.toThrow(
        'Invalid base64 format'
      );
    });
  });

  describe('getPhotoSizeKB', () => {
    it('should calculate size of base64 photo in KB', () => {
      // Base64 encoding: 4 chars = 3 bytes, so ~1.33x size
      // Example: 1000 bytes encoded = ~1333 chars
      const base64 = 'data:image/jpeg;base64,' + 'A'.repeat(1333); // ~1KB

      const sizeKB = service.getPhotoSizeKB(base64);

      expect(sizeKB).toBeGreaterThan(0);
      expect(sizeKB).toBeLessThan(2); // Should be around 1KB
    });

    it('should handle small photos', () => {
      const smallBase64 = 'data:image/jpeg;base64,ABC';

      const sizeKB = service.getPhotoSizeKB(smallBase64);

      expect(sizeKB).toBeGreaterThan(0);
      expect(sizeKB).toBeLessThan(1);
    });
  });

  describe('MAX_PHOTO_SIZE constant', () => {
    it('should define 5MB limit for photos', () => {
      expect(PhotoService.MAX_PHOTO_SIZE).toBe(5 * 1024 * 1024); // 5MB in bytes
    });
  });

  describe('MAX_VIDEO_SIZE constant', () => {
    it('should define 10MB limit for videos', () => {
      expect(PhotoService.MAX_VIDEO_SIZE).toBe(10 * 1024 * 1024); // 10MB in bytes
    });
  });

  describe('MAX_PHOTOS_PER_SPOT constant', () => {
    it('should define 10 photos limit', () => {
      expect(PhotoService.MAX_PHOTOS_PER_SPOT).toBe(10);
    });
  });

  describe('MAX_VIDEOS_PER_SPOT constant', () => {
    it('should define 5 videos limit', () => {
      expect(PhotoService.MAX_VIDEOS_PER_SPOT).toBe(5);
    });
  });

  describe('MAX_MEDIA_PER_SPOT constant', () => {
    it('should define 15 total media limit', () => {
      expect(PhotoService.MAX_MEDIA_PER_SPOT).toBe(15);
    });
  });

  describe('ALLOWED_IMAGE_TYPES constant', () => {
    it('should allow JPEG, PNG, WebP', () => {
      expect(PhotoService.ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
      expect(PhotoService.ALLOWED_IMAGE_TYPES).toContain('image/png');
      expect(PhotoService.ALLOWED_IMAGE_TYPES).toContain('image/webp');
      expect(PhotoService.ALLOWED_IMAGE_TYPES).toHaveLength(3);
    });
  });

  describe('ALLOWED_VIDEO_TYPES constant', () => {
    it('should allow MP4, WebM, QuickTime', () => {
      expect(PhotoService.ALLOWED_VIDEO_TYPES).toContain('video/mp4');
      expect(PhotoService.ALLOWED_VIDEO_TYPES).toContain('video/webm');
      expect(PhotoService.ALLOWED_VIDEO_TYPES).toContain('video/quicktime');
      expect(PhotoService.ALLOWED_VIDEO_TYPES).toHaveLength(3);
    });
  });
});
