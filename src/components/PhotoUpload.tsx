// PhotoUpload component - Upload and manage spot photos (max 5)
import { useState, useRef } from 'react';
import { PhotoService } from '../services/PhotoService';

export interface PhotoUploadProps {
  photos: string[];              // Current photos (base64)
  onPhotosChange: (photos: string[]) => void;
  disabled?: boolean;
}

export function PhotoUpload({ photos, onPhotosChange, disabled = false }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoService = new PhotoService();

  const maxPhotos = PhotoService.MAX_PHOTOS_PER_SPOT;
  const canAddMore = photos.length < maxPhotos;
  const remaining = maxPhotos - photos.length;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setIsUploading(true);

    try {
      const newPhotos: string[] = [];
      const errors: string[] = [];
      const filesToProcess = Math.min(files.length, remaining); // Don't exceed limit

      for (let i = 0; i < filesToProcess; i++) {
        const file = files[i];

        // Validate file
        const validation = photoService.validatePhoto(file);
        if (!validation.valid) {
          errors.push(...validation.errors);
          continue; // Skip invalid file
        }

        // Convert to base64
        const base64 = await photoService.uploadPhoto(file);
        newPhotos.push(base64);
      }

      // Show validation errors if any
      if (errors.length > 0) {
        setError(errors.join(', '));
        setIsUploading(false);
        return;
      }

      // Update photos array
      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (indexToDelete: number) => {
    const updatedPhotos = photos.filter((_, index) => index !== indexToDelete);
    onPhotosChange(updatedPhotos);
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="photo-upload">
      <div className="photo-upload-header">
        <label htmlFor="photo-input">Upload Photo</label>
        <span className="photo-count">
          {photos.length} / {maxPhotos} photos
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id="photo-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        capture="environment" // Enable camera on mobile
        onChange={handleFileChange}
        disabled={disabled || !canAddMore || isUploading}
        style={{ display: 'none' }}
        aria-label="Upload photo"
      />

      {/* Add Photo Button */}
      {canAddMore && (
        <button
          type="button"
          className="btn-add-photo"
          onClick={handleAddClick}
          disabled={disabled || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Add Photo'}
        </button>
      )}

      {/* Max Photos Message */}
      {!canAddMore && (
        <p className="max-photos-message">Maximum 5 photos reached</p>
      )}

      {/* Error Message */}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {/* Photo Thumbnails */}
      {photos.length > 0 && (
        <div className="photo-thumbnails">
          {photos.map((photo, index) => (
            <div key={index} className="photo-thumbnail">
              <img src={photo} alt={`Photo ${index + 1}`} />
              <button
                type="button"
                className="btn-delete-photo"
                onClick={() => handleDelete(index)}
                disabled={disabled}
                aria-label={`Delete photo ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
