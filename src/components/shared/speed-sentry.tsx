'use client';

import { useDriverOperations } from '@/hooks/use-driver-operations';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const OVERSPEED_THRESHOLD = 40; // km/h

export function SpeedSentry() {
  const { driverSpeed, driverStatus } = useDriverOperations();

  const isOverspeeding = driverStatus === 'active' && driverSpeed > OVERSPEED_THRESHOLD;

  if (!isOverspeeding) {
    return null;
  }

  return (
    <div 
      className={cn(
        "absolute bottom-24 left-4 right-4 z-20 p-4 rounded-xl shadow-2xl",
        "bg-destructive/90 border border-red-500/50 text-destructive-foreground backdrop-blur-sm",
        "flex items-center gap-4 animate-in fade-in duration-300"
      )}
    >
      <AlertTriangle className="w-10 h-10 text-yellow-300 animate-pulse" />
      <div>
        <h3 className="font-black text-lg text-white">تم تفعيل درع السرعة السيادي</h3>
        <p className="text-sm text-white/80 mt-1">
          تم إخفاء الإعلانات والطلبات مؤقتاً لضمان تركيزك على الطريق. السلامة أولاً.
        </p>
      </div>
    </div>
  );
}
