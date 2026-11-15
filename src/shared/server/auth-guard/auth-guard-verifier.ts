import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getServerSupabaseAdmin } from './auth-guard-clients';
import { extractBearerToken } from './auth-guard-requests';

export interface VerifiedCallerUser {
  id: string;
  role: string;
  status: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  serialId: string | null;
  allowedSectors: string[] | null;
  rankAuditLog: string[] | null;
  rawUser: User;
  profile: Record<string, unknown>;
}

export async function getVerifiedUser(
  req: { headers: Headers | Record<string, unknown> },
  options: { allowSuspended?: boolean } = {},
): Promise<VerifiedCallerUser | null> {
  const token = extractBearerToken(req);
  if (!token) return null;

  let adminClient: SupabaseClient;
  try {
    adminClient = getServerSupabaseAdmin();
  } catch {
    return null;
  }

  const { data: userData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !userData?.user) return null;

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, role, status, full_name, phone, email, serial_id, allowed_sectors, rank_audit_log')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError || !profile) return null;

  const role = String(profile.role || '').toUpperCase();
  const status = String(profile.status || 'ACTIVE').toUpperCase();
  if (status === 'BANNED') return null;
  if (status === 'SUSPENDED' && !options.allowSuspended) return null;

  return {
    id: userData.user.id,
    role,
    status,
    email: (profile.email as string | null) ?? userData.user.email ?? null,
    phone: (profile.phone as string | null) ?? userData.user.phone ?? null,
    fullName: (profile.full_name as string | null) ?? null,
    serialId: (profile.serial_id as string | null) ?? null,
    allowedSectors: Array.isArray(profile.allowed_sectors) ? (profile.allowed_sectors as string[]) : null,
    rankAuditLog: Array.isArray(profile.rank_audit_log) ? (profile.rank_audit_log as string[]) : null,
    rawUser: userData.user,
    profile: profile as Record<string, unknown>,
  };
}
