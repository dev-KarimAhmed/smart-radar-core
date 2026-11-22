import type { CaptainAdPackage } from './captain-ads-types';
import { AD_PACKAGE_A_DETAILS } from './captain-ads-types';

export type { CaptainAdPackage };

export function getCaptainAdPackageKey(captainId: string): string {
  return `radar_captain_ad_package_${captainId}`;
}

export function getCaptainAdPackage(captainId: string, user?: any): CaptainAdPackage {
  if (user?.ad_package_active === true) {
    return {
      ...AD_PACKAGE_A_DETAILS,
      status: 'ACTIVE',
      hasActivatedBefore: true,
      subscribedAt: user?.ad_package_subscribed_at || new Date().toISOString(),
      expiresAt: user?.ad_package_expires_at,
    };
  }
  if (user?.ad_package_status === 'EXPIRED' || user?.ad_package_activated === true) {
    return {
      ...AD_PACKAGE_A_DETAILS,
      status: 'EXPIRED',
      hasActivatedBefore: true,
      subscribedAt: user?.ad_package_subscribed_at,
      expiresAt: user?.ad_package_expires_at,
    };
  }
  if (typeof window === 'undefined') return AD_PACKAGE_A_DETAILS;
  try {
    const raw = localStorage.getItem(getCaptainAdPackageKey(captainId));
    if (!raw) return AD_PACKAGE_A_DETAILS;
    const parsed = JSON.parse(raw);
    const hasActivated = Boolean(parsed.hasActivatedBefore || parsed.subscribedAt || parsed.status === 'ACTIVE' || parsed.status === 'EXPIRED');
    if (parsed && parsed.status === 'ACTIVE') {
      if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
        const expired = { ...parsed, status: 'EXPIRED' as const, hasActivatedBefore: true };
        localStorage.setItem(getCaptainAdPackageKey(captainId), JSON.stringify(expired));
        return expired;
      }
      return { ...parsed, hasActivatedBefore: true };
    }
    return { ...AD_PACKAGE_A_DETAILS, ...parsed, hasActivatedBefore: hasActivated };
  } catch {
    return AD_PACKAGE_A_DETAILS;
  }
}

export function subscribeCaptainAdPackage(captainId: string): CaptainAdPackage {
  const existing = getCaptainAdPackage(captainId);
  // Launch package is strictly single-use: cannot re-activate once used!
  if (existing.hasActivatedBefore || existing.status === 'ACTIVE' || existing.status === 'EXPIRED') {
    return existing;
  }
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const pkg: CaptainAdPackage = {
    ...AD_PACKAGE_A_DETAILS,
    status: 'ACTIVE',
    hasActivatedBefore: true,
    subscribedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(getCaptainAdPackageKey(captainId), JSON.stringify(pkg));
    window.dispatchEvent(new CustomEvent('radar_captain_ad_package_updated', { detail: { captainId, package: pkg } }));
  }
  return pkg;
}

export type CaptainOperatingLockReason = 'NEEDS_FREE_PACKAGE' | 'EXPIRED_NEEDS_HOURS' | null;

export interface CaptainOperatingEligibility {
  isEligible: boolean;
  lockReason: CaptainOperatingLockReason;
  lockMessage: string;
}

export function getCaptainOperatingEligibility({
  adPackage,
  totalUsableMinutes = 0,
  language = 'ar',
}: {
  adPackage: CaptainAdPackage;
  totalUsableMinutes?: number;
  language?: 'ar' | 'en';
}): CaptainOperatingEligibility {
  if (adPackage.status === 'UNSUBSCRIBED') {
    return {
      isEligible: false,
      lockReason: 'NEEDS_FREE_PACKAGE',
      lockMessage:
        language === 'ar'
          ? 'يرجى تفعيل الباقة الافتتاحية المجانية (أول شهر مجاناً) لبدء استقبال الرحلات ونشر إعلاناتك.'
          : 'Please activate the free Launch Package (first month free) to start receiving rides and publishing ads.',
    };
  }

  if (adPackage.status === 'EXPIRED') {
    if (totalUsableMinutes > 0) {
      return {
        isEligible: true,
        lockReason: null,
        lockMessage: '',
      };
    }
    return {
      isEligible: false,
      lockReason: 'EXPIRED_NEEDS_HOURS',
      lockMessage:
        language === 'ar'
          ? 'انتهت فترة الـ 30 يوماً للباقة الافتتاحية. يرجى شحن ساعات التشغيل لتفعيل الرادار ونشر الإعلانات.'
          : 'Your 30-day Launch Package has expired. Please recharge operating hours to continue.',
    };
  }

  return {
    isEligible: true,
    lockReason: null,
    lockMessage: '',
  };
}
