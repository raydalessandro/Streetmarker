// src/components/SpotFilters.tsx
import React, { useState, useEffect, useRef } from 'react';
import type { SpotType, SpotStatus, SecurityLevel } from '../types/spot';
import type { SpotFilters as SpotFiltersType } from '../services/SpotService';

export interface SpotFiltersProps {
  onFilterChange: (filters: SpotFiltersType) => void;
  onSearchChange: (query: string) => void;
}

export function SpotFilters({ onFilterChange, onSearchChange }: SpotFiltersProps) {
  const [selectedTypes, setSelectedTypes] = useState<SpotType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<SpotStatus[]>([]);
  const [selectedSecurityLevels, setSelectedSecurityLevels] = useState<SecurityLevel[]>([]);
  const [availableNow, setAvailableNow] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Notify parent when filters change
  useEffect(() => {
    const filters: SpotFiltersType = {
      type: selectedTypes.length > 0 ? selectedTypes : undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      securityLevel: selectedSecurityLevels.length > 0 ? selectedSecurityLevels : undefined,
      availableNow: availableNow || undefined,
    };
    onFilterChange(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes, selectedStatuses, selectedSecurityLevels, availableNow]); // onFilterChange is stable

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]); // onSearchChange is stable

  const handleTypeChange = (type: SpotType, checked: boolean) => {
    if (checked) {
      setSelectedTypes([...selectedTypes, type]);
    } else {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    }
  };

  const handleStatusChange = (status: SpotStatus, checked: boolean) => {
    if (checked) {
      setSelectedStatuses([...selectedStatuses, status]);
    } else {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
    }
  };

  const handleSecurityLevelChange = (level: SecurityLevel, checked: boolean) => {
    if (checked) {
      setSelectedSecurityLevels([...selectedSecurityLevels, level]);
    } else {
      setSelectedSecurityLevels(selectedSecurityLevels.filter((l) => l !== level));
    }
  };

  return (
    <div className="spot-filters">
      <div className="filter-section">
        <h3>Search</h3>
        <input
          type="text"
          placeholder="Search spots..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filter-section">
        <h3>Type</h3>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={selectedTypes.includes('wall')}
            onChange={(e) => handleTypeChange('wall', e.target.checked)}
          />
          Wall
        </label>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={selectedTypes.includes('train')}
            onChange={(e) => handleTypeChange('train', e.target.checked)}
          />
          Train
        </label>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={selectedTypes.includes('sign')}
            onChange={(e) => handleTypeChange('sign', e.target.checked)}
          />
          Sign
        </label>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={selectedTypes.includes('other')}
            onChange={(e) => handleTypeChange('other', e.target.checked)}
          />
          Other
        </label>
      </div>

      <div className="filter-section">
        <h3>Status</h3>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={selectedStatuses.includes('free')}
            onChange={(e) => handleStatusChange('free', e.target.checked)}
          />
          Free
        </label>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={selectedStatuses.includes('occupied')}
            onChange={(e) => handleStatusChange('occupied', e.target.checked)}
          />
          Occupied
        </label>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={selectedStatuses.includes('protected')}
            onChange={(e) => handleStatusChange('protected', e.target.checked)}
          />
          Protected
        </label>
      </div>

      <div className="filter-section">
        <h3>Security Level</h3>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={selectedSecurityLevels.includes('low')}
            onChange={(e) => handleSecurityLevelChange('low', e.target.checked)}
          />
          Low
        </label>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={selectedSecurityLevels.includes('medium')}
            onChange={(e) => handleSecurityLevelChange('medium', e.target.checked)}
          />
          Medium
        </label>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={selectedSecurityLevels.includes('high')}
            onChange={(e) => handleSecurityLevelChange('high', e.target.checked)}
          />
          High
        </label>
      </div>

      <div className="filter-section">
        <h3>Availability</h3>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={availableNow}
            onChange={(e) => setAvailableNow(e.target.checked)}
          />
          Disponibile adesso
        </label>
      </div>
    </div>
  );
}
