import { grantNewCaptainWelcomeCredit } from '@/features/captain/services/captain-welcome-credit';
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
}: HandleCaptainPostRegistrationParams) {
  // 1. Grant welcome operating hours to the newly registered captain
  void (async () => {
    try {
      await grantNewCaptainWelcomeCredit(userId);
    } catch (creditErr) {
      console.warn('[Registration API] Welcome credit error:', creditErr);
    }
  })();

  // Note: Per Sovereign V2.6 protocol, the official Captain Contract
  // is certified and emailed upon Package Activation in the Control Room.
}
