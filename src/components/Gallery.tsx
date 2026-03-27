// src/components/Gallery.tsx
import { useState, useEffect } from 'react';
import type { Spot } from '../types/spot';
import './Gallery.css';

interface GalleryProps {
  spots: Spot[];
  onSpotClick: (spot: Spot) => void;
}

export function Gallery({ spots, onSpotClick }: GalleryProps) {
  const [allPhotos, setAllPhotos] = useState<Array<{ spot: Spot; photo: string; index: number }>>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<{ spot: Spot; photo: string } | null>(null);

  useEffect(() => {
    // Flatten all photos from all spots
    const photos: Array<{ spot: Spot; photo: string; index: number }> = [];
    spots.forEach(spot => {
      if (spot.photos && spot.photos.length > 0) {
        spot.photos.forEach((photo, index) => {
          photos.push({ spot, photo, index });
        });
      }
    });
    setAllPhotos(photos);
  }, [spots]);

  const handlePhotoClick = (photo: { spot: Spot; photo: string }) => {
    setSelectedPhoto(photo);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
  };

  const getSpotName = (spot: Spot) => {
    return spot.owner || `${spot.type.charAt(0).toUpperCase() + spot.type.slice(1)} Spot`;
  };

  return (
    <div className="gallery-view">
      <div className="gallery-header">
        <h2>Gallery</h2>
        <div className="gallery-stats">
          <span>{allPhotos.length} photos</span>
          <span>{spots.filter(s => s.photos && s.photos.length > 0).length} spots</span>
        </div>
      </div>

      {allPhotos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📸</div>
          <p>No photos yet</p>
          <p className="empty-hint">Add spots with photos to see them here</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {allPhotos.map((item, idx) => (
            <div
              key={`${item.spot.id}-${item.index}-${idx}`}
              className="gallery-item"
              onClick={() => handlePhotoClick(item)}
            >
              <img src={item.photo} alt={getSpotName(item.spot)} />
              <div className="gallery-item-overlay">
                <div className="gallery-item-title">{getSpotName(item.spot)}</div>
                <div className="gallery-item-type">{item.spot.type}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="photo-modal-overlay" onClick={closeModal}>
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="photo-modal-close" onClick={closeModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <img src={selectedPhoto.photo} alt={getSpotName(selectedPhoto.spot)} />
            <div className="photo-modal-info">
              <h3>{getSpotName(selectedPhoto.spot)}</h3>
              <p>{selectedPhoto.spot.notes}</p>
              <button
                className="photo-modal-view-spot"
                onClick={() => {
                  onSpotClick(selectedPhoto.spot);
                  closeModal();
                }}
              >
                View Spot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
