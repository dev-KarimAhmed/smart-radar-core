'use client';

export async function getClientAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const { supabase } = await import('@/lib/supabase-client');
    const { data, error } = await supabase.auth.getSession();
    if (!error && data?.session?.access_token) {
      return data.session.access_token;
    }
  } catch {
    // Fallback below if dynamic import or session read fails
  }

  return null;
}

export async function getClientUserId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const { supabase } = await import('@/lib/supabase-client');
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) {
      return data.user.id;
    }
  } catch {
    // Ignore session lookup errors
  }

  return null;
}

export async function getSupabaseAuthHeaders(
  baseHeaders: Record<string, string> = {},
): Promise<Record<string, string>> {
  const token = await getClientAccessToken();
  if (!token) {
    return { ...baseHeaders };
  }
  return {
    ...baseHeaders,
    Authorization: `Bearer ${token}`,
  };
}

export async function getFirebaseIdToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const { auth } = await import('@/lib/firebase');
    const token = await auth.currentUser?.getIdToken();
    return token || null;
  } catch {
    return null;
  }
}

export function getSafeLandingPageUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_PAGE || 'https://radar-page.vercel.app').trim();
  const sanitized = raw.replace(/["'\\]/g, '').trim();
  if (sanitized.startsWith('http://') || sanitized.startsWith('https://')) {
    return sanitized;
  }
  return `https://${sanitized.replace(/^https?:?\/?\/?/, '')}`;
}
