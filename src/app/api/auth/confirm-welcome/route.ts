import { NextResponse } from 'next/server';
import { grantNewCaptainWelcomeCredit } from '@/features/captain/services/captain-welcome-credit';
import { getServerSupabaseAdmin, getVerifiedUser } from '@/shared/server/api-auth-guard';
import { encodeNotificationPayload } from '@/shared/utils/notification-i18n';

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
      const welcomePayload = encodeNotificationPayload(
        'مرحباً بك في شبكة بينكم للإعلان الرقمي 🌟',
        'تم تفعيل حسابك بنجاح وأصبح جاهزاً للاستخدام بالكامل.',
        'Welcome to Bynkcom Digital Ad Network 🌟',
        'Your account has been successfully activated and is now ready for full use.'
      );
      const legalPayload = encodeNotificationPayload(
        'توثيق السجل القانوني الإلكتروني 🛡️',
        'تم توثيق الإقرار وحفظه في السجل القانوني الإلكتروني في شاشة سجلاتي.',
        'Electronic Legal Log Verification 🛡️',
        'The declaration has been verified and saved in the Electronic Legal Log on the My Records screen.'
      );

      await supabaseAdmin.from('user_notifications').upsert(
        [
          {
            id: `notif_welcome_main_${caller.id}`,
            user_id: caller.id,
            title: welcomePayload.title,
            description: welcomePayload.description,
            type: 'admin_message',
            is_read: false,
          },
          {
            id: `notif_welcome_legal_${caller.id}`,
            user_id: caller.id,
            title: legalPayload.title,
            description: legalPayload.description,
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

