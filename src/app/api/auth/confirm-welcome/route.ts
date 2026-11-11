import { NextResponse } from 'next/server';
import { grantNewCaptainWelcomeCredit } from '@/features/captain/services/captain-welcome-credit';
import { getServerSupabaseAdmin, getVerifiedUser } from '@/shared/server/api-auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const caller = await getVerifiedUser(req, { allowSuspended: true });
    if (!caller) {
      return NextResponse.json({ success: false, error: 'authentication_required' }, { status: 401 });
    }

    if (!caller.rawUser.email_confirmed_at) {
      return NextResponse.json({ success: false, error: 'email_not_confirmed' }, { status: 403 });
    }

    const supabaseAdmin = getServerSupabaseAdmin();

    if (!caller.rawUser.phone_confirmed_at && caller.phone) {
      await supabaseAdmin.auth.admin
        .updateUserById(caller.id, { phone_confirm: true })
        .catch(() => null);
    }

    if (caller.role === 'CAPTAIN' || caller.role === 'DRIVER') {
      try {
        await grantNewCaptainWelcomeCredit(caller.id);
      } catch (creditErr) {
        console.warn('[confirm-welcome] Welcome credit error:', creditErr);
      }
    }

    try {
      await supabaseAdmin.from('user_notifications').upsert(
        [
          {
            id: `notif_welcome_main_${caller.id}`,
            user_id: caller.id,
            title: 'مرحباً بك في شبكة بينكم للإعلان الرقمي 🌟',
            description: 'تم تفعيل حسابك بنجاح وأصبح جاهزاً للاستخدام بالكامل.',
            type: 'admin_message',
            is_read: false,
          },
          {
            id: `notif_welcome_legal_${caller.id}`,
            user_id: caller.id,
            title: 'توثيق السجل القانوني الإلكتروني 🛡️',
            description: 'تم توثيق الإقرار وحفظه في السجل القانوني الإلكتروني في شاشة سجلاتي.',
            type: 'admin_message',
            is_read: false,
          },
        ],
        { onConflict: 'id', ignoreDuplicates: true },
      );
    } catch (notifErr) {
      console.warn('[confirm-welcome] Notification upsert error:', notifErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[confirm-welcome] Unexpected error:', err);
    return NextResponse.json({ success: false, error: 'internal_server_error' }, { status: 500 });
  }
}

