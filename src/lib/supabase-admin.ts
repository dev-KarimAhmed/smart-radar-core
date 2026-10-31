import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[supabase-admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      }
    }

    _supabaseAdminInstance = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      serviceRoleKey || 'placeholder',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return _supabaseAdminInstance;
}

/**
 * Lazy proxy to guarantee that createClient is only instantiated after environment
 * variables have been loaded, preventing ESM hoisting crashes on server startup.
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
});
