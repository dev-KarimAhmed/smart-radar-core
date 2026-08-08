'use client';

import { LocateFixed } from 'lucide-react';

const styles = {
  icon: "h-5 w-5",
} as const;

export interface RecenterMapButtonProps {
  onClick: () => void;
  className: string;
  ariaLabel: string;
  disabled?: boolean;
  title?: string;
}

/**
 * The "recenter to my location" control shared by every MapLibre map screen.
 * Visual placement/sizing stays caller-controlled via `className` — rider
 * and captain use different positioning today and this does not change that.
 */
export function RecenterMapButton({ onClick, className, ariaLabel, disabled, title }: RecenterMapButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      title={title}
    >
      <LocateFixed className={styles.icon} aria-hidden="true" />
    </button>
  );
}
