import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side fallback lookup to resolve email by phone number without
 * exposing public profiles to unauthenticated clients.
 */
export async function resolveFallbackEmail(params: {
  adminClient: SupabaseClient;
  normalizedPhone: string;
  rawEmail?: string;
}): Promise<string | null> {
  const { adminClient, normalizedPhone, rawEmail } = params;

  if (rawEmail && rawEmail.includes('@')) {
    return rawEmail.trim().toLowerCase();
  }

  // 1. Check direct profile lookup by phone
  const { data: profileByPhone } = await adminClient
    .from('profiles')
    .select('email')
    .eq('phone', normalizedPhone)
    .maybeSingle();

  if (profileByPhone?.email && String(profileByPhone.email).includes('@')) {
    return String(profileByPhone.email).trim().toLowerCase();
  }

  // 2. RPC lookup via phone digits
  const phoneDigits = normalizedPhone.replace(/\D/g, '');
  const { data: rpcRows, error: rpcErr } = await adminClient.rpc('find_account_by_phone', {
    p_phone_digits: phoneDigits,
  });

  const rpcRow = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
  const rpcId = rpcRow && typeof rpcRow === 'object' ? (rpcRow as { user_id?: unknown }).user_id : undefined;
  const rpcEmail = rpcRow && typeof rpcRow === 'object' ? (rpcRow as { email?: unknown }).email : undefined;

  if (!rpcErr && typeof rpcEmail === 'string' && rpcEmail.includes('@')) {
    return rpcEmail.trim().toLowerCase();
  }

  if (!rpcErr && typeof rpcId === 'string') {
    const { data: userLookup } = await adminClient.auth.admin.getUserById(rpcId);
    const emailCandidate = userLookup?.user?.email || String(userLookup?.user?.user_metadata?.email || '');
    if (emailCandidate && emailCandidate.includes('@')) {
      return emailCandidate.trim().toLowerCase();
    }
  }

  return null;
}
