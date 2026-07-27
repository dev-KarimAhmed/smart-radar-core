'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, Sparkles, VolumeX, TrafficCone, Car } from 'lucide-react';
import type { VehicleOfferData } from '@/core/types';

const styles = {
  style14_1: "flex items-center justify-between gap-4",
  style15_2: "flex items-center gap-2",
  style17_3: "text-sm font-medium text-muted-foreground",
  style19_4: "flex items-center gap-2",
  style20_5: "w-24 h-2 bg-muted rounded-full overflow-hidden",
  style21_6: "h-full bg-amber-400 rounded-full",
  style23_7: "text-sm font-bold text-white w-8 text-right",
  style40_8: "sm:max-w-md bg-card border-border",
  style42_9: "flex items-center gap-2 text-xl font-bold text-white",
  style43_10: "w-6 h-6 text-primary",
  style50_11: "py-4 space-y-4",
  style51_12: "flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border",
  style53_13: "text-lg font-bold text-white",
  style54_14: "text-sm text-muted-foreground",
  style56_15: "text-lg font-mono tracking-widest",
  style61_16: "space-y-3",
  style62_17: "flex items-center justify-between",
  style63_18: "font-bold text-base text-white flex items-center gap-2",
  style64_19: "w-5 h-5 text-yellow-400 fill-current",
  style67_20: "text-2xl font-black text-yellow-300",
  style70_21: "text-xs text-center text-muted-foreground",
  style72_22: "my-4",
  style74_23: "font-bold text-center text-primary pt-2",
  style75_24: "w-5 h-5 text-amber-400",
  style76_25: "w-5 h-5 text-purple-400",
  style77_26: "w-5 h-5 text-orange-400",
} as const;


// Helper component for displaying a sensory rating
const SensoryStat = ({ icon, label, value, max }: { icon: React.ReactNode, label: string, value: number, max: number }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className={styles.style14_1}>
      <div className={styles.style15_2}>
        {icon}
        <span className={styles.style17_3}>{label}</span>
      </div>
      <div className={styles.style19_4}>
        <div className={styles.style20_5}>
          <div className={styles.style21_6} style={{ width: `${percentage}%` }} />
        </div>
        <span className={styles.style23_7}>{value.toFixed(1)}</span>
      </div>
    </div>
  );
};

export function VehicleSensoryProfile({ vehicle, isOpen, onClose }: { vehicle: VehicleOfferData | null, isOpen: boolean, onClose: () => void }) {
  if (!vehicle) return null;

  const totalRatings = vehicle.ratingCount || 0;
  const avgCleanliness = totalRatings > 0 ? (vehicle.cleanlinessSum || 0) / totalRatings : 0;
  const avgQuietness = totalRatings > 0 ? (vehicle.quietnessSum || 0) / totalRatings : 0;
  const avgAdherence = totalRatings > 0 ? (vehicle.adherenceSum || 0) / totalRatings : 0;
  const avgVehicleRating = totalRatings > 0 ? (vehicle.ratingSum || 0) / totalRatings : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={styles.style40_8}>
        <DialogHeader>
          <DialogTitle className={styles.style42_9}>
            <Car className={styles.style43_10} />
            الهوية الحسية للمركبة
          </DialogTitle>
          <DialogDescription>
            هذه البيانات تمثل متوسط تقييمات الركاب السابقين لهذه المركبة.
          </DialogDescription>
        </DialogHeader>
        <div className={styles.style50_11}>
          <div className={styles.style51_12}>
              <div>
                <p className={styles.style53_13}>{vehicle.make} - {vehicle.year}</p>
                <p className={styles.style54_14}>{vehicle.color}</p>
              </div>
              <Badge variant="outline" className={styles.style56_15}>{vehicle.plate}</Badge>
          </div>
          
          <Separator />

          <div className={styles.style61_16}>
             <div className={styles.style62_17}>
                <p className={styles.style63_18}>
                    <Star className={styles.style64_19} />
                    التقييم العام للمركبة
                </p>
                <p className={styles.style67_20}>{avgVehicleRating.toFixed(1)}</p>
            </div>
            
            <p className={styles.style70_21}>بناءً على {totalRatings} تقييم</p>
            
            <Separator className={styles.style72_22}/>

            <h4 className={styles.style74_23}>المؤشرات الحسية</h4>
            <SensoryStat icon={<Sparkles className={styles.style75_24}/>} label="النظافة والترتيب" value={avgCleanliness} max={5} />
            <SensoryStat icon={<VolumeX className={styles.style76_25}/>} label="الهدوء (العزل)" value={avgQuietness} max={5} />
            <SensoryStat icon={<TrafficCone className={styles.style77_26}/>} label="التزام السائق (مهنية)" value={avgAdherence} max={5} />
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
