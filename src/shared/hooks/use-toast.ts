'use client';

import { useState, useEffect } from 'react';
import {
  resolveNotificationForDisplay,
  requestBatchTranslation,
  hasArabicScript,
} from '@/shared/utils/notification-i18n';
import { readStoredDashboardLanguage } from '@/lib/i18n/language-storage';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  duration?: number;
}

type ToastListener = (toasts: Toast[]) => void;
const listeners = new Set<ToastListener>();
let toastMemory: Toast[] = [];

function isTranslatableToastText(text: string | undefined): boolean {
  const trimmed = (text || '').trim();
  if (!trimmed) return false;
  if (/^\+?[\d\s()-]{5,}$/.test(trimmed)) return false;
  if (/^[A-Z0-9_-]{2,24}$/.test(trimmed)) return false;
  if (hasArabicScript(trimmed)) return true;
  // Require at least two words for Latin strings to avoid translating short status/voucher tokens
  return /\s+/.test(trimmed);
} 

export const toast = (options: {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  duration?: number;
}) => {
  const isArabic = typeof window !== 'undefined' ? readStoredDashboardLanguage() === 'ar' : true;
  const parsed = resolveNotificationForDisplay(
    { title: options.title, description: options.description },
    isArabic
  );

  const title = parsed.title;
  const description = options.description !== undefined ? parsed.description : undefined;

  const id = Math.random().toString(36).substring(2, 9);
  const newToast: Toast = { ...options, id, title, description };

  // Limiting active notifications to keep UI clean and focused
  toastMemory = [newToast, ...toastMemory].slice(0, 3);
  listeners.forEach((listener) => listener(toastMemory));

  // If a natural-language toast still lacks static/cached translation, translate asynchronously and patch in place
  if (typeof window !== 'undefined' && (parsed.titleNeedsTranslation || parsed.descriptionNeedsTranslation)) {
    const missing: string[] = [];
    if (parsed.titleNeedsTranslation && isTranslatableToastText(title)) {
      missing.push(title);
    }
    if (parsed.descriptionNeedsTranslation && description && isTranslatableToastText(description)) {
      missing.push(description);
    }

    if (missing.length > 0) {
      const targetLang: 'ar' | 'en' = isArabic ? 'ar' : 'en';
      void requestBatchTranslation(missing, targetLang).then((translatedMap) => {
        if (!translatedMap || Object.keys(translatedMap).length === 0) return;
        let updated = false;
        toastMemory = toastMemory.map((item) => {
          if (item.id !== id) return item;
          const nextTitle = (item.title && translatedMap[item.title.trim()]) || item.title;
          const nextDesc =
            item.description !== undefined
              ? (translatedMap[item.description.trim()] || item.description)
              : undefined;
          if (nextTitle !== item.title || nextDesc !== item.description) {
            updated = true;
            return { ...item, title: nextTitle, description: nextDesc };
          }
          return item;
        });
        if (updated) {
          listeners.forEach((listener) => listener(toastMemory));
        }
      });
    }
  }

  // Default auto-dismiss duration: 7500ms (7.5 seconds) instead of 3.5s
  const duration = options.duration ?? 7500;

  setTimeout(() => {
    toastMemory = toastMemory.filter((t) => t.id !== id);
    listeners.forEach((listener) => listener(toastMemory));
  }, duration);

  return {
    id,
    dismiss: () => {
      toastMemory = toastMemory.filter((t) => t.id !== id);
      listeners.forEach((listener) => listener(toastMemory));
    }
  };
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastMemory);

  useEffect(() => {
    const handleUpdate = (latestToasts: Toast[]) => {
      setToasts(latestToasts);
    };
    
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: (id: string) => {
      toastMemory = toastMemory.filter((t) => t.id !== id);
      listeners.forEach((listener) => listener(toastMemory));
    }
  };
}

