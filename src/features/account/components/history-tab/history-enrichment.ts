import { supabase } from '@/lib/supabase-client';
import { firstHistoryString, isPlainRecord } from './history-types-utils';
import { getCaptainIdFromTrip } from './history-extractors';

export async function fetchSafeCaptainCardsMap(ids: string[]): Promise<Map<string, any> | null> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map<string, any>();

  try {
    const { data, error } = await supabase.rpc('get_safe_captain_cards', {
      p_captain_ids: uniqueIds,
    });
    if (error || !Array.isArray(data)) return null;
    return new Map(data.map((row: any) => [String(row.id), row]));
  } catch {
    return null;
  }
}

export async function fetchSafeCounterpartProfilesMap(ids: string[]): Promise<Map<string, any> | null> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map<string, any>();

  try {
    const { data, error } = await supabase.rpc('get_safe_counterpart_profiles', {
      p_user_ids: uniqueIds,
    });
    if (error || !Array.isArray(data)) return null;
    return new Map(data.map((row: any) => [String(row.id), row]));
  } catch {
    return null;
  }
}

export async function fetchRowsByIds(tableName: string, ids: string[]): Promise<Map<string, any>> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map<string, any>();

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .in('id', uniqueIds);

    if (error || !data) {
      if (process.env.NODE_ENV !== 'production') console.warn(`[HistoryTab ${tableName} enrichment skipped]`, error);
      return new Map<string, any>();
    }

    return new Map(data.map((row: any) => [row.id, row]));
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.warn(`[HistoryTab ${tableName} enrichment failed]`, error);
    return new Map<string, any>();
  }
}

export async function enrichCaptainDetails(rows: any[]): Promise<any[]> {
  const captainIds = Array.from(new Set(rows.map(getCaptainIdFromTrip).filter(Boolean)));
  if (captainIds.length === 0) return rows;

  const [rpcCardsMap, rpcProfilesMap] = await Promise.all([
    fetchSafeCaptainCardsMap(captainIds),
    fetchSafeCounterpartProfilesMap(captainIds),
  ]);

  let profileMap: Map<string, any>;
  let captainProfileMap: Map<string, any>;

  if (rpcCardsMap !== null || rpcProfilesMap !== null) {
    profileMap = new Map<string, any>();
    captainProfileMap = rpcCardsMap ?? new Map<string, any>();
    for (const cid of captainIds) {
      const card = rpcCardsMap?.get(cid);
      const prof = rpcProfilesMap?.get(cid);
      if (card || prof) {
        profileMap.set(cid, {
          ...(card || {}),
          ...(prof || {}),
          id: cid,
          full_name: firstHistoryString(prof?.full_name, card?.full_name),
          phone: firstHistoryString(prof?.phone),
          rating: prof?.rating ?? card?.rating,
          tier: prof?.tier ?? card?.tier,
          serial_id: prof?.serial_id ?? card?.serial_id,
        });
      }
    }
  } else {
    [profileMap, captainProfileMap] = await Promise.all([
      fetchRowsByIds('profiles', captainIds),
      fetchRowsByIds('captain_profiles', captainIds),
    ]);
  }

  return rows.map((row) => {
    const captainId = getCaptainIdFromTrip(row);
    const profile = captainId ? profileMap.get(captainId) : null;
    const captainProfile = captainId ? captainProfileMap.get(captainId) : null;
    const existingCaptain = isPlainRecord(row?.captain) ? row.captain : {};

    if (!profile && !captainProfile) return row;

    return {
      ...row,
      captain_id: row.captain_id || row.accepted_captain_id || captainId,
      captain: {
        ...existingCaptain,
        ...profile,
        ...(captainProfile ? {
          vehicle_type: captainProfile.vehicle_type,
          vehicle_brand: captainProfile.vehicle_brand,
          vehicle_model: captainProfile.vehicle_model,
          vehicle_color: captainProfile.vehicle_color,
          vehicle_year: captainProfile.vehicle_year,
          plate_number: captainProfile.plate_number,
          employment_type: captainProfile.employment_type,
          contact_page_url: captainProfile.contact_page_url,
          verification_status: captainProfile.verification_status,
        } : {}),
        id: captainId,
        full_name: firstHistoryString(profile?.full_name, existingCaptain.full_name, captainProfile?.full_name),
        phone: firstHistoryString(profile?.phone, existingCaptain.phone, captainProfile?.phone),
      },
      captain_profile: {
        ...(isPlainRecord(row?.captain_profile) ? row.captain_profile : {}),
        ...(captainProfile || {}),
      },
    };
  });
}
