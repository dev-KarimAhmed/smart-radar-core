import { supabaseAdmin } from '@/lib/supabase-admin';
import { encodeNotificationPayload } from '@/shared/utils/notification-i18n';

export const WELCOME_HOURS_FLAG_KEY = 'new_captain_welcome_credit';

export interface WelcomeHoursConfig {
  enabled: boolean;
  hours: number;
  minutes: number;
  validityDays: number;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_WELCOME_HOURS_CONFIG: WelcomeHoursConfig = {
  enabled: true,
  hours: 20,
  minutes: 1200,
  validityDays: 30,
};

export async function getWelcomeHoursConfig(): Promise<WelcomeHoursConfig> {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_flags')
      .select('enabled, note, updated_at')
      .eq('flag', WELCOME_HOURS_FLAG_KEY)
      .maybeSingle();

    if (!error && data) {
      let parsedNote: any = {};
      if (data.note) {
        try {
          parsedNote = JSON.parse(data.note);
        } catch {}
      }

      const hours = Number(parsedNote.hours ?? DEFAULT_WELCOME_HOURS_CONFIG.hours);
      return {
        enabled: Boolean(data.enabled),
        hours,
        minutes: Number(parsedNote.minutes ?? hours * 60),
        validityDays: Number(parsedNote.validity_days ?? DEFAULT_WELCOME_HOURS_CONFIG.validityDays),
        updatedAt: data.updated_at,
        updatedBy: parsedNote.updated_by,
      };
    }
  } catch (err) {
    console.warn('[WelcomeHours] Error reading app_flags:', err);
  }

  return DEFAULT_WELCOME_HOURS_CONFIG;
}

export interface WelcomeCreditResult {
  granted: boolean;
  hours?: number;
  minutes?: number;
  reason?: string;
}

/**
 * Ensures a newly registered or approved captain receives their configured welcome flight hours.
 * Idempotent: Only grants if the captain hasn't already received them and currently has 0 minutes.
 */
export async function grantNewCaptainWelcomeCredit(
  captainId: string,
  options?: { force?: boolean }
): Promise<WelcomeCreditResult> {
  if (!captainId) {
    return { granted: false, reason: 'invalid_captain_id' };
  }

  try {
    const config = await getWelcomeHoursConfig();
    if (!config.enabled && !options?.force) {
      return { granted: false, reason: 'feature_disabled' };
    }

    const hours = Math.max(0, config.hours);
    const minutes = hours * 60;
    const validityDays = Math.max(1, config.validityDays || 30);

    if (minutes <= 0) {
      return { granted: false, reason: 'zero_hours_configured' };
    }

    // 1. Check existing wallet
    const { data: existingWallet, error: wErr } = await supabaseAdmin
      .from('wallet_accounts')
      .select('paid_minutes_remaining, bonus_minutes_remaining, active_package_name')
      .eq('profile_id', captainId)
      .maybeSingle();

    if (wErr) {
      console.warn('[grantNewCaptainWelcomeCredit] wallet fetch error:', wErr);
    }

    const currentMins = Number(existingWallet?.paid_minutes_remaining || 0);
    const hasExistingPackage = (existingWallet?.active_package_name || '').includes('ترحيبية');

    if (currentMins > 0 || hasExistingPackage) {
      // Already has minutes or already received welcome package
      return { granted: false, reason: 'already_credited', minutes: currentMins };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    // 2. Upsert wallet account with welcome hours
    const { error: upsertErr } = await supabaseAdmin
      .from('wallet_accounts')
      .upsert(
        {
          profile_id: captainId,
          balance: 0,
          paid_minutes_remaining: minutes,
          bonus_minutes_remaining: 0,
          time_bundle_expires_at: expiresAt.toISOString(),
          active_package_name: `باقة ترحيبية للكابتن الجديد (${hours} ساعة)`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id' }
      );

    if (upsertErr) {
      console.error('[grantNewCaptainWelcomeCredit] wallet upsert error:', upsertErr);
      throw upsertErr;
    }

    // 3. Dispatch dual-language welcome notification
    const titleAr = `هدية ترحيبية: ${hours} ساعة رادار مجاناً 🎁⚡`;
    const bodyAr = `أهلاً بك يا كابتن! تم إيداع رصيد ترحيبي قدره (${hours}) ساعة طيران رادار في محفظتك بنجاح لتنطلق في استقبال الرحلات فوراً. نتمنى لك رحلات موفقة وأرباحاً وفيرة!`;
    const titleEn = `Welcome Gift: ${hours} Free Radar Hours 🎁⚡`;
    const bodyEn = `Welcome Captain! A welcome credit of (${hours}) radar flight hours has been deposited into your wallet to start accepting rides immediately. Wishing you successful trips!`;

    const encoded = encodeNotificationPayload(titleAr, bodyAr, titleEn, bodyEn);

    await supabaseAdmin.from('user_notifications').insert({
      id: `notif_welcome_hours_${captainId}_${Date.now()}`,
      user_id: captainId,
      title: encoded.title,
      description: encoded.description,
      type: 'WALLET_CREDIT',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return {
      granted: true,
      hours,
      minutes,
    };
  } catch (err: any) {
    console.error('[grantNewCaptainWelcomeCredit] execution failed:', err);
    return { granted: false, reason: err?.message || 'execution_error' };
  }
}
