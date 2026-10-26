'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Play,
  Pause,
  Heart,
  Clock,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  CAPTAIN_ADS_CONFIG,
  type AdDisplayMode,
  type RiverSpeed,
  type CaptainAdItem,
  fetchCaptainAds,
  getCaptainAds,
} from '@/features/captain/contract';
import { CaptainAdHeaderMenu } from '@/features/ads/contract';
import {
  fetchFavoriteCaptainIds,
  setFavoriteCaptain,
} from '@/features/account/contract';

const styles = {
  container: "relative w-full overflow-hidden rounded-3xl border border-[#00ffcc]/30 bg-gradient-to-b from-[#091224] via-[#050B17] to-[#02060F] p-4 sm:p-5 shadow-2xl shadow-black/50 select-none",
  topHeaderRow: "flex items-center justify-between border-b border-white/10 pb-3 mb-3 gap-2",
  titleBox: "flex items-center gap-2",
  titleIconBox: "flex h-7 w-7 items-center justify-center rounded-lg border border-[#00ffcc]/40 bg-[#00ffcc]/15 text-[#00ffcc] shadow-[0_0_10px_rgba(0,255,204,0.3)]",
  titleIcon: "h-4 w-4",
  titleText: "text-xs sm:text-sm font-black text-white",
  subtitleBadge: "text-[10px] font-mono font-bold text-[#00ffcc] bg-[#00ffcc]/10 border border-[#00ffcc]/20 rounded-md px-2 py-0.5 hidden sm:inline",
  headerControlsRow: "flex items-center gap-2",
  playPauseBtn: "flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 hover:bg-white/20 text-white transition active:scale-90 cursor-pointer shadow-sm",
  playPauseIcon: "h-3.5 w-3.5",
  heartBtn: "flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 hover:bg-rose-500/20 text-white transition active:scale-90 cursor-pointer shadow-sm",
  heartIconFavorited: "h-4 w-4 fill-rose-500 text-rose-500 transition-transform duration-300 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]",
  heartIconNormal: "h-4 w-4 text-slate-300 transition-colors duration-200 hover:text-rose-400",
  storyProgressContainer: "flex items-center justify-between gap-2.5 w-full mb-3",
  storyTracksWrapper: "flex items-center gap-1.5 flex-1",
  storyDurationBadge: "shrink-0 flex items-center gap-1 rounded-md border border-[#00ffcc]/30 bg-[#00ffcc]/10 px-2 py-0.5 text-[10px] font-black text-[#00ffcc] shadow-[0_0_8px_rgba(0,255,204,0.15)] select-none",
  durationClockIcon: "h-3 w-3 text-[#00ffcc]",
  storyProgressTrack: "relative h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden cursor-pointer",
  storyProgressBar: "h-full bg-gradient-to-r from-teal-400 to-[#00ffcc] rounded-full",
  storyProgressFilled: "h-full w-full bg-[#00ffcc] rounded-full",
  storyProgressUnfilled: "h-full w-0 bg-transparent",
  mainAdCard: "w-full max-w-md mx-auto rounded-2xl border border-[#00ffcc]/35 bg-[#081020] p-4 shadow-xl flex flex-col justify-between transition-all duration-300",
  seatBadgeRow: "flex items-center justify-between w-full mb-2.5",
  seatBadge: "font-mono text-[10px] font-black text-[#00ffcc] bg-[#00ffcc]/10 border border-[#00ffcc]/25 rounded-md px-2 py-0.5",
  counterBadge: "font-mono text-[10px] text-slate-400 bg-white/5 border border-white/10 rounded-md px-2 py-0.5",
  imageWrapper: "relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/80 mb-3 cursor-pointer group shadow-md",
  adImage: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
  navPrevBtn: "flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-[#00ffcc]/30 hover:border-[#00ffcc] text-white backdrop-blur-md shadow-md transition active:scale-90 cursor-pointer",
  navNextBtn: "flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-[#00ffcc]/30 hover:border-[#00ffcc] text-white backdrop-blur-md shadow-md transition active:scale-90 cursor-pointer",
  navIcon: "h-4 w-4",
  zoomOverlay: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 text-white pointer-events-none",
  zoomIcon: "h-5 w-5 drop-shadow-md text-[#00ffcc]",
  captionBlock: "text-right w-full bg-black/30 rounded-xl border border-white/5 p-3 flex flex-col justify-start space-y-1.5",
  captionText: "text-xs sm:text-sm font-semibold text-slate-200 leading-relaxed",
  seeMoreBtn: "inline-block text-[11px] font-black text-[#00ffcc] hover:text-[#00ffcc]/80 underline underline-offset-2 cursor-pointer transition select-none self-start",
  seeLessBtn: "inline-block text-[11px] font-black text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer transition select-none self-start",
  riverViewport: "captain-river-viewport-mask relative w-full overflow-hidden py-1",
  riverTrackAnimated: "captain-river-stream-track flex flex-nowrap min-w-max gap-2.5 sm:gap-3 py-1",
  cardContainerRiver: "w-[240px] sm:w-[260px] shrink-0 rounded-2xl border border-white/10 hover:border-[#00ffcc]/60 bg-[#081020]/90 p-3 shadow-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,204,0.2)] flex flex-col justify-between",
  activeDot: "flex h-2 w-2 relative",
  activeDotPing: "animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75",
  activeDotCore: "relative inline-flex rounded-full h-2 w-2 bg-[#00ffcc]",
  imageClickArea: "h-full w-full",
  lightboxOverlay: "fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200",
  lightboxContent: "relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-3xl border border-[#00ffcc]/40 bg-[#070D19] shadow-2xl text-right",
  lightboxHeader: "flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-black/40",
  lightboxTitle: "text-xs font-black text-white flex items-center gap-1.5",
  lightboxTitleIcon: "h-4 w-4 text-[#00ffcc]",
  lightboxCloseBtn: "rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer",
  lightboxCloseIcon: "h-5 w-5",
  lightboxBody: "relative flex max-h-[65vh] items-center justify-center overflow-auto bg-black p-3",
  lightboxImage: "max-h-[60vh] w-auto rounded-xl object-contain shadow-2xl",
  lightboxFooter: "border-t border-white/10 p-4 bg-black/40 text-xs text-slate-200 space-y-1.5",
  lightboxCaptionText: "font-bold text-white text-sm",
} as const;

export interface CaptainTripAdsViewerProps {
  captainId: string;
  isArabic?: boolean;
}

export function CaptainTripAdsViewer({ captainId, isArabic = true }: CaptainTripAdsViewerProps) {
  const t = useTranslations('captainAds');
  // تحميل فوري مباشر من الذاكرة المحلية حتى تظهر الإعلانات بصفر تأخير
  const [ads, setAds] = useState<CaptainAdItem[]>(() => {
    if (typeof window !== 'undefined' && captainId) {
      const cached = getCaptainAds(captainId);
      const active = cached.filter((a) => a.status === 'ACTIVE');
      return active.length > 0 ? active : cached;
    }
    return [];
  });
  const [displayMode, setDisplayMode] = useState<AdDisplayMode>(CAPTAIN_ADS_CONFIG.DEFAULT_DISPLAY_MODE);
  const [speed, setSpeed] = useState<RiverSpeed>(CAPTAIN_ADS_CONFIG.DEFAULT_SPEED);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeAdIndex, setActiveAdIndex] = useState<number>(0);
  const [storyProgress, setStoryProgress] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isHeartLoading, setIsHeartLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [lightboxAd, setLightboxAd] = useState<CaptainAdItem | null>(null);
  const [expandedAdIds, setExpandedAdIds] = useState<Set<string>>(new Set());

  // مرجع لتوقيت شريط التقدم 6 ثواني
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const storyProgressRef = useRef<number>(0);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const storyDurationMs = CAPTAIN_ADS_CONFIG.STORY_DURATION_SECONDS * 1000;
  const tickIntervalMs = 50;

  // تحميل الإعلانات للكابتن المقبول من الباك إند وتحديث العرض
  const loadAds = useCallback(async () => {
    const list = await fetchCaptainAds(captainId);
    if (list && list.length > 0) {
      const activeAds = list.filter((a) => a.status === 'ACTIVE');
      setAds(activeAds.length > 0 ? activeAds : list);
    }
  }, [captainId]);

  // فحص حالة تفضيل الكابتن الحالي
  const checkFavoriteStatus = useCallback(async () => {
    try {
      const favIds = await fetchFavoriteCaptainIds();
      setIsFavorite(favIds.has(captainId));
    } catch {
      // Ignored
    }
  }, [captainId]);

  // التحميل المسبق لجميع صور الإعلانات لتنقل فوري 0ms بدون وميض أو تأخير
  useEffect(() => {
    if (ads.length > 0) {
      ads.forEach((ad) => {
        if (ad.imageUrl) {
          const img = new Image();
          img.src = ad.imageUrl;
        }
      });
    }
  }, [ads]);

  useEffect(() => {
    setMounted(true);
    void loadAds();
    void checkFavoriteStatus();

    try {
      const savedMode = localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.DISPLAY_MODE) as AdDisplayMode;
      if (savedMode === 'jump' || savedMode === 'river') setDisplayMode(savedMode);

      const savedSpeed = localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.STREAM_SPEED) as RiverSpeed;
      if (savedSpeed && (savedSpeed === 'slow' || savedSpeed === 'normal' || savedSpeed === 'fast')) {
        setSpeed(savedSpeed);
      }

      const savedPaused = localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.IS_PAUSED);
      if (savedPaused !== null) setIsPaused(savedPaused === 'true');
    } catch {
      // Ignored
    }

    const onMode = () => {
      const mode = (localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.DISPLAY_MODE) as AdDisplayMode) || 'jump';
      setDisplayMode(mode);
    };

    const onSpeed = () => {
      const sp = (localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.STREAM_SPEED) as RiverSpeed) || 'normal';
      setSpeed(sp);
    };

    const onPause = (e: any) => {
      if (e?.detail?.isPaused !== undefined) {
        setIsPaused(Boolean(e.detail.isPaused));
      }
    };

    const onAdsUpdated = (e: any) => {
      if (!e?.detail?.captainId || e.detail.captainId === captainId) {
        void loadAds();
      }
    };

    const onFavUpdated = (e: any) => {
      if (!e?.detail?.captainId || e.detail.captainId === captainId) {
        if (typeof e.detail?.isFavorite === 'boolean') {
          setIsFavorite(e.detail.isFavorite);
        } else {
          void checkFavoriteStatus();
        }
      }
    };

    window.addEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.DISPLAY_MODE_CHANGED, onMode);
    window.addEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.STREAM_SPEED_CHANGED, onSpeed);
    window.addEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.PAUSE_CHANGED, onPause);
    window.addEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.ADS_UPDATED, onAdsUpdated);
    window.addEventListener('rider-favorites-updated', onFavUpdated);

    return () => {
      window.removeEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.DISPLAY_MODE_CHANGED, onMode);
      window.removeEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.STREAM_SPEED_CHANGED, onSpeed);
      window.removeEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.PAUSE_CHANGED, onPause);
      window.removeEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.ADS_UPDATED, onAdsUpdated);
      window.removeEventListener('rider-favorites-updated', onFavUpdated);
    };
  }, [captainId, loadAds, checkFavoriteStatus]);

  // إدارة شريط التقدم 6 ثواني والانتقال الفوري المباشر للإعلان التالي
  useEffect(() => {
    if (ads.length === 0 || isPaused) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      return;
    }

    const durationMs = storyDurationMs;
    const initialProgress = storyProgressRef.current;
    const remainingRatio = Math.max(0, 1 - initialProgress / 100);
    const startTimestamp = Date.now();
    const durationRemainingMs = durationMs * remainingRatio;

    if (durationRemainingMs <= 0) {
      storyProgressRef.current = 0;
      setStoryProgress(0);
      setActiveAdIndex((prev) => (prev + 1) % ads.length);
      setCycleCount((c) => c + 1);
      return;
    }

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimestamp;
      const addedProgress = (elapsed / durationMs) * 100;
      const current = Math.min(100, initialProgress + addedProgress);

      if (current >= 100 || elapsed >= durationRemainingMs) {
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
        // الانتقال الفوري للإعلان التالي وتصفير البار في نفس اللحظة
        storyProgressRef.current = 0;
        setStoryProgress(0);
        setActiveAdIndex((prev) => (prev + 1) % ads.length);
        setCycleCount((c) => c + 1);
      } else {
        storyProgressRef.current = current;
        setStoryProgress(current);
      }
    }, tickIntervalMs);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [ads.length, activeAdIndex, cycleCount, isPaused, storyDurationMs, tickIntervalMs]);

  // تبديل زر التشغيل / الإيقاف المؤقت كالفيديو
  const handleTogglePlayPause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    try {
      localStorage.setItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.IS_PAUSED, String(nextPaused));
      window.dispatchEvent(
        new CustomEvent(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.PAUSE_CHANGED, {
          detail: { isPaused: nextPaused },
        }),
      );
    } catch {
      // Ignored
    }
  };

  // تبديل إضافة الكابتن إلى المفضلة مع تلوين القلب
  const handleToggleFavorite = async () => {
    if (isHeartLoading) return;
    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);
    setIsHeartLoading(true);

    try {
      await setFavoriteCaptain(captainId, nextFavorite);
    } catch {
      setIsFavorite(!nextFavorite);
    } finally {
      setIsHeartLoading(false);
    }
  };

  // الانتقال اليدوي للأمام أو الخلف مع إعادة التصفير الفوري
  const handleNextAd = () => {
    if (ads.length <= 1) return;
    storyProgressRef.current = 0;
    setStoryProgress(0);
    setActiveAdIndex((prev) => (prev + 1) % ads.length);
    setCycleCount((c) => c + 1);
  };

  const handlePrevAd = () => {
    if (ads.length <= 1) return;
    storyProgressRef.current = 0;
    setStoryProgress(0);
    setActiveAdIndex((prev) => (prev - 1 + ads.length) % ads.length);
    setCycleCount((c) => c + 1);
  };

  const handleJumpToAd = (index: number) => {
    storyProgressRef.current = 0;
    setStoryProgress(0);
    setActiveAdIndex(index);
    setCycleCount((c) => c + 1);
  };

  // تبديل إظهار / إخفاء تفاصيل النص الطويل
  const toggleExpandCaption = (adId: string) => {
    setExpandedAdIds((prev) => {
      const next = new Set(prev);
      if (next.has(adId)) {
        next.delete(adId);
      } else {
        next.add(adId);
      }
      return next;
    });
  };

  // مدة الحركة للنهر
  const riverDurationSeconds = CAPTAIN_ADS_CONFIG.SPEED_DURATIONS[speed] || CAPTAIN_ADS_CONFIG.SPEED_DURATIONS.normal;

  const riverAds = useMemo(() => {
    if (ads.length === 0) return [];
    // نضمن أن نصف المسار (المجموعة الأولى) يغطي أي شاشة فائقة العرض (10 كروت على الأقل)
    // حتى يختفي الإعلان ويظهر الذي بعده فوراً وبدون أي مساحة بيضاء أو فراغ بين الإعلانات
    const targetSetSize = 10;
    const repeatCount = Math.max(1, Math.ceil(targetSetSize / ads.length));
    const setA: CaptainAdItem[] = [];
    for (let r = 0; r < repeatCount; r++) {
      setA.push(...ads);
    }
    // مسار النهر الكامل يتكون من نسختين متطابقتين تماماً لتحقيق حلقة لانهائية سلسة بنسبة 100%
    return [...setA, ...setA];
  }, [ads]);

  if (ads.length === 0) {
    return null;
  }

  const currentAd = ads[activeAdIndex] || ads[0];
  const isExpanded = currentAd ? expandedAdIds.has(currentAd.id) : false;
  const caption = currentAd?.caption || '';
  const shouldTruncate = caption.length > CAPTAIN_ADS_CONFIG.RIDER_CAPTION_PREVIEW_LIMIT;
  const displayText = isExpanded || !shouldTruncate
    ? caption
    : `${caption.slice(0, CAPTAIN_ADS_CONFIG.RIDER_CAPTION_PREVIEW_LIMIT)}...`;

  return (
    <div className={styles.container} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* الـ Keyframes للحركة بكرت الشاشة مباشرة في وضع النهر */}
      <style>{`
        @keyframes captainAdRiverFlow {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .captain-river-stream-track {
          animation: captainAdRiverFlow ${riverDurationSeconds}s linear infinite;
          will-change: transform;
        }
        .captain-river-stream-track:hover {
          animation-play-state: paused;
        }
        .captain-river-viewport-mask {
          mask-image: linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%);
        }
      `}</style>

      {/* الترويسة الرئيسية مع أزرار التحكم: تشغيل/إيقاف الفيديو، والمفضلة، والقائمة */}
      <div className={styles.topHeaderRow}>
        <div className={styles.titleBox}>
          <div className={styles.titleIconBox}>
            <Sparkles className={styles.titleIcon} />
          </div>
          <div>
            <span className={styles.titleText}>
              {t('title')}
            </span>
          </div>
          {/* <span className={styles.subtitleBadge}>
            {isArabic ? 'تختفي عند بدء الرحلة' : 'Until Trip Starts'}
          </span> */}
        </div>

        <div className={styles.headerControlsRow}>
          {/* زر تشغيل / إيقاف مؤقت زي كأنه فيديو */}
          <button
            type="button"
            onClick={handleTogglePlayPause}
            className={styles.playPauseBtn}
            title={isPaused ? t('play') : t('pauseFlow')}
            aria-label={isPaused ? 'Play' : 'Pause'}
          >
            {isPaused ? (
              <Play className={styles.playPauseIcon} />
            ) : (
              <Pause className={styles.playPauseIcon} />
            )}
          </button>

          {/* قلب إضافة المفضلة: يتلون عند الضغط ويوضع الكابتن في المفضلة */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={isHeartLoading}
            className={styles.heartBtn}
            title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
            aria-label="Favorite Captain"
          >
            <Heart className={isFavorite ? styles.heartIconFavorited : styles.heartIconNormal} />
          </button>

          {/* قائمة إعدادات العرض (السرعة، النمط) */}
          <CaptainAdHeaderMenu isArabic={isArabic} />
        </div>
      </div>

      {/* نمط العرض الأساسي: شريط التقدم 6 ثواني مع الصورة والنص */}
      {displayMode !== 'river' && currentAd && (
        <div className={styles.mainAdCard}>
          {/* شريط تقدم منفصل لكل إعلان: ينتهي ليبدأ الإعلان التالي ببار جديد كلياً */}
          <div className={styles.storyProgressContainer}>
            <div className={styles.storyTracksWrapper}>
              <div
                key={`ad-progress-${currentAd.id}-${activeAdIndex}`}
                className={styles.storyProgressTrack}
                onClick={handleNextAd}
                role="progressbar"
                aria-valuenow={Math.round(storyProgress)}
                aria-valuemin={0}
                aria-valuemax={100}
                title={isArabic ? 'اضغط للانتقال للإعلان التالي' : 'Click for next ad'}
              >
                <div
                  className={styles.storyProgressBar}
                  style={{
                    width: `${storyProgress}%`,
                    transition: storyProgress === 0 ? 'none' : 'width 50ms linear',
                  }}
                />
              </div>
            </div>
            <span className={styles.storyDurationBadge}>
              <Clock className={styles.durationClockIcon} />
              <span>{t('storyDuration')}</span>
            </span>
          </div>

          {/* شريط معلومات الإعلان بدون أي ترقيم */}
          <div className="flex items-center justify-between w-full mb-2.5">
            <span className={styles.seatBadge}>
              {t('promotionalAd')}
            </span>
          </div>

          {/* الصورة في المنتصف نظيفة بالكامل بدون أسهم تحجب الأرقام أو النصوص */}
          <div className={styles.imageWrapper}>
            <div
              className={styles.imageClickArea}
              onClick={() => setLightboxAd(currentAd)}
              role="button"
              tabIndex={0}
              title={t('clickToEnlarge')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentAd.imageUrl}
                alt={caption || 'Ad Image'}
                className={styles.adImage}
              />
              <div className={styles.zoomOverlay}>
                <Maximize2 className={styles.zoomIcon} />
              </div>
            </div>
          </div>

          {/* النص أسفل الصورة مع زر "عرض المزيد" لفتح البوبب بتفاصيل الصورة والكلام */}
          {caption ? (
            <div className={styles.captionBlock}>
              <p className={styles.captionText}>{displayText}</p>
              <button
                type="button"
                onClick={() => setLightboxAd(currentAd)}
                className={styles.seeMoreBtn}
              >
                {t('viewMore')}
              </button>
            </div>
          ) : null}

          {/* أزرار التنقل بالأسهم في الأسفل بدون أي ترقيم */}
          {ads.length > 1 && (
            <div className="flex items-center justify-between w-full pt-3 mt-2 border-t border-white/10 select-none">
              <button
                type="button"
                onClick={handlePrevAd}
                className={styles.navPrevBtn}
                title={t('prevAd')}
                aria-label="Previous Ad"
              >
                <ChevronRight className={styles.navIcon} />
              </button>

              <div className="flex items-center gap-1.5">
                {ads.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeAdIndex ? 'w-5 bg-[#00ffcc]' : 'w-1.5 bg-white/20'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNextAd}
                className={styles.navNextBtn}
                title={t('nextAd')}
                aria-label="Next Ad"
              >
                <ChevronLeft className={styles.navIcon} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* نمط العرض البديل: نهر الإعلانات المتدفق (River Marquee) في حال اختياره من القائمة */}
      {displayMode === 'river' && (
        <div className={styles.riverViewport} dir="ltr">
          <div
            className={styles.riverTrackAnimated}
            style={{
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {riverAds.map((ad, idx) => {
              const uniqueKey = `${ad.id}-${idx}`;
              const isAdExpanded = expandedAdIds.has(ad.id);
              const adCaption = ad.caption || '';
              const isTruncated = adCaption.length > CAPTAIN_ADS_CONFIG.RIDER_CAPTION_PREVIEW_LIMIT;
              const adDisplayText = isAdExpanded || !isTruncated
                ? adCaption
                : `${adCaption.slice(0, CAPTAIN_ADS_CONFIG.RIDER_CAPTION_PREVIEW_LIMIT)}...`;

              return (
                <div key={uniqueKey} className={styles.cardContainerRiver} dir={isArabic ? 'rtl' : 'ltr'}>
                  <div>
                    <div className="flex items-center justify-end w-full mb-2">
                      <span className={styles.activeDot}>
                        <span className={styles.activeDotPing} />
                        <span className={styles.activeDotCore} />
                      </span>
                    </div>

                    <div
                      className={styles.imageWrapper}
                      onClick={() => setLightboxAd(ad)}
                      role="button"
                      tabIndex={0}
                      title={t('clickToEnlarge')}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ad.imageUrl} alt={adCaption || 'Ad'} className={styles.adImage} />
                      <div className={styles.zoomOverlay}>
                        <Maximize2 className={styles.zoomIcon} />
                      </div>
                    </div>
                  </div>

                  {adCaption ? (
                    <div className={styles.captionBlock}>
                      <p className={styles.captionText}>{adDisplayText}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxAd(ad);
                        }}
                        className={styles.seeMoreBtn}
                      >
                        {t('viewMore')}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* نافذة التكبير الكامل (Lightbox) عند النقر على أي إعلان خارج البوكس بالكامل */}
      {mounted && lightboxAd
        ? createPortal(
          <div
            className={styles.lightboxOverlay}
            onClick={() => setLightboxAd(null)}
            role="dialog"
            aria-modal="true"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.lightboxHeader}>
                <span className={styles.lightboxTitle}>
                  <Sparkles className={styles.lightboxTitleIcon} />
                  <span>{t('promotionalAd')}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxAd(null)}
                  className={styles.lightboxCloseBtn}
                  title={t('close')}
                  aria-label="Close"
                >
                  <X className={styles.lightboxCloseIcon} />
                </button>
              </div>

              <div className={styles.lightboxBody}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightboxAd.imageUrl}
                  alt={lightboxAd.caption || 'Enlarged Ad'}
                  className={styles.lightboxImage}
                />
              </div>

              {lightboxAd.caption ? (
                <div className={styles.lightboxFooter}>
                  <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed whitespace-pre-wrap select-text">
                    {lightboxAd.caption}
                  </p>
                </div>
              ) : null}
            </div>
          </div>,
          document.body,
        )
        : null}
    </div>
  );
}
