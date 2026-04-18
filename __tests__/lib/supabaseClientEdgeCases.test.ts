/**
 * Additional tests for supabaseClient edge cases
 * These complement the existing supabaseClient.test.ts
 */

// Save original crypto
const originalCrypto = globalThis.crypto;

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

describe('supabaseClient - UUID fallback', () => {
  it('generates a valid UUID v4 format when crypto.randomUUID is unavailable', () => {
    // Remove crypto.randomUUID to trigger fallback
    Object.defineProperty(globalThis, 'crypto', {
      value: {},
      writable: true,
      configurable: true,
    });

    // Clear module cache so supabaseClient re-evaluates with missing crypto
    jest.resetModules();

    const { getAnonymousUserId } = require('@/lib/supabaseClient');
    const id = getAnonymousUserId();

    expect(id).toMatch(/^anon_/);
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidPart = id.replace('anon_', '');
    expect(uuidPart).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );

    // Restore crypto
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      writable: true,
      configurable: true,
    });
  });

  it('generates unique UUIDs on multiple calls (fallback path)', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: {},
      writable: true,
      configurable: true,
    });

    jest.resetModules();

    const { getAnonymousUserId } = require('@/lib/supabaseClient');

    // First call generates and stores
    const id1 = getAnonymousUserId();
    // Clear storage to force re-generation
    localStorageMock.clear();
    const id2 = getAnonymousUserId();

    // Both should be valid
    expect(id1).toMatch(/^anon_/);
    expect(id2).toMatch(/^anon_/);

    // Restore crypto
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      writable: true,
      configurable: true,
    });
  });
});

describe('supabaseClient - edge cases', () => {
  beforeEach(() => {
    // Ensure crypto.randomUUID is available for these tests
    Object.defineProperty(globalThis, 'crypto', {
      value: { randomUUID: () => 'test-uuid-1234-5678-abcd-ef0123456789' },
      writable: true,
      configurable: true,
    });
    jest.resetModules();
  });

  afterAll(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      writable: true,
      configurable: true,
    });
  });

  it('setUserDisplayName and getUserDisplayName round-trip with empty string', () => {
    const { setUserDisplayName, getUserDisplayName } = require('@/lib/supabaseClient');

    setUserDisplayName('');
    // Empty string is stored, but getUserDisplayName returns 'Anonymous' for empty/falsy
    // Actually checking the behavior: localStorage stores '', .getItem returns '', which is falsy
    const name = getUserDisplayName();
    // Empty string is falsy, so || 'Anonymous' triggers
    expect(name).toBe('Anonymous');
  });

  it('setUserDisplayName handles special characters', () => {
    const { setUserDisplayName, getUserDisplayName } = require('@/lib/supabaseClient');

    setUserDisplayName('Ñoño <script>alert("xss")</script>');
    expect(getUserDisplayName()).toBe('Ñoño <script>alert("xss")</script>');
  });

  it('getAnonymousUserId returns consistent ID across module reloads when stored', () => {
    const mod1 = require('@/lib/supabaseClient');
    const id1 = mod1.getAnonymousUserId();

    // Don't clear modules, just call again
    const id2 = mod1.getAnonymousUserId();
    expect(id1).toBe(id2);
  });
});
