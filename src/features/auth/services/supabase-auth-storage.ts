const SUPABASE_AUTH_STORAGE_KEY = 'radar_supabase_auth_session';
const SUPABASE_REMEMBER_SESSION_KEY = 'radar_supabase_remember_session';

export function shouldRememberSupabaseSession() {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(SUPABASE_REMEMBER_SESSION_KEY) !== 'false';
}

export function setSupabaseRememberSession(remember: boolean) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(SUPABASE_REMEMBER_SESSION_KEY, remember ? 'true' : 'false');
  } catch {}
}

export function clearSupabaseAuthStorage() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
  } catch {}
  try {
    window.sessionStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
  } catch {}
}

export function hasStoredSupabaseAuthSession() {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(
      window.localStorage.getItem(SUPABASE_AUTH_STORAGE_KEY)
      || window.sessionStorage.getItem(SUPABASE_AUTH_STORAGE_KEY),
    );
  } catch {
    return false;
  }
}

export function createRememberAwareStorage() {
  return {
    getItem(key: string) {
      if (typeof window === 'undefined') return null;
      try {
        const localVal = window.localStorage.getItem(key);
        if (localVal) return localVal;
      } catch {}
      try {
        return window.sessionStorage.getItem(key);
      } catch {}
      return null;
    },
    setItem(key: string, value: string) {
      if (typeof window === 'undefined') return;
      // Always store primarily in localStorage to prevent session destruction on mobile screen lock/sleep
      try {
        window.localStorage.setItem(key, value);
      } catch {}
      try {
        window.sessionStorage.setItem(key, value);
      } catch {}
    },
    removeItem(key: string) {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.removeItem(key);
      } catch {}
      try {
        window.sessionStorage.removeItem(key);
      } catch {}
    },
  };
}

export { SUPABASE_AUTH_STORAGE_KEY };
