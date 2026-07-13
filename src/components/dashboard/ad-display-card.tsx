'use client';

import React from 'react';
import { Heart, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';
import arMessages from '@/messages/ar.json';
import enMessages from '@/messages/en.json';

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


  const AD_CARD_FALLBACK = {
  ar: {
    title: arMessages.adCard.fallbackTitle,
    description: arMessages.adCard.fallbackDescription,
    cta: arMessages.adCard.fallbackCta,
  },
  en: {
    title: enMessages.adCard.fallbackTitle,
    description: enMessages.adCard.fallbackDescription,
    cta: enMessages.adCard.fallbackCta,
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

export function getAdTitle(ad: any, fallback: string = AD_CARD_FALLBACK.ar.title) {
  return ad?.content?.title || ad?.title || fallback;
}

export function getAdDescription(ad: any, fallback: string = AD_CARD_FALLBACK.ar.description) {
  return ad?.content?.description || ad?.description || fallback;
}

export function getAdCta(ad: any, fallback: string = AD_CARD_FALLBACK.ar.cta) {
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
  const { direction } = useDashboardLanguage();
  const t = useTranslations('adCard');
  const title = getAdTitle(ad, t('fallbackTitle'));
  const description = getAdDescription(ad, t('fallbackDescription'));
  const image = getAdImage(ad);
  const actionText = ctaText || getAdCta(ad, t('fallbackCta'));
  const resolvedBadgeText = badgeText || t('defaultBadge');
  const isPlaceholder = Boolean(ad?.isPlaceholder);

  return (
    <article
      dir={direction}
      onClick={onOpen ? (event) => onOpen(event, ad) : undefined}
      className={cn(
        'group relative isolate flex h-[360px] w-full cursor-pointer select-none flex-col justify-end overflow-hidden rounded-[28px] border border-cyan-400/10 bg-radar-bg-deep p-5 text-right shadow-[0_24px_70px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-radar-teal/45 hover:shadow-[0_26px_80px_rgb(var(--radar-teal-rgb)_/_0.18)]',
        isPlaceholder && 'border-radar-teal/20 shadow-[0_22px_65px_rgb(var(--radar-teal-rgb)_/_0.10)]',
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
      <div className={cn('absolute inset-0 z-[1]', isPlaceholder ? 'bg-radar-overlay/4' : 'bg-radar-overlay/18')} />
      <div
        className={cn(
          'absolute inset-0 z-[2] bg-gradient-to-t',
          isPlaceholder
            ? 'from-radar-gradient/78 via-radar-gradient/24 to-transparent'
            : 'from-radar-gradient/95 via-radar-gradient/45 to-radar-gradient/8'
        )}
      />

      {showHeart && (
        <button
          type="button"
          aria-label={isHearted ? t('removeAd') : t('saveAd')}
          onClick={(event) => {
            event.stopPropagation();
            onHeart?.(event, ad);
          }}
          className="absolute left-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-radar-night/88 text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:scale-105 hover:border-radar-teal/40"
        >
          <Heart
            className={cn(
              'h-5 w-5 transition',
              isHearted
                ? 'fill-radar-teal text-radar-teal drop-shadow-[0_0_10px_rgb(var(--radar-teal-rgb)_/_0.9)]'
                : 'text-white'
            )}
          />
        </button>
      )}

      <div className="absolute right-5 top-6 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-radar-surface/90 px-3 py-1.5 text-[10px] font-black text-radar-teal-bright shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
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

        <span className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-radar-teal-bright px-6 py-2.5 text-[11px] font-black text-radar-ink shadow-[0_0_22px_rgb(var(--radar-teal-bright-rgb)_/_0.42)] transition group-hover:bg-radar-teal-glow">
          {actionText}
        </span>
      </div>
    </article>
  );
}
