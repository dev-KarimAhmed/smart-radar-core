import { supabaseAdmin } from '@/lib/supabase-admin';
import { saveRiderContract } from '@/server/services/rider-pdf-service';
import { sendRiderContractEmail } from '@/server/services/email-service';
import type { AppLanguage } from '@/lib/i18n/simple-copy';

interface HandleRiderPostRegistrationParams {
  userId: string;
  fullName: string;
  normalizedPhone: string;
  rawEmail: string;
  governorateId?: number | null;
  districtId?: number | null;
  clientIp?: string;
  lang: AppLanguage;
}

export function handleRiderPostRegistration({
  userId,
  fullName,
  normalizedPhone,
  rawEmail,
  governorateId,
  districtId,
  clientIp,
  lang,
}: HandleRiderPostRegistrationParams) {
  // Generate official PDF privacy agreement & email it asynchronously upon account creation
  void (async () => {
    try {
      let governorate = 'الأردن';
      let district = 'المركزي';

      if (governorateId) {
        const { data: gov } = await supabaseAdmin
          .from('governorates')
          .select('name_ar')
          .eq('id', governorateId)
          .maybeSingle();
        if (gov?.name_ar) governorate = String(gov.name_ar);
      }

      if (districtId) {
        const { data: dist } = await supabaseAdmin
          .from('districts')
          .select('name_ar')
          .eq('id', districtId)
          .maybeSingle();
        if (dist?.name_ar) district = String(dist.name_ar);
      }

      const contractRes = await saveRiderContract({
        userId,
        fullName,
        phone: normalizedPhone,
        email: rawEmail,
        governorate,
        district,
        ipAddress: clientIp,
      });

      await sendRiderContractEmail({
        to: rawEmail,
        userName: fullName,
        pdfBuffer: contractRes.pdfBuffer,
        contractHash: contractRes.contractHash,
        acceptedAt: contractRes.acceptedAt,
        lang,
      });
    } catch (contractErr) {
      console.warn('[Registration API] Async privacy contract email error:', contractErr);
    }
  })();
}
