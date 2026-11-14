import {
  getRefreshedSupabaseAuthHeaders,
  getSupabaseAuthHeaders,
} from '@/shared/services/supabase-auth-headers';

export const POST_COMMIT_GRACE_MS = 2500;

export function playAlertSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 1.0;
    void audio.play().catch(() => {});
  } catch {}
}

export async function fetchWithSupabaseAuthRetry(
  url: string,
  options: { method?: 'GET' | 'POST'; body?: string; requireAuthForInitialTry?: boolean } = {},
): Promise<{ res: Response | null; data: Record<string, unknown> | null }> {
  const baseHeaders: Record<string, string> = options.method === 'POST'
    ? { 'Content-Type': 'application/json' }
    : {};
  let authHeaders = await getSupabaseAuthHeaders(baseHeaders);
  if (options.requireAuthForInitialTry && !authHeaders.Authorization) {
    authHeaders = await getRefreshedSupabaseAuthHeaders(baseHeaders);
    if (!authHeaders.Authorization) {
      return { res: null, data: { success: false, error: 'authentication_required' } };
    }
  }

  let res = await fetch(url, {
    method: options.method || 'GET',
    headers: authHeaders,
    body: options.body,
  });

  if (res.status === 401) {
    const refreshedHeaders = await getRefreshedSupabaseAuthHeaders(baseHeaders);
    if (refreshedHeaders.Authorization) {
      res = await fetch(url, {
        method: options.method || 'GET',
        headers: refreshedHeaders,
        body: options.body,
      });
    }
  }

  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { res, data };
}
