'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { styles } from './driver-pricing-styles';

export const PricingInput = React.memo(({
  id,
  label,
  icon,
  value,
  onChange,
  hasError,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (val: number) => void;
  hasError?: boolean;
}) => (
  <div className={styles.style30_1}>
    <Label htmlFor={id} className={styles.style31_2}>
      {icon}
      {label}
    </Label>
    <Input
      id={id}
      type="number"
      step="0.05"
      value={value === 0 ? '' : value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={cn(
        styles.style39_3,
        hasError ? styles.style41_4 : styles.style42_5,
      )}
    />
  </div>
));
PricingInput.displayName = 'PricingInput';
