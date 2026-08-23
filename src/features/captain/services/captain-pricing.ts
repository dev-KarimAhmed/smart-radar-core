import type { SupabaseClient } from '@supabase/supabase-js';

export interface CaptainPricingRange {
  min: number;
  max: number;
  avg: number;
}

export interface CaptainPricingSaveResult {
  ok: boolean;
  errorCode?: string;
  range?: CaptainPricingRange;
}

/**
 * Saves price_per_km/flag_fall_fee through the `set_captain_pricing` RPC —
 * NOT a direct table update. The RPC re-validates both values server-side
 * against the average of other captains in the same governorate (or
 * country-wide, if the governorate doesn't have enough priced peers yet),
 * rejecting anything more than 10% off that average. This has to happen on
 * the server: a captain could otherwise call the table update directly and
 * set any price, undercutting or price-gouging the local market.
 */
export async function saveCaptainPricing(
  supabase: SupabaseClient,
  pricePerKm: number,
  flagFallFee: number,
): Promise<CaptainPricingSaveResult> {
  const { error } = await supabase.rpc('set_captain_pricing', {
    p_price_per_km: pricePerKm,
    p_flag_fall_fee: flagFallFee,
  });

  if (!error) return { ok: true };

  return {
    ok: false,
    errorCode: String(error.message || ''),
    range: parsePricingRangeDetail((error as { details?: unknown })?.details),
  };
}

function parsePricingRangeDetail(detail: unknown): CaptainPricingRange | undefined {
  const text = typeof detail === 'string' ? detail : '';
  const min = Number(text.match(/min=([\d.]+)/)?.[1]);
  const max = Number(text.match(/max=([\d.]+)/)?.[1]);
  const avg = Number(text.match(/avg=([\d.]+)/)?.[1]);

  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(avg)) return undefined;
  return { min, max, avg };
}
