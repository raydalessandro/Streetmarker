// src/components/SettingsView.tsx
import { useState, useEffect } from 'react';
import { ImportExport } from './ImportExport';
import { QRScannerModal } from './QRScannerModal';
import { QRService, type QRChunk } from '../services/QRService';
import { ImportService } from '../services/ImportService';
import type { Spot } from '../types/spot';
import './SettingsView.css';

interface MergeResult {
  added: Spot[];
  updated: Spot[];
  conflicts: Spot[];
}

interface SettingsViewProps {
  spots: Spot[];
  onImport: (mergeResult: MergeResult) => void;
}

export function SettingsView({ spots, onImport }: SettingsViewProps) {
  const [selectedSpots, setSelectedSpots] = useState<Set<string>>(new Set());
  const [qrCodes, setQrCodes] = useState<string[]>([]);
  const [currentQRIndex, setCurrentQRIndex] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedChunks, setScannedChunks] = useState<QRChunk[]>([]);
  const [expectedTotal, setExpectedTotal] = useState<number | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);

  const qrService = new QRService();
  const importService = new ImportService();

  // Get last 10 created/modified spots as default selection
  const getDefaultSelection = (): Set<string> => {
    const sorted = [...spots].sort((a, b) => b.updatedAt - a.updatedAt);
    return new Set(sorted.slice(0, 10).map(s => s.id));
  };

  const handleToggleSpot = (spotId: string) => {
    const newSelection = new Set(selectedSpots);
    if (newSelection.has(spotId)) {
      newSelection.delete(spotId);
    } else {
      newSelection.add(spotId);
    }
    setSelectedSpots(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedSpots.size === spots.length) {
      setSelectedSpots(new Set());
    } else {
      setSelectedSpots(new Set(spots.map(s => s.id)));
    }
  };

  const handleGenerateQR = async () => {
    if (selectedSpots.size === 0) {
      alert('Please select at least one spot');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedSpotData = spots.filter(s => selectedSpots.has(s.id));
      const qrDataUrls = await qrService.exportToQR(selectedSpotData);
      setQrCodes(qrDataUrls);
      setCurrentQRIndex(0);
      setShowQRModal(true);
    } catch (error) {
      console.error('Failed to generate QR codes:', error);
      alert('Failed to generate QR codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setQrCodes([]);
    setCurrentQRIndex(0);
  };

  const handleScanQR = (data: string) => {
    try {
      const parsed = qrService.parseQRData(data);

      if (!parsed.isChunk && parsed.data) {
        // Single QR - import directly
        const mergeResult = importService.mergeSpots(spots, parsed.data.spots);
        onImport(mergeResult);
        setShowScanner(false);
        alert(`Import complete: ${mergeResult.added.length} added, ${mergeResult.updated.length} updated`);
      } else if (parsed.isChunk && parsed.chunk) {
        // Multi-QR sequence
        const newChunks = [...scannedChunks];

        // Check if we already have this chunk
        if (!newChunks.some(c => c.index === parsed.chunk!.index)) {
          newChunks.push(parsed.chunk);
          setScannedChunks(newChunks);
          setExpectedTotal(parsed.chunk.total);

          // Check if sequence is complete
          if (qrService.isChunkSequenceComplete(newChunks)) {
            const exportData = qrService.assembleChunks(newChunks);
            const mergeResult = importService.mergeSpots(spots, exportData.spots);
            onImport(mergeResult);
            setShowScanner(false);
            setScannedChunks([]);
            setExpectedTotal(undefined);
            alert(`Import complete: ${mergeResult.added.length} added, ${mergeResult.updated.length} updated`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse QR data:', error);
      alert('Invalid QR code data');
    }
  };

  const handleOpenScanner = () => {
    setScannedChunks([]);
    setExpectedTotal(undefined);
    setShowScanner(true);
  };

  // Auto-select last 10 spots on mount if none selected
  useEffect(() => {
    if (selectedSpots.size === 0 && spots.length > 0) {
      setSelectedSpots(getDefaultSelection());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance multi-QR sequence
  useEffect(() => {
    if (showQRModal && qrCodes.length > 1 && currentQRIndex < qrCodes.length - 1) {
      const timer = setTimeout(() => {
        setCurrentQRIndex(prev => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showQRModal, qrCodes.length, currentQRIndex]);

  return (
    <div className="settings-view">
      <div className="settings-view-header">
        <h2>Settings</h2>
        <div className="settings-view-subtitle">
          Manage your data and app preferences
        </div>
      </div>

      <div className="settings-view-content">
        {/* QR Code Sharing Section */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h3>Share via QR Code</h3>
            <p>Export and import spots using QR codes</p>
          </div>
          <div className="settings-section-content">
            {spots.length > 0 && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--t2)', fontWeight: 600 }}>
                      Select spots to share ({selectedSpots.size} selected)
                    </span>
                    <button
                      onClick={handleSelectAll}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: 'var(--bg3)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--t2)',
                        cursor: 'pointer',
                      }}
                    >
                      {selectedSpots.size === spots.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: 'var(--bg3)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px',
                  }}>
                    {spots.map(spot => (
                      <label
                        key={spot.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSpots.has(spot.id)}
                          onChange={() => handleToggleSpot(spot.id)}
                          style={{ marginRight: '8px' }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--t1)' }}>
                          {spot.owner || `${spot.type} spot`} - {new Date(spot.updatedAt).toLocaleDateString()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleGenerateQR}
                  disabled={selectedSpots.size === 0 || isGenerating}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: selectedSpots.size === 0 ? 'var(--bg3)' : 'var(--accent)',
                    color: selectedSpots.size === 0 ? 'var(--t3)' : 'var(--bg)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: selectedSpots.size === 0 ? 'not-allowed' : 'pointer',
                    marginBottom: '12px',
                  }}
                >
                  {isGenerating ? 'Generating...' : `Generate QR Code${qrCodes.length > 1 ? 's' : ''}`}
                </button>
              </>
            )}
            <button
              onClick={handleOpenScanner}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--blue)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📷 Scan QR Code
            </button>
          </div>
        </section>

        {/* Import/Export Section */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h3>Data Management</h3>
            <p>Import and export your spots data</p>
          </div>
          <div className="settings-section-content">
            <ImportExport spots={spots} onImport={onImport} />
          </div>
        </section>

        {/* Storage Info Section */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h3>Storage Info</h3>
            <p>Local database statistics</p>
          </div>
          <div className="settings-section-content">
            <div className="storage-stats">
              <div className="storage-stat-item">
                <div className="storage-stat-label">Total Spots</div>
                <div className="storage-stat-value">{spots.length}</div>
              </div>
              <div className="storage-stat-item">
                <div className="storage-stat-label">Spots with Photos</div>
                <div className="storage-stat-value">
                  {spots.filter(s => s.photos && s.photos.length > 0).length}
                </div>
              </div>
              <div className="storage-stat-item">
                <div className="storage-stat-label">Total Photos</div>
                <div className="storage-stat-value">
                  {spots.reduce((sum, s) => sum + (s.photos?.length || 0), 0)}
                </div>
              </div>
              <div className="storage-stat-item">
                <div className="storage-stat-label">Storage Type</div>
                <div className="storage-stat-value">IndexedDB</div>
              </div>
            </div>
          </div>
        </section>

        {/* App Info Section */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h3>About</h3>
            <p>Application information</p>
          </div>
          <div className="settings-section-content">
            <div className="app-info">
              <div className="app-info-item">
                <div className="app-info-label">Version</div>
                <div className="app-info-value">1.0.0</div>
              </div>
              <div className="app-info-item">
                <div className="app-info-label">Mode</div>
                <div className="app-info-value">Local (Offline-First)</div>
              </div>
              <div className="app-info-item">
                <div className="app-info-label">Framework</div>
                <div className="app-info-value">React 19 + TypeScript</div>
              </div>
              <div className="app-info-item">
                <div className="app-info-label">Map Provider</div>
                <div className="app-info-value">Leaflet.js + CartoDB</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* QR Code Display Modal */}
      {showQRModal && qrCodes.length > 0 && (
        <div className="modal-overlay" onClick={handleCloseQRModal}>
          <div
            style={{
              background: '#000',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseQRModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '8px',
                fontSize: '24px',
              }}
            >
              ✕
            </button>
            <div style={{ textAlign: 'center', color: 'white' }}>
              {qrCodes.length > 1 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                    QR {currentQRIndex + 1}/{qrCodes.length}
                  </div>
                  <div style={{ height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${((currentQRIndex + 1) / qrCodes.length) * 100}%`,
                        height: '100%',
                        background: 'var(--accent)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              )}
              <img
                src={qrCodes[currentQRIndex]}
                alt={`QR Code ${currentQRIndex + 1}`}
                style={{ width: '100%', maxWidth: '500px', height: 'auto' }}
              />
              {qrCodes.length > 1 && (
                <div style={{ marginTop: '16px', fontSize: '14px', color: '#999' }}>
                  Auto-advancing in 3 seconds...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <QRScannerModal
          onScan={handleScanQR}
          onClose={() => {
            setShowScanner(false);
            setScannedChunks([]);
            setExpectedTotal(undefined);
          }}
          scannedChunks={scannedChunks}
          expectedTotal={expectedTotal}
        />
      )}
    </div>
  );
}
