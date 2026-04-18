/**
 * Tests for Home page component
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Home from '@/app/page';

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ---------------------------------------------------------------------------
// Mock sonner toast
// ---------------------------------------------------------------------------
const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();
jest.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

// ---------------------------------------------------------------------------
// Mock Supabase client – configurable via a flag
// ---------------------------------------------------------------------------
let supabaseConfigured = true;

const mockSupabaseFrom = jest.fn();
const mockInsert = jest.fn();
const mockSelectAfterInsert = jest.fn();
const mockSingle = jest.fn();
const mockSelectQuery = jest.fn();
const mockEq = jest.fn();

// Default chain setup
function setupSupabaseChains() {
  mockInsert.mockReturnValue({ select: mockSelectAfterInsert });
  mockSelectAfterInsert.mockReturnValue({ single: mockSingle });
  mockSingle.mockResolvedValue({ data: null, error: null });
  mockSelectQuery.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: null }) });

  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'rooms') {
      return {
        insert: mockInsert,
        select: mockSelectQuery,
      };
    }
    if (table === 'channels') {
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
    }
    return {};
  });
}

jest.mock('@/lib/supabaseClient', () => ({
  get isSupabaseConfigured() {
    return supabaseConfigured;
  },
  requireSupabaseConfig: () => {
    if (!supabaseConfigured) {
      throw new Error('Supabase is not configured');
    }
  },
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  },
  getAnonymousUserId: () => 'anon_test-user',
  getUserDisplayName: () => 'TestUser',
  setUserDisplayName: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Mock Zustand store
// ---------------------------------------------------------------------------
const mockSetUserId = jest.fn();
const mockSetStoreUserName = jest.fn();
jest.mock('@/lib/store', () => ({
  useAppStore: () => ({
    setUserId: mockSetUserId,
    setUserName: mockSetStoreUserName,
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Home page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabaseConfigured = true;
    setupSupabaseChains();
  });

  describe('setup message', () => {
    it('shows setup required message when Supabase is not configured', () => {
      supabaseConfigured = false;
      render(<Home />);
      expect(screen.getByText('Setup Required')).toBeInTheDocument();
    });

    it('does not show setup message when Supabase is configured', () => {
      render(<Home />);
      expect(screen.queryByText('Setup Required')).not.toBeInTheDocument();
    });
  });

  describe('rendering', () => {
    it('renders the DevCanvas title', () => {
      render(<Home />);
      expect(screen.getByText('DevCanvas')).toBeInTheDocument();
    });

    it('renders the Your Name input', () => {
      render(<Home />);
      expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
    });

    it('renders the Create New Room button', () => {
      render(<Home />);
      expect(screen.getByText('Create New Room')).toBeInTheDocument();
    });

    it('renders the Join Room button', () => {
      render(<Home />);
      expect(screen.getByText('Join Room')).toBeInTheDocument();
    });

    it('renders the Room ID input', () => {
      render(<Home />);
      expect(screen.getByLabelText('Room ID')).toBeInTheDocument();
    });

    it('pre-fills the user name from getUserDisplayName', () => {
      render(<Home />);
      const nameInput = screen.getByLabelText('Your Name') as HTMLInputElement;
      expect(nameInput.value).toBe('TestUser');
    });
  });

  describe('create room', () => {
    it('shows error toast when name is empty', async () => {
      render(<Home />);

      // Clear the name input
      const nameInput = screen.getByLabelText('Your Name');
      fireEvent.change(nameInput, { target: { value: '' } });

      const createBtn = screen.getByText('Create New Room');
      await act(async () => {
        fireEvent.click(createBtn);
      });

      expect(mockToastError).toHaveBeenCalledWith('Please enter your name');
    });

    it('creates a room and navigates on success', async () => {
      mockSingle.mockResolvedValue({ data: { id: 'new-room-id' }, error: null });

      render(<Home />);

      const createBtn = screen.getByText('Create New Room');
      await act(async () => {
        fireEvent.click(createBtn);
      });

      expect(mockPush).toHaveBeenCalledWith('/room/new-room-id');
      expect(mockSetUserId).toHaveBeenCalledWith('anon_test-user');
    });

    it('shows error toast when room creation fails', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      render(<Home />);

      const createBtn = screen.getByText('Create New Room');
      await act(async () => {
        fireEvent.click(createBtn);
      });

      expect(mockToastError).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('join room', () => {
    it('shows error toast when room ID is empty', async () => {
      render(<Home />);

      const joinBtn = screen.getByText('Join Room');
      await act(async () => {
        fireEvent.click(joinBtn);
      });

      expect(mockToastError).toHaveBeenCalledWith('Please enter a room ID');
    });

    it('shows error toast when name is empty for join', async () => {
      render(<Home />);

      // Set room ID but clear name
      const roomInput = screen.getByLabelText('Room ID');
      fireEvent.change(roomInput, { target: { value: 'some-room' } });
      const nameInput = screen.getByLabelText('Your Name');
      fireEvent.change(nameInput, { target: { value: '' } });

      const joinBtn = screen.getByText('Join Room');
      await act(async () => {
        fireEvent.click(joinBtn);
      });

      expect(mockToastError).toHaveBeenCalledWith('Please enter your name');
    });

    it('navigates to room on successful join', async () => {
      const mockSingleJoin = jest.fn().mockResolvedValue({
        data: { id: 'existing-room' },
        error: null,
      });
      mockEq.mockReturnValue({ single: mockSingleJoin });

      render(<Home />);

      const roomInput = screen.getByLabelText('Room ID');
      fireEvent.change(roomInput, { target: { value: 'existing-room' } });

      const joinBtn = screen.getByText('Join Room');
      await act(async () => {
        fireEvent.click(joinBtn);
      });

      expect(mockPush).toHaveBeenCalledWith('/room/existing-room');
      expect(mockSetUserId).toHaveBeenCalledWith('anon_test-user');
    });

    it('shows error toast when room is not found', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const mockSingleJoin = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'not found' },
      });
      mockEq.mockReturnValue({ single: mockSingleJoin });

      render(<Home />);

      const roomInput = screen.getByLabelText('Room ID');
      fireEvent.change(roomInput, { target: { value: 'nonexistent-room' } });

      const joinBtn = screen.getByText('Join Room');
      await act(async () => {
        fireEvent.click(joinBtn);
      });

      expect(mockToastError).toHaveBeenCalledWith('Room not found. Please check the room ID.');
      expect(mockPush).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('keyboard interaction', () => {
    it('pressing Enter in name input triggers create room', async () => {
      mockSingle.mockResolvedValue({ data: { id: 'room-enter' }, error: null });

      render(<Home />);

      const nameInput = screen.getByLabelText('Your Name');
      await act(async () => {
        fireEvent.keyDown(nameInput, { key: 'Enter' });
      });

      expect(mockPush).toHaveBeenCalledWith('/room/room-enter');
    });

    it('pressing Enter in room ID input triggers join room', async () => {
      const mockSingleJoin = jest.fn().mockResolvedValue({
        data: { id: 'room-id-enter' },
        error: null,
      });
      mockEq.mockReturnValue({ single: mockSingleJoin });

      render(<Home />);

      const roomInput = screen.getByLabelText('Room ID');
      fireEvent.change(roomInput, { target: { value: 'room-id-enter' } });

      await act(async () => {
        fireEvent.keyDown(roomInput, { key: 'Enter' });
      });

      expect(mockPush).toHaveBeenCalledWith('/room/room-id-enter');
    });
  });
});
