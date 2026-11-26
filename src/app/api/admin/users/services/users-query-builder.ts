import { supabaseAdmin } from '@/lib/supabase-admin';

export interface AdminUsersQueryFilters {
  countryId?: string;
  governorateId?: string;
  districtId?: string;
  status?: string;
  tier?: string;
  language?: string;
  q?: string;
}

export async function fetchGeoLookups() {
  const [govRes, distRes, countriesRes] = await Promise.all([
    supabaseAdmin.from('governorates').select('id, name_ar, country_id').order('id', { ascending: true }),
    supabaseAdmin.from('districts').select('id, name_ar, governorate_id').order('id', { ascending: true }),
    supabaseAdmin.from('countries').select('id, currency_ar, currency_en, name_ar, country_code').order('id', { ascending: true }),
  ]);

  return {
    govRes,
    distRes,
    countriesRes,
    geo: {
      countries: (countriesRes.data || []).map((c) => ({ id: c.id, name_ar: c.name_ar, country_code: c.country_code })),
      governorates: (govRes.data || []).map((g) => ({ id: g.id, name_ar: g.name_ar, country_id: g.country_id })),
      districts: (distRes.data || []).map((d) => ({ id: d.id, name_ar: d.name_ar, governorate_id: d.governorate_id })),
    },
  };
}

export function buildFilteredProfilesQuery(targetRole: 'CAPTAIN' | 'RIDER', filters: AdminUsersQueryFilters) {
  let query = supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('role', targetRole)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (filters.countryId && filters.countryId !== 'ALL') {
    const cId = Number(filters.countryId);
    if (cId === 1) {
      query = query.or('country_id.eq.1,phone.like.+962%');
    } else if (cId === 2) {
      query = query.or('country_id.eq.2,phone.like.+20%');
    } else if (Number.isFinite(cId)) {
      query = query.eq('country_id', cId);
    }
  }

  if (filters.governorateId && filters.governorateId !== 'ALL' && Number.isFinite(Number(filters.governorateId))) {
    query = query.eq('governorate_id', Number(filters.governorateId));
  }

  if (filters.districtId && filters.districtId !== 'ALL' && Number.isFinite(Number(filters.districtId))) {
    query = query.eq('district_id', Number(filters.districtId));
  }

  if (filters.language && filters.language !== 'ALL') {
    query = query.eq('preferred_language', filters.language.toLowerCase());
  }

  if (filters.tier && filters.tier !== 'ALL') {
    query = query.eq('tier', filters.tier.toUpperCase());
  }

  return query;
}
