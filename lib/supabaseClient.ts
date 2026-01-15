import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if environment variables are configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Client-side Supabase client (will use placeholder values if not configured)
// This allows the app to load and show a setup message instead of crashing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false, // We're using anonymous auth or no auth
      autoRefreshToken: false,
    },
  }
);

// Helper to check configuration and throw helpful error if needed
export function requireSupabaseConfig() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Please create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. See SETUP.md for instructions.'
    );
  }
}

// Polyfill for crypto.randomUUID if not available
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper to generate anonymous user ID (stored in localStorage)
export function getAnonymousUserId(): string {
  if (typeof window === 'undefined') return '';
  
  let userId = localStorage.getItem('devcanvas_user_id');
  if (!userId) {
    userId = `anon_${generateUUID()}`;
    localStorage.setItem('devcanvas_user_id', userId);
  }
  return userId;
}

// Helper to get or set display name
export function getUserDisplayName(): string {
  if (typeof window === 'undefined') return 'Anonymous';
  
  const name = localStorage.getItem('devcanvas_user_name');
  return name || 'Anonymous';
}

export function setUserDisplayName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('devcanvas_user_name', name);
}
