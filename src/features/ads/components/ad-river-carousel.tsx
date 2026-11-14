'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdDisplayCard } from './ad-display-card';
import { enqueueAdEvent, getVisibleAdForMetric } from '../services/ad-stage-metrics';
import {
  calculateNextScrollStep,
  getScrollButtonState,
} from '../services/ad-stage-scroll';

interface AdRiverCarouselProps {
  adsToUse: any[];
  displayAds: any[];
  cardClassName?: string;
  heartedAdIds: string[];
  toggleHeart: (event: React.MouseEvent, ad: any) => void;
  openTakeover: (event: React.MouseEvent, ad: any) => void;
  getBadgeText: (ad: any) => string;
  showNavigationShell: boolean;
  copy: {
    previous: string;
    next: string;
  };
  adStageDirection: 'rtl' | 'ltr';
  isFullScreen?: boolean;
  isTakeoverOpen: boolean;
}

export function AdRiverCarousel({
  adsToUse,
  displayAds,
  cardClassName,
  heartedAdIds,
  toggleHeart,
  openTakeover,
  getBadgeText,
  showNavigationShell,
  copy,
  adStageDirection,
  isFullScreen = false,
  isTakeoverOpen,
}: AdRiverCarouselProps) {
  const prefersReducedMotion = useReducedMotion();
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const isAdStreamPausedRef = useRef(false);
  const touchResumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastManualSwipeMetricAtRef = useRef(0);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const setAdStreamPaused = useCallback((paused: boolean) => {
    isAdStreamPausedRef.current = paused;
  }, []);

  const updateScrollButtons = useCallback(() => {
    const track = scrollTrackRef.current;
    if (!track) return;
    const state = getScrollButtonState(
      track.scrollLeft,
      track.scrollWidth,
      track.clientWidth,
      adStageDirection,
    );
    setCanScrollLeft(state.canScrollLeft);
    setCanScrollRight(state.canScrollRight);
  }, [adStageDirection]);

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [updateScrollButtons, adsToUse.length]);

  const handleTouchStart = useCallback(() => {
    if (touchResumeTimerRef.current) clearTimeout(touchResumeTimerRef.current);
    setAdStreamPaused(true);
    touchResumeTimerRef.current = setTimeout(() => setAdStreamPaused(false), 2000);
  }, [setAdStreamPaused]);

  const handleTouchEnd = useCallback(() => {
    if (touchResumeTimerRef.current) clearTimeout(touchResumeTimerRef.current);
    touchResumeTimerRef.current = setTimeout(() => setAdStreamPaused(false), 600);
  }, [setAdStreamPaused]);

  const handleMouseEnter = useCallback(() => {
    if (touchResumeTimerRef.current) clearTimeout(touchResumeTimerRef.current);
    setAdStreamPaused(true);
  }, [setAdStreamPaused]);

  const handleMouseLeave = useCallback(() => {
    if (touchResumeTimerRef.current) clearTimeout(touchResumeTimerRef.current);
    setAdStreamPaused(false);
  }, [setAdStreamPaused]);

  useEffect(() => {
    return () => {
      if (touchResumeTimerRef.current) clearTimeout(touchResumeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (adsToUse.length <= 1 || prefersReducedMotion) return;

    let animFrameId: number;
    let lastTimestamp = performance.now();

    const animateScroll = (currentTimestamp: number) => {
      const deltaSeconds = Math.min((currentTimestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = currentTimestamp;

      const track = scrollTrackRef.current;
      if (track && !isAdStreamPausedRef.current && !isTakeoverOpen && document.visibilityState === 'visible') {
        const speed = 25;
        const deltaPixels = speed * deltaSeconds;
        const maxScroll = track.scrollWidth - track.clientWidth;

        if (maxScroll > 0) {
          const repeatMultiplier = adsToUse.length < 4 ? 3 : 2;
          const singleSetWidth = track.scrollWidth / repeatMultiplier;
          track.scrollLeft = calculateNextScrollStep(
            track.scrollLeft,
            deltaPixels,
            singleSetWidth,
            adStageDirection,
          );
        }
      }

      animFrameId = requestAnimationFrame(animateScroll);
    };

    animFrameId = requestAnimationFrame(animateScroll);
    return () => cancelAnimationFrame(animFrameId);
  }, [adsToUse.length, adStageDirection, prefersReducedMotion, isTakeoverOpen]);

  const scrollAds = useCallback(
    (scrollDirection: 'left' | 'right') => {
      const track = scrollTrackRef.current;
      if (!track || adsToUse.length <= 1) return;

      setAdStreamPaused(true);
      if (touchResumeTimerRef.current) clearTimeout(touchResumeTimerRef.current);
      touchResumeTimerRef.current = setTimeout(() => setAdStreamPaused(false), 400);

      lastManualSwipeMetricAtRef.current = Date.now();
      enqueueAdEvent(getVisibleAdForMetric(track, adsToUse), 'swipe');

      const distance = Math.max(240, Math.min(track.clientWidth * 0.82, 520));
      const delta = scrollDirection === 'left' ? -distance : distance;
      track.scrollBy({ left: delta, behavior: 'smooth' });
    },
    [adsToUse, setAdStreamPaused],
  );

  const registerManualTrackScroll = useCallback(() => {
    const track = scrollTrackRef.current;
    if (!track || !isAdStreamPausedRef.current || adsToUse.length <= 1) return;

    const now = Date.now();
    if (now - lastManualSwipeMetricAtRef.current < 1200) return;

    lastManualSwipeMetricAtRef.current = now;
    enqueueAdEvent(getVisibleAdForMetric(track, adsToUse), 'swipe');
  }, [adsToUse]);

  return (
    <div
      className={cn(
        'group/river relative flex min-h-0 w-full flex-1 items-center justify-center pt-0 overflow-hidden',
        isFullScreen && 'py-0 sm:py-0 h-full',
      )}
      dir={adStageDirection}
    >
      {showNavigationShell && (
        <>
          <button
            type="button"
            aria-label={copy.previous}
            disabled={!canScrollLeft}
            onClick={() => scrollAds('left')}
            className={cn(
              'absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0F19]/88 text-white shadow-xl shadow-black/35 backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/45 sm:left-4',
              canScrollLeft ? 'hover:border-[#14B8A6]/45 hover:bg-[#14B8A6]/15' : 'cursor-not-allowed opacity-35',
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label={copy.next}
            disabled={!canScrollRight}
            onClick={() => scrollAds('right')}
            className={cn(
              'absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0F19]/88 text-white shadow-xl shadow-black/35 backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/45 sm:right-4',
              canScrollRight ? 'hover:border-[#14B8A6]/45 hover:bg-[#14B8A6]/15' : 'cursor-not-allowed opacity-35',
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div
        ref={scrollTrackRef}
        onScroll={registerManualTrackScroll}
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        className={cn(
          'no-scrollbar flex min-w-0 flex-1 flex-nowrap gap-6 sm:gap-8 overflow-x-auto items-center h-full',
          adsToUse.length === 1 ? 'justify-center px-6 sm:px-16' : 'px-14 lg:justify-center',
        )}
      >
        {displayAds.map((ad: any, index: number) => (
          <div
            key={`${ad.id}-${index}`}
            className="flex-shrink-0 flex-grow-0 my-auto h-full flex items-center justify-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <AdDisplayCard
              ad={ad}
              isHearted={heartedAdIds.includes(ad.id)}
              onHeart={toggleHeart}
              onOpen={ad.isPlaceholder ? undefined : openTakeover}
              badgeText={getBadgeText(ad)}
              showHeart={!ad.isPlaceholder}
              className={cardClassName}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
