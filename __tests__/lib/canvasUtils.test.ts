import { throttleSnapshot } from '@/lib/utils/canvas';
import type { TLStoreSnapshot } from '@tldraw/tldraw';

// We don't need a real TLStoreSnapshot for testing the throttle behavior
const makeSnapshot = (id: number) => ({ id } as unknown as TLStoreSnapshot);

describe('throttleSnapshot', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls the function immediately on first invocation', () => {
    const fn = jest.fn();
    const throttled = throttleSnapshot(fn, 100);

    throttled(makeSnapshot(1));
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(makeSnapshot(1));
  });

  it('does not call the function again within the throttle period', () => {
    const fn = jest.fn();
    const throttled = throttleSnapshot(fn, 100);

    throttled(makeSnapshot(1));
    throttled(makeSnapshot(2));
    throttled(makeSnapshot(3));

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('calls the function again after the throttle period expires', () => {
    const fn = jest.fn();
    const throttled = throttleSnapshot(fn, 100);

    throttled(makeSnapshot(1));
    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);

    throttled(makeSnapshot(2));
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith(makeSnapshot(2));
  });

  it('uses CANVAS_THROTTLE_MS as default limit when no limit specified', () => {
    const fn = jest.fn();
    // Import constant to check default
    const { CANVAS_THROTTLE_MS } = require('@/lib/constants');
    const throttled = throttleSnapshot(fn);

    throttled(makeSnapshot(1));
    expect(fn).toHaveBeenCalledTimes(1);

    // Still within default throttle period
    jest.advanceTimersByTime(CANVAS_THROTTLE_MS - 1);
    throttled(makeSnapshot(2));
    expect(fn).toHaveBeenCalledTimes(1);

    // After default throttle period
    jest.advanceTimersByTime(1);
    throttled(makeSnapshot(3));
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('handles multiple throttle cycles correctly', () => {
    const fn = jest.fn();
    const throttled = throttleSnapshot(fn, 50);

    // Cycle 1
    throttled(makeSnapshot(1));
    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(50);

    // Cycle 2
    throttled(makeSnapshot(2));
    expect(fn).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(50);

    // Cycle 3
    throttled(makeSnapshot(3));
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('drops intermediate calls during throttle period', () => {
    const fn = jest.fn();
    const throttled = throttleSnapshot(fn, 100);

    throttled(makeSnapshot(1)); // accepted
    throttled(makeSnapshot(2)); // dropped
    throttled(makeSnapshot(3)); // dropped
    throttled(makeSnapshot(4)); // dropped

    jest.advanceTimersByTime(100);

    throttled(makeSnapshot(5)); // accepted

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, makeSnapshot(1));
    expect(fn).toHaveBeenNthCalledWith(2, makeSnapshot(5));
  });
});

describe('makeToolbarsDraggable', () => {
  // We need a real DOM environment for this test
  const { makeToolbarsDraggable } = require('@/lib/utils/canvas');

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('returns an array of cleanup functions', () => {
    const cleanups = makeToolbarsDraggable();
    expect(Array.isArray(cleanups)).toBe(true);
  });

  it('returns empty array when no matching elements exist', () => {
    const cleanups = makeToolbarsDraggable();
    expect(cleanups).toHaveLength(0);
  });

  it('makes matching elements draggable', () => {
    const toolbar = document.createElement('div');
    toolbar.className = 'tlui-layout__top';
    // Mock offsetWidth to be large enough
    Object.defineProperty(toolbar, 'offsetWidth', { value: 100 });
    document.body.appendChild(toolbar);

    const cleanups = makeToolbarsDraggable();

    expect(toolbar.dataset.draggable).toBe('true');
    expect(toolbar.style.cursor).toBe('move');
    expect(toolbar.style.userSelect).toBe('none');
    expect(cleanups.length).toBeGreaterThan(0);
  });

  it('skips elements that are too small (offsetWidth < 20)', () => {
    const toolbar = document.createElement('div');
    toolbar.className = 'tlui-layout__top';
    Object.defineProperty(toolbar, 'offsetWidth', { value: 10 });
    document.body.appendChild(toolbar);

    makeToolbarsDraggable();
    expect(toolbar.dataset.draggable).toBeUndefined();
  });

  it('skips elements that are already draggable', () => {
    const toolbar = document.createElement('div');
    toolbar.className = 'tlui-layout__top';
    toolbar.dataset.draggable = 'true';
    Object.defineProperty(toolbar, 'offsetWidth', { value: 100 });
    document.body.appendChild(toolbar);

    const cleanups = makeToolbarsDraggable();
    // No new cleanup functions should be created for already draggable elements
    expect(cleanups).toHaveLength(0);
  });

  it('restores position from localStorage if available', () => {
    const toolbar = document.createElement('div');
    toolbar.className = 'tlui-layout__bottom';
    Object.defineProperty(toolbar, 'offsetWidth', { value: 100 });
    document.body.appendChild(toolbar);

    const storageKey = `toolbar-pos-tlui-layout__bottom`;
    localStorage.setItem(storageKey, JSON.stringify({ x: 50, y: 75 }));

    makeToolbarsDraggable();

    expect(toolbar.style.position).toBe('absolute');
    expect(toolbar.style.left).toBe('50px');
    expect(toolbar.style.top).toBe('75px');
    expect(toolbar.style.zIndex).toBe('1000');
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    const toolbar = document.createElement('div');
    toolbar.className = 'tlui-layout__bottom';
    Object.defineProperty(toolbar, 'offsetWidth', { value: 100 });
    document.body.appendChild(toolbar);

    const storageKey = `toolbar-pos-tlui-layout__bottom`;
    localStorage.setItem(storageKey, 'not-valid-json');

    // Should not throw
    expect(() => makeToolbarsDraggable()).not.toThrow();
    expect(toolbar.dataset.draggable).toBe('true');
  });

  it('cleanup functions remove event listeners without throwing', () => {
    const toolbar = document.createElement('div');
    toolbar.className = 'tlui-layout__top';
    Object.defineProperty(toolbar, 'offsetWidth', { value: 100 });
    document.body.appendChild(toolbar);

    const cleanups = makeToolbarsDraggable();
    cleanups.forEach((cleanup) => {
      expect(() => cleanup()).not.toThrow();
    });
  });
});
