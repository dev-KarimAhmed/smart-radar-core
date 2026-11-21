'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Link2, X } from 'lucide-react';
import type { User } from '@/core/types';
import { cn } from '@/lib/utils';
import { buildCaptainReferralLink } from '@/features/referral/services/captain-referral';

interface CaptainReferralCopyButtonProps {
  user?: User | null;
  isArabic: boolean;
  className?: string;
  iconClassName?: string;
}

export function CaptainReferralCopyButton({
  user,
  isArabic,
  className,
  iconClassName = 'h-4 w-4 shrink-0',
}: CaptainReferralCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const captainIdentifier = user?.serial_id || user?.uid || 'CAPTAIN';
  const referralLink =
    typeof window !== 'undefined'
      ? buildCaptainReferralLink(captainIdentifier)
      : `/register/rider?ref=${captainIdentifier}`;

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = referralLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setShowSnackbar(true);

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setCopied(false);
        setShowSnackbar(false);
      }, 4500);
    } catch {
      // fallback
    }
  };

  const buttonTitle = isArabic ? 'نسخ رابط إحالة الركاب' : 'Copy Passenger Referral Link';

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={buttonTitle}
        title={buttonTitle}
        className={cn(
          'inline-flex items-center justify-center rounded-xl border px-2.5 py-1.5 transition cursor-pointer sm:rounded-2xl sm:px-3 sm:py-2',
          copied
            ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
            : 'border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] hover:bg-[#14B8A6]/20',
          className
        )}
      >
        {copied ? (
          <Check className="h-4 w-4 shrink-0 text-emerald-400 stroke-[2.5]" />
        ) : (
          <Copy className={iconClassName} />
        )}
      </button>

      {showSnackbar && (
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-[99999] w-[92vw] max-w-md pointer-events-auto animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="relative flex items-start gap-3 rounded-2xl border border-[#14F5D5]/40 bg-[#0B1320]/95 p-3.5 sm:p-4 text-white shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl ring-1 ring-[#14F5D5]/20">
            <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5] to-transparent" />
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#14F5D5]/30 bg-[#14F5D5]/15 text-[#14F5D5]">
              <Link2 className="h-4.5 w-4.5" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-black text-[#14F5D5] flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[3]" />
                <span>{isArabic ? 'تم نسخ رابط إحالة الركاب بنجاح!' : 'Passenger Referral Link Copied!'}</span>
              </p>
              <p className="mt-1 text-[11px] sm:text-xs font-medium text-slate-300 leading-relaxed">
                {isArabic
                  ? 'شاركه مع الركاب لربطهم بك كمفضلين تلقائياً، واكسب النقاط لترقية رتبتك إلى الماسي وزيادة أرباحك وعروضك.'
                  : 'Share it with riders to link them as your favorites automatically, earn points to boost your rank to Diamond, and maximize your earnings.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSnackbar(false)}
              className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg cursor-pointer shrink-0"
              aria-label={isArabic ? 'إغلاق' : 'Close'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
