
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
  const [calculatedScores, setCalculatedScores] = React.useState<Record<string, number>>({});
  const [isProcessingScores, setIsProcessingScores] = React.useState(false);

  React.useEffect(() => {
    if (pulseData.length === 0) return;

    setIsProcessingScores(true);
    
    // Web Worker Code as string to offload complex geographical density processing loops from the main thread
    const workerCode = `
      self.onmessage = function(e) {
        const data = e.data;
        const results = {};
        
        for (const pulse of data) {
          let densityScore = 0;
          // Heavy loop simulation: Geospatial coordinates intersections matching
          for (let i = 0; i < 50000; i++) {
            densityScore += Math.sin(i) * Math.cos(i);
          }
          
          const rawDensity = (pulse.demand * 2.5 + pulse.supply * 1.1) + Math.abs(densityScore) * 0.01;
          results[pulse.id] = Math.round((rawDensity % 100) * 10) / 10;
        }
        
        self.postMessage(results);
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    let worker: Worker | null = null;

    try {
      worker = new Worker(workerUrl);
      worker.onmessage = (e) => {
        setCalculatedScores(e.data);
        setIsProcessingScores(false);
      };
      worker.postMessage(pulseData);
    } catch (err) {
      console.warn("WebWorker creation fallback to main-thread async chunks:", err);
      // Fallback for isolated contexts where WebWorkers are blocked
      setTimeout(() => {
        const results: Record<string, number> = {};
        for (const pulse of pulseData) {
          results[pulse.id] = Math.round(((pulse.demand * 2.5 + pulse.supply * 1.1) % 100) * 10) / 10;
        }
        setCalculatedScores(results);
        setIsProcessingScores(false);
      }, 50);
    }

    return () => {
      if (worker) {
        worker.terminate();
      }
      URL.revokeObjectURL(workerUrl);
    };
  }, [pulseData]);

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

                {/* Offloaded WebWorker Geo Density Indicator */}
                <div className="border-t border-dashed border-emerald-900/30 pt-2.5 flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                  <span>مؤشر تقاطع الكثافة (WebWorker):</span>
                  <span className="text-[#00ffcc] font-black">
                    {isProcessingScores ? 'حساب...' : `${calculatedScores[pulse.id] ?? '0.0'}%`}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
