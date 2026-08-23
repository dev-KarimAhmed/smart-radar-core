'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const styles = {
  content: 'border-emerald-500/25 bg-[#0B0F19] text-white shadow-2xl',
  title: 'text-xl font-black text-white',
  description: 'text-sm leading-6 text-[#94A3B8] text-start',
  fieldGroup: 'mt-4 space-y-1.5',
  fieldLabel: 'text-xs font-bold text-[#94A3B8] text-start block',
  fieldHint: 'text-[11px] leading-5 text-[#94A3B8]/70 text-start',
  inputRow: 'mt-1 flex items-stretch gap-2',
  input: 'w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400',
  currencyBadge: 'flex shrink-0 items-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-3 text-sm font-black text-emerald-300',
  error: 'mt-3 text-sm font-bold text-rose-400',
  footer: 'sm:justify-start',
  confirm: 'w-full bg-[#14B8A6] font-black text-[#06111f] hover:bg-[#14B8A6]/90 disabled:opacity-60',
} as const;

interface PricePerKmSetupModalProps {
  direction: string;
  currency?: string;
  initialValue?: number | null;
  initialFlagFallValue?: number | null;
  isCountryChange?: boolean;
  onSave: (price: number, flagFallFee: number) => Promise<boolean>;
}

export function PricePerKmSetupModal({
  direction,
  currency,
  initialValue,
  initialFlagFallValue,
  isCountryChange = false,
  onSave,
}: PricePerKmSetupModalProps) {
  const t = useTranslations('captainDashboard');
  const [value, setValue] = React.useState(initialValue != null ? String(initialValue) : '');
  const [flagFallValue, setFlagFallValue] = React.useState(initialFlagFallValue != null ? String(initialFlagFallValue) : '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setError(t('pricePerKmModalInvalid'));
      return;
    }

    const numericFlagFall = Number(flagFallValue);
    if (!Number.isFinite(numericFlagFall) || numericFlagFall < 0) {
      setError(t('pricePerKmModalFlagFallInvalid'));
      return;
    }

    setIsSaving(true);
    setError('');
    const saved = await onSave(numericValue, numericFlagFall);
    setIsSaving(false);
    if (!saved) {
      setError(t('pricePerKmModalError'));
    }
  };

  return (
    <AlertDialog open>
      <AlertDialogContent
        className={styles.content}
        dir={direction}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className={styles.title}>
            {isCountryChange ? t('pricePerKmModalCountryChangeTitle') : t('pricePerKmModalTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription className={styles.description}>
            {isCountryChange ? t('pricePerKmModalCountryChangeBody') : t('pricePerKmModalBody')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>{t('pricePerKmModalPriceLabel')}</label>
          <div className={styles.inputRow}>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={t('pricePerKmModalPlaceholder')}
              disabled={isSaving}
              className={styles.input}
              autoFocus
            />
            {currency ? <span className={styles.currencyBadge}>{currency}</span> : null}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>{t('pricePerKmModalFlagFallLabel')}</label>
          <p className={styles.fieldHint}>{t('pricePerKmModalFlagFallHint')}</p>
          <div className={styles.inputRow}>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={flagFallValue}
              onChange={(event) => setFlagFallValue(event.target.value)}
              placeholder={t('pricePerKmModalFlagFallPlaceholder')}
              disabled={isSaving}
              className={styles.input}
            />
            {currency ? <span className={styles.currencyBadge}>{currency}</span> : null}
          </div>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}
        <AlertDialogFooter className={styles.footer}>
          <AlertDialogAction disabled={isSaving} onClick={handleSave} className={styles.confirm}>
            {isSaving ? t('pricePerKmModalSaving') : t('pricePerKmModalSave')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
