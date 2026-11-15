import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _serverAdminClient: SupabaseClient | null = null;

function readEnvTrimmed(name: string): string {
  return (process.env[name] || '').trim();
}

export function getServerSupabaseAdmin(): SupabaseClient {
  if (_serverAdminClient) return _serverAdminClient;

  const url = readEnvTrimmed('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = readEnvTrimmed('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceKey) {
    throw new Error('[security] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  _serverAdminClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return _serverAdminClient;
}

export function createEphemeralSupabaseAnonClient(): SupabaseClient {
  const url = readEnvTrimmed('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = readEnvTrimmed('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!url || !anonKey) {
    throw new Error('[security] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createUserScopedSupabaseClient(accessToken: string): SupabaseClient {
  const url = readEnvTrimmed('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = readEnvTrimmed('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!url || !anonKey) {
    throw new Error('[security] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
