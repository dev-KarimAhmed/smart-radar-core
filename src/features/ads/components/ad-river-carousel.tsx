'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { AdDisplayCard } from './ad-display-card';
import { AdCarouselNavButtons } from './ad-carousel-nav-buttons';
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
  copy: { previous: string; next: string };
  adStageDirection: 'rtl' | 'ltr';
  isFullScreen?: boolean;
  isTakeoverOpen: boolean;
}

export function AdRiverCarousel({
  adsToUse, displayAds, cardClassName, heartedAdIds,
  toggleHeart, openTakeover, getBadgeText, showNavigationShell,
  copy, adStageDirection, isFullScreen = false, isTakeoverOpen,
}: AdRiverCarouselProps) {
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const scrollAccumulatorRef = useRef<number | null>(null);
  const isHoveredRef = useRef(false);
  const isInteractingRef = useRef(false);
  const touchResumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastManualSwipeMetricAtRef = useRef(0);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  const handleMouseEnter = useCallback(() => {
    isHoveredRef.current = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false;
    if (scrollTrackRef.current) {
      scrollAccumulatorRef.current = scrollTrackRef.current.scrollLeft;
    }
  }, []);

  const handleTouchStart = useCallback(() => {
    if (touchResumeTimerRef.current) clearTimeout(touchResumeTimerRef.current);
    isInteractingRef.current = true;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchResumeTimerRef.current) clearTimeout(touchResumeTimerRef.current);
    touchResumeTimerRef.current = setTimeout(() => {
      if (scrollTrackRef.current) {
        scrollAccumulatorRef.current = scrollTrackRef.current.scrollLeft;
      }
      isInteractingRef.current = false;
    }, 500);
  }, []);

  useEffect(() => {
    return () => {
      if (touchResumeTimerRef.current) clearTimeout(touchResumeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isTakeoverOpen && scrollTrackRef.current) {
      scrollAccumulatorRef.current = scrollTrackRef.current.scrollLeft;
    }
  }, [isTakeoverOpen]);

  useEffect(() => {
    if (adsToUse.length <= 1) return;

    let animFrameId: number;
    let lastTimestamp = performance.now();

    const animateScroll = (currentTimestamp: number) => {
      const deltaSeconds = Math.min((currentTimestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = currentTimestamp;

      const track = scrollTrackRef.current;
      if (
        track &&
        !isHoveredRef.current &&
        !isInteractingRef.current &&
        !isTakeoverOpen &&
        document.visibilityState === 'visible'
      ) {
        const speed = 30;
        const deltaPixels = speed * deltaSeconds;
        const maxScroll = track.scrollWidth - track.clientWidth;

        if (maxScroll > 0) {
          if (scrollAccumulatorRef.current === null) {
            scrollAccumulatorRef.current = track.scrollLeft;
          }

          const repeatMultiplier = adsToUse.length < 4 ? 3 : 2;
          const singleSetWidth = track.scrollWidth / repeatMultiplier;
          const nextScroll = calculateNextScrollStep(
            scrollAccumulatorRef.current,
            deltaPixels,
            singleSetWidth,
            adStageDirection,
          );

          scrollAccumulatorRef.current = nextScroll;
          track.scrollLeft = nextScroll;
        }
      }

      animFrameId = requestAnimationFrame(animateScroll);
    };

    animFrameId = requestAnimationFrame(animateScroll);
    return () => cancelAnimationFrame(animFrameId);
  }, [adsToUse.length, adStageDirection, isTakeoverOpen]);

  const scrollAds = useCallback(
    (scrollDirection: 'left' | 'right') => {
      const track = scrollTrackRef.current;
      if (!track || adsToUse.length <= 1) return;

      isInteractingRef.current = true;
      if (touchResumeTimerRef.current) clearTimeout(touchResumeTimerRef.current);
      touchResumeTimerRef.current = setTimeout(() => {
        if (scrollTrackRef.current) {
          scrollAccumulatorRef.current = scrollTrackRef.current.scrollLeft;
        }
        isInteractingRef.current = false;
      }, 500);

      lastManualSwipeMetricAtRef.current = Date.now();
      enqueueAdEvent(getVisibleAdForMetric(track, adsToUse), 'swipe');

      const distance = Math.max(220, Math.min(track.clientWidth * 0.8, 480));
      const delta = scrollDirection === 'left' ? -distance : distance;
      track.scrollBy({ left: delta, behavior: 'smooth' });
    },
    [adsToUse],
  );

  const registerManualTrackScroll = useCallback(() => {
    const track = scrollTrackRef.current;
    if (!track || adsToUse.length <= 1) return;

    if (isInteractingRef.current) {
      scrollAccumulatorRef.current = track.scrollLeft;
    }
    updateScrollButtons();

    const now = Date.now();
    if (now - lastManualSwipeMetricAtRef.current < 1200) return;

    lastManualSwipeMetricAtRef.current = now;
    enqueueAdEvent(getVisibleAdForMetric(track, adsToUse), 'swipe');
  }, [adsToUse, updateScrollButtons]);

  return (
    <div
      className={cn(
        'group/river relative flex min-h-0 w-full flex-1 items-center justify-center pt-0 overflow-hidden',
        isFullScreen && 'py-0 sm:py-0 h-full',
      )}
      dir={adStageDirection}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showNavigationShell && (
        <AdCarouselNavButtons
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScroll={scrollAds}
          copy={copy}
        />
      )}

      <div
        ref={scrollTrackRef}
        onScroll={registerManualTrackScroll}
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        className={cn(
          'no-scrollbar flex min-w-0 flex-1 flex-nowrap gap-4 sm:gap-8 overflow-x-auto items-center h-full',
          adsToUse.length === 1 ? 'justify-center px-4 sm:px-16' : 'px-4 sm:px-14 lg:justify-center',
        )}
      >
        {displayAds.map((ad: any, index: number) => (
          <div
            key={`${ad.id}-${index}`}
            className="flex-shrink-0 flex-grow-0 my-auto h-full max-h-full flex items-center justify-center overflow-hidden"
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
