import { supabase } from '@/lib/supabase-client';
import type { User } from '@/core/types';
import type {
  CaptainTariff,
  CaptainTariffSaveResult,
  MarketAverageTariff,
} from '../types/captain-tariff-types';

export function toNumberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function getRejectedBaseFareFloor(error: unknown) {
  const message = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message?: unknown }).message ?? '')
    : String(error ?? '');
  const match = message.match(/base_fare_below_market_minimum:\s*([0-9]+(?:\.[0-9]+)?)/i);
  const floor = Number(match?.[1]);
  return Number.isFinite(floor) ? floor : null;
}

export function toMarketAverage(value: unknown): MarketAverageTariff | null {
  if (!value || typeof value !== 'object') return null;
  const context = value as Record<string, unknown>;
  const baseFare = toNumberOrNull(context.baseFare);
  const perKm = toNumberOrNull(context.perKm);
  const perMin = toNumberOrNull(context.perMin);
  if (baseFare === null || perKm === null || perMin === null) return null;

  return {
    baseFare,
    perKm,
    perMin,
    includedKm: toNumberOrNull(context.includedKm) ?? 0,
    captainCount: toNumberOrNull(context.captainCount) ?? 0,
    threshold: toNumberOrNull(context.threshold) ?? 0,
    scope: context.scope === 'governorate' || context.scope === 'country' ? context.scope : 'country_seed',
    source: context.source === 'captain_average' ? 'captain_average' : 'country_seed',
  };
}

export async function saveCaptainTariffToSupabase(
  user: User | null,
  value: CaptainTariff,
): Promise<{ error: any; minBaseFare: number | null }> {
  if (!user?.uid) return { error: new Error('User not found'), minBaseFare: null };

  const mode = value.pricingMode || 'FREE';
  const affiliationType =
    mode === 'FREE' ? 'independent' : mode === 'TAXI' ? 'office-taxi' : 'smart-app';
  const subRole = affiliationType === 'independent' ? 'independent' : 'captain';
  const vehicleType = mode === 'TAXI' ? 'TAXI' : 'PRIVATE';

  const currentAffiliation = (user?.affiliation || {}) as Record<string, unknown>;
  const currentName = String(currentAffiliation?.name || currentAffiliation?.companyName || '').trim();

  let employmentType = 'مستقل';
  if (mode === 'APP') {
    employmentType = currentName && currentName !== 'مستقل' ? currentName : 'تطبيق ذكي';
  } else if (mode === 'TAXI') {
    employmentType = currentName && currentName !== 'مستقل' ? currentName : 'مكتب تاكسي';
  }

  let updateError: any = null;
  try {
    const updatePromise = supabase
      .from('captain_profiles')
      .update({
        base_fare: value.baseFare,
        price_per_km: value.pricePerKm,
        price_per_min: value.pricePerMin,
        included_km: value.includedKm,
        pricing_mode: mode,
        affiliation_type: affiliationType,
        employment_type: employmentType,
        vehicle_type: vehicleType,
      })
      .eq('id', user.uid);

    const timeoutPromise = new Promise<{ error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 4500)
    );

    const res: any = await Promise.race([updatePromise, timeoutPromise]);
    updateError = res?.error || null;
  } catch (err) {
    updateError = err;
  }

  if (updateError) {
    const minBaseFare = getRejectedBaseFareFloor(updateError);
    if (minBaseFare !== null) {
      return { error: updateError, minBaseFare };
    }
    if (process.env.NODE_ENV !== 'production') console.warn('[Captain tariff save offline fallback]', updateError);
  }

  // Persist locally for offline-first resilience (SC55 / Offline-First)
  try {
    localStorage.setItem(
      `radar_captain_tariff_${user.uid}`,
      JSON.stringify({
        baseFare: value.baseFare,
        pricePerKm: value.pricePerKm,
        pricePerMin: value.pricePerMin,
        includedKm: value.includedKm,
        pricingMode: mode,
      })
    );
  } catch {}

  // Sync with Supabase Auth user metadata in background (non-blocking so modal confirms instantly)
  void (async () => {
    try {
      await supabase.auth.updateUser({
        data: {
          subRole,
          affiliation: {
            ...currentAffiliation,
            type: affiliationType,
            companyName: affiliationType === 'independent' ? '' : employmentType,
            name: affiliationType === 'independent' ? 'مستقل' : employmentType,
          },
          vehicle: {
            ...((user as any)?.vehicle || {}),
            type: vehicleType,
          },
        },
      });
    } catch (authErr) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Captain tariff sync auth metadata]', authErr);
    }
  })();

  return { error: null, minBaseFare: null };
}
