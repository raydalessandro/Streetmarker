// Test for auto-collapse filters after "Applica Filtri"
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SpotFilters } from '../SpotFilters';

describe('SpotFilters - Auto-Collapse', () => {
  it('starts with all sections expanded (default state)', () => {
    render(
      <SpotFilters
        onFilterChange={vi.fn()}
        onSearchChange={vi.fn()}
      />
    );

    // Check that sections are expanded by default (aria-expanded = true)
    const typeHeader = screen.getByRole('button', { name: /type/i });
    expect(typeHeader).toHaveAttribute('aria-expanded', 'true');
  });

  it('collapses all sections after "Applica Filtri" is clicked', async () => {
    render(
      <SpotFilters
        onFilterChange={vi.fn()}
        onSearchChange={vi.fn()}
      />
    );

    // Click "Applica Filtri" button
    const applyButton = screen.getByRole('button', { name: /applica filtri/i });
    fireEvent.click(applyButton);

    // Wait for collapse animation
    await waitFor(() => {
      const container = document.querySelector('.filter-sections-container');
      expect(container).toHaveClass('collapsed');
    });

    // Chevron should rotate to collapsed state
    const chevron = document.querySelector('.filter-header-chevron');
    expect(chevron).toHaveClass('collapsed');
  });

  it('shows active filter count badge when filters are applied', async () => {
    render(
      <SpotFilters
        onFilterChange={vi.fn()}
        onSearchChange={vi.fn()}
      />
    );

    // Select type filter
    const wallCheckbox = screen.getByLabelText(/wall/i);
    fireEvent.click(wallCheckbox);

    // Apply filters
    const applyButton = screen.getByRole('button', { name: /applica filtri/i });
    fireEvent.click(applyButton);

    // Badge should show "1 filtri attivi"
    await waitFor(() => {
      expect(screen.getByText(/1 filtri attivi/i)).toBeInTheDocument();
    });
  });

  it('shows correct count when multiple filters are active', async () => {
    render(
      <SpotFilters
        onFilterChange={vi.fn()}
        onSearchChange={vi.fn()}
      />
    );

    // Select multiple filters
    const wallCheckbox = screen.getByLabelText(/wall/i);
    fireEvent.click(wallCheckbox);

    const freeCheckbox = screen.getByLabelText(/free/i);
    fireEvent.click(freeCheckbox);

    const lowCheckbox = screen.getByLabelText(/low/i);
    fireEvent.click(lowCheckbox);

    // Apply filters
    const applyButton = screen.getByRole('button', { name: /applica filtri/i });
    fireEvent.click(applyButton);

    // Badge should show "3 filtri attivi"
    await waitFor(() => {
      expect(screen.getByText(/3 filtri attivi/i)).toBeInTheDocument();
    });
  });

  it('toggles expand/collapse when header is clicked', async () => {
    render(
      <SpotFilters
        onFilterChange={vi.fn()}
        onSearchChange={vi.fn()}
      />
    );

    // Apply filters first to collapse
    const applyButton = screen.getByRole('button', { name: /applica filtri/i });
    fireEvent.click(applyButton);

    // Wait for collapse
    await waitFor(() => {
      const container = document.querySelector('.filter-sections-container');
      expect(container).toHaveClass('collapsed');
    });

    // Click header to expand again
    const headerToggle = screen.getByRole('button', { name: /toggle filters/i });
    fireEvent.click(headerToggle);

    // Sections should expand
    await waitFor(() => {
      const container = document.querySelector('.filter-sections-container');
      expect(container).not.toHaveClass('collapsed');
    });

    // Chevron should rotate back
    const chevron = document.querySelector('.filter-header-chevron');
    expect(chevron).toHaveClass('expanded');
  });

  it('counts search query as active filter', async () => {
    const onSearchChange = vi.fn();

    render(
      <SpotFilters
        onFilterChange={vi.fn()}
        onSearchChange={onSearchChange}
      />
    );

    // Type in search box
    const searchInput = screen.getByPlaceholderText(/search spots/i);
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    // Apply filters
    const applyButton = screen.getByRole('button', { name: /applica filtri/i });
    fireEvent.click(applyButton);

    // Badge should show "1 filtri attivi" (search query counts)
    await waitFor(() => {
      expect(screen.getByText(/1 filtri attivi/i)).toBeInTheDocument();
    });
  });

  it('does not show badge when no filters are active', () => {
    render(
      <SpotFilters
        onFilterChange={vi.fn()}
        onSearchChange={vi.fn()}
      />
    );

    // Apply filters without selecting any
    const applyButton = screen.getByRole('button', { name: /applica filtri/i });
    fireEvent.click(applyButton);

    // Badge should not appear
    expect(screen.queryByText(/filtri attivi/i)).not.toBeInTheDocument();
  });
});
