// src/components/SettingsView.tsx
import { ImportExport } from './ImportExport';
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
  return (
    <div className="settings-view">
      <div className="settings-view-header">
        <h2>Settings</h2>
        <div className="settings-view-subtitle">
          Manage your data and app preferences
        </div>
      </div>

      <div className="settings-view-content">
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
    </div>
  );
}
