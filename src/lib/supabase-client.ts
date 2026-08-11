import { createClient } from '@supabase/supabase-js';
import {
  clearSupabaseAuthStorage,
  createRememberAwareStorage,
  setSupabaseRememberSession,
  shouldRememberSupabaseSession,
  SUPABASE_AUTH_STORAGE_KEY,
} from '@/features/auth/services/supabase-auth-storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: SUPABASE_AUTH_STORAGE_KEY,
    storage: createRememberAwareStorage(),
    persistSession: true,
    autoRefreshToken: true,
  },
});

export {
  clearSupabaseAuthStorage,
  setSupabaseRememberSession,
  shouldRememberSupabaseSession,
};
