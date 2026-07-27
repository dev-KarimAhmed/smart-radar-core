'use client';

import React from 'react';
import { Heart, Zap } from 'lucide-react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
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

const AD_CARD_COPY = {
  ar: {
    fallbackTitle: 'إعلان قريب منك',
    fallbackDescription: 'اكتشف عرضاً مناسباً في منطقتك وتواصل مع المعلن مباشرة.',
    fallbackCta: 'عرض التفاصيل',
    defaultBadge: 'إعلان قريب',
    saveAd: 'حفظ الإعلان',
    removeAd: 'إزالة الإعلان من المفضلة',
  },
  en: {
    fallbackTitle: 'Nearby ad',
    fallbackDescription: 'Discover a useful offer in your area and contact the advertiser directly.',
    fallbackCta: 'View details',
    defaultBadge: 'Nearby ad',
    saveAd: 'Save ad',
    removeAd: 'Remove ad from vault',
  },
} as const;

export function getAdImage(ad: any) {
  return (
    ad?.content?.posterUrl ||
    ad?.posterUrl ||
    ad?.bannerUrl ||
    ad?.imageUrl ||
    FALLBACK_IMAGE
  );
}

export function getAdTitle(ad: any, fallback: string = AD_CARD_COPY.ar.fallbackTitle) {
  return ad?.content?.title || ad?.title || fallback;
}

export function getAdDescription(ad: any, fallback: string = AD_CARD_COPY.ar.fallbackDescription) {
  return ad?.content?.description || ad?.description || fallback;
}

export function getAdCta(ad: any, fallback: string = AD_CARD_COPY.ar.fallbackCta) {
  return ad?.action?.buttonText || ad?.buttonText || fallback;
}

export function AdDisplayCard({
  ad,
  isHearted = false,
  onHeart,
  onOpen,
  className,
  badgeText,
  ctaText,
  showHeart = true,
}: AdDisplayCardProps) {
  const { direction, language } = useDashboardLanguage();
  const copy = AD_CARD_COPY[language];
  const title = getAdTitle(ad, copy.fallbackTitle);
  const description = getAdDescription(ad, copy.fallbackDescription);
  const image = getAdImage(ad);
  const actionText = ctaText || getAdCta(ad, copy.fallbackCta);
  const resolvedBadgeText = badgeText || copy.defaultBadge;
  const isPlaceholder = Boolean(ad?.isPlaceholder);

  return (
    <article
      dir={direction}
      onClick={onOpen ? (event) => onOpen(event, ad) : undefined}
      className={cn(
        'group relative isolate flex h-[360px] w-full cursor-pointer select-none flex-col justify-end overflow-hidden rounded-[28px] border border-cyan-400/10 bg-[#0B0F19] p-5 text-right shadow-[0_24px_70px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-[#14B8A6]/45 hover:shadow-[0_26px_80px_rgba(20,184,166,0.18)]',
        isPlaceholder && 'border-[#14B8A6]/20 shadow-[0_22px_65px_rgba(20,184,166,0.10)]',
        className
      )}
    >
      <img
        src={image}
        alt={title}
        onError={(event) => {
          event.currentTarget.src = FALLBACK_IMAGE;
        }}
        className={cn(
          'absolute inset-0 z-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]',
          isPlaceholder
            ? 'opacity-100 brightness-110 saturate-110'
            : 'opacity-85 grayscale-[12%] brightness-[0.82] saturate-[0.95] group-hover:opacity-95'
        )}
        referrerPolicy="no-referrer"
      />
      <div className={cn('absolute inset-0 z-[1]', isPlaceholder ? 'bg-[#07101F]/4' : 'bg-[#07101F]/18')} />
      <div
        className={cn(
          'absolute inset-0 z-[2] bg-gradient-to-t',
          isPlaceholder
            ? 'from-[#06101D]/78 via-[#06101D]/24 to-transparent'
            : 'from-[#06101D]/95 via-[#06101D]/45 to-[#06101D]/8'
        )}
      />

      {showHeart && (
        <button
          type="button"
          aria-label={isHearted ? copy.removeAd : copy.saveAd}
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
        <span>{resolvedBadgeText}</span>
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
