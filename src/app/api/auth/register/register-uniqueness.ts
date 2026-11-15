import { supabaseAdmin } from '@/lib/supabase-admin';

export async function checkRegistrationUniqueness(
  normalizedPhone: string,
  rawEmail: string,
  role: string,
  captainProfile: any,
): Promise<{ error?: string }> {
  // A. Check phone in profiles & auth.users
  const { data: existingProfileByPhone } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('phone', normalizedPhone)
    .maybeSingle();

  if (existingProfileByPhone) {
    return { error: 'رقم الهاتف مسجل بالفعل مسبقاً.' };
  }

  // B. Check email in profiles
  const { data: existingProfileByEmail } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .ilike('email', rawEmail)
    .maybeSingle();

  if (existingProfileByEmail) {
    return { error: 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر.' };
  }

  // C. Check Captain credentials uniqueness if applicable
  if ((role === 'CAPTAIN' || role === 'DRIVER') && captainProfile) {
    const trimmedNatId = captainProfile.national_id_number?.trim() || null;
    const trimmedLic = captainProfile.license_number?.trim() || null;
    const trimmedPlate = captainProfile.plate_number?.trim().toUpperCase() || null;

    const { data: availability } = await supabaseAdmin.rpc('check_captain_identity_available', {
      p_national_id: trimmedNatId,
      p_license_number: trimmedLic,
      p_plate_number: trimmedPlate,
      p_email: rawEmail,
    });

    if (availability) {
      if (availability.email_taken) {
        return { error: 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر.' };
      }
      if (availability.national_id_taken) {
        return { error: 'رقم الهوية الوطنية مسجل بالفعل مسبقاً.' };
      }
      if (availability.license_taken) {
        return { error: 'رقم رخصة القيادة مسجل بالفعل مسبقاً.' };
      }
      if (availability.plate_taken) {
        return { error: 'رقم لوحة المركبة مسجل بالفعل مسبقاً لمركبة أخرى.' };
      }
    }
  }

  return {};
}
