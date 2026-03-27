// src/components/SpotFilters.tsx
import { useState, useEffect, useRef } from 'react';
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
  const [timeFrom, setTimeFrom] = useState<string>('');
  const [timeTo, setTimeTo] = useState<string>('');

  // Collapsible sections state
  const [isTypeExpanded, setIsTypeExpanded] = useState<boolean>(false);
  const [isStatusExpanded, setIsStatusExpanded] = useState<boolean>(false);
  const [isSecurityExpanded, setIsSecurityExpanded] = useState<boolean>(false);
  const [isAvailabilityExpanded, setIsAvailabilityExpanded] = useState<boolean>(false);

  const debounceTimerRef = useRef<number | undefined>(undefined);

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

      <div className="filter-section collapsible">
        <button
          className="filter-section-header"
          onClick={() => setIsTypeExpanded(!isTypeExpanded)}
          aria-expanded={isTypeExpanded}
        >
          <h3>Type</h3>
          <svg
            className={`chevron-icon ${isTypeExpanded ? 'expanded' : ''}`}
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className={`filter-section-content ${isTypeExpanded ? 'expanded' : ''}`}>
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
      </div>

      <div className="filter-section collapsible">
        <button
          className="filter-section-header"
          onClick={() => setIsStatusExpanded(!isStatusExpanded)}
          aria-expanded={isStatusExpanded}
        >
          <h3>Status</h3>
          <svg
            className={`chevron-icon ${isStatusExpanded ? 'expanded' : ''}`}
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className={`filter-section-content ${isStatusExpanded ? 'expanded' : ''}`}>
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
      </div>

      <div className="filter-section collapsible">
        <button
          className="filter-section-header"
          onClick={() => setIsSecurityExpanded(!isSecurityExpanded)}
          aria-expanded={isSecurityExpanded}
        >
          <h3>Security Level</h3>
          <svg
            className={`chevron-icon ${isSecurityExpanded ? 'expanded' : ''}`}
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className={`filter-section-content ${isSecurityExpanded ? 'expanded' : ''}`}>
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
      </div>

      <div className="filter-section collapsible">
        <button
          className="filter-section-header"
          onClick={() => setIsAvailabilityExpanded(!isAvailabilityExpanded)}
          aria-expanded={isAvailabilityExpanded}
        >
          <h3>Availability</h3>
          <svg
            className={`chevron-icon ${isAvailabilityExpanded ? 'expanded' : ''}`}
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className={`filter-section-content ${isAvailabilityExpanded ? 'expanded' : ''}`}>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={availableNow}
              onChange={(e) => setAvailableNow(e.target.checked)}
            />
            Disponibile adesso
          </label>

          <div className="time-range-filter">
            <label className="time-input-label">
              Orario Da:
              <input
                type="time"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
                className="time-input"
              />
            </label>
            <label className="time-input-label">
              Orario A:
              <input
                type="time"
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
                className="time-input"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
