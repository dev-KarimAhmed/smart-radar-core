/**
 * Shared Helpers for Admin Users API Route.
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { buildBilingualNotificationServer } from '@/shared/server/translate';

export async function insertDualNotification(item: {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: string;
  is_read?: boolean;
  created_at?: string;
}) {
  const encoded = await buildBilingualNotificationServer({
    title: item.title,
    description: item.description,
  });

  return supabaseAdmin.from('user_notifications').insert({
    ...item,
    title: encoded.title,
    description: encoded.description,
  });
}
