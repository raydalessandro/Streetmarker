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

  const maxMedia = PhotoService.MAX_MEDIA_PER_SPOT;
  const canAddMore = photos.length < maxMedia;
  const remaining = maxMedia - photos.length;
  const { photoCount, videoCount } = photoService.countMediaTypes(photos);

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
        <label htmlFor="photo-input">Upload Photo/Video</label>
        <span className="photo-count">
          {photos.length} / {maxMedia} media ({photoCount} photos, {videoCount} videos)
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id="photo-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        multiple
        capture="environment" // Enable camera on mobile
        onChange={handleFileChange}
        disabled={disabled || !canAddMore || isUploading}
        style={{ display: 'none' }}
        aria-label="Upload photo or video"
      />

      {/* Add Media Button */}
      {canAddMore && (
        <button
          type="button"
          className="btn-add-photo"
          onClick={handleAddClick}
          disabled={disabled || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Add Photo/Video'}
        </button>
      )}

      {/* Max Media Message */}
      {!canAddMore && (
        <p className="max-photos-message">Maximum 15 media files reached (10 photos + 5 videos max)</p>
      )}

      {/* Error Message */}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {/* Media Thumbnails */}
      {photos.length > 0 && (
        <div className="photo-thumbnails">
          {photos.map((media, index) => {
            const isVideo = media.startsWith('data:video/');
            return (
              <div key={index} className="photo-thumbnail">
                {isVideo ? (
                  <video src={media} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                    Your browser does not support video playback.
                  </video>
                ) : (
                  <img src={media} alt={`Media ${index + 1}`} />
                )}
                <button
                  type="button"
                  className="btn-delete-photo"
                  onClick={() => handleDelete(index)}
                  disabled={disabled}
                  aria-label={`Delete media ${index + 1}`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
