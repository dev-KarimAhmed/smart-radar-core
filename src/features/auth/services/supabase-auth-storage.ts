const SUPABASE_AUTH_STORAGE_KEY = 'radar_supabase_auth_session';
const SUPABASE_REMEMBER_SESSION_KEY = 'radar_supabase_remember_session';

export function shouldRememberSupabaseSession() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SUPABASE_REMEMBER_SESSION_KEY) === 'true';
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
    if (window.sessionStorage.getItem(SUPABASE_AUTH_STORAGE_KEY)) {
      return true;
    }
    if (shouldRememberSupabaseSession() && window.localStorage.getItem(SUPABASE_AUTH_STORAGE_KEY)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function createRememberAwareStorage() {
  return {
    getItem(key: string) {
      if (typeof window === 'undefined') return null;
      try {
        const sessionVal = window.sessionStorage.getItem(key);
        if (sessionVal) return sessionVal;
      } catch {}
      try {
        if (shouldRememberSupabaseSession()) {
          const localVal = window.localStorage.getItem(key);
          if (localVal) return localVal;
        }
      } catch {}
      return null;
    },
    setItem(key: string, value: string) {
      if (typeof window === 'undefined') return;
      try {
        window.sessionStorage.setItem(key, value);
      } catch {}
      if (shouldRememberSupabaseSession()) {
        try {
          window.localStorage.setItem(key, value);
        } catch {}
      } else {
        try {
          window.localStorage.removeItem(key);
        } catch {}
      }
    },
    removeItem(key: string) {
      if (typeof window === 'undefined') return;
      try {
        window.sessionStorage.removeItem(key);
      } catch {}
      try {
        window.localStorage.removeItem(key);
      } catch {}
    },
  };
}

export { SUPABASE_AUTH_STORAGE_KEY };
