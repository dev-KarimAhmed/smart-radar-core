'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { styles } from './vehicle-step.styles';

interface VehicleTaxiFieldsProps {
  vehicle: {
    officeName?: string;
    officePhone?: string;
    sideId?: string;
    plate?: string;
    year?: string;
    [key: string]: any;
  };
  setVehicle: (v: any) => void;
  isOfficePhoneValid: boolean;
  officePhoneValidationMessage?: string;
  tAuto: (key: string) => string;
}

export function VehicleTaxiFields({
  vehicle,
  setVehicle,
  isOfficePhoneValid,
  officePhoneValidationMessage,
  tAuto,
}: VehicleTaxiFieldsProps) {
  return (
    <>
      <div>
        <label className={styles.style91_5}>{tAuto('key_d36e572a')}</label>
        <Input
          placeholder={tAuto('key_d36e572a')}
          value={vehicle.officeName || ''}
          onChange={(e) => setVehicle({ ...vehicle, officeName: e.target.value })}
          className={styles.style98_6}
          required
        />
      </div>

      <div>
        <label className={styles.style103_7}>{tAuto('key_d9162751')}</label>
        <div className="relative">
          <Input
            type="tel"
            dir="ltr"
            placeholder={tAuto('key_d9162751')}
            value={vehicle.officePhone || ''}
            onChange={(e) => setVehicle({ ...vehicle, officePhone: e.target.value })}
            className={cn(
              styles.style111_8,
              isOfficePhoneValid && '!border-emerald-500/70 focus:!border-emerald-500 ring-1 ring-emerald-500/20',
              !isOfficePhoneValid && vehicle.officePhone?.trim() && '!border-amber-500/60 focus:!border-amber-500',
            )}
            required
          />
          {isOfficePhoneValid ? (
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center pointer-events-none">
              <Check className="h-4 w-4 stroke-[2.5]" />
            </span>
          ) : null}
        </div>
        {!isOfficePhoneValid && vehicle.officePhone?.trim() ? (
          <p className="text-[10px] text-amber-400/90 font-medium mt-1">
            {officePhoneValidationMessage || tAuto('key_33be5d12')}
          </p>
        ) : null}
      </div>

      <div className={styles.style115_9}>
        <div>
          <label className={styles.style117_10}>{tAuto('key_f0cafb7c')}</label>
          <Input
            placeholder={tAuto('key_f0cafb7c')}
            value={vehicle.sideId || ''}
            onChange={(e) => setVehicle({ ...vehicle, sideId: e.target.value })}
            className={styles.style124_11}
            required
          />
        </div>
        <div>
          <label className={styles.style129_12}>{tAuto('key_ddc5f6b0')}</label>
          <Input
            placeholder={tAuto('key_ddc5f6b0')}
            value={vehicle.plate || ''}
            onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })}
            className={styles.style136_13}
            required
          />
        </div>
      </div>

      <div>
        <label className={styles.style142_14}>{tAuto('key_19c502e1')}</label>
        <Input
          type="number"
          placeholder={tAuto('key_19c502e1')}
          value={vehicle.year || ''}
          onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
          className={styles.style150_15}
          required
          min="1990"
          max="2027"
        />
      </div>
    </>
  );
}
