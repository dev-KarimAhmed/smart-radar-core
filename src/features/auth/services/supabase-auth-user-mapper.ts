import type { User } from '@supabase/supabase-js';

export function buildUserFromSupabaseAuth(authUser: User) {
  const metadata = authUser.user_metadata || {};
  const vehicle = metadata.vehicle && typeof metadata.vehicle === 'object' ? metadata.vehicle as Record<string, unknown> : {};
  const phone = String(metadata.phone || authUser.phone || '');
  const isSovereignOwner =
    authUser.id === '70b4a26f-10ac-4888-8df6-c3a5ad824b8a' ||
    phone === '+201551981922' ||
    phone === '+201551981977' ||
    phone === '201551981977';
  const rawRole = String(metadata.role || 'RIDER').toLowerCase();
  const role = isSovereignOwner ? 'admin' : (rawRole === 'captain' ? 'driver' : rawRole);
  const metadataStatus = String(metadata.status || 'idle').toLowerCase();
  const status = ['active', 'idle', 'busy', 'rating'].includes(metadataStatus)
    ? metadataStatus as 'active' | 'idle' | 'busy' | 'rating'
    : 'idle';

  const affiliation = metadata.affiliation && typeof metadata.affiliation === 'object'
    ? metadata.affiliation as Record<string, unknown>
    : {};
  const affiliationType = String(affiliation.type || metadata.affiliation_type || '').toLowerCase();
  const affiliationName = String(affiliation.name || affiliation.companyName || metadata.company_name || '');
  const subRole = (metadata.subRole || (affiliationType === 'independent' ? 'independent' : 'captain')) as 'independent' | 'captain' | undefined;

  const countryId = metadata.country_id !== undefined ? Number(metadata.country_id) : undefined;
  const isEgypt = countryId === 2 || phone.startsWith('+20');
  const currencyAr = metadata.currency_ar !== undefined && metadata.currency_ar !== null
    ? String(metadata.currency_ar)
    : (isEgypt ? 'ج.م' : 'د.أ');
  const currencyEn = metadata.currency_en !== undefined && metadata.currency_en !== null
    ? String(metadata.currency_en)
    : (isEgypt ? 'EGP' : 'JOD');

  const adminRank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN' | undefined = isSovereignOwner
    ? 'GENERAL_ADMIN'
    : (role === 'admin'
        ? (metadata.admin_rank || metadata.adminRank || 'ASSISTANT_ADMIN')
        : undefined);

  const allowedSectors: string[] | undefined = isSovereignOwner || adminRank === 'GENERAL_ADMIN'
    ? ['captains', 'riders', 'wallet', 'hourly_rates', 'delegates', 'admins']
    : (Array.isArray(metadata.allowed_sectors)
        ? metadata.allowed_sectors
        : (Array.isArray(metadata.allowedSectors)
            ? metadata.allowedSectors
            : undefined));

  return {
    uid: authUser.id,
    phone,
    role: role === 'rider' ? 'rider' : role,
    subRole,
    adminRank,
    allowedSectors,
    name: String(metadata.full_name || metadata.name || authUser.phone || ''),
    countryId,
    currencyAr,
    currencyEn,
    governorate: metadata.governorate_id !== undefined ? String(metadata.governorate_id) : '',
    district: metadata.district_id !== undefined ? String(metadata.district_id) : '',
    status,
    rating: 5,
    affiliation: {
      type: affiliationType,
      name: affiliationName,
    },
    vehicle: {
      plate: String(vehicle.plate || ''),
      make: String(vehicle.make || ''),
      color: String(vehicle.color || ''),
      year: Number(vehicle.year) || 0,
    },
    isBufferActive: false,
  };
}
