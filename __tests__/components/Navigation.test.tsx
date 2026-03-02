import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Navigation from '@/components/Navigation';

// ---------------------------------------------------------------------------
// Mock Next.js navigation hooks
// ---------------------------------------------------------------------------
const mockPush = jest.fn();
let mockPathname = '/';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

// ---------------------------------------------------------------------------
// Mock Zustand store
// ---------------------------------------------------------------------------
jest.mock('@/lib/store', () => ({
  useAppStore: () => ({ userName: 'TestUser' }),
}));

// ---------------------------------------------------------------------------
// Mock supabaseClient helpers
// ---------------------------------------------------------------------------
jest.mock('@/lib/supabaseClient', () => ({
  getUserDisplayName: () => 'TestUser',
  isSupabaseConfigured: false,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderNavigation(pathname = '/') {
  mockPathname = pathname;
  return render(<Navigation />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Navigation component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the DevCanvas brand name', () => {
    renderNavigation('/');
    expect(screen.getByText('DevCanvas')).toBeInTheDocument();
  });

  it('shows the current user display name', () => {
    renderNavigation('/');
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  it('does NOT render the Home button on the home page', () => {
    renderNavigation('/');
    expect(screen.queryByTitle('Go to home')).not.toBeInTheDocument();
  });

  it('renders the Home button when on a room page', () => {
    renderNavigation('/room/abc-123');
    expect(screen.getByTitle('Go to home')).toBeInTheDocument();
  });

  it('renders the abbreviated room ID when on a room page', () => {
    renderNavigation('/room/abc-12345-xyz');
    // roomId.slice(0, 8) → "abc-1234"
    expect(screen.getByText(/abc-1234/)).toBeInTheDocument();
  });

  it('renders the Copy Link button when on a room page', () => {
    renderNavigation('/room/abc-123');
    expect(screen.getByTitle(/Copy room link/)).toBeInTheDocument();
  });

  it('does NOT render the Copy Link button on the home page', () => {
    renderNavigation('/');
    expect(screen.queryByTitle(/Copy room link/)).not.toBeInTheDocument();
  });

  it('Copy Link button has aria-keyshortcuts attribute on room page', () => {
    renderNavigation('/room/abc-123');
    const btn = screen.getByTitle(/Copy room link/);
    expect(btn).toHaveAttribute('aria-keyshortcuts', 'Control+Shift+L');
  });

  it('keyboard shortcut Ctrl+Shift+L copies room link on room page', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    renderNavigation('/room/abc-123');

    await act(async () => {
      fireEvent.keyDown(document, { key: 'l', ctrlKey: true, shiftKey: true });
    });

    expect(writeText).toHaveBeenCalled();
  });

  it('keyboard shortcut Ctrl+Shift+L does nothing on home page', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    renderNavigation('/');

    await act(async () => {
      fireEvent.keyDown(document, { key: 'l', ctrlKey: true, shiftKey: true });
    });

    expect(writeText).not.toHaveBeenCalled();
  });
});
