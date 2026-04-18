/**
 * Tests for usePanelPersistence hook
 */
import { renderHook, act } from '@testing-library/react';
import { usePanelPersistence } from '@/app/room/[roomId]/hooks/usePanelPersistence';
import { PANEL_SIZE_KEYS, DEFAULT_PANEL_SIZES } from '@/lib/constants';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

beforeEach(() => {
  localStorageMock.clear();
});

describe('usePanelPersistence', () => {
  describe('initial state', () => {
    it('returns default panel sizes when no stored values', () => {
      const { result } = renderHook(() => usePanelPersistence());
      const [sizes] = result.current;

      expect(sizes.sidebar).toBe(DEFAULT_PANEL_SIZES.sidebar);
      expect(sizes.canvas).toBe(DEFAULT_PANEL_SIZES.canvas);
      expect(sizes.chat).toBe(DEFAULT_PANEL_SIZES.chat);
      expect(sizes.voice).toBe(DEFAULT_PANEL_SIZES.voice);
      expect(sizes.main).toBe(DEFAULT_PANEL_SIZES.main);
    });

    it('loads stored panel sizes from localStorage', () => {
      localStorageMock.setItem(PANEL_SIZE_KEYS.sidebar, '20');
      localStorageMock.setItem(PANEL_SIZE_KEYS.canvas, '50');
      localStorageMock.setItem(PANEL_SIZE_KEYS.chat, '30');

      const { result } = renderHook(() => usePanelPersistence());
      const [sizes] = result.current;

      expect(sizes.sidebar).toBe(20);
      expect(sizes.canvas).toBe(50);
      expect(sizes.chat).toBe(30);
    });

    it('falls back to defaults for invalid stored values', () => {
      localStorageMock.setItem(PANEL_SIZE_KEYS.sidebar, 'not-a-number');
      localStorageMock.setItem(PANEL_SIZE_KEYS.canvas, '-5');
      localStorageMock.setItem(PANEL_SIZE_KEYS.chat, '200');

      const { result } = renderHook(() => usePanelPersistence());
      const [sizes] = result.current;

      expect(sizes.sidebar).toBe(DEFAULT_PANEL_SIZES.sidebar);
      expect(sizes.canvas).toBe(DEFAULT_PANEL_SIZES.canvas);
      expect(sizes.chat).toBe(DEFAULT_PANEL_SIZES.chat);
    });
  });

  describe('handleHorizontalLayoutChange', () => {
    it('updates sidebar, canvas, and chat sizes', () => {
      const { result } = renderHook(() => usePanelPersistence());

      act(() => {
        result.current[1].handleHorizontalLayoutChange({
          'sidebar-panel': 18,
          'canvas-panel': 55,
          'chat-panel': 27,
        });
      });

      const [sizes] = result.current;
      expect(sizes.sidebar).toBe(18);
      expect(sizes.canvas).toBe(55);
      expect(sizes.chat).toBe(27);
    });

    it('persists sizes to localStorage', () => {
      const { result } = renderHook(() => usePanelPersistence());

      act(() => {
        result.current[1].handleHorizontalLayoutChange({
          'sidebar-panel': 22,
          'canvas-panel': 48,
          'chat-panel': 30,
        });
      });

      expect(localStorageMock.getItem(PANEL_SIZE_KEYS.sidebar)).toBe('22');
      expect(localStorageMock.getItem(PANEL_SIZE_KEYS.canvas)).toBe('48');
      expect(localStorageMock.getItem(PANEL_SIZE_KEYS.chat)).toBe('30');
    });

    it('handles partial layout updates (only some panels provided)', () => {
      const { result } = renderHook(() => usePanelPersistence());

      act(() => {
        result.current[1].handleHorizontalLayoutChange({
          'sidebar-panel': 25,
        });
      });

      const [sizes] = result.current;
      expect(sizes.sidebar).toBe(25);
      // Others should remain at defaults
      expect(sizes.canvas).toBe(DEFAULT_PANEL_SIZES.canvas);
      expect(sizes.chat).toBe(DEFAULT_PANEL_SIZES.chat);
    });
  });

  describe('handleVerticalLayoutChange', () => {
    it('updates main and voice sizes', () => {
      const { result } = renderHook(() => usePanelPersistence());

      act(() => {
        result.current[1].handleVerticalLayoutChange({
          'main-panel': 85,
          'voice-panel': 15,
        });
      });

      const [sizes] = result.current;
      expect(sizes.main).toBe(85);
      expect(sizes.voice).toBe(15);
    });

    it('persists sizes to localStorage', () => {
      const { result } = renderHook(() => usePanelPersistence());

      act(() => {
        result.current[1].handleVerticalLayoutChange({
          'main-panel': 90,
          'voice-panel': 10,
        });
      });

      expect(localStorageMock.getItem(PANEL_SIZE_KEYS.main)).toBe('90');
      expect(localStorageMock.getItem(PANEL_SIZE_KEYS.voice)).toBe('10');
    });

    it('handles partial layout updates', () => {
      const { result } = renderHook(() => usePanelPersistence());

      act(() => {
        result.current[1].handleVerticalLayoutChange({
          'voice-panel': 20,
        });
      });

      const [sizes] = result.current;
      expect(sizes.voice).toBe(20);
      expect(sizes.main).toBe(DEFAULT_PANEL_SIZES.main);
    });
  });

  describe('handler stability', () => {
    it('handleHorizontalLayoutChange is stable across renders', () => {
      const { result, rerender } = renderHook(() => usePanelPersistence());
      const handler1 = result.current[1].handleHorizontalLayoutChange;

      rerender();
      const handler2 = result.current[1].handleHorizontalLayoutChange;

      expect(handler1).toBe(handler2);
    });

    it('handleVerticalLayoutChange is stable across renders', () => {
      const { result, rerender } = renderHook(() => usePanelPersistence());
      const handler1 = result.current[1].handleVerticalLayoutChange;

      rerender();
      const handler2 = result.current[1].handleVerticalLayoutChange;

      expect(handler1).toBe(handler2);
    });
  });
});
