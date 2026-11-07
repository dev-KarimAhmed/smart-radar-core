'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { styles } from './active-trip-tracker-styles';

interface StepButtonProps {
  active: boolean;
  done?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export function StepButton({
  active,
  done,
  disabled,
  icon,
  label,
  onClick,
}: StepButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        styles.style112_24,
        done
          ? styles.style114_25
          : active
            ? styles.style116_26
            : styles.style117_27,
      )}
    >
      {icon}
      {label}
    </button>
  );
}
