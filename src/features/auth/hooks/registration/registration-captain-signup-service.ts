import { supabase } from '@/lib/supabase-client';
import { recordLegalDeclaration } from '@/features/account/services/legal-log-service';
import type { AffiliationType } from '@/core/types';

interface CompleteCaptainProfileParams {
  userId: string;
  userSerialId?: string;
  affiliation: AffiliationType | null;
  vehicle: any;
  verificationDoc: string;
  sessionToken?: string;
  lang: 'ar' | 'en';
  tAuto: (key: string) => string;
}

export async function createCaptainProfileAndWelcomeCredit({
  userId,
  userSerialId,
  affiliation,
  vehicle,
  verificationDoc,
  sessionToken,
  lang,
  tAuto,
}: CompleteCaptainProfileParams): Promise<void> {
  const isTaxi = affiliation === 'office-taxi';
  const { error: profileError } = await supabase.from('captain_profiles').upsert({
    id: userId,
    vehicle_type: isTaxi ? tAuto('key_0870671f') : tAuto('key_3e71cbbc'),
    vehicle_brand: isTaxi ? null : vehicle.make,
    vehicle_year: Number(vehicle.year) || null,
    plate_number: vehicle.plate,
    employment_type: isTaxi ? vehicle.officeName : vehicle.companyName,
    affiliation_type: affiliation,
    office_phone: isTaxi ? vehicle.officePhone : null,
    side_id: isTaxi ? vehicle.sideId : null,
    identity_url: verificationDoc,
    verification_status: 'PENDING',
  });

  if (profileError) {
    console.error('[Captain Profile Insert Error]', profileError);
    throw new Error(profileError.message || tAuto('key_643f2795'));
  }

  if (sessionToken) {
    try {
      void fetch('/api/captain/welcome-credit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
      }).catch((err) => console.warn('[Welcome Credit Hook] Async error:', err));
    } catch (e) {
      console.warn('[Welcome Credit Trigger]', e);
    }
  }

  void recordLegalDeclaration({
    userId,
    userSerialId: userSerialId || ('U-' + userId.slice(0, 6).toUpperCase()),
    actionType: 'NEW_ACCOUNT',
    actionLabel: lang === 'ar' ? 'تسجيل حساب جديد' : 'New Account Registration',
    isArabic: lang === 'ar',
  });
}
