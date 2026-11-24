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
        className={cn(
          'w-full h-full overflow-hidden select-none',
          isFullScreen && 'py-0.5 sm:py-1',
        )}
      >
        <div
          className={cn(
            'flex h-full items-center',
            adsToUse.length === 1
              ? 'justify-center px-4 sm:px-16'
              : 'gap-4 sm:gap-8 px-4 sm:px-14',
          )}
          style={{ touchAction: 'pan-y pinch-zoom' }}
        >
          {displayAds.map((ad: any, index: number) => (
            <div
              key={`${ad.id}-${index}`}
              className="flex-[0_0_auto] min-w-0 my-auto h-full max-h-full flex items-center justify-center py-0.5 sm:py-1"
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
    </div>
  );
}
