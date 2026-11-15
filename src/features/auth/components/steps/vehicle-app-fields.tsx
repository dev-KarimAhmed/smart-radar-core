'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { styles } from './vehicle-step.styles';

interface VehicleAppFieldsProps {
  vehicle: {
    companyName?: string;
    make?: string;
    color?: string;
    plate?: string;
    year?: string;
    [key: string]: any;
  };
  setVehicle: (v: any) => void;
  tAuto: (key: string) => string;
}

export function VehicleAppFields({
  vehicle,
  setVehicle,
  tAuto,
}: VehicleAppFieldsProps) {
  return (
    <>
      <div>
        <label className={styles.style160_16}>{tAuto('key_ae69bf11')}</label>
        <Input
          placeholder={tAuto('key_ae69bf11')}
          value={vehicle.companyName || ''}
          onChange={(e) => setVehicle({ ...vehicle, companyName: e.target.value })}
          className={styles.style167_17}
          required
        />
      </div>

      <div className={styles.style171_18}>
        <div>
          <label className={styles.style173_19}>{tAuto('key_5db84e2e')}</label>
          <Input
            placeholder={tAuto('key_7fd1a36c')}
            value={vehicle.make || ''}
            onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })}
            className={styles.style180_20}
            required
          />
        </div>
        <div>
          <label className={styles.style185_21}>{tAuto('key_4851a7c0')}</label>
          <Input
            placeholder={tAuto('key_4851a7c0')}
            value={vehicle.color || ''}
            onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })}
            className={styles.style192_22}
            required
          />
        </div>
      </div>

      <div className={styles.style197_23}>
        <div>
          <label className={styles.style199_24}>{tAuto('key_ddc5f6b0')}</label>
          <Input
            placeholder={tAuto('key_ddc5f6b0')}
            value={vehicle.plate || ''}
            onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })}
            className={styles.style206_25}
            required
          />
        </div>
        <div>
          <label className={styles.style211_26}>{tAuto('key_19c502e1')}</label>
          <Input
            type="number"
            placeholder={tAuto('key_19c502e1')}
            value={vehicle.year || ''}
            onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
            className={styles.style219_27}
            required
            min="1990"
            max="2027"
          />
        </div>
      </div>
    </>
  );
}
