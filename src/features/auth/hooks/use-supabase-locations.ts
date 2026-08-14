'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export interface SupabaseGovernorateRow {
  id: number;
  country_id: number;
  name_ar?: string | null;
  name_en?: string | null;
  name?: string | null;
}

export interface SupabaseDistrictRow {
  id: number;
  governorate_id: number;
  name_ar?: string | null;
  name_en?: string | null;
  name?: string | null;
}

export function normalizeGovernorates(rows: unknown): SupabaseGovernorateRow[] {
  return Array.isArray(rows)
    ? rows
        .map((row) => row as Partial<SupabaseGovernorateRow>)
        .filter((row): row is SupabaseGovernorateRow => Number.isInteger(row.id) && Number.isInteger(row.country_id))
    : [];
}

export function normalizeDistricts(rows: unknown): SupabaseDistrictRow[] {
  return Array.isArray(rows)
    ? rows
        .map((row) => row as Partial<SupabaseDistrictRow>)
        .filter((row): row is SupabaseDistrictRow => Number.isInteger(row.id) && Number.isInteger(row.governorate_id))
    : [];
}

export function getLocationLabel(row: SupabaseGovernorateRow | SupabaseDistrictRow, lang: 'ar' | 'en'): string {
  const preferred = lang === 'ar' ? row.name_ar : row.name_en;
  return preferred || row.name_ar || row.name_en || row.name || String(row.id);
}

/**
 * The single source of the app's Supabase-backed governorate list, cascading
 * from a country id. Used by the rider/advertiser/delegate flow
 * (`use-registration.tsx`) and re-exported via the auth contract so other
 * features (e.g. captain onboarding) share the same data instead of a local,
 * single-country fallback list.
 */
export function useSupabaseGovernorates(countryId: number | null, options?: { onError?: (error: unknown) => void }) {
  const [governorateRows, setGovernorateRows] = useState<SupabaseGovernorateRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setGovernorateRows([]);

    if (!countryId || !Number.isInteger(countryId) || countryId <= 0) {
      return;
    }

    async function fetchGovernorates() {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('governorates')
          .select('*')
          .eq('country_id', countryId)
          .order('id', { ascending: true });
        if (error) throw error;
        if (active) setGovernorateRows(normalizeGovernorates(data));
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Supabase Governorates Fetch]', error);
        if (active) options?.onError?.(error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchGovernorates();

    return () => {
      active = false;
    };
  }, [countryId]);

  return { governorateRows, loading };
}

/** Same idea as `useSupabaseGovernorates`, cascading from a governorate id. */
export function useSupabaseDistricts(governorateId: number | null, options?: { onError?: (error: unknown) => void }) {
  const [districtRows, setDistrictRows] = useState<SupabaseDistrictRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setDistrictRows([]);

    if (!governorateId || !Number.isInteger(governorateId) || governorateId <= 0) {
      return;
    }

    async function fetchDistricts() {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('districts')
          .select('*')
          .eq('governorate_id', governorateId)
          .order('id', { ascending: true });
        if (error) throw error;
        if (active) setDistrictRows(normalizeDistricts(data));
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Supabase Districts Fetch]', error);
        if (active) options?.onError?.(error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchDistricts();

    return () => {
      active = false;
    };
  }, [governorateId]);

  return { districtRows, loading };
}
