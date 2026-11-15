'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

export interface DestinationWelcomeModalProps {
  isArabic: boolean;
  isOpen: boolean;
  onDismiss: () => void;
}

export function DestinationWelcomeModal({
  isArabic,
  isOpen,
  onDismiss,
}: DestinationWelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-sm rounded-3xl border-2 border-[#14B8A6]/40 bg-[#0A0F1D] p-5 sm:p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/40 bg-[#14B8A6]/15 text-[#14F5D5] shadow-[0_0_20px_rgba(20,245,213,0.3)]">
          <ShieldAlert className="h-7 w-7 text-[#14F5D5]" />
        </div>

        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-black text-white leading-snug">
            {isArabic
              ? 'هذا القطاع مخصص للكباتن المعلنين عن خدماتهم'
              : 'This sector is dedicated to advertising captains'}
          </h3>
          <p className="text-xs sm:text-sm font-bold text-slate-300 leading-relaxed">
            {isArabic
              ? 'المعلنون يطلبون تعبئة بيانات طلبك'
              : 'Advertisers require you to fill in your trip details'}
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#14B8A6] via-[#14F5D5] to-[#14B8A6] text-sm font-black text-slate-950 shadow-[0_0_20px_rgba(20,245,213,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          {isArabic ? 'أفهم' : 'I Understand'}
        </button>
      </div>
    </div>
  );
}
