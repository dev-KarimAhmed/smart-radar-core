import { supabaseAdmin } from '@/lib/supabase-admin';
import { buildBilingualNotificationServer } from '@/shared/server/translate';

export function generateVoucherCode(minutes: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RDR-${minutes}M-${rand}`;
}

export async function sendCaptainNotification(
  userId: string,
  id: string,
  title: string,
  description: string,
  type: string
): Promise<void> {
  try {
    const notifId = `${id}_${Date.now()}`;
    const { data: capProfile } = await supabaseAdmin
      .from('profiles')
      .select('preferred_language')
      .eq('id', userId)
      .maybeSingle();

    const encoded = await buildBilingualNotificationServer({
      title,
      description,
      preferredLanguage: capProfile?.preferred_language,
    });

    await supabaseAdmin.from('user_notifications').insert({
      id: notifId,
      user_id: userId,
      title: encoded.title,
      description: encoded.description,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Admin Wallet] Failed to send notification:', err);
  }
}
