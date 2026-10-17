'use client';

import { supabase } from '@/lib/supabase-client';
import { SUPABASE_AUTH_STORAGE_KEY } from '@/features/auth/services/supabase-auth-storage';

export async function getAdminAuthHeaders(explicitAdminId?: string): Promise<Record<string, string>> {
  let token = '';
  let activeId = explicitAdminId || '';

  // 1. Try Supabase Auth session
  try {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token || '';
    if (!activeId && data.session?.user?.id) {
      activeId = data.session.user.id;
    }
  } catch {}

  // 2. Try browser localStorage / sessionStorage cache
  if ((!token || !activeId) && typeof window !== 'undefined') {
    try {
      const keys = [SUPABASE_AUTH_STORAGE_KEY, 'supabase.auth.token'];
      for (const k of keys) {
        const raw = window.localStorage.getItem(k) || window.sessionStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (!token) {
            token = parsed?.access_token || parsed?.session?.access_token || '';
          }
          if (!activeId) {
            activeId = parsed?.user?.id || parsed?.user?.uid || parsed?.session?.user?.id || '';
          }
          if (token && activeId) break;
        }
      }
    } catch {}
  }

  // 3. Fallback active id from custom admin key
  if (!activeId && typeof window !== 'undefined') {
    try {
      activeId = window.localStorage.getItem('radar_admin_active_id') || window.sessionStorage.getItem('radar_admin_active_id') || '';
    } catch {}
  }

  // 4. In development fallback
  if (!activeId && !token && process.env.NODE_ENV !== 'production') {
    activeId = 'dev-admin-001';
  }

  return {
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(activeId ? { 'x-admin-id': activeId } : {}),
  };
}

export async function adminFetch(
  url: string,
  init?: RequestInit,
  explicitAdminId?: string
): Promise<Response> {
  const authHeaders = await getAdminAuthHeaders(explicitAdminId);
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

