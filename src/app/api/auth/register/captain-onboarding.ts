import { grantNewCaptainWelcomeCredit } from '@/features/captain/services/captain-welcome-credit';
import { saveCaptainContract } from '@/server/services/contract-pdf-service';
import { sendCaptainContractEmail } from '@/server/services/email-service';
import type { AppLanguage } from '@/lib/i18n/simple-copy';

interface HandleCaptainPostRegistrationParams {
  userId: string;
  fullName: string;
  normalizedPhone: string;
  rawEmail: string;
  captainProfile: any;
  clientIp?: string;
  lang: AppLanguage;
}

export function handleCaptainPostRegistration({
  userId,
  fullName,
  normalizedPhone,
  rawEmail,
  captainProfile,
  clientIp,
  lang,
}: HandleCaptainPostRegistrationParams) {
  // 1. Grant welcome hours
  void (async () => {
    try {
      await grantNewCaptainWelcomeCredit(userId);
    } catch (creditErr) {
      console.warn('[Registration API] Welcome credit error:', creditErr);
    }
  })();

  // 2. Generate official PDF contract & email it to the captain asynchronously (Article 5 Section 4)
  void (async () => {
    try {
      const contractRes = await saveCaptainContract({
        captainId: userId,
        fullName,
        phone: normalizedPhone,
        email: rawEmail,
        licenseNumber: captainProfile?.license_number,
        plateNumber: captainProfile?.plate_number,
        vehicleMake: captainProfile?.make || captainProfile?.vehicle_brand,
        vehicleModel: captainProfile?.model || captainProfile?.vehicle_model,
        vehicleYear: captainProfile?.year || captainProfile?.vehicle_year,
        governorate: captainProfile?.governorate,
        district: captainProfile?.district,
        ipAddress: clientIp,
      });

      await sendCaptainContractEmail({
        to: rawEmail,
        captainName: fullName,
        pdfBuffer: contractRes.pdfBuffer,
        contractHash: contractRes.contractHash,
        acceptedAt: contractRes.acceptedAt,
        lang,
      });
    } catch (contractErr) {
      console.warn('[Registration API] Async captain contract email error:', contractErr);
    }
  })();
}
