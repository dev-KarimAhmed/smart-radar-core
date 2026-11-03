'use client';

import React, { useEffect } from 'react';
import { ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LegalDataAccuracyModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
  isArabic?: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function LegalDataAccuracyModal({
  isOpen,
  onConfirm,
  onClose,
  isArabic = true,
  title,
  message,
  confirmText,
  cancelText,
  isLoading = false,
}: LegalDataAccuracyModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const resolvedTitle = title || (isArabic ? 'إقرار وتأكيد صحة البيانات' : 'Data Accuracy Confirmation');
  const resolvedMessage =
    message ||
    (isArabic
      ? 'أنت المسؤول عن صحة ومصداقية كافة البيانات المدخلة الشخصية والمهنية ولا تتحمل شبكة بينكم أي مسؤولية قانونية عن أي خلل أو عدم مطابقة في مصداقيتها ...'
      : 'You are solely responsible for the authenticity and accuracy of all personal and professional data entered. Bynkcom Network assumes no legal liability for any defect or mismatch in its authenticity...');

  const resolvedConfirmText = confirmText || (isArabic ? 'تأكيد' : 'Confirm');
  const resolvedCancelText = cancelText || (isArabic ? 'خروج' : 'Exit');

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Click outside backdrop to close */}
      <div
        className="fixed inset-0 bg-transparent cursor-pointer"
        onClick={() => {
          if (!isLoading) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/40',
          'bg-gradient-to-b from-[#181108] via-[#0E1527] to-[#060913] p-6 sm:p-7 shadow-2xl shadow-black/80',
          'animate-in zoom-in-95 duration-200 text-center select-none'
        )}
      >
        {/* Glowing Top Ambient Accent */}
        <div className="pointer-events-none absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent shadow-[0_0_12px_rgba(251,191,36,0.8)]" />

        {/* Close Icon (Top Left in RTL / Top Right in LTR) */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className={cn(
            'absolute top-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer',
            isArabic ? 'left-4' : 'right-4'
          )}
          aria-label={isArabic ? 'إغلاق' : 'Close'}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Shield Warning Badge */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-500/20 to-amber-600/5 text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.25)]">
          <ShieldAlert className="h-7 w-7 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
        </div>

        {/* Modal Title */}
        <div className="space-y-1.5 mb-4">
          <span className="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-[11px] font-black tracking-wide text-amber-300">
            {isArabic ? 'تنبيه ومسؤولية قانونية' : 'Legal & Compliance Notice'}
          </span>
          <h3 className="text-lg sm:text-xl font-black text-white">
            {resolvedTitle}
          </h3>
        </div>

        {/* Disclaimer Body (Styled to match the text from user requirement) */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 mb-6 text-center">
          <p className="text-sm sm:text-base font-bold text-amber-100/95 leading-relaxed tracking-normal">
            {resolvedMessage}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Confirm Button (Green / Emerald Styled) */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4 text-slate-950 stroke-[2.5]" />
            <span>{resolvedConfirmText}</span>
          </button>

          {/* Cancel / Exit Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-12 flex items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-sm sm:text-base active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          >
            <span>{resolvedCancelText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

