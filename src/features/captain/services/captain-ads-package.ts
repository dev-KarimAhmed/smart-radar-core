import type { CaptainAdPackage } from './captain-ads-types';
import { AD_PACKAGE_A_DETAILS } from './captain-ads-types';

export function getCaptainAdPackageKey(captainId: string): string {
  return `radar_captain_ad_package_${captainId}`;
}

export function getCaptainAdPackage(captainId: string): CaptainAdPackage {
  if (typeof window === 'undefined') return AD_PACKAGE_A_DETAILS;
  try {
    const raw = localStorage.getItem(getCaptainAdPackageKey(captainId));
    if (!raw) return AD_PACKAGE_A_DETAILS;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.status === 'ACTIVE') {
      if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
        return { ...parsed, status: 'EXPIRED' };
      }
      return parsed;
    }
    return { ...AD_PACKAGE_A_DETAILS, ...parsed };
  } catch {
    return AD_PACKAGE_A_DETAILS;
  }
}

export function subscribeCaptainAdPackage(captainId: string): CaptainAdPackage {
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const pkg: CaptainAdPackage = {
    ...AD_PACKAGE_A_DETAILS,
    status: 'ACTIVE',
    subscribedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(getCaptainAdPackageKey(captainId), JSON.stringify(pkg));
    window.dispatchEvent(new CustomEvent('radar_captain_ad_package_updated', { detail: { captainId, package: pkg } }));
  }
  return pkg;
}
