'use client';

import React from 'react';
import { Heart, Zap } from 'lucide-react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';

const styles = {
  style87_1: "group relative isolate flex h-[360px] w-full cursor-pointer select-none flex-col justify-end overflow-hidden rounded-[28px] border border-cyan-400/10 bg-[#0B0F19] p-5 text-right shadow-[0_24px_70px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-[#14B8A6]/45 hover:shadow-[0_26px_80px_rgba(20,184,166,0.18)]",
  style88_2: "border-[#14B8A6]/20 shadow-[0_22px_65px_rgba(20,184,166,0.10)]",
  style99_3: "absolute inset-0 z-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]",
  style101_4: "opacity-100 brightness-110 saturate-110",
  style102_5: "opacity-85 grayscale-[12%] brightness-[0.82] saturate-[0.95] group-hover:opacity-95",
  style106_6: "absolute inset-0 z-[1]",
  style106_7: "bg-[#07101F]/4",
  style106_8: "bg-[#07101F]/18",
  style109_9: "absolute inset-0 z-[2] bg-gradient-to-t",
  style111_10: "from-[#06101D]/78 via-[#06101D]/24 to-transparent",
  style112_11: "from-[#06101D]/95 via-[#06101D]/45 to-[#06101D]/8",
  style124_12: "absolute left-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#121A2D]/88 text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:scale-105 hover:border-[#14B8A6]/40",
  style128_13: "h-5 w-5 transition",
  style130_14: "fill-[#14B8A6] text-[#14B8A6] drop-shadow-[0_0_10px_rgba(20,184,166,0.9)]",
  style131_15: "text-white",
  style137_16: "absolute right-5 top-6 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#111827]/90 px-3 py-1.5 text-[10px] font-black text-[#14F5D5] shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-md",
  style138_17: "h-3 w-3 fill-orange-400 text-orange-400",
  style142_18: "relative z-10 mx-auto flex w-full max-w-[90%] flex-col items-center gap-3 pb-1 text-center",
  style143_19: "space-y-1.5",
  style144_20: "line-clamp-2 text-[15px] font-black leading-snug text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]",
  style147_21: "line-clamp-2 text-[11px] font-semibold leading-relaxed text-white/86 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]",
  style152_22: "inline-flex min-h-10 items-center justify-center rounded-2xl bg-[#14F5D5] px-6 py-2.5 text-[11px] font-black text-[#041315] shadow-[0_0_22px_rgba(20,245,213,0.42)] transition group-hover:bg-[#2FFFE5]",
} as const;


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
        styles.style87_1,
        isPlaceholder && styles.style88_2,
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
          styles.style99_3,
          isPlaceholder
            ? styles.style101_4
            : styles.style102_5
        )}
        referrerPolicy="no-referrer"
      />
      <div className={cn(styles.style106_6, isPlaceholder ? styles.style106_7 : styles.style106_8)} />
      <div
        className={cn(
          styles.style109_9,
          isPlaceholder
            ? styles.style111_10
            : styles.style112_11
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
          className={styles.style124_12}
        >
          <Heart
            className={cn(
              styles.style128_13,
              isHearted
                ? styles.style130_14
                : styles.style131_15
            )}
          />
        </button>
      )}

      <div className={styles.style137_16}>
        <Zap className={styles.style138_17} />
        <span>{resolvedBadgeText}</span>
      </div>

      <div className={styles.style142_18}>
        <div className={styles.style143_19}>
          <h3 className={styles.style144_20}>
            {title}
          </h3>
          <p className={styles.style147_21}>
            {description}
          </p>
        </div>

        <span className={styles.style152_22}>
          {actionText}
        </span>
      </div>
    </article>
  );
}
