
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, ArrowRightLeft, Users, Car } from 'lucide-react';
import type { MarketPulse } from '@/core/types';
import { cn } from '@/lib/utils';

interface PulseHeatmapProps {
  pulseData: MarketPulse[];
  isLoading: boolean;
}

const getTrendStyle = (trend: MarketPulse['trend']) => {
  switch (trend) {
    case 'high_demand':
      return {
        bg: 'bg-red-900/40 border-red-500/50',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
        iconColor: 'text-red-400',
        Icon: TrendingUp,
      };
    case 'high_supply':
      return {
        bg: 'bg-blue-900/40 border-blue-500/50',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
        iconColor: 'text-blue-400',
        Icon: TrendingDown,
      };
    case 'balanced':
    default:
      return {
        bg: 'bg-emerald-950/40 border-emerald-500/50',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
        iconColor: 'text-emerald-400',
        Icon: ArrowRightLeft,
      };
  }
};

export function PulseHeatmap({ pulseData, isLoading }: PulseHeatmapProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-[#091B09]/40 border-emerald-900/50 p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="flex justify-between pt-4">
              <div className="h-8 bg-muted rounded w-1/4"></div>
              <div className="h-8 bg-muted rounded w-1/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-black mb-4 text-center">خريطة النبض الحرارية</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {pulseData.sort((a,b) => b.demand - a.demand).map((pulse) => {
          const style = getTrendStyle(pulse.trend);
          return (
            <Card key={pulse.id} className={cn('transition-all duration-300', style.bg, style.glow)}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{pulse.id}</span>
                  <style.Icon className={cn('w-6 h-6', style.iconColor)} />
                </CardTitle>
                <CardDescription className={cn(style.iconColor, 'capitalize font-bold')}>
                  {pulse.trend.replace('_', ' ')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-around text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground">الطلب</span>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-white/70" />
                      <span className="text-2xl font-bold">{pulse.demand}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground">العرض</span>
                     <div className="flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-white/70" />
                      <span className="text-2xl font-bold">{pulse.supply}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
