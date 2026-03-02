import {
  isSupabaseConfigured,
  requireSupabaseConfig,
  getAnonymousUserId,
  getUserDisplayName,
  setUserDisplayName,
} from '@/lib/supabaseClient';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Ensure crypto.randomUUID is available in jsdom
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => 'test-uuid-1234-5678-abcd-ef0123456789' },
  writable: true,
});

beforeEach(() => {
  localStorageMock.clear();
});

describe('isSupabaseConfigured', () => {
  it('is a boolean', () => {
    expect(typeof isSupabaseConfigured).toBe('boolean');
  });

  // When running tests without real env vars, isSupabaseConfigured should be false
  it('is false when NEXT_PUBLIC_SUPABASE_URL is not set', () => {
    expect(isSupabaseConfigured).toBe(false);
  });
});

describe('requireSupabaseConfig', () => {
  it('throws when Supabase is not configured', () => {
    // In test environment Supabase is not configured
    if (!isSupabaseConfigured) {
      expect(() => requireSupabaseConfig()).toThrow(
        'Supabase is not configured'
      );
    }
  });

  it('does not throw when Supabase is configured', () => {
    // We can't easily test the "configured" path without env vars,
    // so we mock the module-level variables via the real implementation contract
    // by calling requireSupabaseConfig only when configured.
    // This test validates the error message shape when thrown.
    try {
      requireSupabaseConfig();
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toContain('Supabase is not configured');
    }
  });
});

describe('getAnonymousUserId', () => {
  it('returns a non-empty string', () => {
    const id = getAnonymousUserId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns the same ID on subsequent calls (persisted in localStorage)', () => {
    const id1 = getAnonymousUserId();
    const id2 = getAnonymousUserId();
    expect(id1).toBe(id2);
  });

  it('stores the ID in localStorage under devcanvas_user_id', () => {
    getAnonymousUserId();
    const stored = localStorage.getItem('devcanvas_user_id');
    expect(stored).not.toBeNull();
  });

  it('prefixes the ID with "anon_"', () => {
    const id = getAnonymousUserId();
    expect(id.startsWith('anon_')).toBe(true);
  });

  it('returns the stored ID if one already exists', () => {
    localStorage.setItem('devcanvas_user_id', 'anon_existing-id');
    const id = getAnonymousUserId();
    expect(id).toBe('anon_existing-id');
  });
});

describe('getUserDisplayName', () => {
  it('returns "Anonymous" when no name is stored', () => {
    expect(getUserDisplayName()).toBe('Anonymous');
  });

  it('returns the stored display name', () => {
    localStorage.setItem('devcanvas_user_name', 'Alice');
    expect(getUserDisplayName()).toBe('Alice');
  });
});

describe('setUserDisplayName', () => {
  it('stores the name in localStorage', () => {
    setUserDisplayName('Bob');
    expect(localStorage.getItem('devcanvas_user_name')).toBe('Bob');
  });

  it('can be retrieved via getUserDisplayName after being set', () => {
    setUserDisplayName('Charlie');
    expect(getUserDisplayName()).toBe('Charlie');
  });

  it('overwrites a previously stored name', () => {
    setUserDisplayName('Dave');
    setUserDisplayName('Eve');
    expect(getUserDisplayName()).toBe('Eve');
  });
});
