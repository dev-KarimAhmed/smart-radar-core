'use client';

import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Phone, ShieldCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAdDescription, getAdImage, getAdTitle } from '../services/ad-card-helpers';
import { getAdMedia, PLACEHOLDER_BANNER_URL } from '../services/ad-media-helpers';

interface AdTakeoverModalProps {
  takeoverAd: any;
  onClose: () => void;
  copy: {
    trustedAd: string;
    nearbyBadge: string;
    riderBadge: string;
    captainBadge: string;
    emptyDescription: string;
    whatsapp: string;
    call: string;
    whatsappMessage: (title: string) => string;
  };
  direction: 'rtl' | 'ltr';
  language: 'ar' | 'en';
}

function getBadgeText(
  ad: any,
  copy: { riderBadge: string; captainBadge: string; nearbyBadge: string },
  language: 'ar' | 'en'
): string {
  if (language === 'en' && ad?.badgeTextEn) return ad.badgeTextEn;
  if (language === 'ar' && ad?.badgeText) return ad.badgeText;
  if (ad.adType === 'RIDER_BENEFIT') return copy.riderBadge;
  if (ad.adType === 'CAPTAIN_PROFESSIONAL') return copy.captainBadge;
  return copy.nearbyBadge;
}

export function AdTakeoverModal({
  takeoverAd,
  onClose,
  copy,
  direction,
  language,
}: AdTakeoverModalProps) {
  const adTitle = getAdTitle(takeoverAd, copy.nearbyBadge, language);
  const adDescription = getAdDescription(takeoverAd, copy.emptyDescription, language);
  const badge = getBadgeText(takeoverAd, copy, language);

  // Determine language direction for content dynamically based on text content & language setting
  const hasArabicChars = /[\u0600-\u06FF]/.test(`${adTitle} ${adDescription}`);
  const isContentArabic = language === 'ar' || hasArabicChars;
  const contentDir = isContentArabic ? 'rtl' : 'ltr';
  const contentAlign = isContentArabic ? 'text-right' : 'text-left';

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-end bg-black/85 p-0 backdrop-blur-sm md:p-4 md:justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-[32px] border-t-2 border-[#14B8A6]/40 bg-[#070D19] px-6 pt-6 pb-28 shadow-[0_-12px_45px_rgba(20,184,166,0.25)] md:rounded-[32px] md:border-x-2 md:p-6"
        dir={direction}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-1 h-1 w-12 rounded-full bg-[#14B8A6]/30" />

        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <span className="flex items-center gap-2 text-xs font-black text-[#14F5D5]">
            <ShieldCheck className="h-4 w-4 animate-pulse text-[#14F5D5]" />
            {copy.trustedAd}
          </span>

          <button
            type="button"
            aria-label="Close ad"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0B0F19]/90 text-white shadow-md transition hover:border-red-400/40 hover:bg-red-950/70 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <AdTakeoverMedia ad={takeoverAd} />

        <div dir={contentDir} className={cn('space-y-2', contentAlign)}>
          <span className="rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-2.5 py-1 text-[10px] font-black text-[#14F5D5]">
            {badge}
          </span>
          <h3 className="mt-2 text-xl font-black leading-tight text-white">
            {adTitle}
          </h3>
          <p className="pt-1 text-xs leading-relaxed text-gray-300">
            {adDescription}
          </p>
        </div>

        <div className="mt-1.5 flex flex-col gap-3">
          <a
            href={`https://wa.me/${takeoverAd.whatsapp || takeoverAd.advertiserData?.whatsapp || '962798888888'}?text=${encodeURIComponent(copy.whatsappMessage(adTitle))}`}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#00cc66]/50 bg-[#00cc66] p-3.5 text-xs font-black text-white shadow-[0_4px_15px_rgba(0,204,102,0.25)] transition hover:bg-[#00e271]"
          >
            <MessageCircle className="h-4 w-4 text-white" />
            {copy.whatsapp}
          </a>

          <a
            href={`tel:${takeoverAd.phone || takeoverAd.advertiserData?.phone || '0798888888'}`}
            onClick={(event) => event.stopPropagation()}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#14B8A6]/35 bg-[#131C31] p-3.5 text-xs font-black text-[#14F5D5] shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition hover:bg-[#14B8A6]/15"
          >
            <Phone className="h-4 w-4 text-[#14F5D5]" />
            {copy.call}
          </a>
        </div>
      </motion.div>
    </div>
  );
}

function AdTakeoverMedia({ ad }: { ad: any }) {
  const media = getAdMedia(ad);
  const title = getAdTitle(ad, 'Ad media');
  const fallbackImage = getAdImage(ad) || PLACEHOLDER_BANNER_URL;
  const isCaptainSectorAd = Boolean(
    ad?.isCaptainSectorAd ||
    ad?.adType === 'CAPTAIN_PROFESSIONAL' ||
    (typeof ad?.id === 'string' && ad.id.startsWith('captain-sector-ad-'))
  );

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#07101F] shadow-[0_18px_40px_rgba(0,0,0,0.35)] flex items-center justify-center p-0 mx-auto w-full max-w-[min(420px,100%)] max-h-[62vh]"
      style={isCaptainSectorAd ? { aspectRatio: '904 / 1280' } : undefined}
    >
      {media.kind === 'video' && media.url ? (
        <video
          className="aspect-video w-full bg-black object-cover"
          src={media.url}
          poster={media.posterUrl || fallbackImage}
          controls
          playsInline
          preload="metadata"
        />
      ) : (
        <img
          className="w-full h-full max-h-[62vh] object-contain mx-auto block bg-[#07101F]"
          src={media.url || fallbackImage}
          alt={title}
          style={isCaptainSectorAd ? { aspectRatio: '904 / 1280' } : undefined}
          onError={(event) => {
            if (ad?.fallbackImageUrl && event.currentTarget.src !== ad.fallbackImageUrl) {
              event.currentTarget.src = ad.fallbackImageUrl;
            } else {
              event.currentTarget.src = fallbackImage;
            }
          }}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
