'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import { enqueueAdEvent, getVisibleAdForMetric } from '../services/ad-stage-metrics';
import {
  calculateNextScrollStep,
  getSeamlessManualScrollStart,
  type AdStageDirection,
} from '../services/ad-stage-scroll';

interface UseAdRiverScrollOptions {
  adsToUse: any[];
  repeatCount: number;
  adStageDirection: AdStageDirection;
  isTakeoverOpen: boolean;
}

const AUTO_SCROLL_SPEED_PX_PER_SEC = 36;
const MANUAL_RESUME_DELAY_MS = 650;

export function useAdRiverScroll({
  adsToUse,
  repeatCount,
  adStageDirection,
  isTakeoverOpen,
}: UseAdRiverScrollOptions) {
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const scrollAccumulatorRef = useRef<number | null>(null);
  const isHoveredRef = useRef(false);
  const isFocusedRef = useRef(false);
  const isInteractingRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastManualSwipeMetricAtRef = useRef(0);
  const [hasOverflow, setHasOverflow] = useState(adsToUse.length > 1);

  const measureSingleSetWidth = useCallback((track: HTMLDivElement): number => {
    const children = track.children;
    if (adsToUse.length > 0 && children.length > adsToUse.length) {
      const first = children[0] as HTMLElement;
      const secondSetFirst = children[adsToUse.length] as HTMLElement;
      const measured = Math.abs(secondSetFirst.offsetLeft - first.offsetLeft);
      if (measured > 0) return measured;
    }
    return repeatCount > 0 ? track.scrollWidth / repeatCount : track.scrollWidth;
  }, [adsToUse.length, repeatCount]);

  const syncAccumulator = useCallback(() => {
    if (scrollTrackRef.current) scrollAccumulatorRef.current = scrollTrackRef.current.scrollLeft;
  }, []);

  const scheduleInteractionResume = useCallback((delayMs = MANUAL_RESUME_DELAY_MS) => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      syncAccumulator();
      isInteractingRef.current = false;
    }, delayMs);
  }, [syncAccumulator]);

  const updateOverflowState = useCallback(() => {
    const track = scrollTrackRef.current;
    if (!track) return;
    setHasOverflow(adsToUse.length > 1 && track.scrollWidth - track.clientWidth > 2);
  }, [adsToUse.length]);

  useEffect(() => {
    updateOverflowState();
    window.addEventListener('resize', updateOverflowState);
    return () => window.removeEventListener('resize', updateOverflowState);
  }, [updateOverflowState, adsToUse.length, repeatCount]);

  useEffect(() => {
    const track = scrollTrackRef.current;
    if (!track) return;
    track.scrollLeft = 0;
    scrollAccumulatorRef.current = 0;
    updateOverflowState();
  }, [adStageDirection, adsToUse.length, updateOverflowState]);

  useEffect(() => {
    if (!isTakeoverOpen) syncAccumulator();
  }, [isTakeoverOpen, syncAccumulator]);

  useEffect(() => () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  useEffect(() => {
    if (adsToUse.length <= 1) return;
    let animFrameId: number;
    let lastTimestamp = performance.now();

    const animateScroll = (currentTimestamp: number) => {
      const deltaSeconds = Math.min((currentTimestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = currentTimestamp;

      const track = scrollTrackRef.current;
      const isPaused =
        isHoveredRef.current ||
        isFocusedRef.current ||
        isInteractingRef.current ||
        isTakeoverOpen ||
        document.visibilityState !== 'visible';

      if (track && !isPaused) {
        const maxScroll = track.scrollWidth - track.clientWidth;
        if (maxScroll > 2) {
          if (scrollAccumulatorRef.current === null) scrollAccumulatorRef.current = track.scrollLeft;
          const singleSetWidth = measureSingleSetWidth(track);
          const loopWidth = singleSetWidth > 0 && singleSetWidth <= maxScroll ? singleSetWidth : maxScroll;
          const nextScroll = calculateNextScrollStep(
            scrollAccumulatorRef.current,
            AUTO_SCROLL_SPEED_PX_PER_SEC * deltaSeconds,
            loopWidth,
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
  }, [adsToUse.length, adStageDirection, isTakeoverOpen, measureSingleSetWidth]);

  const handlePointerEnter = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') isHoveredRef.current = true;
  }, []);

  const handlePointerLeave = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') {
      isHoveredRef.current = false;
      syncAccumulator();
    }
  }, [syncAccumulator]);

  const handleFocusCapture = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlurCapture = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      isFocusedRef.current = false;
      syncAccumulator();
    }
  }, [syncAccumulator]);

  const handleTouchStart = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    isInteractingRef.current = true;
  }, []);

  const handleTouchEnd = useCallback(() => scheduleInteractionResume(), [scheduleInteractionResume]);

  const handleWheel = useCallback(() => {
    isInteractingRef.current = true;
    scheduleInteractionResume();
  }, [scheduleInteractionResume]);

  const scrollAds = useCallback(
    (scrollDirection: 'left' | 'right') => {
      const track = scrollTrackRef.current;
      if (!track || adsToUse.length <= 1) return;

      isInteractingRef.current = true;
      scheduleInteractionResume();
      lastManualSwipeMetricAtRef.current = Date.now();
      enqueueAdEvent(getVisibleAdForMetric(track, adsToUse), 'swipe');

      const distance = Math.max(220, Math.min(track.clientWidth * 0.8, 480));
      const delta = scrollDirection === 'left' ? -distance : distance;
      const jumpStart = getSeamlessManualScrollStart(
        track.scrollLeft,
        delta,
        measureSingleSetWidth(track),
        track.scrollWidth - track.clientWidth,
        adStageDirection,
      );
      if (jumpStart !== null) {
        track.scrollLeft = jumpStart;
        scrollAccumulatorRef.current = jumpStart;
      }
      track.scrollBy({ left: delta, behavior: 'smooth' });
    },
    [adsToUse, adStageDirection, measureSingleSetWidth, scheduleInteractionResume],
  );

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollAds('left');
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollAds('right');
    }
  }, [scrollAds]);

  const registerManualTrackScroll = useCallback(() => {
    const track = scrollTrackRef.current;
    if (!track || adsToUse.length <= 1) return;
    if (isInteractingRef.current || isHoveredRef.current || isFocusedRef.current) {
      scrollAccumulatorRef.current = track.scrollLeft;
    }
    const now = Date.now();
    if (now - lastManualSwipeMetricAtRef.current < 1200) return;
    lastManualSwipeMetricAtRef.current = now;
    enqueueAdEvent(getVisibleAdForMetric(track, adsToUse), 'swipe');
  }, [adsToUse]);

  return {
    scrollTrackRef,
    canScrollLeft: hasOverflow,
    canScrollRight: hasOverflow,
    scrollAds,
    registerManualTrackScroll,
    handlePointerEnter,
    handlePointerLeave,
    handleFocusCapture,
    handleBlurCapture,
    handleTouchStart,
    handleTouchEnd,
    handleWheel,
    handleKeyDown,
  };
}
