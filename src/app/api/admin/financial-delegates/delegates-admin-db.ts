import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  DEFAULT_FINANCIAL_DELEGATES,
  type FinancialDelegate,
} from '@/features/admin/types/wallet-directory';

const FLAG_KEY = 'financial_delegates_directory';

export async function loadDelegatesFromDb(): Promise<FinancialDelegate[]> {
  try {
    const { data } = await supabaseAdmin
      .from('app_flags')
      .select('note')
      .eq('flag', FLAG_KEY)
      .maybeSingle();

    if (data?.note) {
      const parsed = JSON.parse(data.note);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[financial-delegates] error loading from app_flags:', err);
  }

  try {
    await supabaseAdmin.from('app_flags').upsert({
      flag: FLAG_KEY,
      enabled: true,
      note: JSON.stringify(DEFAULT_FINANCIAL_DELEGATES),
      updated_at: new Date().toISOString(),
    });
  } catch {}

  return DEFAULT_FINANCIAL_DELEGATES;
}

export async function saveDelegatesToDb(delegates: FinancialDelegate[]): Promise<boolean> {
  const { error } = await supabaseAdmin.from('app_flags').upsert({
    flag: FLAG_KEY,
    enabled: true,
    note: JSON.stringify(delegates),
    updated_at: new Date().toISOString(),
  });
  return !error;
}
