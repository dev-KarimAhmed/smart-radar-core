'use client';

import { useDriverOperations } from '@/hooks/use-driver-operations';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const styles = {
  style22_1: "absolute bottom-24 left-4 right-4 z-20 p-4 rounded-xl shadow-2xl",
  style23_2: "bg-destructive/90 border border-red-500/50 text-destructive-foreground backdrop-blur-sm",
  style24_3: "flex items-center gap-4 animate-in fade-in duration-300",
  style27_4: "w-10 h-10 text-yellow-300 animate-pulse",
  style29_5: "font-black text-lg text-white",
  style30_6: "text-sm text-white/80 mt-1",
} as const;


const OVERSPEED_THRESHOLD = 40; // km/h

export function SpeedSentry() {
  const driverOps = useDriverOperations();
  const { driverSpeed, driverStatus } = driverOps || { driverSpeed: 0, driverStatus: 'idle' };

  const isOverspeeding = driverStatus === 'active' && driverSpeed > OVERSPEED_THRESHOLD;

  if (!isOverspeeding) {
    return null;
  }

  return (
    <div
      className={cn(
        styles.style22_1,
        styles.style23_2,
        styles.style24_3
      )}
    >
      <AlertTriangle className={styles.style27_4} />
      <div>
        <h3 className={styles.style29_5}>تم تفعيل درع السرعة </h3>
        <p className={styles.style30_6}>
          تم إخفاء الإعلانات والطلبات مؤقتاً لضمان تركيزك على الطريق. السلامة أولاً.
        </p>
      </div>
    </div>
  );
}
