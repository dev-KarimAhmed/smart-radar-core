'use client';

import React from 'react';
import { Instagram, Facebook } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BYNCOM_OFFICIAL_SOCIAL_LINKS } from '@/lib/constants';

export interface SocialLinksProps {
  variant?: 'pill' | 'compact' | 'inline';
  isArabic?: boolean;
  className?: string;
}

export function SocialLinks({
  variant = 'pill',
  isArabic = true,
  className,
}: SocialLinksProps) {
  const { instagram, facebook } = BYNCOM_OFFICIAL_SOCIAL_LINKS;

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center justify-center gap-2.5', className)}>
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isArabic ? 'إنستغرام بينكم (@byncom3)' : 'Byncom Instagram (@byncom3)'}
          title={isArabic ? 'إنستغرام بينكم (@byncom3)' : 'Byncom Instagram (@byncom3)'}
          className="group relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-md transition-all duration-300 hover:scale-115 hover:shadow-[0_0_15px_rgba(225,48,108,0.5)] active:scale-95"
        >
          <Instagram className="h-4 w-4" />
        </a>

        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isArabic ? 'فيسبوك بينكم' : 'Byncom Facebook'}
          title={isArabic ? 'فيسبوك بينكم' : 'Byncom Facebook'}
          className="group relative flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-md transition-all duration-300 hover:scale-115 hover:shadow-[0_0_15px_rgba(24,119,242,0.5)] active:scale-95"
        >
          <Facebook className="h-4 w-4" />
        </a>
      </div>
    );
  }

  const containerClasses =
    variant === 'pill'
      ? 'fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 shadow-[0_10px_35px_rgba(0,0,0,0.6)]'
      : 'inline-flex shadow-lg';

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className={cn(
        'flex items-center gap-2.5 rounded-full border border-white/10 bg-[#161F30]/85 px-3.5 py-1.5 backdrop-blur-xl transition hover:border-[#14B8A6]/40',
        containerClasses,
        className
      )}
    >
      <span className="text-[11px] font-bold text-slate-300 select-none">
        {isArabic ? 'تابعنا:' : 'Follow us:'}
      </span>

      <div className="h-3.5 w-px bg-white/15" />

      <a
        href={instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={isArabic ? 'إنستغرام بينكم (@byncom3)' : 'Byncom Instagram (@byncom3)'}
        title={isArabic ? 'إنستغرام (@byncom3)' : 'Instagram (@byncom3)'}
        className="group relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-sm transition-all duration-300 hover:scale-115 hover:shadow-[0_0_15px_rgba(225,48,108,0.55)] active:scale-95"
      >
        <Instagram className="h-3.5 w-3.5" />
      </a>

      <a
        href={facebook}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={isArabic ? 'فيسبوك بينكم' : 'Byncom Facebook'}
        title={isArabic ? 'فيسبوك بينكم' : 'Byncom Facebook'}
        className="group relative flex h-7 w-7 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-sm transition-all duration-300 hover:scale-115 hover:shadow-[0_0_15px_rgba(24,119,242,0.55)] active:scale-95"
      >
        <Facebook className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
