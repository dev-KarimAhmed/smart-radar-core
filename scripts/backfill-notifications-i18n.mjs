import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Import resolution logic
import { resolveDynamicNotification } from '../src/shared/utils/notification-i18n.js';

async function backfill() {
  console.log('🔄 Fetching notifications from Supabase...');
  const { data: rows, error } = await supabase
    .from('user_notifications')
    .select('id, title, description')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch error:', error);
    process.exit(1);
  }

  console.log(`Found ${rows.length} total notifications.`);
  let updatedCount = 0;

  for (const row of rows) {
    if (row.description && row.description.includes('<!--i18n:')) {
      continue; // already has payload
    }

    const dynamic = resolveDynamicNotification(row.title || '', row.description || '');
    if (dynamic.matched) {
      const payload = {
        title_ar: dynamic.titleAr,
        body_ar: dynamic.descriptionAr,
        title_en: dynamic.titleEn,
        body_en: dynamic.descriptionEn,
      };

      const newDesc = `${(row.description || '').trim()}\n\n<!--i18n:${JSON.stringify(payload)}-->`;
      const { error: updateErr } = await supabase
        .from('user_notifications')
        .update({ description: newDesc })
        .eq('id', row.id);

      if (updateErr) {
        console.warn(`Failed to update ${row.id}:`, updateErr.message);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`✅ Successfully backfilled ${updatedCount} notifications with dual-language i18n payload.`);
}

backfill().catch(console.error);

