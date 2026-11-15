import type { SupabaseClient, User as AuthUser } from '@supabase/supabase-js';

const PRIMARY_OWNER_ID = '70b4a26f-10ac-4888-8df6-c3a5ad824b8a';
const PRIMARY_OWNER_PHONES = new Set(['+201551981922', '+201551981977', '201551981977']);
// Cutoff timestamp for email verification rollout: Oct 23, 2026 15:30:00 UTC
const EMAIL_CONFIRM_CUTOFF_MS = 1792769400000;

export async function checkEmailConfirmation(params: {
  adminClient: SupabaseClient;
  user: AuthUser;
  normalizedPhone: string;
}): Promise<{ ok: boolean; responsePayload?: any }> {
  const { adminClient, user, normalizedPhone } = params;
  const userEmail = user.email || (user.user_metadata?.email as string | undefined);
  const createdAtMs = user.created_at ? new Date(user.created_at).getTime() : 0;
  const isPreFeatureAccount = createdAtMs > 0 && createdAtMs < EMAIL_CONFIRM_CUTOFF_MS;
  const isPhoneOnlyAccount = !userEmail || !userEmail.includes('@');
  const requiresEmailConfirmation = !isPreFeatureAccount && !isPhoneOnlyAccount;

  let isEmailConfirmed = Boolean(user.email_confirmed_at);
  if (requiresEmailConfirmation && !isEmailConfirmed) {
    const { data: freshUser } = await adminClient.auth.admin.getUserById(user.id);
    if (freshUser?.user?.email_confirmed_at) {
      isEmailConfirmed = true;
    } else {
      const { data: profCheck } = await adminClient
        .from('profiles')
        .select('email_verified')
        .eq('id', user.id)
        .maybeSingle();
      if (profCheck?.email_verified) {
        isEmailConfirmed = true;
      }
    }
  }

  if (requiresEmailConfirmation && !isEmailConfirmed) {
    return {
      ok: false,
      responsePayload: {
        code: 'email_not_confirmed',
        error: 'email_not_confirmed',
        email: userEmail,
        phone: normalizedPhone,
      },
    };
  }

  return { ok: true };
}

export function validateRoleAndStatus(params: {
  profile: any;
  user: AuthUser;
  expectedRole?: string;
}): { ok: boolean; status: number; code?: string; error?: string } {
  const { profile, user, expectedRole } = params;
  const profileStatus = String(profile?.status || 'ACTIVE').toUpperCase();
  const auditLogs = Array.isArray(profile?.rank_audit_log) ? (profile.rank_audit_log as string[]) : [];
  const isTemporarySuspension =
    profileStatus === 'SUSPENDED' || (profileStatus === 'BANNED' && auditLogs.includes('ACCOUNT_SUSPENDED'));
  const isPermanentBan = profileStatus === 'BANNED' && !isTemporarySuspension;

  if (isPermanentBan) {
    return { ok: false, status: 403, code: 'account_banned', error: 'هذا الحساب محظور من استخدام المنصة.' };
  }

  const dbRole = String(profile?.role || user.user_metadata?.role || 'RIDER').toUpperCase();
  const isPrimaryOwner =
    user.id === PRIMARY_OWNER_ID ||
    PRIMARY_OWNER_PHONES.has(String(user.phone || '')) ||
    PRIMARY_OWNER_PHONES.has(String(user.user_metadata?.phone || ''));

  if (expectedRole === 'ADMIN' && (profileStatus === 'BANNED' || profileStatus === 'SUSPENDED')) {
    return { ok: false, status: 403, code: 'admin_suspended', error: 'حساب الإدارة موقوف أو محظور حالياً.' };
  }

  if (expectedRole) {
    if (dbRole !== expectedRole && !(isPrimaryOwner && expectedRole === 'ADMIN')) {
      return {
        ok: false,
        status: 403,
        code: 'role_mismatch',
        error: `role_mismatch:${dbRole}:${expectedRole}`,
      };
    }
  }

  return { ok: true, status: 200 };
}
