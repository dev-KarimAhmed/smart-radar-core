'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export interface SupabaseCountryRow {
  id: number;
  name_ar?: string | null;
  name_en?: string | null;
  name?: string | null;
  currency_ar?: string | null;
  currency_en?: string | null;
  currency_code?: string | null;
  phone_code?: string | null;
  dial_code?: string | null;
  calling_code?: string | null;
  country_code?: string | null;
  iso2?: string | null;
  code?: string | null;
  example_phone?: string | null;
  phone_example?: string | null;
}

export function normalizeCountries(rows: unknown): SupabaseCountryRow[] {
  return Array.isArray(rows)
    ? rows
        .map((row) => row as Partial<SupabaseCountryRow>)
        .filter((row): row is SupabaseCountryRow => Number.isInteger(row.id))
    : [];
}

export function getCountryLabel(row: SupabaseCountryRow, lang: 'ar' | 'en'): string {
  const preferred = lang === 'ar' ? row.name_ar : row.name_en;
  return preferred || row.name_ar || row.name_en || row.name || String(row.id);
}

export function getCountryDialCode(country: SupabaseCountryRow): string {
  const rawCode = country.phone_code || country.dial_code || country.calling_code || '';
  if (!rawCode) return '';
  return rawCode.startsWith('+') ? rawCode : `+${rawCode}`;
}

// Best-effort ISO 3166-1 alpha-2 lookup: prefer an explicit code column, otherwise
// sniff the name/dial-code text for the handful of countries this product ships in.
export function getCountryIsoCode(country: SupabaseCountryRow | null | undefined): string {
  if (!country) return '';

  const explicitCode = String(country.country_code || country.iso2 || country.code || '').slice(0, 2).toUpperCase();
  if (explicitCode) return explicitCode;

  const searchableText = [
    country.name_ar,
    country.name_en,
    country.name,
    country.phone_code,
    country.dial_code,
    country.calling_code,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (searchableText.includes('egypt') || searchableText.includes('مصر')) return 'EG';
  if (searchableText.includes('jordan') || searchableText.includes('اردن') || searchableText.includes('الأردن')) {
    return 'JO';
  }
  if (searchableText.includes('saudi') || searchableText.includes('سعود')) return 'SA';

  const dialDigits = getCountryDialCode(country).replace(/\D/g, '');
  if (dialDigits.startsWith('20')) return 'EG';
  if (dialDigits.startsWith('962')) return 'JO';
  if (dialDigits.startsWith('966')) return 'SA';

  return '';
}

/**
 * The single source of the app's Supabase-backed country list. Used directly by
 * the rider/advertiser/delegate registration flow (`use-registration.tsx`) and
 * re-exported via the auth contract for other features (e.g. captain onboarding)
 * that need the same country list without duplicating the fetch.
 */
export function useSupabaseCountries(options?: { onError?: (error: unknown) => void }) {
  const [countryRows, setCountryRows] = useState<SupabaseCountryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchCountries() {
      setLoading(true);

      try {
        const { data, error } = await supabase.from('countries').select('*').order('id', { ascending: true });
        if (error) throw error;
        if (active) setCountryRows(normalizeCountries(data));
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Supabase Countries Fetch]', error);
        if (active) options?.onError?.(error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchCountries();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { countryRows, loading };
}
