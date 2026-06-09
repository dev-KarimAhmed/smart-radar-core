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
