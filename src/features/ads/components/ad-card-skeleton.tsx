'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export interface AdCardSkeletonProps {
  className?: string;
}

export function AdCardSkeleton({ className }: AdCardSkeletonProps) {
  return (
    <article
      aria-hidden="true"
      className={cn(
        'group relative isolate flex flex-col justify-end overflow-hidden rounded-[28px]',
        'border border-cyan-400/15 bg-gradient-to-b from-[#0F172A] via-[#0B0F19] to-[#040812]',
        'p-5 text-right shadow-[0_24px_70px_rgba(0,0,0,0.5)] select-none',
        className
      )}
    >
      {/* Background ambient glow and image placeholder */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/[0.03] via-[#07101F]/40 to-[#06101D]/95" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 opacity-30 pointer-events-none">
        <div className="h-14 w-14 rounded-2xl border border-dashed border-[#14B8A6]/30 bg-[#14B8A6]/5 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-[#14F5D5] animate-pulse" />
        </div>
      </div>

      {/* Shimmer overlay sweep */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#06101D]/90 via-[#06101D]/40 to-transparent" />

      {/* Top action: Heart button placeholder */}
      <div className="absolute left-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#121A2D]/80 shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div className="h-5 w-5 rounded-full bg-white/15 animate-pulse" />
      </div>

      {/* Top action: Badge placeholder */}
      <div className="absolute right-5 top-6 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#111827]/90 px-3 py-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div className="h-2.5 w-2.5 rounded-full bg-[#14F5D5]/40 animate-pulse" />
        <div className="h-2.5 w-16 rounded-full bg-white/15 animate-pulse" />
      </div>

      {/* Bottom Content Area */}
      <div className="relative z-10 mx-auto flex w-full max-w-[90%] flex-col items-center gap-3 pb-1 text-center">
        {/* Title and subtitle skeleton lines */}
        <div className="w-full flex flex-col items-center space-y-2">
          <div className="h-5 w-3/4 rounded-xl bg-white/20 animate-pulse shadow-sm" />
          <div className="h-3.5 w-1/2 rounded-lg bg-white/15 animate-pulse" />
          <div className="h-2.5 w-5/6 rounded-md bg-white/10 animate-pulse mt-1" />
        </div>

        {/* CTA Button placeholder */}
        <div className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#14F5D5]/30 bg-[#14F5D5]/20 px-6 py-2.5 shadow-[0_0_22px_rgba(20,245,213,0.15)] animate-pulse mt-0.5">
          <div className="h-3 w-20 rounded-md bg-[#14F5D5]/40" />
        </div>
      </div>
    </article>
  );
}
