import React from 'react';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/shared/components/ui/star-rating';
import { VehicleCriterionKey, VehicleRatings } from './rating-types';

interface RatingVehicleSectionProps {
  vehicle: VehicleRatings;
  onSetVehicleRating: (key: VehicleCriterionKey, stars: number) => void;
  vehicleInfo?: string;
  tAuto: (key: string) => string;
}

export function RatingVehicleSection({
  vehicle,
  onSetVehicleRating,
  vehicleInfo,
  tAuto,
}: RatingVehicleSectionProps) {
  const criteria: Array<{ key: VehicleCriterionKey; label: string }> = [
    { key: 'interior', label: tAuto('ratingModal_vehicleInterior') },
    { key: 'exterior', label: tAuto('ratingModal_vehicleExterior') },
    { key: 'comfort', label: tAuto('ratingModal_vehicleComfortQuiet') },
  ];

  return (
    <div className="space-y-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <Label className="text-sm font-black text-white flex items-center gap-2">
          <span>🚗</span>
          <span>{tAuto('ratingModal_vehicleSectionTitle')}</span>
        </Label>
        {vehicleInfo ? (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            {vehicleInfo}
          </span>
        ) : null}
      </div>

      <div className="divide-y divide-white/5">
        {criteria.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
            <span className="text-xs font-bold text-slate-300 min-w-0 pr-2">
              {item.label}
            </span>
            <StarRating
              rating={vehicle[item.key]}
              setRating={(stars) => onSetVehicleRating(item.key, stars)}
              size="sm"
              color="amber"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
