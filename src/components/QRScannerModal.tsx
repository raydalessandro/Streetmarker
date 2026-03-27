// src/components/QRScannerModal.tsx
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import type { QRChunk } from '../services/QRService';
import './QRScannerModal.css';

interface QRScannerModalProps {
  onScan: (data: string) => void;
  onClose: () => void;
  scannedChunks?: QRChunk[];
  expectedTotal?: number;
}

export function QRScannerModal({ onScan, onClose, scannedChunks = [], expectedTotal }: QRScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerIdRef = useRef(`qr-scanner-${Date.now()}`);

  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode(scannerIdRef.current);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {
          // Ignore scan errors (happens frequently while focusing)
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Camera not available. Use manual input below.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  const progress = expectedTotal ? scannedChunks.length / expectedTotal : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="qr-scanner-modal" onClick={(e) => e.stopPropagation()}>
        <button className="qr-scanner-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="qr-scanner-content">
          <h2>Scan QR Code</h2>

          {/* Progress indicator for multi-QR sequences */}
          {expectedTotal && expectedTotal > 1 && (
            <div className="qr-scanner-progress">
              <div className="qr-scanner-progress-text">
                Scanned {scannedChunks.length}/{expectedTotal} QR codes
              </div>
              <div className="qr-scanner-progress-bar">
                <div
                  className="qr-scanner-progress-fill"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Scanner container */}
          <div id={scannerIdRef.current} className="qr-scanner-video" />

          {/* Error message */}
          {error && (
            <div className="qr-scanner-error">
              {error}
            </div>
          )}

          {/* Manual input fallback */}
          <div className="qr-scanner-manual">
            <label htmlFor="manual-input">Or paste QR data manually:</label>
            <textarea
              id="manual-input"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Paste JSON or base64 data here..."
              rows={4}
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
              className="qr-scanner-submit"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
