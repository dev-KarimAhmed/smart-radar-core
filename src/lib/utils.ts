import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const triggerHaptic = (type: 'light' | 'heavy' = 'light') => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(type === 'heavy' ? [50, 50, 50] : 50);
  }
};

export const handleAdAction = (actionUrl: string | undefined) => {
  if (!actionUrl) return;

  if (actionUrl.startsWith('tel:') || actionUrl.startsWith('https://wa.me/')) {
    window.location.href = actionUrl;
  } else if (actionUrl.startsWith('http')) {
    window.open(actionUrl, '_blank', 'noopener,noreferrer');
  }
};

export const PRODUCTION_DOMAIN = 'https://smart-radar-core-production-8d61.up.railway.app';

export function getAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || PRODUCTION_DOMAIN;
}

export function getAuthRedirectUrl(path: string = '/reset-password'): string {
  const origin = getAppOrigin();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}

