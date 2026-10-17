'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  getPendingCaptainReferral,
  storePendingCaptainReferral,
  clearPendingCaptainReferral,
  removeReferralParamFromUrl,
} from '../services/captain-referral';

export function useReferralListener(isArabic = true) {
  const { user, isPassenger } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('referral.listener');
  const [conflictModalInfo, setConflictModalInfo] = useState<{
    open: boolean;
    existingCaptainName: string;
    existingCaptainSerial: string;
  }>({
    open: false,
    existingCaptainName: '',
    existingCaptainSerial: '',
  });

  // 1. Capture ref from URL as soon as any unauthenticated page loads (excluding login)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (window.location.pathname.includes('/login')) {
        clearPendingCaptainReferral();
        removeReferralParamFromUrl();
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('captain');
      if (ref && ref.trim()) {
        storePendingCaptainReferral(ref.trim());
      }
    } catch {
      // ignore
    }
  }, []);

  // 2. If rider is already registered / authenticated, referral MUST NOT be applied
  useEffect(() => {
    if (!user?.uid || !isPassenger) return;

    const pending = getPendingCaptainReferral();
    if (pending) {
      clearPendingCaptainReferral();
      removeReferralParamFromUrl();
    }
  }, [user?.uid, isPassenger]);

  // 3. Welcome toast when rider registers through referral link
  useEffect(() => {
    if (!user?.uid || !isPassenger) return;
    if (typeof window === 'undefined') return;

    try {
      const captainName = window.sessionStorage.getItem('radar_just_linked_captain_name');
      if (captainName !== null) {
        window.sessionStorage.removeItem('radar_just_linked_captain_name');
        toast({
          title: t('linkedSuccessTitle'),
          description: t('linkedSuccessDesc', {
            captainName: captainName.trim() || (isArabic ? 'كابتنك المعتمد' : 'Your Captain'),
          }),
        });
      }
    } catch {
      // ignore
    }
  }, [user?.uid, isPassenger, isArabic, t, toast]);

  return {
    conflictModalInfo,
    closeConflictModal: () => {
      clearPendingCaptainReferral();
      removeReferralParamFromUrl();
      setConflictModalInfo((prev) => ({ ...prev, open: false }));
    },
  };
}
