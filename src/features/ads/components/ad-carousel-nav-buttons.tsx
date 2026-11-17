'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdCarouselNavButtonsProps {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScroll: (direction: 'left' | 'right') => void;
  copy: { previous: string; next: string };
}

export function AdCarouselNavButtons({
  canScrollLeft,
  canScrollRight,
  onScroll,
  copy,
}: AdCarouselNavButtonsProps) {
  return (
    <>
      <button
        type="button"
        aria-label={copy.previous}
        disabled={!canScrollLeft}
        onClick={() => onScroll('left')}
        className={cn(
          'absolute left-2 sm:left-4 top-1/2 z-30 flex h-9 w-9 sm:h-11 sm:w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0F19]/88 text-white shadow-xl shadow-black/35 backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/45',
          canScrollLeft ? 'hover:border-[#14B8A6]/45 hover:bg-[#14B8A6]/15' : 'cursor-not-allowed opacity-35',
        )}
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      <button
        type="button"
        aria-label={copy.next}
        disabled={!canScrollRight}
        onClick={() => onScroll('right')}
        className={cn(
          'absolute right-2 sm:right-4 top-1/2 z-30 flex h-9 w-9 sm:h-11 sm:w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0F19]/88 text-white shadow-xl shadow-black/35 backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/45',
          canScrollRight ? 'hover:border-[#14B8A6]/45 hover:bg-[#14B8A6]/15' : 'cursor-not-allowed opacity-35',
        )}
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
    </>
  );
}
