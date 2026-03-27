// src/components/__tests__/SpotForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpotForm } from '../SpotForm';
import type { Spot } from '../../types/spot';

describe('SpotForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render empty form when no spot provided', () => {
      render(<SpotForm {...defaultProps} />);

      expect(screen.getByLabelText(/latitude/i)).toHaveValue(null);
      expect(screen.getByLabelText(/longitude/i)).toHaveValue(null);
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/security level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toHaveValue('');
    });

    it('should render form with prefilled data when spot provided', () => {
      const existingSpot: Spot = {
        id: '123',
        coords: [45.4642, 9.19],
        type: 'wall',
        status: 'free',
        availability: [{ from: '09:00', to: '18:00' }],
        securityLevel: 'medium',
        owner: 'TestCrew',
        notes: 'Test notes',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      render(<SpotForm {...defaultProps} spot={existingSpot} />);

      expect(screen.getByLabelText(/latitude/i)).toHaveValue(45.4642);
      expect(screen.getByLabelText(/longitude/i)).toHaveValue(9.19);
      expect(screen.getByLabelText(/type/i)).toHaveValue('wall');
      expect(screen.getByLabelText(/status/i)).toHaveValue('free');
      expect(screen.getByLabelText(/security level/i)).toHaveValue('medium');
      expect(screen.getByLabelText(/owner/i)).toHaveValue('TestCrew');
      expect(screen.getByLabelText(/notes/i)).toHaveValue('Test notes');
    });

    it('should have submit and cancel buttons', () => {
      render(<SpotForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /submit|save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Field changes', () => {
    it('should update latitude when user types', async () => {
      const user = userEvent.setup();
      render(<SpotForm {...defaultProps} />);

      const latInput = screen.getByLabelText(/latitude/i);
      await user.type(latInput, '45.4642');

      expect(latInput).toHaveValue(45.4642);
    });

    it('should update longitude when user types', async () => {
      const user = userEvent.setup();
      render(<SpotForm {...defaultProps} />);

      const lngInput = screen.getByLabelText(/longitude/i);
      await user.type(lngInput, '9.19');

      expect(lngInput).toHaveValue(9.19);
    });

    it('should update type when user selects', async () => {
      const user = userEvent.setup();
      render(<SpotForm {...defaultProps} />);

      const typeSelect = screen.getByLabelText(/type/i);
      await user.selectOptions(typeSelect, 'train');

      expect(typeSelect).toHaveValue('train');
    });

    it('should update notes when user types', async () => {
      const user = userEvent.setup();
      render(<SpotForm {...defaultProps} />);

      const notesInput = screen.getByLabelText(/notes/i);
      await user.type(notesInput, 'Test note');

      expect(notesInput).toHaveValue('Test note');
    });
  });

  describe('Validation', () => {
    it('should show error for invalid coordinates', async () => {
      const user = userEvent.setup();
      render(<SpotForm {...defaultProps} />);

      const latInput = screen.getByLabelText(/latitude/i);
      await user.type(latInput, '100');

      const submitButton = screen.getByRole('button', { name: /submit|save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid coordinates/i)).toBeInTheDocument();
      });
    });

    it('should show error when notes exceed 500 characters', async () => {
      render(<SpotForm {...defaultProps} />);

      const notesInput = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
      const longNotes = 'a'.repeat(501);

      // Use fireEvent for large text input (userEvent is too slow)
      fireEvent.change(notesInput, { target: { value: longNotes } });

      await waitFor(() => {
        expect(screen.getByText(/exceed.*500/i)).toBeInTheDocument();
      });
    });

    it('should show character count for notes', () => {
      render(<SpotForm {...defaultProps} />);

      // Should show 0/500 or similar
      expect(screen.getByText(/0.*\/.*500/i)).toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    it('should call onSubmit with valid data', async () => {
      const user = userEvent.setup();
      render(<SpotForm {...defaultProps} />);

      // Fill in valid data
      await user.type(screen.getByLabelText(/latitude/i), '45.4642');
      await user.type(screen.getByLabelText(/longitude/i), '9.19');
      await user.selectOptions(screen.getByLabelText(/type/i), 'wall');
      await user.selectOptions(screen.getByLabelText(/status/i), 'free');
      await user.selectOptions(screen.getByLabelText(/security level/i), 'medium');

      // Use fireEvent for notes (faster than userEvent)
      const notesInput = screen.getByLabelText(/notes/i);
      fireEvent.change(notesInput, { target: { value: 'Test notes' } });

      const submitButton = screen.getByRole('button', { name: /submit|save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.coords).toEqual([45.4642, 9.19]);
        expect(submittedData.type).toBe('wall');
        expect(submittedData.status).toBe('free');
        expect(submittedData.securityLevel).toBe('medium');
        expect(submittedData.notes).toBe('Test notes');
      });
    });

    it('should not call onSubmit with invalid data', async () => {
      const user = userEvent.setup();
      render(<SpotForm {...defaultProps} />);

      // Fill in invalid coordinates
      await user.type(screen.getByLabelText(/latitude/i), '100');

      const submitButton = screen.getByRole('button', { name: /submit|save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should disable submit button when form is invalid', async () => {
      const user = userEvent.setup();
      render(<SpotForm {...defaultProps} />);

      // Leave required fields empty or invalid
      const submitButton = screen.getByRole('button', { name: /submit|save/i });

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Cancel action', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<SpotForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Availability time ranges', () => {
    it('should allow adding time ranges', async () => {
      const user = userEvent.setup();
      render(<SpotForm {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /add.*time/i });
      await user.click(addButton);

      expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/to/i)).toBeInTheDocument();
    });

    it('should allow removing time ranges', async () => {
      const user = userEvent.setup();
      render(<SpotForm {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /add.*time/i });
      await user.click(addButton);

      expect(screen.getByLabelText(/from/i)).toBeInTheDocument();

      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      expect(screen.queryByLabelText(/from/i)).not.toBeInTheDocument();
    });
  });
});
