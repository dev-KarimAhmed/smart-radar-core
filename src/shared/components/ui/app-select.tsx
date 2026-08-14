'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';

// Ports the exact select design used across the auth registration flow
// (see /register/rider's personal-step.tsx) so any form in the app can reuse
// the same look instead of re-declaring the trigger/content/item classes.
const styles = {
  trigger:
    'h-11 w-full min-w-0 rounded-xl border border-white/10 bg-black/35 px-3 text-xs font-black text-white outline-none transition focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:outline-none data-[state=open]:ring-0 data-[state=open]:ring-offset-0',
  content: 'border-white/10 bg-[#0F172A] text-white shadow-2xl shadow-black/40',
  item: 'cursor-pointer rounded-lg py-2.5 text-xs font-black text-slate-200 focus:bg-[#14B8A6]/15 focus:text-[#14F5D5] data-[state=checked]:bg-[#14B8A6]/10 data-[state=checked]:text-[#14F5D5]',
} as const;

export interface AppSelectOption {
  value: string;
  label: string;
}

export function AppSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { isArabic } = useDashboardLanguage();
  const dir = isArabic ? 'rtl' : 'ltr';

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled} dir={dir}>
      <SelectTrigger className={cn(styles.trigger, className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={styles.content}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className={styles.item}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
