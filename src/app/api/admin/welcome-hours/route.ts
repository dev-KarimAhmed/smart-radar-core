import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminCaller } from '@/lib/admin-auth-verifier';
import { encodeNotificationPayload } from '@/shared/utils/notification-i18n';
import {
  WELCOME_HOURS_FLAG_KEY,
  WelcomeHoursConfig,
  DEFAULT_WELCOME_HOURS_CONFIG,
  getWelcomeHoursConfig,
} from '@/features/captain/services/captain-welcome-credit';

export const dynamic = 'force-dynamic';

export {
  WELCOME_HOURS_FLAG_KEY,
  DEFAULT_WELCOME_HOURS_CONFIG,
  getWelcomeHoursConfig,
};
export type { WelcomeHoursConfig };

export async function GET(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin privileges required' },
      { status: 401 }
    );
  }

  try {
    const config = await getWelcomeHoursConfig();
    return NextResponse.json({ success: true, ...config });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch welcome hours configuration' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin privileges required' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const action = body.action || 'update_settings';

    if (action === 'apply_to_existing') {
      // 1. Grant welcome hours to existing captains with 0 balance
      const config = await getWelcomeHoursConfig();
      const customHours = body.hours !== undefined ? Number(body.hours) : config.hours;
      const hoursToGrant = Math.max(0, isNaN(customHours) ? 20 : customHours);
      const minutesToGrant = hoursToGrant * 60;
      const validityDays = Math.max(1, Number(body.validityDays || config.validityDays || 30));

      if (minutesToGrant <= 0) {
        return NextResponse.json(
          { success: false, error: 'عدد الساعات الممنوحة يجب أن يكون أكبر من صفر' },
          { status: 400 }
        );
      }

      // Fetch all captains from profiles
      const { data: captains, error: capErr } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, phone')
        .eq('role', 'CAPTAIN');

      if (capErr) throw capErr;

      const captainIds = (captains || []).map((c) => c.id);
      if (captainIds.length === 0) {
        return NextResponse.json({
          success: true,
          count: 0,
          message: 'لا يوجد كباتن مسجلين حالياً في المنظومة.',
        });
      }

      // Fetch wallet accounts
      const { data: wallets, error: wErr } = await supabaseAdmin
        .from('wallet_accounts')
        .select('profile_id, paid_minutes_remaining, balance')
        .in('profile_id', captainIds);

      if (wErr) throw wErr;

      const walletMap = new Map((wallets || []).map((w) => [w.profile_id, w]));
      const targetCaptainIds: string[] = [];

      for (const capId of captainIds) {
        const w = walletMap.get(capId);
        const currentMins = Number(w?.paid_minutes_remaining || 0);
        // Only target captains who have 0 paid minutes remaining
        if (currentMins === 0) {
          targetCaptainIds.push(capId);
        }
      }

      if (targetCaptainIds.length === 0) {
        return NextResponse.json({
          success: true,
          count: 0,
          message: 'جميع الكباتن المسجلين لديهم رصيد دقائق بالفعل.',
        });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validityDays);

      const CHUNK_SIZE = 50;
      for (let i = 0; i < targetCaptainIds.length; i += CHUNK_SIZE) {
        const chunk = targetCaptainIds.slice(i, i + CHUNK_SIZE);
        const upsertRows = chunk.map((id) => {
          const current = walletMap.get(id);
          return {
            profile_id: id,
            balance: Number(current?.balance || 0),
            paid_minutes_remaining: minutesToGrant,
            time_bundle_expires_at: expiresAt.toISOString(),
            active_package_name: `باقة ترحيبية إدارية (${hoursToGrant} ساعة)`,
            updated_at: new Date().toISOString(),
          };
        });

        const { error: upErr } = await supabaseAdmin
          .from('wallet_accounts')
          .upsert(upsertRows, { onConflict: 'profile_id' });

        if (upErr) throw upErr;

        // Dispatch dual-language notification
        const titleAr = `هدية ترحيبية: ${hoursToGrant} ساعة رادار مجاناً 🎁⚡`;
        const bodyAr = `أهلاً بك يا كابتن! تم إيداع رصيد ترحيبي قدره (${hoursToGrant}) ساعة طيران رادار في محفظتك بنجاح وتمديد الصلاحية لـ ${validityDays} يوماً لتنطلق في استقبال الرحلات فوراً.`;
        const titleEn = `Welcome Gift: ${hoursToGrant} Free Radar Hours 🎁⚡`;
        const bodyEn = `Welcome Captain! A welcome credit of (${hoursToGrant}) radar flight hours has been deposited into your wallet, valid for ${validityDays} days, to start accepting rides immediately.`;

        const encoded = encodeNotificationPayload(titleAr, bodyAr, titleEn, bodyEn);

        const notifRows = chunk.map((id) => ({
          id: `notif_welcome_hours_${id}_${Date.now()}`,
          user_id: id,
          title: encoded.title,
          description: encoded.description,
          type: 'WALLET_CREDIT',
          is_read: false,
          created_at: new Date().toISOString(),
        }));

        await supabaseAdmin.from('user_notifications').insert(notifRows);
      }

      return NextResponse.json({
        success: true,
        count: targetCaptainIds.length,
        message: `تم منح الرصيد الترحيبي (${hoursToGrant} ساعة) لـ ${targetCaptainIds.length} كابتن بنجاح!`,
      });
    }

    // Default Action: Update welcome hours settings
    const enabled = Boolean(body.enabled !== undefined ? body.enabled : true);
    const hours = Math.max(0, Number(body.hours ?? DEFAULT_WELCOME_HOURS_CONFIG.hours));
    const minutes = hours * 60;
    const validityDays = Math.max(1, Number(body.validityDays ?? DEFAULT_WELCOME_HOURS_CONFIG.validityDays));

    const notePayload = {
      hours,
      minutes,
      validity_days: validityDays,
      enabled,
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    };

    const { error: flagErr } = await supabaseAdmin.from('app_flags').upsert(
      {
        flag: WELCOME_HOURS_FLAG_KEY,
        enabled,
        note: JSON.stringify(notePayload),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'flag' }
    );

    if (flagErr) throw flagErr;

    return NextResponse.json({
      success: true,
      message: enabled
        ? `تم تحديث وضبط رصيد الساعات الترحيبي بنجاح (${hours} ساعة لكل كابتن جديد).`
        : 'تم تعطيل منح الساعات الترحيبية للكباتن الجدد تلقائياً.',
      data: {
        enabled,
        hours,
        minutes,
        validityDays,
      },
    });
  } catch (err: any) {
    console.error('[WelcomeHours API] Error saving configuration:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update welcome hours configuration' },
      { status: 500 }
    );
  }
}
