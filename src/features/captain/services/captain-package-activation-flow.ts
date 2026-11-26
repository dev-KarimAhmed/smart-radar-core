import { subscribeCaptainAdPackage, type CaptainAdPackage } from './captain-ads-package';
import { recordLegalDeclaration } from '@/features/account/services/legal-log-service';
import { getClientAccessToken } from '@/shared/services/supabase-auth-headers';

export interface ActivateCaptainPackageParams {
  userId: string;
  isArabic?: boolean;
}

export interface ActivationResult {
  package: CaptainAdPackage;
  contractHash?: string;
  acceptedAt?: string;
}

/**
 * Executes sovereign package activation for captain:
 * 1. Activates launch package locally and broadcasts state
 * 2. Asynchronously calls /api/captain/contract/activate to certify contract & email PDF
 * 3. Records official legal declaration in the Electronic Legal Log
 */
export async function executeCaptainPackageActivation({
  userId,
  isArabic = true,
}: ActivateCaptainPackageParams): Promise<ActivationResult> {
  // 1. Activate package
  const pkg = subscribeCaptainAdPackage(userId);

  // 2. Record declaration in legal log
  try {
    await recordLegalDeclaration({
      userId,
      actionType: 'CAPTAIN_CONTRACT_ACTIVATION',
      actionLabel: isArabic
        ? 'توثيق وثيقة الكابتن وتفعيل الباقة'
        : 'Captain Contract Activation',
      isArabic,
    });
  } catch (err) {
    console.warn('[Activation Flow] Legal log recording warning:', err);
  }

  // 3. Trigger server contract generation and email delivery
  let contractHash: string | undefined;
  let acceptedAt: string | undefined;
  try {
    const accessToken = await getClientAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const res = await fetch('/api/captain/contract/activate', {
      method: 'POST',
      headers,
    });

    if (res.ok) {
      const payload = await res.json();
      if (payload?.success) {
        contractHash = payload.contractHash;
        acceptedAt = payload.acceptedAt;
      }
    }
  } catch (apiErr) {
    console.warn('[Activation Flow] API contract activation warning:', apiErr);
  }

  return {
    package: pkg,
    contractHash,
    acceptedAt,
  };
}

/**
 * Seamless one-click jump to History -> Legal Record -> Open Accordion
 */
export function navigateToLegalRecord(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('radar_navigate_to_legal_record'));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('radar_navigate_to_legal_record'));
    }, 100);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('radar_navigate_to_legal_record'));
    }, 300);
  }
}
