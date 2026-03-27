// src/components/__tests__/SpotList.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpotList } from '../SpotList';
import type { Spot } from '../../types/spot';

describe('SpotList', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const mockSpots: Spot[] = [
    {
      id: '1',
      coords: [45.4642, 9.19],
      type: 'wall',
      status: 'free',
      availability: [{ from: '09:00', to: '18:00' }],
      securityLevel: 'low',
      notes: 'First spot near the station',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: '2',
      coords: [45.4642, 9.19],
      type: 'train',
      status: 'occupied',
      availability: [],
      securityLevel: 'high',
      owner: 'CrewA',
      notes: 'Second spot under the bridge',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: '3',
      coords: [45.4642, 9.19],
      type: 'sign',
      status: 'protected',
      availability: [],
      securityLevel: 'medium',
      notes: 'Third spot in city center',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  const defaultProps = {
    spots: mockSpots,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render list of spots', () => {
      render(<SpotList {...defaultProps} />);

      expect(screen.getByText(/First spot near the station/i)).toBeInTheDocument();
      expect(screen.getByText(/Second spot under the bridge/i)).toBeInTheDocument();
      expect(screen.getByText(/Third spot in city center/i)).toBeInTheDocument();
    });

    it('should display spot types', () => {
      render(<SpotList {...defaultProps} />);

      expect(screen.getByText(/wall/i)).toBeInTheDocument();
      expect(screen.getByText(/train/i)).toBeInTheDocument();
      expect(screen.getByText(/sign/i)).toBeInTheDocument();
    });

    it('should display spot statuses', () => {
      render(<SpotList {...defaultProps} />);

      expect(screen.getByText(/free/i)).toBeInTheDocument();
      expect(screen.getByText(/occupied/i)).toBeInTheDocument();
      expect(screen.getByText(/protected/i)).toBeInTheDocument();
    });

    it('should show empty state when no spots', () => {
      render(<SpotList {...defaultProps} spots={[]} />);

      expect(screen.getByText(/nessun spot trovato/i)).toBeInTheDocument();
    });

    it('should have edit button for each spot', () => {
      render(<SpotList {...defaultProps} />);

      const editButtons = screen.getAllByRole('button', { name: /edit|modifica/i });
      expect(editButtons).toHaveLength(3);
    });

    it('should have delete button for each spot', () => {
      render(<SpotList {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete|elimina/i });
      expect(deleteButtons).toHaveLength(3);
    });
  });

  describe('Actions', () => {
    it('should call onEdit when edit button clicked', async () => {
      const user = userEvent.setup();
      render(<SpotList {...defaultProps} />);

      const editButtons = screen.getAllByRole('button', { name: /edit|modifica/i });
      await user.click(editButtons[0]);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(mockSpots[0]);
    });

    it('should call onDelete when delete button clicked', async () => {
      const user = userEvent.setup();
      render(<SpotList {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete|elimina/i });
      await user.click(deleteButtons[0]);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith('1');
    });

    it('should call correct callbacks for multiple spots', async () => {
      const user = userEvent.setup();
      render(<SpotList {...defaultProps} />);

      const editButtons = screen.getAllByRole('button', { name: /edit|modifica/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete|elimina/i });

      await user.click(editButtons[1]);
      expect(mockOnEdit).toHaveBeenCalledWith(mockSpots[1]);

      await user.click(deleteButtons[2]);
      expect(mockOnDelete).toHaveBeenCalledWith('3');
    });
  });

  describe('Optional fields', () => {
    it('should display owner when provided', () => {
      render(<SpotList {...defaultProps} />);

      expect(screen.getByText(/CrewA/i)).toBeInTheDocument();
    });

    it('should handle spots without owner', () => {
      const spotsWithoutOwner: Spot[] = [
        {
          id: '1',
          coords: [45.4642, 9.19],
          type: 'wall',
          status: 'free',
          availability: [],
          securityLevel: 'low',
          notes: 'No owner spot',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      render(<SpotList {...defaultProps} spots={spotsWithoutOwner} />);

      expect(screen.getByText(/No owner spot/i)).toBeInTheDocument();
    });
  });
});
