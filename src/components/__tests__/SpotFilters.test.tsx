// src/components/__tests__/SpotFilters.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpotFilters } from '../SpotFilters';

describe('SpotFilters', () => {
  const mockOnFilterChange = vi.fn();
  const mockOnSearchChange = vi.fn();

  const defaultProps = {
    onFilterChange: mockOnFilterChange,
    onSearchChange: mockOnSearchChange,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render type checkboxes', () => {
      render(<SpotFilters {...defaultProps} />);

      expect(screen.getByLabelText(/wall/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/train/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sign/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/other/i)).toBeInTheDocument();
    });

    it('should render status checkboxes', () => {
      render(<SpotFilters {...defaultProps} />);

      expect(screen.getByLabelText(/free/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/occupied/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/protected/i)).toBeInTheDocument();
    });

    it('should render security level checkboxes', () => {
      render(<SpotFilters {...defaultProps} />);

      expect(screen.getByLabelText(/low/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/medium/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/high/i)).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<SpotFilters {...defaultProps} />);

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  describe('Type filters', () => {
    it('should call onFilterChange when type checkbox is checked', async () => {
      const user = userEvent.setup();
      render(<SpotFilters {...defaultProps} />);

      const wallCheckbox = screen.getByLabelText(/wall/i);
      await user.click(wallCheckbox);

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled();
        const filters = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1][0];
        expect(filters.type).toBeDefined();
        expect(filters.type).toContain('wall');
      });
    });

    it('should handle multiple type selections', async () => {
      const user = userEvent.setup();
      render(<SpotFilters {...defaultProps} />);

      await user.click(screen.getByLabelText(/wall/i));
      await user.click(screen.getByLabelText(/train/i));

      await waitFor(() => {
        const filters = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1][0];
        expect(filters.type).toContain('wall');
        expect(filters.type).toContain('train');
      });
    });

    it('should remove type when unchecked', async () => {
      const user = userEvent.setup();
      render(<SpotFilters {...defaultProps} />);

      const wallCheckbox = screen.getByLabelText(/wall/i);
      await user.click(wallCheckbox); // Check
      await user.click(wallCheckbox); // Uncheck

      await waitFor(() => {
        const filters = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1][0];
        expect(filters.type).toBeUndefined();
      });
    });
  });

  describe('Status filters', () => {
    it('should call onFilterChange when status checkbox is checked', async () => {
      const user = userEvent.setup();
      render(<SpotFilters {...defaultProps} />);

      const freeCheckbox = screen.getByLabelText(/free/i);
      await user.click(freeCheckbox);

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled();
        const filters = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1][0];
        expect(filters.status).toBeDefined();
        expect(filters.status).toContain('free');
      });
    });

    it('should handle multiple status selections', async () => {
      const user = userEvent.setup();
      render(<SpotFilters {...defaultProps} />);

      await user.click(screen.getByLabelText(/free/i));
      await user.click(screen.getByLabelText(/occupied/i));

      await waitFor(() => {
        const filters = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1][0];
        expect(filters.status).toContain('free');
        expect(filters.status).toContain('occupied');
      });
    });
  });

  describe('Security level filters', () => {
    it('should call onFilterChange when security level checkbox is checked', async () => {
      const user = userEvent.setup();
      render(<SpotFilters {...defaultProps} />);

      const lowCheckbox = screen.getByLabelText(/low/i);
      await user.click(lowCheckbox);

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled();
        const filters = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1][0];
        expect(filters.securityLevel).toBeDefined();
        expect(filters.securityLevel).toContain('low');
      });
    });
  });

  describe('Combined filters', () => {
    it('should combine type and status filters', async () => {
      const user = userEvent.setup();
      render(<SpotFilters {...defaultProps} />);

      await user.click(screen.getByLabelText(/wall/i));
      await user.click(screen.getByLabelText(/free/i));

      await waitFor(() => {
        const filters = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1][0];
        expect(filters.type).toContain('wall');
        expect(filters.status).toContain('free');
      });
    });

    it('should combine all filter types', async () => {
      const user = userEvent.setup();
      render(<SpotFilters {...defaultProps} />);

      await user.click(screen.getByLabelText(/wall/i));
      await user.click(screen.getByLabelText(/free/i));
      await user.click(screen.getByLabelText(/low/i));

      await waitFor(() => {
        const filters = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1][0];
        expect(filters.type).toContain('wall');
        expect(filters.status).toContain('free');
        expect(filters.securityLevel).toContain('low');
      });
    });
  });

  describe('Search input', () => {
    it('should call onSearchChange when user types', async () => {
      const user = userEvent.setup();
      render(<SpotFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'station');

      await waitFor(
        () => {
          expect(mockOnSearchChange).toHaveBeenCalled();
          const lastCall = mockOnSearchChange.mock.calls[mockOnSearchChange.mock.calls.length - 1];
          expect(lastCall[0]).toBe('station');
        },
        { timeout: 1000 }
      );
    });

    it('should debounce search input', async () => {
      const user = userEvent.setup();
      render(<SpotFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'test');

      // Should not call immediately for every keystroke
      const callsImmediately = mockOnSearchChange.mock.calls.length;
      expect(callsImmediately).toBeLessThan(4); // Less than number of characters
    });

    it('should clear search when input is cleared', async () => {
      const user = userEvent.setup();
      render(<SpotFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'test');
      await user.clear(searchInput);

      await waitFor(
        () => {
          const lastCall = mockOnSearchChange.mock.calls[mockOnSearchChange.mock.calls.length - 1];
          expect(lastCall[0]).toBe('');
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Time availability filter', () => {
    it('should render "Disponibile adesso" checkbox', () => {
      render(<SpotFilters {...defaultProps} />);

      expect(screen.getByLabelText(/disponibile adesso/i)).toBeInTheDocument();
    });

    it('should call onFilterChange with availableNow: true when checked', async () => {
      const user = userEvent.setup();
      render(<SpotFilters {...defaultProps} />);

      const availableNowCheckbox = screen.getByLabelText(/disponibile adesso/i);
      await user.click(availableNowCheckbox);

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled();
        const filters = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1][0];
        expect(filters.availableNow).toBe(true);
      });
    });

    it('should call onFilterChange with availableNow: undefined when unchecked', async () => {
      const user = userEvent.setup();
      render(<SpotFilters {...defaultProps} />);

      const availableNowCheckbox = screen.getByLabelText(/disponibile adesso/i);
      await user.click(availableNowCheckbox); // Check
      await user.click(availableNowCheckbox); // Uncheck

      await waitFor(() => {
        const filters = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1][0];
        expect(filters.availableNow).toBeUndefined();
      });
    });

    it('should combine availableNow with other filters', async () => {
      const user = userEvent.setup();
      render(<SpotFilters {...defaultProps} />);

      await user.click(screen.getByLabelText(/wall/i));
      await user.click(screen.getByLabelText(/disponibile adesso/i));

      await waitFor(() => {
        const filters = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1][0];
        expect(filters.type).toContain('wall');
        expect(filters.availableNow).toBe(true);
      });
    });
  });
});
