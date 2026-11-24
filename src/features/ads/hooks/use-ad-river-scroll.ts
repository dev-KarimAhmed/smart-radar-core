'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import type { EmblaOptionsType } from 'embla-carousel';
import { enqueueAdEvent } from '../services/ad-stage-metrics';
import type { AdStageDirection } from '../services/ad-stage-scroll';

interface UseAdRiverScrollOptions {
  adsToUse: any[];
  repeatCount: number;
  adStageDirection: AdStageDirection;
  isTakeoverOpen: boolean;
}

export function useAdRiverScroll({
  adsToUse,
  adStageDirection,
  isTakeoverOpen,
}: UseAdRiverScrollOptions) {
  const hasMultipleAds = adsToUse.length > 1;
  const lastManualSwipeMetricAtRef = useRef(0);

  const options = useMemo<EmblaOptionsType>(
    () => ({
      loop: hasMultipleAds,
      direction: adStageDirection,
      dragFree: true,
      skipSnaps: true,
      watchDrag: hasMultipleAds,
    }),
    [hasMultipleAds, adStageDirection],
  );

  const plugins = useMemo(() => {
    if (!hasMultipleAds) return [];
    return [
      AutoScroll({
        speed: 1,
        startDelay: 400,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        playOnInit: true,
      }),
    ];
  }, [hasMultipleAds]);

  const [emblaRef, emblaApi] = useEmblaCarousel(options, plugins);

  // Pause / resume auto scroll when takeover modal opens or closes
  useEffect(() => {
    if (!emblaApi) return;
    const autoScroll = emblaApi.plugins()?.autoScroll;
    if (!autoScroll) return;

    if (isTakeoverOpen) {
      autoScroll.stop();
    } else {
      autoScroll.play();
    }
  }, [emblaApi, isTakeoverOpen]);

  // Track swipe metrics when user drags manually
  useEffect(() => {
    if (!emblaApi || !hasMultipleAds) return;

    const onPointerUp = () => {
      const now = Date.now();
      if (now - lastManualSwipeMetricAtRef.current < 1200) return;
      lastManualSwipeMetricAtRef.current = now;

      const snaps = emblaApi.scrollSnapList();
      if (snaps.length === 0 || adsToUse.length === 0) return;
      const selected = emblaApi.selectedScrollSnap();
      const ad = adsToUse[selected % adsToUse.length];
      if (ad) {
        enqueueAdEvent(ad, 'swipe');
      }
    };

    emblaApi.on('pointerUp', onPointerUp);
    return () => {
      emblaApi.off('pointerUp', onPointerUp);
    };
  }, [emblaApi, hasMultipleAds, adsToUse]);

  const scrollAds = useCallback(
    (direction: 'left' | 'right') => {
      if (!emblaApi) return;
      const isRtl = adStageDirection === 'rtl';

      if (direction === 'left') {
        if (isRtl) {
          emblaApi.scrollNext();
        } else {
          emblaApi.scrollPrev();
        }
      } else {
        if (isRtl) {
          emblaApi.scrollPrev();
        } else {
          emblaApi.scrollNext();
        }
      }

      const autoScroll = emblaApi.plugins()?.autoScroll;
      if (autoScroll && typeof autoScroll.reset === 'function') {
        autoScroll.reset();
      }
    },
    [emblaApi, adStageDirection],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollAds('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollAds('right');
      }
    },
    [scrollAds],
  );

  return {
    scrollTrackRef: emblaRef,
    canScrollLeft: hasMultipleAds,
    canScrollRight: hasMultipleAds,
    scrollAds,
    handleKeyDown,
    registerManualTrackScroll: () => {},
    handlePointerEnter: () => {},
    handlePointerLeave: () => {},
    handleFocusCapture: () => {},
    handleBlurCapture: () => {},
    handleTouchStart: () => {},
    handleTouchEnd: () => {},
    handleWheel: () => {},
  };
}
