'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { enqueueAdEvent, getVisibleAdForMetric } from '../services/ad-stage-telemetry';

interface UseAdStageScrollStreamProps {
  adsCount: number;
  adStageDirection: 'rtl' | 'ltr';
  prefersReducedMotion: boolean | null;
  takeoverAd: any | null;
  adsToUse: any[];
}

export function useAdStageScrollStream({
  adsCount,
  adStageDirection,
  prefersReducedMotion,
  takeoverAd,
  adsToUse,
}: UseAdStageScrollStreamProps) {
  const [isAdStreamPaused, setIsAdStreamPaused] = useState(false);
  const isAdStreamPausedRef = useRef(false);
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const touchResumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastManualSwipeMetricAtRef = useRef(0);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const track = scrollTrackRef.current;
    if (!track) return;

    const tolerance = 2;
    const maxScroll = track.scrollWidth - track.clientWidth;

    if (maxScroll <= 0) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    if (adStageDirection === 'rtl') {
      const isAtRightEdge = track.scrollLeft >= -tolerance;
      const isAtLeftEdge = track.scrollLeft <= -(maxScroll - tolerance);

      setCanScrollRight(!isAtRightEdge);
      setCanScrollLeft(!isAtLeftEdge);
    } else {
      const isAtLeftEdge = track.scrollLeft <= tolerance;
      const isAtRightEdge = track.scrollLeft >= maxScroll - tolerance;

      setCanScrollLeft(!isAtLeftEdge);
      setCanScrollRight(!isAtRightEdge);
    }
  }, [adStageDirection]);

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [updateScrollButtons, adsCount]);

  const setAdStreamPaused = useCallback((paused: boolean) => {
    isAdStreamPausedRef.current = paused;
    setIsAdStreamPaused(paused);
  }, []);

  const handleTouchStart = useCallback(() => {
    if (touchResumeTimerRef.current) {
      clearTimeout(touchResumeTimerRef.current);
    }
    setAdStreamPaused(true);
    touchResumeTimerRef.current = setTimeout(() => {
      setAdStreamPaused(false);
    }, 2000);
  }, [setAdStreamPaused]);

  const handleTouchEnd = useCallback(() => {
    if (touchResumeTimerRef.current) {
      clearTimeout(touchResumeTimerRef.current);
    }
    touchResumeTimerRef.current = setTimeout(() => {
      setAdStreamPaused(false);
    }, 600);
  }, [setAdStreamPaused]);

  const handleMouseEnter = useCallback(() => {
    if (touchResumeTimerRef.current) {
      clearTimeout(touchResumeTimerRef.current);
      touchResumeTimerRef.current = null;
    }
    setAdStreamPaused(true);
  }, [setAdStreamPaused]);

  const handleMouseLeave = useCallback(() => {
    if (touchResumeTimerRef.current) {
      clearTimeout(touchResumeTimerRef.current);
      touchResumeTimerRef.current = null;
    }
    setAdStreamPaused(false);
  }, [setAdStreamPaused]);

  useEffect(() => {
    return () => {
      if (touchResumeTimerRef.current) {
        clearTimeout(touchResumeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (adsCount <= 1 || prefersReducedMotion) return;

    let animFrameId: number;
    let lastTimestamp = performance.now();

    const animateScroll = (currentTimestamp: number) => {
      const deltaSeconds = Math.min((currentTimestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = currentTimestamp;

      const track = scrollTrackRef.current;
      if (
        track &&
        !isAdStreamPausedRef.current &&
        !takeoverAd &&
        document.visibilityState === 'visible'
      ) {
        const speed = 25;
        const deltaPixels = speed * deltaSeconds;
        const maxScroll = track.scrollWidth - track.clientWidth;

        if (maxScroll > 0) {
          const repeatMultiplier = adsCount < 4 ? 3 : 2;
          const singleSetWidth = track.scrollWidth / repeatMultiplier;

          if (adStageDirection === 'rtl') {
            const currentScroll = track.scrollLeft;
            const currentAbs = Math.abs(currentScroll);

            if (currentAbs >= singleSetWidth - 1 && singleSetWidth > 0) {
              if (currentScroll < 0) {
                track.scrollLeft += singleSetWidth;
              } else {
                track.scrollLeft -= singleSetWidth;
              }
            } else {
              if (currentScroll < 0) {
                track.scrollLeft -= deltaPixels;
              } else if (currentScroll > 0) {
                track.scrollLeft += deltaPixels;
              } else {
                const prev = track.scrollLeft;
                track.scrollLeft -= deltaPixels;
                if (track.scrollLeft === prev) {
                  track.scrollLeft += deltaPixels;
                }
              }
            }
          } else {
            if (track.scrollLeft >= singleSetWidth - 1 && singleSetWidth > 0) {
              track.scrollLeft -= singleSetWidth;
            } else {
              track.scrollLeft += deltaPixels;
            }
          }
        }
      }

      animFrameId = requestAnimationFrame(animateScroll);
    };

    animFrameId = requestAnimationFrame(animateScroll);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [adsCount, adStageDirection, prefersReducedMotion, takeoverAd]);

  const scrollAds = useCallback(
    (scrollDirection: 'left' | 'right') => {
      const track = scrollTrackRef.current;
      if (!track || adsToUse.length <= 1) return;

      setAdStreamPaused(true);
      if (touchResumeTimerRef.current) {
        clearTimeout(touchResumeTimerRef.current);
      }
      touchResumeTimerRef.current = setTimeout(() => {
        setAdStreamPaused(false);
      }, 400);

      lastManualSwipeMetricAtRef.current = Date.now();
      enqueueAdEvent(getVisibleAdForMetric(track, adsToUse), 'swipe');

      const distance = Math.max(240, Math.min(track.clientWidth * 0.82, 520));
      const delta = scrollDirection === 'left' ? -distance : distance;
      track.scrollBy({
        left: delta,
        behavior: 'smooth',
      });
    },
    [adsToUse, setAdStreamPaused]
  );

  const registerManualTrackScroll = useCallback(() => {
    const track = scrollTrackRef.current;
    if (!track || !isAdStreamPausedRef.current || adsToUse.length <= 1) return;

    const now = Date.now();
    if (now - lastManualSwipeMetricAtRef.current < 1200) return;

    lastManualSwipeMetricAtRef.current = now;
    enqueueAdEvent(getVisibleAdForMetric(track, adsToUse), 'swipe');
  }, [adsToUse]);

  return {
    scrollTrackRef,
    isAdStreamPaused,
    canScrollLeft,
    canScrollRight,
    updateScrollButtons,
    handleTouchStart,
    handleTouchEnd,
    handleMouseEnter,
    handleMouseLeave,
    scrollAds,
    registerManualTrackScroll,
  };
}
