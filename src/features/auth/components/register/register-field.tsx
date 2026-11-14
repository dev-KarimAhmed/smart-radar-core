'use client';

import React from 'react';
import { styles } from './register-styles';

export interface RegisterFieldProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function RegisterField({ label, icon, children }: RegisterFieldProps) {
  return (
    <label className={styles.style374_47}>
      <span className={styles.style375_48}>
        <span className={styles.style376_49}>{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}
