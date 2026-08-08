import React from 'react';
import { supabase } from '@/lib/supabase-client';

export interface CountryCurrencyConfig {
  id: number;
  name_ar?: string | null;
  name_en?: string | null;
  currency_ar?: string | null;
  currency_en?: string | null;
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
          .select('id,name_ar,name_en,currency_ar,currency_en')
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
