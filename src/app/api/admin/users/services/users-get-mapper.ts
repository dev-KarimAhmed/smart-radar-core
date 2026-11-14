/**
 * User Enrichment and Mapping for Admin Users API GET Handler.
 */

export interface EnrichedUserParams {
  p: any;
  walletMap: Map<string, any>;
  captainProfilesMap: Map<string, any>;
  govMap: Map<number, string>;
  distMap: Map<number, string>;
  countriesMap: Map<number, any>;
  completedTripsMap: Map<string, number>;
  activeRequestsMap: Map<string, string>;
  consecutiveCancellationsMap: Map<string, number>;
  referralMap: Map<string, any>;
}

export function mapEnrichedUser({
  p,
  walletMap,
  captainProfilesMap,
  govMap,
  distMap,
  countriesMap,
  completedTripsMap,
  activeRequestsMap,
  consecutiveCancellationsMap,
  referralMap,
}: EnrichedUserParams) {
  const w = walletMap.get(p.id) || {};
  const cap = captainProfilesMap.get(p.id) || {};

  const govName = p.governorate_id ? govMap.get(p.governorate_id) : p.governorate;
  const distName = p.district_id ? distMap.get(p.district_id) : p.district;
  const country = p.country_id ? countriesMap.get(p.country_id) : null;
  const isEgypt = p.country_id === 2 || String(p.phone || '').startsWith('+20');
  const currencyAr = country?.currency_ar || (isEgypt ? 'ج.م' : 'د.أ');
  const currencyCode = country?.currency_en || w.currency_code || (isEgypt ? 'EGP' : 'JOD');

  let userStatus = (p.status || 'IDLE').toUpperCase();
  if (userStatus === 'BANNED' && Array.isArray(p.rank_audit_log) && p.rank_audit_log.includes('ACCOUNT_SUSPENDED')) {
    userStatus = 'SUSPENDED';
  }

  if (userStatus !== 'BANNED' && userStatus !== 'SUSPENDED') {
    const activeReq = activeRequestsMap.get(p.id);
    if (activeReq === 'PENDING') {
      userStatus = 'ACTIVE';
    } else if (activeReq && ['ACCEPTED', 'ARRIVED', 'TRIP_ACTIVE', 'STARTED'].includes(activeReq)) {
      userStatus = 'BUSY';
    }
  }

  const referralItem = referralMap.get(p.id);
  const daysInactive = referralItem
    ? Math.max(0, Math.floor((Date.now() - new Date(referralItem.last_interacted_at || referralItem.created_at).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    id: p.id,
    serial_id: p.serial_id || (p.role === 'CAPTAIN' ? `C-${p.id.slice(0, 4)}` : `R-${p.id.slice(0, 4)}`),
    full_name: p.full_name || 'مستخدم غير مسمّى',
    phone: p.phone || '',
    email: p.email || '',
    role: p.role,
    preferred_language: p.preferred_language || 'ar',
    country_id: p.country_id,
    country_name: country?.name_ar || (isEgypt ? 'مصر' : 'الأردن'),
    currency: currencyAr,
    currency_ar: currencyAr,
    currency_code: currencyCode,
    status: userStatus,
    completed_trips_count: Number(completedTripsMap.get(p.id) || 0),
    tier: (p.tier || 'SILVER').toUpperCase(),
    rating: Number(p.rating ?? 5.0),
    rating_count: Number(p.rating_count ?? 0),
    heart_count: Number(p.heart_count ?? 0),
    penalty_count: Number(p.penalty_count ?? 0),
    trust_score: Number(p.trust_score ?? p.trust_rating ?? 5.0),
    consecutive_cancellations: consecutiveCancellationsMap.has(p.id)
      ? (consecutiveCancellationsMap.get(p.id) || 0)
      : Number(p.consecutive_cancellations ?? 0),
    governorate: govName || 'عمّان',
    district: distName || 'المركز',
    governorate_id: p.governorate_id,
    district_id: p.district_id,
    created_at: p.created_at,
    updated_at: p.updated_at,
    vehicle: {
      brand: cap.vehicle_brand || p.vehicle_make || '',
      model: cap.vehicle_model || '',
      year: cap.vehicle_year || (p.vehicle_year ? Number(p.vehicle_year) : 0),
      color: cap.vehicle_color || p.vehicle_color || '',
      plate: cap.plate_number || p.vehicle_plate || '',
      type: cap.vehicle_type || 'STANDARD',
      affiliation_type: cap.affiliation_type || 'independent',
      office_phone: cap.office_phone || '',
      side_id: cap.side_id || '',
    },
    verification_status: (cap.verification_status || 'PENDING').toUpperCase(),
    documents: {
      identity_url: cap.identity_url || cap.national_id_url || null,
      driving_license_url: cap.driving_license_url || null,
      vehicle_registration_url: cap.vehicle_registration_url || null,
      criminal_record_url: cap.criminal_record_url || null,
    },
    wallet: {
      balance: Number(w.balance ?? 0),
      paid_minutes_remaining: Number(w.paid_minutes_remaining ?? 0),
      bonus_minutes_remaining: Number(w.bonus_minutes_remaining ?? 0),
      total_minutes: Number(w.paid_minutes_remaining ?? 0) + Number(w.bonus_minutes_remaining ?? 0),
      active_package_name: w.active_package_name || null,
      time_bundle_expires_at: w.time_bundle_expires_at || null,
      currency_code: currencyCode,
      currency_ar: currencyAr,
    },
    referral_activity: {
      has_referral: Boolean(referralItem),
      referral_id: referralItem?.id || null,
      captain_id: referralItem?.captain_id || null,
      captain_name: (referralItem?.profiles as any)?.full_name || null,
      captain_phone: (referralItem?.profiles as any)?.phone || null,
      captain_serial: (referralItem?.profiles as any)?.serial_id || null,
      last_interacted_at: referralItem?.last_interacted_at || p.updated_at || p.created_at,
      days_inactive: daysInactive,
      is_active: referralItem ? daysInactive < 10 : true,
      last_notified_at: referralItem?.last_inactivity_notified_at || null,
    },
  };
}
