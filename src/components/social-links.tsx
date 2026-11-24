'use client';

import React from 'react';
import { Instagram, Facebook, ArrowUpRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BYNCOM_OFFICIAL_SOCIAL_LINKS } from '@/lib/constants';

export interface SocialLinksProps {
  variant?: 'hero' | 'compact';
  isArabic?: boolean;
  className?: string;
  showTitle?: boolean;
}

export function SocialLinks({
  variant = 'hero',
  isArabic = true,
  className,
  showTitle = true,
}: SocialLinksProps) {
  const { instagram, facebook } = BYNCOM_OFFICIAL_SOCIAL_LINKS;

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center justify-center gap-3', className)}>
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isArabic ? 'إنستغرام بينكم (@byncom3)' : 'Byncom Instagram (@byncom3)'}
          title={isArabic ? 'إنستغرام بينكم (@byncom3)' : 'Byncom Instagram (@byncom3)'}
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-pink-500/25 bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-amber-500/10 text-pink-400 transition-all duration-300 hover:border-pink-400/80 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white hover:shadow-[0_0_20px_rgba(225,48,108,0.4)] active:scale-95"
        >
          <Instagram className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
        </a>

        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isArabic ? 'فيسبوك بينكم' : 'Byncom Facebook'}
          title={isArabic ? 'فيسبوك بينكم' : 'Byncom Facebook'}
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10 text-blue-400 transition-all duration-300 hover:border-blue-400/80 hover:bg-[#1877F2] hover:text-white hover:shadow-[0_0_20px_rgba(24,119,242,0.4)] active:scale-95"
        >
          <Facebook className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
        </a>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className={cn(
        'mx-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-[#161F30]/65 p-4 sm:p-5 backdrop-blur-xl shadow-2xl shadow-black/40',
        className
      )}
    >
      {showTitle && (
        <div className="mb-3.5 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-[#14B8A6]">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-black tracking-normal text-slate-200">
              {isArabic ? 'قنوات شبكة بينكم الرسمية' : 'Official Byncom Channels'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#14F5D5]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14F5D5] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14F5D5]" />
            </span>
            <span>{isArabic ? 'تابعنا الآن' : 'Follow Us'}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Instagram Card Button */}
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isArabic ? 'حساب إنستغرام الرسمي @byncom3' : 'Official Instagram Account @byncom3'}
          className="group relative flex items-center justify-between rounded-2xl border border-pink-500/20 bg-gradient-to-r from-pink-500/[0.08] via-purple-500/[0.06] to-transparent p-3.5 transition-all duration-300 hover:border-pink-500/50 hover:bg-gradient-to-r hover:from-pink-500/15 hover:via-purple-500/10 hover:to-pink-500/5 hover:shadow-[0_0_25px_rgba(225,48,108,0.25)] active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-md shadow-pink-500/25 transition-transform duration-300 group-hover:scale-110">
              <Instagram className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-start">
              <span className="text-xs font-black text-slate-100 group-hover:text-pink-200 transition-colors">
                {isArabic ? 'إنستغرام' : 'Instagram'}
              </span>
              <span className="text-[11px] font-semibold text-pink-300/80 font-mono" dir="ltr">
                @byncom3
              </span>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-pink-500/20 bg-pink-500/10 text-pink-300 transition-colors group-hover:border-pink-400 group-hover:bg-pink-500/20 group-hover:text-white">
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </a>

        {/* Facebook Card Button */}
        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isArabic ? 'صفحة فيسبوك الرسمية' : 'Official Facebook Page'}
          className="group relative flex items-center justify-between rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/[0.08] via-sky-500/[0.06] to-transparent p-3.5 transition-all duration-300 hover:border-blue-500/50 hover:bg-gradient-to-r hover:from-blue-500/15 hover:via-sky-500/10 hover:to-blue-500/5 hover:shadow-[0_0_25px_rgba(24,119,242,0.25)] active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1877F2] text-white shadow-md shadow-blue-500/25 transition-transform duration-300 group-hover:scale-110">
              <Facebook className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-start">
              <span className="text-xs font-black text-slate-100 group-hover:text-blue-200 transition-colors">
                {isArabic ? 'فيسبوك' : 'Facebook'}
              </span>
              <span className="text-[11px] font-semibold text-blue-300/80">
                {isArabic ? 'صفحتنا الرسمية' : 'Official Page'}
              </span>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-300 transition-colors group-hover:border-blue-400 group-hover:bg-blue-500/20 group-hover:text-white">
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </a>
      </div>
    </div>
  );
}
