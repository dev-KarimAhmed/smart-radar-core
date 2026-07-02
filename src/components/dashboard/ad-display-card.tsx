'use client';

import React from 'react';
import { Heart, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdDisplayCardProps = {
  ad: any;
  isHearted?: boolean;
  onHeart?: (event: React.MouseEvent, ad: any) => void;
  onOpen?: (event: React.MouseEvent, ad: any) => void;
  className?: string;
  badgeText?: string;
  ctaText?: string;
  showHeart?: boolean;
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200';

export function getAdImage(ad: any) {
  return (
    ad?.content?.posterUrl ||
    ad?.posterUrl ||
    ad?.bannerUrl ||
    ad?.imageUrl ||
    FALLBACK_IMAGE
  );
}

export function getAdTitle(ad: any) {
  return ad?.content?.title || ad?.title || 'عرض محلي قريب منك';
}

export function getAdDescription(ad: any) {
  return (
    ad?.content?.description ||
    ad?.description ||
    'اكتشف عرضاً مناسباً في منطقتك وتواصل مع المعلن مباشرة.'
  );
}

export function getAdCta(ad: any) {
  return ad?.action?.buttonText || ad?.buttonText || 'عرض التفاصيل';
}

export function AdDisplayCard({
  ad,
  isHearted = false,
  onHeart,
  onOpen,
  className,
  badgeText = 'نبض ميداني',
  ctaText,
  showHeart = true,
}: AdDisplayCardProps) {
  const title = getAdTitle(ad);
  const description = getAdDescription(ad);
  const image = getAdImage(ad);
  const actionText = ctaText || getAdCta(ad);

  return (
    <article
      dir="rtl"
      onClick={onOpen ? (event) => onOpen(event, ad) : undefined}
      className={cn(
        'group relative isolate flex h-[360px] w-full cursor-pointer select-none flex-col justify-end overflow-hidden rounded-[28px] border border-cyan-400/10 bg-[#0B0F19] p-5 text-right shadow-[0_24px_70px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-[#14B8A6]/45 hover:shadow-[0_26px_80px_rgba(20,184,166,0.18)]',
        className
      )}
    >
      <img
        src={image}
        alt={title}
        onError={(event) => {
          event.currentTarget.src = FALLBACK_IMAGE;
        }}
        className="absolute inset-0 z-0 h-full w-full object-cover opacity-85 grayscale-[12%] brightness-[0.82] saturate-[0.95] transition duration-700 group-hover:scale-[1.03] group-hover:opacity-95"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 z-[1] bg-[#07101F]/18" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#06101D]/95 via-[#06101D]/45 to-[#06101D]/8" />

      {showHeart && (
        <button
          type="button"
          aria-label={isHearted ? 'إزالة الإعلان من المفضلة' : 'حفظ الإعلان'}
          onClick={(event) => {
            event.stopPropagation();
            onHeart?.(event, ad);
          }}
          className="absolute left-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#121A2D]/88 text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:scale-105 hover:border-[#14B8A6]/40"
        >
          <Heart
            className={cn(
              'h-5 w-5 transition',
              isHearted
                ? 'fill-[#14B8A6] text-[#14B8A6] drop-shadow-[0_0_10px_rgba(20,184,166,0.9)]'
                : 'text-white'
            )}
          />
        </button>
      )}

      <div className="absolute right-5 top-6 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#111827]/90 px-3 py-1.5 text-[10px] font-black text-[#14F5D5] shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <Zap className="h-3 w-3 fill-orange-400 text-orange-400" />
        <span>{badgeText}</span>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[90%] flex-col items-center gap-3 pb-1 text-center">
        <div className="space-y-1.5">
          <h3 className="line-clamp-2 text-[15px] font-black leading-snug text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]">
            {title}
          </h3>
          <p className="line-clamp-2 text-[11px] font-semibold leading-relaxed text-white/86 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            {description}
          </p>
        </div>

        <span className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-[#14F5D5] px-6 py-2.5 text-[11px] font-black text-[#041315] shadow-[0_0_22px_rgba(20,245,213,0.42)] transition group-hover:bg-[#2FFFE5]">
          {actionText}
        </span>
      </div>
    </article>
  );
}
