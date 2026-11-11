'use client';

import { supabase } from '@/lib/supabase-client';
import { SUPABASE_AUTH_STORAGE_KEY } from '@/features/auth/services/supabase-auth-storage';

export async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  let token = '';

  // 1. Try Supabase Auth session
  try {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token || '';
  } catch {}

  // 2. Fallback to browser storage for Supabase access token
  if (!token && typeof window !== 'undefined') {
    try {
      const keys = [SUPABASE_AUTH_STORAGE_KEY, 'supabase.auth.token'];
      for (const k of keys) {
        const raw = window.localStorage.getItem(k) || window.sessionStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          token = parsed?.access_token || parsed?.session?.access_token || '';
          if (token) break;
        }
      }
    } catch {}
  }

  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function adminFetch(
  url: string,
  init?: RequestInit,
  _explicitAdminId?: string,
): Promise<Response> {
  const authHeaders = await getAdminAuthHeaders();
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  return fetch(url, {
    ...init,
    headers: {
      ...authHeaders,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers || {}),
    },
  });
}
