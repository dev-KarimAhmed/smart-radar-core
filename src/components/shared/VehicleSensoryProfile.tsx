'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, Sparkles, VolumeX, TrafficCone, Car } from 'lucide-react';
import type { VehicleOfferData } from '@/core/types';

// Helper component for displaying a sensory rating
const SensoryStat = ({ icon, label, value, max }: { icon: React.ReactNode, label: string, value: number, max: number }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }} />
        </div>
        <span className="text-sm font-bold text-white w-8 text-right">{value.toFixed(1)}</span>
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
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <Car className="w-6 h-6 text-primary" />
            الهوية الحسية للمركبة
          </DialogTitle>
          <DialogDescription>
            هذه البيانات تمثل متوسط تقييمات الركاب السابقين لهذه المركبة.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
              <div>
                <p className="text-lg font-bold text-white">{vehicle.make} - {vehicle.year}</p>
                <p className="text-sm text-muted-foreground">{vehicle.color}</p>
              </div>
              <Badge variant="outline" className="text-lg font-mono tracking-widest">{vehicle.plate}</Badge>
          </div>
          
          <Separator />

          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <p className="font-bold text-base text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    التقييم العام للمركبة
                </p>
                <p className="text-2xl font-black text-yellow-300">{avgVehicleRating.toFixed(1)}</p>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">بناءً على {totalRatings} تقييم</p>
            
            <Separator className="my-4"/>

            <h4 className="font-bold text-center text-primary pt-2">المؤشرات الحسية</h4>
            <SensoryStat icon={<Sparkles className="w-5 h-5 text-amber-400"/>} label="النظافة والترتيب" value={avgCleanliness} max={5} />
            <SensoryStat icon={<VolumeX className="w-5 h-5 text-purple-400"/>} label="الهدوء (العزل)" value={avgQuietness} max={5} />
            <SensoryStat icon={<TrafficCone className="w-5 h-5 text-orange-400"/>} label="التزام السائق (مهنية)" value={avgAdherence} max={5} />
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
