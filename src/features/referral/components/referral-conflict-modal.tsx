'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Lock, User } from 'lucide-react';
import { removeReferralParamFromUrl, clearPendingCaptainReferral } from '../services/captain-referral';

interface ReferralConflictModalProps {
  open: boolean;
  onClose: () => void;
  existingCaptainName: string;
  existingCaptainSerial?: string;
  isArabic?: boolean;
}

export function ReferralConflictModal({
  open,
  onClose,
  existingCaptainName,
  existingCaptainSerial,
  isArabic = true,
}: ReferralConflictModalProps) {
  const t = useTranslations('referral.conflictModal');

  const handleAction = (goToProfile: boolean) => {
    clearPendingCaptainReferral();
    removeReferralParamFromUrl();
    onClose();
    if (goToProfile && typeof window !== 'undefined') {
      window.location.hash = '#profile';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(val) => !val && handleAction(false)}>
      <AlertDialogContent
        dir={isArabic ? 'rtl' : 'ltr'}
        className="border border-amber-500/30 bg-[#0B0F19] text-white rounded-3xl p-6 max-w-md"
      >
        <AlertDialogHeader className="text-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 mb-2">
            <Lock className="h-6 w-6 stroke-[2]" />
          </div>
          <AlertDialogTitle className="text-base font-black text-white flex items-center gap-2">
            {t('title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-slate-300 leading-relaxed pt-2 space-y-2">
            <span className="block">
              {t('currentCaptainPrefix')}
              <strong className="text-amber-300">{existingCaptainName}</strong>
              {existingCaptainSerial ? ` (🧬 #${existingCaptainSerial})` : ''}.
            </span>
            <span className="block text-slate-400">
              {t('policyNote')}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-4">
          <AlertDialogAction
            onClick={() => handleAction(true)}
            className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black text-xs hover:brightness-110 cursor-pointer"
          >
            <User className="h-4 w-4 mr-1 ml-1" />
            <span>{t('manageProfileButton')}</span>
          </AlertDialogAction>
          <button
            type="button"
            onClick={() => handleAction(false)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 cursor-pointer"
          >
            {t('closeButton')}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
