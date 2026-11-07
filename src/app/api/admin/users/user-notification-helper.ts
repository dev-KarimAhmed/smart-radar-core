import { supabaseAdmin } from '@/lib/supabase-admin';
import { encodeNotificationPayload, resolveDynamicNotification } from '@/shared/utils/notification-i18n';

export async function insertDualNotification(item: {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: string;
  is_read?: boolean;
  created_at?: string;
}) {
  const dynamic = resolveDynamicNotification(item.title, item.description);
  const encoded = dynamic.matched
    ? encodeNotificationPayload(dynamic.titleAr, dynamic.descriptionAr, dynamic.titleEn, dynamic.descriptionEn)
    : { title: item.title, description: item.description };

  return supabaseAdmin.from('user_notifications').insert({
    ...item,
    title: encoded.title,
    description: encoded.description,
  });
}
