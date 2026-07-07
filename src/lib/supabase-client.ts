import { createClient } from '@supabase/supabase-js';

const SUPABASE_AUTH_STORAGE_KEY = 'radar_supabase_auth_session';
const SUPABASE_REMEMBER_SESSION_KEY = 'radar_supabase_remember_session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: SUPABASE_AUTH_STORAGE_KEY,
    storage: createRememberAwareStorage(),
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function shouldRememberSupabaseSession() {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(SUPABASE_REMEMBER_SESSION_KEY) !== 'false';
}

export function setSupabaseRememberSession(remember: boolean) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(SUPABASE_REMEMBER_SESSION_KEY, remember ? 'true' : 'false');
  const fromStorage = remember ? window.sessionStorage : window.localStorage;
  const toStorage = remember ? window.localStorage : window.sessionStorage;
  const currentSession = fromStorage.getItem(SUPABASE_AUTH_STORAGE_KEY);

  if (currentSession) {
    toStorage.setItem(SUPABASE_AUTH_STORAGE_KEY, currentSession);
    fromStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
  }
}

export function clearSupabaseAuthStorage() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
}

function createRememberAwareStorage() {
  return {
    getItem(key: string) {
      if (typeof window === 'undefined') return null;
      const preferredStorage = shouldRememberSupabaseSession() ? window.localStorage : window.sessionStorage;
      return preferredStorage.getItem(key) || window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    },
    setItem(key: string, value: string) {
      if (typeof window === 'undefined') return;
      const targetStorage = shouldRememberSupabaseSession() ? window.localStorage : window.sessionStorage;
      const otherStorage = shouldRememberSupabaseSession() ? window.sessionStorage : window.localStorage;
      targetStorage.setItem(key, value);
      otherStorage.removeItem(key);
    },
    removeItem(key: string) {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    },
  };
}
