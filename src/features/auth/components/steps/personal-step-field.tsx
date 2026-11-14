import React from 'react';
import { styles } from './personal-step.styles';

interface PersonalStepFieldProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function PersonalStepField({
  label,
  icon,
  children,
}: PersonalStepFieldProps) {
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
