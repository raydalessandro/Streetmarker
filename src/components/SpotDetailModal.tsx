// src/components/SpotDetailModal.tsx
import { useMemo, useState } from 'react';
import QRCode from 'qrcode';
import type { Spot, TemporaryState } from '../types/spot';
import { SpotService } from '../services/SpotService';
import './SpotDetailModal.css';

interface SpotDetailModalProps {
  spot: Spot;
  allSpots?: Spot[]; // All spots for pattern analysis
  onClose: () => void;
  onViewOnMap?: () => void;
  onEdit: () => void;
  onOpenInMaps: () => void;
  onToggleFavorite: () => void;
  onUpdateSpot: (spot: Spot) => void;
}

export function SpotDetailModal({ spot, allSpots = [], onClose, onViewOnMap, onEdit, onOpenInMaps, onToggleFavorite, onUpdateSpot }: SpotDetailModalProps) {
  const spotService = useMemo(() => new SpotService(), []);
  const [note, setNote] = useState<string>('');
  const [qrCodeDataURL, setQRCodeDataURL] = useState<string | null>(null);

  // Calculate best time window for this spot
  const bestTimeWindow = useMemo(() => {
    if (allSpots.length === 0) return null;
    return spotService.getBestTimeWindow(spot, allSpots);
  }, [spot, allSpots, spotService]);

  // Check if temporary status is valid
  const hasValidTemporaryStatus = spotService.isTemporaryStatusValid(spot);

  const handleSetTemporaryStatus = (state: TemporaryState) => {
    const updatedSpot = spotService.setTemporaryStatus(spot, state, note || undefined);
    onUpdateSpot(updatedSpot);
    setNote(''); // Clear note input
  };

  const handleRemoveTemporaryStatus = () => {
    const updatedSpot = spotService.removeTemporaryStatus(spot);
    onUpdateSpot(updatedSpot);
  };

  const handleGenerateQR = async () => {
    try {
      const spotData = JSON.stringify({ version: '1.0', spots: [spot] });
      const qrDataURL = await QRCode.toDataURL(spotData, {
        errorCorrectionLevel: 'M',
        width: 512,
        margin: 2,
        color: {
          dark: '#c8ff00',  // accent lime
          light: '#080809',  // bg dark
        },
      });
      setQRCodeDataURL(qrDataURL);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      alert('Errore generazione QR code');
    }
  };

  const handleShareWhatsApp = () => {
    const spotName = getSpotName(spot);
    const coords = `${spot.coords[0].toFixed(4)}, ${spot.coords[1].toFixed(4)}`;
    const googleMapsLink = `https://www.google.com/maps?q=${spot.coords[0]},${spot.coords[1]}`;
    const message = `📍 ${spotName}\n${spot.type} • ${spot.status}\n${coords}\n${googleMapsLink}`;
    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
  };

  const getSpotName = (spot: Spot) => {
    return spot.owner || `${spot.type.charAt(0).toUpperCase() + spot.type.slice(1)} Spot`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'free': return 'var(--status-free)';
      case 'occupied': return 'var(--status-occupied)';
      case 'protected': return 'var(--status-protected)';
      default: return 'var(--text-muted)';
    }
  };

  const getSecurityIcon = (level: string) => {
    switch (level) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="spot-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="spot-detail-close"
          onClick={onClose}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="spot-detail-content">
          {/* Photo */}
          {spot.photos && spot.photos.length > 0 ? (
            <div className="spot-detail-photo">
              <img src={spot.photos[0]} alt={getSpotName(spot)} />
              {spot.photos.length > 1 && (
                <div className="spot-detail-photo-count">
                  +{spot.photos.length - 1} photos
                </div>
              )}
            </div>
          ) : (
            <div className="spot-detail-photo-placeholder">
              <div className="spot-detail-photo-placeholder-icon">📍</div>
            </div>
          )}

          {/* Info */}
          <div className="spot-detail-info">
            <div className="spot-detail-header">
              <h2>{getSpotName(spot)}</h2>
              <span className="spot-detail-type">{spot.type}</span>
            </div>

            {spot.notes && (
              <p className="spot-detail-notes">{spot.notes}</p>
            )}

            {/* Availability */}
            {spot.availability && spot.availability.length > 0 && (
              <div className="spot-detail-availability">
                <div className="spot-detail-availability-label">Orari:</div>
                {spot.availability.map((range, idx) => (
                  <span key={idx} className="spot-detail-availability-badge">
                    {range.from} - {range.to}
                  </span>
                ))}
              </div>
            )}

            {/* Best Time Window Pattern */}
            {bestTimeWindow && (
              <div className="spot-detail-pattern">
                <div className="spot-detail-pattern-icon">📊</div>
                <div className="spot-detail-pattern-content">
                  <div className="spot-detail-pattern-text">
                    La zona è più attiva tra le {bestTimeWindow.from} e le {bestTimeWindow.to}
                  </div>
                  <div className="spot-detail-pattern-subtext">
                    Basato su {bestTimeWindow.spotCount} spot nelle vicinanze
                  </div>
                </div>
              </div>
            )}

            {/* Temporary Status Section */}
            <div className="spot-detail-temporary-status">
              <h3 className="temporary-status-title">Stato Attuale</h3>

              {hasValidTemporaryStatus && spot.temporaryStatus ? (
                <div className="temporary-status-active">
                  <div className="temporary-status-badge">
                    <span className="temporary-status-emoji">
                      {spotService.getTemporaryStateEmoji(spot.temporaryStatus.state)}
                    </span>
                    <span className="temporary-status-label">{spot.temporaryStatus.state}</span>
                    <span className="temporary-status-time">
                      {spotService.formatRelativeTime(spot.temporaryStatus.setAt)}
                    </span>
                  </div>
                  {spot.temporaryStatus.note && (
                    <p className="temporary-status-note">"{spot.temporaryStatus.note}"</p>
                  )}
                  <button
                    className="temporary-status-remove"
                    onClick={handleRemoveTemporaryStatus}
                  >
                    Rimuovi stato
                  </button>
                </div>
              ) : (
                <div className="temporary-status-controls">
                  <div className="temporary-status-buttons">
                    <button
                      className="temporary-status-btn hot"
                      onClick={() => handleSetTemporaryStatus('hot')}
                    >
                      <span className="temporary-status-btn-emoji">🔥</span>
                      <span className="temporary-status-btn-label">Caldo</span>
                    </button>
                    <button
                      className="temporary-status-btn cold"
                      onClick={() => handleSetTemporaryStatus('cold')}
                    >
                      <span className="temporary-status-btn-emoji">❄️</span>
                      <span className="temporary-status-btn-label">Freddo</span>
                    </button>
                    <button
                      className="temporary-status-btn burned"
                      onClick={() => handleSetTemporaryStatus('burned')}
                    >
                      <span className="temporary-status-btn-emoji">💀</span>
                      <span className="temporary-status-btn-label">Bruciato</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    className="temporary-status-note-input"
                    placeholder="Nota opzionale..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <p className="temporary-status-hint">Scade automaticamente dopo 48h</p>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="spot-detail-tags">
              <span
                className="spot-detail-tag status"
                style={{ color: getStatusColor(spot.status) }}
              >
                {spot.status}
              </span>
              <span className="spot-detail-tag security">
                {getSecurityIcon(spot.securityLevel)} {spot.securityLevel}
              </span>
            </div>

            {/* Location */}
            <div className="spot-detail-location">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{spot.coords[0].toFixed(4)}, {spot.coords[1].toFixed(4)}</span>
            </div>

            {/* Actions */}
            <div className="spot-detail-actions">
              {onViewOnMap && (
                <button
                  className="spot-detail-action-btn primary"
                  onClick={onViewOnMap}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Mappa
                </button>
              )}
              <button
                className="spot-detail-action-btn secondary"
                onClick={onEdit}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
              <button
                className="spot-detail-action-btn secondary"
                onClick={onOpenInMaps}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"></path>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
                Google
              </button>
              <button
                className={`spot-detail-action-btn ${spot.isFavorite ? 'favorite-active' : 'secondary'}`}
                onClick={onToggleFavorite}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={spot.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Favorite
              </button>
              <button
                className="spot-detail-action-btn secondary"
                onClick={handleGenerateQR}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <rect x="7" y="7" width="3" height="3"></rect>
                  <rect x="14" y="7" width="3" height="3"></rect>
                  <rect x="7" y="14" width="3" height="3"></rect>
                  <rect x="14" y="14" width="3" height="3"></rect>
                </svg>
                QR Code
              </button>
              <button
                className="spot-detail-action-btn secondary"
                onClick={handleShareWhatsApp}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrCodeDataURL && (
        <div className="qr-modal-overlay" onClick={() => setQRCodeDataURL(null)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={() => setQRCodeDataURL(null)}>✕</button>
            <div className="qr-modal-content">
              <h3>{getSpotName(spot)}</h3>
              <img src={qrCodeDataURL} alt="QR Code" className="qr-code-image" />
              <p className="qr-modal-hint">Scansiona per importare questo spot</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
