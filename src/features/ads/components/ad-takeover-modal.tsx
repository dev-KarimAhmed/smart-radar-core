'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Heart, MessageCircle, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAdDescription, getAdImage, getAdTitle } from './ad-display-card';
import { styles, type AdStageCopy, getBadgeText } from './ad-stage-styles';
import { getAdMedia, PLACEHOLDER_BANNER_URL } from '../services/ad-stage-media';

export function AdTakeoverMedia({ ad }: { ad: any }) {
  const media = getAdMedia(ad, getAdImage);
  const title = getAdTitle(ad, 'Ad media');
  const fallbackImage = getAdImage(ad) || PLACEHOLDER_BANNER_URL;

  return (
    <div className={styles.style629_58}>
      {media.kind === 'video' && media.url ? (
        <video
          className={styles.style632_59}
          src={media.url}
          poster={media.posterUrl || fallbackImage}
          controls
          playsInline
          preload="metadata"
          onClick={(event) => event.stopPropagation()}
        />
      ) : (
        <img
          src={media.url || fallbackImage}
          alt={title}
          className={styles.style644_60}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.src = PLACEHOLDER_BANNER_URL;
          }}
        />
      )}
    </div>
  );
}

interface AdTakeoverModalProps {
  takeoverAd: any | null;
  onClose: () => void;
  isHearted: boolean;
  onToggleHeart: (event: React.MouseEvent, ad: any) => void;
  copy: AdStageCopy;
  direction: 'rtl' | 'ltr';
  isArabic: boolean;
  tAuto: (key: string) => string;
}

export function AdTakeoverModal({
  takeoverAd,
  onClose,
  isHearted,
  onToggleHeart,
  copy,
  direction,
  isArabic,
  tAuto,
}: AdTakeoverModalProps) {
  return (
    <AnimatePresence>
      {takeoverAd && (
        <div className={styles.style518_32} onClick={onClose}>
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={styles.style526_33}
            dir={direction}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close ad"
              onClick={onClose}
              className={styles.style534_34}
            >
              <X className={styles.style536_35} />
            </button>

            <div className={styles.style539_36} />

            <div className={styles.style541_37}>
              <span className={styles.style542_38}>
                <ShieldCheck className={styles.style543_39} />
                {copy.trustedAd}
              </span>
              {!takeoverAd.isPlaceholder ? (
                <button
                  type="button"
                  onClick={(event) => onToggleHeart(event, takeoverAd)}
                  className={cn(
                    styles.style551_40,
                    isHearted ? styles.style553_41 : styles.style554_42
                  )}
                  aria-pressed={isHearted}
                >
                  <Heart
                    className={cn(
                      styles.style560_43,
                      isHearted && styles.style561_44
                    )}
                  />
                  {isHearted
                    ? (copy as any).removeFavorite || (isArabic ? tAuto('key_446a5f99') : 'Remove favorite')
                    : (copy as any).favorite || (isArabic ? tAuto('key_9ddc8cd6') : 'Favorite')}
                </button>
              ) : null}
            </div>

            <AdTakeoverMedia ad={takeoverAd} />

            <div className={cn(styles.style573_45, isArabic ? styles.style573_46 : styles.style573_47)}>
              <span className={styles.style574_48}>{getBadgeText(takeoverAd, copy)}</span>
              <h3 className={styles.style577_49}>{getAdTitle(takeoverAd, copy.nearbyBadge)}</h3>
              <p className={styles.style580_50}>{getAdDescription(takeoverAd, copy.emptyDescription)}</p>
            </div>

            <div className={styles.style585_51}>
              <a
                href={`https://wa.me/${
                  takeoverAd.whatsapp || takeoverAd.advertiserData?.whatsapp || '962798888888'
                }?text=${encodeURIComponent(
                  copy.whatsappMessage(getAdTitle(takeoverAd, copy.nearbyBadge))
                )}`}
                target="_blank"
                onClick={(event) => event.stopPropagation()}
                className={styles.style590_52}
              >
                <MessageCircle className={styles.style592_53} />
                {copy.whatsapp}
              </a>

              <a
                href={`tel:${takeoverAd.phone || takeoverAd.advertiserData?.phone || '0798888888'}`}
                onClick={(event) => event.stopPropagation()}
                className={styles.style599_54}
              >
                <Phone className={styles.style601_55} />
                {copy.call}
              </a>

              <a
                href={takeoverAd.geoLoc || 'https://www.openstreetmap.org/'}
                target="_blank"
                onClick={(event) => event.stopPropagation()}
                className={styles.style609_56}
              >
                <MapPin className={styles.style611_57} />
                {copy.openLocation}
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
