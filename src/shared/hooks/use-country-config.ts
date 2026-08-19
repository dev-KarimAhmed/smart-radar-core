import React from 'react';
import { supabase } from '@/lib/supabase-client';

export interface CountryCurrencyConfig {
  id?: number;
  name_ar?: string | null;
  name_en?: string | null;
  currency_ar?: string | null;
  currency_en?: string | null;
  currency_code?: string | null;
  default_lat?: number | null;
  default_lng?: number | null;
}

/** Fetches the account's country name/currency config from Supabase. */
export function useCountryConfig(activeCountryId: number | undefined) {
  const [countryConfig, setCountryConfig] = React.useState<CountryCurrencyConfig | null>(null);

  React.useEffect(() => {
    let active = true;
    const countryId = Number(activeCountryId);

    setCountryConfig(null);

    if (!Number.isInteger(countryId) || countryId <= 0) {
      return;
    }

    async function fetchCountryCurrency() {
      try {
        const { data, error } = await supabase
          .from('countries')
          .select('id,name_ar,name_en,currency_ar,currency_en,default_lat,default_lng')
          .eq('id', countryId)
          .single();
        if (error) throw error;
        if (active) setCountryConfig(data as CountryCurrencyConfig);
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Supabase Country Currency Fetch]', error);
      }
    }

    void fetchCountryCurrency();

    return () => {
      active = false;
    };
  }, [activeCountryId]);

  return countryConfig;
}

/** Extracts a usable {lat, lng} map center from a country config, if set. */
export function getCountryDefaultCenter(countryConfig: CountryCurrencyConfig | null) {
  if (typeof countryConfig?.default_lat !== 'number' || typeof countryConfig?.default_lng !== 'number') {
    return null;
  }
  return { lat: countryConfig.default_lat, lng: countryConfig.default_lng };
}
