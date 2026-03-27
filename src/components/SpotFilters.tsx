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
  const [isTypeExpanded, setIsTypeExpanded] = useState<boolean>(true); // Start expanded
  const [isStatusExpanded, setIsStatusExpanded] = useState<boolean>(true);
  const [isSecurityExpanded, setIsSecurityExpanded] = useState<boolean>(true);
  const [isAvailabilityExpanded, setIsAvailabilityExpanded] = useState<boolean>(true);

  // Auto-collapse state after "Applica Filtri"
  const [isCollapsedAfterApply, setIsCollapsedAfterApply] = useState<boolean>(false);

  // Pending filters (not yet applied)
  const [pendingTypes, setPendingTypes] = useState<SpotType[]>([]);
  const [pendingStatuses, setPendingStatuses] = useState<SpotStatus[]>([]);
  const [pendingSecurityLevels, setPendingSecurityLevels] = useState<SecurityLevel[]>([]);
  const [pendingAvailableNow, setPendingAvailableNow] = useState<boolean>(false);

  const debounceTimerRef = useRef<number | undefined>(undefined);

  // Count active filters (non-default values)
  const countActiveFilters = () => {
    let count = 0;
    if (selectedTypes.length > 0) count++;
    if (selectedStatuses.length > 0) count++;
    if (selectedSecurityLevels.length > 0) count++;
    if (availableNow) count++;
    if (searchQuery.trim() !== '') count++;
    return count;
  };

  // Apply filters when "Applica Filtri" button clicked
  const handleApplyFilters = () => {
    setSelectedTypes(pendingTypes);
    setSelectedStatuses(pendingStatuses);
    setSelectedSecurityLevels(pendingSecurityLevels);
    setAvailableNow(pendingAvailableNow);

    // Auto-collapse all sections after apply
    setIsCollapsedAfterApply(true);
    setIsTypeExpanded(false);
    setIsStatusExpanded(false);
    setIsSecurityExpanded(false);
    setIsAvailabilityExpanded(false);
  };

  // Toggle header collapse state
  const handleToggleCollapse = () => {
    if (isCollapsedAfterApply) {
      // Expand all sections
      setIsCollapsedAfterApply(false);
      setIsTypeExpanded(true);
      setIsStatusExpanded(true);
      setIsSecurityExpanded(true);
      setIsAvailabilityExpanded(true);
    } else {
      // Collapse all sections
      setIsCollapsedAfterApply(true);
      setIsTypeExpanded(false);
      setIsStatusExpanded(false);
      setIsSecurityExpanded(false);
      setIsAvailabilityExpanded(false);
    }
  };

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
      setPendingTypes([...pendingTypes, type]);
    } else {
      setPendingTypes(pendingTypes.filter((t) => t !== type));
    }
  };

  const handleStatusChange = (status: SpotStatus, checked: boolean) => {
    if (checked) {
      setPendingStatuses([...pendingStatuses, status]);
    } else {
      setPendingStatuses(pendingStatuses.filter((s) => s !== status));
    }
  };

  const handleSecurityLevelChange = (level: SecurityLevel, checked: boolean) => {
    if (checked) {
      setPendingSecurityLevels([...pendingSecurityLevels, level]);
    } else {
      setPendingSecurityLevels(pendingSecurityLevels.filter((l) => l !== level));
    }
  };

  const activeFiltersCount = countActiveFilters();

  return (
    <div className="spot-filters">
      {/* Collapsible Header */}
      <button
        className="filter-header-toggle"
        onClick={handleToggleCollapse}
        aria-label="Toggle filters"
      >
        <span className="filter-header-title">Filtri</span>
        {activeFiltersCount > 0 && (
          <span className="filter-active-badge">{activeFiltersCount} filtri attivi</span>
        )}
        <svg
          className={`filter-header-chevron ${isCollapsedAfterApply ? 'collapsed' : 'expanded'}`}
          viewBox="0 0 24 24"
          width="20"
          height="20"
        >
          <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className={`filter-sections-container ${isCollapsedAfterApply ? 'collapsed' : ''}`}>
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
              checked={pendingTypes.includes('wall')}
              onChange={(e) => handleTypeChange('wall', e.target.checked)}
            />
            Wall
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={pendingTypes.includes('train')}
              onChange={(e) => handleTypeChange('train', e.target.checked)}
            />
            Train
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={pendingTypes.includes('sign')}
              onChange={(e) => handleTypeChange('sign', e.target.checked)}
            />
            Sign
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={pendingTypes.includes('other')}
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
              checked={pendingStatuses.includes('free')}
              onChange={(e) => handleStatusChange('free', e.target.checked)}
            />
            Free
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={pendingStatuses.includes('occupied')}
              onChange={(e) => handleStatusChange('occupied', e.target.checked)}
            />
            Occupied
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={pendingStatuses.includes('protected')}
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
              checked={pendingSecurityLevels.includes('low')}
              onChange={(e) => handleSecurityLevelChange('low', e.target.checked)}
            />
            Low
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={pendingSecurityLevels.includes('medium')}
              onChange={(e) => handleSecurityLevelChange('medium', e.target.checked)}
            />
            Medium
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={pendingSecurityLevels.includes('high')}
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
              checked={pendingAvailableNow}
              onChange={(e) => setPendingAvailableNow(e.target.checked)}
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

        {/* Apply Filters Button - Sticky */}
        <div className="filter-apply-container">
          <button className="filter-apply-btn" onClick={handleApplyFilters}>
            Applica Filtri
          </button>
        </div>
      </div>
    </div>
  );
}
