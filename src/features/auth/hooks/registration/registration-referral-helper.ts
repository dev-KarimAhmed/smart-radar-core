import type { RegistrationRole } from '../../utils/registration-helpers';
import {
  claimCaptainReferral,
  getPendingCaptainReferral,
  clearPendingCaptainReferral,
  removeReferralParamFromUrl,
} from '@/features/referral/services/captain-referral';

export async function claimPendingRiderReferralIfNeeded(
  targetRole: RegistrationRole,
  explicitRef?: string
): Promise<void> {
  const queryRef = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('ref') ||
      new URLSearchParams(window.location.search).get('captain')
    : null;
  const refCode = (explicitRef || getPendingCaptainReferral() || queryRef || '').trim();
  if (targetRole !== 'rider' || !refCode) return;

  try {
    const claimResult = await claimCaptainReferral(refCode);
    if (claimResult.success && typeof window !== 'undefined') {
      window.sessionStorage.setItem('radar_just_linked_captain_name', claimResult.captain_name || '');
    }
    if (process.env.NODE_ENV !== 'production') {
      console.info('[Referral on Signup Claimed]', claimResult);
    }
  } catch (referralErr) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Referral on Signup Error]', referralErr);
    }
  } finally {
    clearPendingCaptainReferral();
    removeReferralParamFromUrl();
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('radar_newly_registered_referral');
      window.dispatchEvent(new CustomEvent('radar_favorites_updated'));
    }
  }
}
