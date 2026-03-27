// src/components/SpotList.tsx
import React from 'react';
import type { Spot } from '../types/spot';

export interface SpotListProps {
  spots: Spot[];
  onEdit: (spot: Spot) => void;
  onDelete: (id: string) => void;
}

export function SpotList({ spots, onEdit, onDelete }: SpotListProps) {
  if (spots.length === 0) {
    return (
      <div className="spot-list-empty">
        <p>Nessun spot trovato</p>
      </div>
    );
  }

  return (
    <div className="spot-list">
      {spots.map((spot) => (
        <div key={spot.id} className="spot-card spot-list-item" data-spot-id={spot.id}>
          <div className="spot-header">
            <span className={`spot-type type-${spot.type}`}>{spot.type}</span>
            <span className={`spot-status status-${spot.status}`}>{spot.status}</span>
          </div>

          <div className="spot-body">
            <p className="spot-notes">{spot.notes}</p>

            {spot.owner && (
              <p className="spot-owner">
                <strong>Owner:</strong> {spot.owner}
              </p>
            )}

            <p className="spot-security">
              <strong>Security:</strong> {spot.securityLevel}
            </p>

            <p className="spot-coords">
              <strong>Coords:</strong> {spot.coords[0].toFixed(4)}, {spot.coords[1].toFixed(4)}
            </p>
          </div>

          <div className="spot-actions">
            <button
              onClick={() => onEdit(spot)}
              className="btn-edit"
              aria-label="Edit spot"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(spot.id)}
              className="btn-delete"
              aria-label="Delete spot"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
