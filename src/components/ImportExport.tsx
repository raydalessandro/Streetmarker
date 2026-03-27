import React, { useRef, useState } from 'react';
import type { Spot, ExportData } from '../types/spot';
import { ExportService } from '../services/ExportService';
import { ImportService } from '../services/ImportService';

interface MergeResult {
  added: Spot[];
  updated: Spot[];
  conflicts: Spot[];
}

interface ImportExportProps {
  spots: Spot[];
  onImport: (mergeResult: MergeResult) => void;
}

export const ImportExport: React.FC<ImportExportProps> = ({ spots, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [error, setError] = useState<string>('');

  const exportService = new ExportService();
  const importService = new ImportService();

  const handleExport = () => {
    const exportData = exportService.exportToJSON(spots);
    const filename = exportService.generateFilename();
    exportService.downloadJSON(exportData, filename);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');

    try {
      // Parse file
      const importedData: ExportData = await importService.parseImportFile(file);

      // Validate data
      const validation = importService.validateImportData(importedData);
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        return;
      }

      // Merge spots
      const result = importService.mergeSpots(spots, importedData.spots);
      setMergeResult(result);
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
    }

    // Reset file input
    event.target.value = '';
  };

  const handleConfirm = () => {
    if (mergeResult) {
      onImport(mergeResult);
      setShowPreview(false);
      setMergeResult(null);
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    setMergeResult(null);
    setError('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={handleExport}>Export Data</button>
        <button onClick={handleImportClick}>Import Data</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          data-testid="file-input"
        />
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      {showPreview && mergeResult && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            <h2>Merge Preview</h2>

            <div style={{ marginBottom: '20px' }}>
              <p>
                <strong>{mergeResult.added.length}</strong> spots will be <strong>added</strong>
              </p>
              <p>
                <strong>{mergeResult.updated.length}</strong> spots will be <strong>updated</strong>
              </p>
              <p>
                <strong>{mergeResult.conflicts.length}</strong> spots have{' '}
                <strong>conflicts</strong>
              </p>
            </div>

            {mergeResult.conflicts.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3>Conflicts Detected</h3>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  The following spots have older timestamps and will NOT be imported:
                </p>
                <ul style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {mergeResult.conflicts.map((spot) => (
                    <li key={spot.id}>
                      {spot.id} - {spot.notes}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={handleCancel}>Cancel</button>
              <button onClick={handleConfirm} style={{ fontWeight: 'bold' }}>
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
