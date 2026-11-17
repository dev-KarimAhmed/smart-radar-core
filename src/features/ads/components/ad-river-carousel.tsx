'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AdDisplayCard } from './ad-display-card';
import { AdCarouselNavButtons } from './ad-carousel-nav-buttons';
import { useAdRiverScroll } from '../hooks/use-ad-river-scroll';

interface AdRiverCarouselProps {
  adsToUse: any[];
  displayAds: any[];
  repeatCount?: number;
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
  adsToUse,
  displayAds,
  repeatCount,
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
  const effectiveRepeatCount =
    repeatCount ?? (adsToUse.length <= 1 ? 1 : Math.max(1, Math.round(displayAds.length / adsToUse.length)));

  const {
    scrollTrackRef,
    canScrollLeft,
    canScrollRight,
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
  } = useAdRiverScroll({
    adsToUse,
    repeatCount: effectiveRepeatCount,
    adStageDirection,
    isTakeoverOpen,
  });

  return (
    <div
      className={cn(
        'group/river relative flex min-h-0 w-full flex-1 items-center justify-center pt-0 overflow-hidden',
        isFullScreen && 'py-0 sm:py-0 h-full',
      )}
      dir={adStageDirection}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      onKeyDown={handleKeyDown}
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
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        className={cn(
          'no-scrollbar flex min-w-0 flex-1 flex-nowrap gap-4 sm:gap-8 overflow-x-auto items-center h-full',
          adsToUse.length === 1 ? 'justify-center px-4 sm:px-16' : 'justify-start px-4 sm:px-14',
        )}
      >
        {displayAds.map((ad: any, index: number) => (
          <div
            key={`${ad.id}-${index}`}
            className="flex-shrink-0 flex-grow-0 my-auto h-full max-h-full flex items-center justify-center overflow-hidden"
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
