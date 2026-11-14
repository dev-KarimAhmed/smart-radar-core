import { useState, useEffect } from 'react';
import type { User } from '@/core/types';
import { supabase } from '@/lib/supabase-client';

export function useRadarHourPrice(user: User | null): number {
  const [radarHourPrice, setRadarHourPrice] = useState(1);

  useEffect(() => {
    let active = true;
    async function resolveHourlyRate() {
      try {
        const countryId = user?.countryId || 1;
        const { data } = await supabase
          .from('countries')
          .select('radar_hour_price')
          .eq('id', countryId)
          .maybeSingle();

        let price = Number(data?.radar_hour_price) || 1;

        const { data: flagRow } = await supabase
          .from('app_flags')
          .select('note')
          .eq('flag', 'hourly_rates_matrix')
          .maybeSingle();

        if (flagRow?.note) {
          try {
            const matrix = JSON.parse(flagRow.note);
            if (user?.district && matrix.districts?.[String(user.district)]) {
              price = Number(matrix.districts[String(user.district)]);
            } else if (user?.governorate && matrix.governorates?.[String(user.governorate)]) {
              price = Number(matrix.governorates[String(user.governorate)]);
            }
          } catch {}
        }

        if (active) setRadarHourPrice(price > 0 ? price : 1);
      } catch {
        if (active) setRadarHourPrice(1);
      }
    }

    void resolveHourlyRate();
    return () => {
      active = false;
    };
  }, [user?.countryId, user?.district, user?.governorate]);

  return radarHourPrice;
}

export function useSelfTopupFlag(): boolean {
  const [selfTopupEnabled, setSelfTopupEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase
      .from('app_flags')
      .select('enabled')
      .eq('flag', 'captain_self_topup')
      .maybeSingle()
      .then(({ data }) => {
        if (active) setSelfTopupEnabled(Boolean(data?.enabled));
      });
    return () => {
      active = false;
    };
  }, []);

  return selfTopupEnabled;
}
