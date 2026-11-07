'use client';

import React from 'react';
import { styles } from './personal-step-constants';

export function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.style900_153}>
      <span className={styles.style901_154}>
        <span className={styles.style902_155}>{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}
