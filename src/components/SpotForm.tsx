// src/components/SpotForm.tsx
import React, { useState, useEffect } from 'react';
import type { Spot, SpotType, SpotStatus, SecurityLevel, TimeRange } from '../types/spot';
import { SpotService } from '../services/SpotService';
import { PhotoUpload } from './PhotoUpload';

export interface SpotFormProps {
  spot?: Spot;
  initialCoords?: [number, number];
  onSubmit: (spot: Omit<Spot, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function SpotForm({ spot, initialCoords, onSubmit, onCancel }: SpotFormProps) {
  const [latitude, setLatitude] = useState<string>(
    spot?.coords[0]?.toString() || initialCoords?.[0]?.toString() || ''
  );
  const [longitude, setLongitude] = useState<string>(
    spot?.coords[1]?.toString() || initialCoords?.[1]?.toString() || ''
  );
  const [type, setType] = useState<SpotType>(spot?.type || 'wall');
  const [status, setStatus] = useState<SpotStatus>(spot?.status || 'free');
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>(spot?.securityLevel || 'low');
  const [owner, setOwner] = useState<string>(spot?.owner || '');
  const [notes, setNotes] = useState<string>(spot?.notes || '');
  const [availability, setAvailability] = useState<TimeRange[]>(spot?.availability || []);
  const [photos, setPhotos] = useState<string[]>(spot?.photos || []);
  const [errors, setErrors] = useState<string[]>([]);

  const spotService = new SpotService();

  // Validate form on change
  useEffect(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const spotData: Partial<Spot> = {
      coords: [lat, lng],
      type,
      status,
      availability,
      securityLevel,
      notes,
    };

    const validation = spotService.validateSpot(spotData);
    setErrors(validation.errors);
  }, [latitude, longitude, type, status, availability, securityLevel, notes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const spotData: Omit<Spot, 'id' | 'createdAt' | 'updatedAt'> = {
      coords: [lat, lng],
      type,
      status,
      availability,
      securityLevel,
      owner: owner || undefined,
      notes,
      photos: photos.length > 0 ? photos : undefined,
    };

    const validation = spotService.validateSpot(spotData);

    if (validation.valid) {
      onSubmit(spotData);
    } else {
      setErrors(validation.errors);
    }
  };

  const handleAddTimeRange = () => {
    setAvailability([...availability, { from: '00:00', to: '23:59' }]);
  };

  const handleRemoveTimeRange = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const handleTimeRangeChange = (index: number, field: 'from' | 'to', value: string) => {
    const newAvailability = [...availability];
    newAvailability[index] = {
      ...newAvailability[index],
      [field]: value,
    };
    setAvailability(newAvailability);
  };

  const isFormValid = errors.length === 0 && latitude && longitude;

  return (
    <form onSubmit={handleSubmit} className="spot-form">
      <div className="form-group">
        <label htmlFor="latitude">Latitude *</label>
        <input
          id="latitude"
          name="lat"
          type="number"
          step="any"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="45.4642"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="longitude">Longitude *</label>
        <input
          id="longitude"
          name="lng"
          type="number"
          step="any"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="9.1900"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="type">Type *</label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as SpotType)}
          required
        >
          <option value="wall">Wall</option>
          <option value="train">Train</option>
          <option value="sign">Sign</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="status">Status *</label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as SpotStatus)}
          required
        >
          <option value="free">Free</option>
          <option value="occupied">Occupied</option>
          <option value="protected">Protected</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="security-level">Security Level *</label>
        <select
          id="security-level"
          name="securityLevel"
          value={securityLevel}
          onChange={(e) => setSecurityLevel(e.target.value as SecurityLevel)}
          required
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="owner">Owner (optional)</label>
        <input
          id="owner"
          name="owner"
          type="text"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="Crew name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">
          Notes * ({notes.length}/500)
        </label>
        <textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add details about this spot..."
          maxLength={500}
          rows={4}
          required
        />
      </div>

      <div className="form-group">
        <label>Availability</label>
        <button
          type="button"
          onClick={handleAddTimeRange}
          className="btn-secondary"
        >
          Add Time Range
        </button>

        {availability.map((range, index) => (
          <div key={index} className="time-range">
            <label htmlFor={`from-${index}`}>From</label>
            <input
              id={`from-${index}`}
              type="time"
              value={range.from}
              onChange={(e) => handleTimeRangeChange(index, 'from', e.target.value)}
            />

            <label htmlFor={`to-${index}`}>To</label>
            <input
              id={`to-${index}`}
              type="time"
              value={range.to}
              onChange={(e) => handleTimeRangeChange(index, 'to', e.target.value)}
            />

            <button
              type="button"
              onClick={() => handleRemoveTimeRange(index)}
              className="btn-danger"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Photo Upload */}
      <div className="form-group">
        <PhotoUpload
          photos={photos}
          onPhotosChange={setPhotos}
        />
      </div>

      {errors.length > 0 && (
        <div className="form-errors">
          {errors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}

      <div className="form-actions">
        <button
          type="submit"
          disabled={!isFormValid}
          className="btn-primary"
        >
          {spot ? 'Save' : 'Submit'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
