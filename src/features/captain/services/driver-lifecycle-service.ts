import { supabase } from '@/lib/supabase-client';
import type { User } from '@/core/types';

export type DriverStatus = 'active' | 'idle' | 'busy' | 'rating';

export function isDriverStatus(value: unknown): value is DriverStatus {
  return value === 'active' || value === 'idle' || value === 'busy' || value === 'rating';
}

export async function setCaptainStatusRemotely(
  uid: string,
  status: DriverStatus,
): Promise<boolean> {
  // 1. First attempt native database RPC
  try {
    const { data: result, error } = await supabase.rpc('set_captain_status', { p_status: status });
    if (!error) {
      const returnedStatus = (result as { status?: unknown } | null)?.status;
      if (String(returnedStatus || '').toLowerCase() === status) {
        return true;
      }
    }
  } catch {}

  // 2. If RPC fails or requires a bundle/minutes, fallback to server-side authoritative status setter
  try {
    const authSession = await supabase.auth.getSession();
    const token = authSession.data.session?.access_token;
    const res = await fetch('/api/captain/set-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status, uid }),
    });
    const json = await res.json();
    if (json?.success) {
      return true;
    }
  } catch {}

  return false;
}

export async function updateCaptainProfileDoc(
  uid: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', uid);

  return !error;
}
