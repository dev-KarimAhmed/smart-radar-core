import type { SupabaseFromLike } from '../../types/rider-marketplace-types';
import { firstString } from './rider-marketplace-parsers';

export async function enrichRideOfferRows(
  client: SupabaseFromLike,
  rows: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  const captainIds = Array.from(
    new Set(rows.map((row) => firstString(row.captain_id, row.driver_id, row.captainId, row.driverId)).filter(Boolean) as string[]),
  );

  if (captainIds.length === 0) return rows;

  const profileMap = new Map<string, Record<string, unknown>>();
  const captainProfileMap = new Map<string, Record<string, unknown>>();
  let usedSafeRpc = false;

  if (typeof client.rpc === 'function') {
    try {
      const { data, error } = await client.rpc('get_safe_captain_cards', {
        p_captain_ids: captainIds,
      });
      if (!error && Array.isArray(data)) {
        usedSafeRpc = true;
        for (const card of data as Record<string, unknown>[]) {
          const cardId = firstString(card?.id);
          if (!cardId) continue;
          profileMap.set(cardId, {
            id: cardId,
            full_name: card.full_name,
            serial_id: card.serial_id,
            rating: card.rating,
            behavior_rating: card.behavior_rating,
            vehicle_rating: card.vehicle_rating,
            rating_count: card.rating_count,
            tier: card.tier,
            heart_count: card.heart_count,
          });
          captainProfileMap.set(cardId, {
            id: cardId,
            vehicle_type: card.vehicle_type,
            vehicle_brand: card.vehicle_brand,
            vehicle_model: card.vehicle_model,
            vehicle_color: card.vehicle_color,
            vehicle_year: card.vehicle_year,
            plate_number: card.plate_number,
            nickname: card.nickname,
            pricing_mode: card.pricing_mode,
            affiliation_type: card.affiliation_type,
            employment_type: card.employment_type,
            base_fare: card.base_fare,
            price_per_km: card.price_per_km,
            price_per_min: card.price_per_min,
            flag_fall_fee: card.flag_fall_fee,
            included_km: card.included_km,
            verification_status: card.verification_status,
            facebook_url: card.facebook_url,
            instagram_url: card.instagram_url,
          });
        }
      }
    } catch {
      // Fallback below for pre-migration environments
    }
  }

  if (!usedSafeRpc) {
    const [profileRows, captainProfileRows] = await Promise.all([
      fetchRowsByIds(client, 'profiles', 'id', captainIds),
      fetchRowsByIds(client, 'captain_profiles', 'id', captainIds),
    ]);

    for (const row of profileRows) {
      profileMap.set(String(row.id), row);
    }
    for (const row of captainProfileRows) {
      captainProfileMap.set(String(row.id), row);
    }
  }

  return rows.map((row) => {
    const captainId = firstString(row.captain_id, row.driver_id, row.captainId, row.driverId);
    return {
      ...row,
      captain: captainId ? profileMap.get(captainId) || row.captain : row.captain,
      captain_profile: captainId ? captainProfileMap.get(captainId) || row.captain_profile : row.captain_profile,
    };
  });
}

export async function fetchRowsByIds(
  client: SupabaseFromLike,
  tableName: string,
  idColumn: string,
  ids: string[],
): Promise<Record<string, unknown>[]> {
  try {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .in(idColumn, ids);

    if (error) throw error;
    return Array.isArray(data) ? data as Record<string, unknown>[] : [];
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Rider offers] Could not enrich ${tableName}:`, error);
    }
    return [];
  }
}
