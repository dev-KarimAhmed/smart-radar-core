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
import type { CaptainTariff } from '../hooks/use-price-per-km-setup';

const styles = {
  content: 'border-emerald-500/25 bg-[#0B0F19] text-white shadow-2xl',
  title: 'text-xl font-black text-white',
  description: 'text-sm leading-6 text-[#94A3B8] text-start',
  fields: 'mt-2 space-y-4',
  field: 'space-y-1.5',
  fieldLabel: 'block text-sm font-black text-white text-start',
  fieldHint: 'block text-xs leading-5 text-[#64748B] text-start',
  inputRow: 'flex items-stretch gap-2',
  input: 'w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400',
  currencyBadge: 'flex shrink-0 items-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-3 text-sm font-black text-emerald-300',
  error: 'text-sm font-bold text-rose-400 text-start',
  footer: 'sm:justify-start',
  confirm: 'w-full bg-[#14B8A6] font-black text-[#06111f] hover:bg-[#14B8A6]/90 disabled:opacity-60',
} as const;

interface PricePerKmSetupModalProps {
  direction: string;
  currency?: string;
  /** Lowest meter-opening charge this captain may set. */
  minBaseFare: number;
  /**
   * Where that floor came from. Named explicitly because "your country's approved minimum"
   * was being shown for a number actually derived from the captains' own prices — captains
   * read it as an official figure and asked support where it came from.
   */
  minBaseFareSource?: 'captain_average' | 'country_seed';
  initialTariff?: { baseFare: number | null; pricePerKm: number | null; pricePerMin: number | null; includedKm?: number };
  isCountryChange?: boolean;
  /** The tariff is already set and this is the per-activation confirmation. */
  isActivationConfirm?: boolean;
  onSave: (value: CaptainTariff) => Promise<boolean>;
}

function toInputValue(value: number | null | undefined) {
  return value != null ? String(value) : '';
}

export function PricePerKmSetupModal({
  direction,
  currency,
  minBaseFare,
  minBaseFareSource = 'country_seed',
  initialTariff,
  isCountryChange = false,
  isActivationConfirm = false,
  onSave,
}: PricePerKmSetupModalProps) {
  const t = useTranslations('captainDashboard');
  const [baseFare, setBaseFare] = React.useState(toInputValue(initialTariff?.baseFare));
  const [pricePerKm, setPricePerKm] = React.useState(toInputValue(initialTariff?.pricePerKm));
  const [pricePerMin, setPricePerMin] = React.useState(toInputValue(initialTariff?.pricePerMin));
  const [includedKm, setIncludedKm] = React.useState(toInputValue(initialTariff?.includedKm ?? 0));
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const parsedBaseFare = Number(baseFare);
    const parsedPricePerKm = Number(pricePerKm);
    // Per-minute may legitimately be zero — a captain who does not want to charge for time.
    const parsedPricePerMin = Number(pricePerMin);

    if (!Number.isFinite(parsedBaseFare) || parsedBaseFare < minBaseFare) {
      setError(t('tariffModalBaseFareTooLow', { min: minBaseFare.toFixed(2) }));
      return;
    }

    if (!Number.isFinite(parsedPricePerKm) || parsedPricePerKm <= 0) {
      setError(t('pricePerKmModalInvalid'));
      return;
    }

    if (!Number.isFinite(parsedPricePerMin) || parsedPricePerMin < 0) {
      setError(t('tariffModalPerMinInvalid'));
      return;
    }

    // Zero is the normal value — it means per-km billing starts from the first metre.
    const parsedIncludedKm = Number(includedKm);
    if (!Number.isFinite(parsedIncludedKm) || parsedIncludedKm < 0) {
      setError(t('tariffModalIncludedKmInvalid'));
      return;
    }

    setIsSaving(true);
    setError('');
    const saved = await onSave({
      baseFare: parsedBaseFare,
      pricePerKm: parsedPricePerKm,
      pricePerMin: parsedPricePerMin,
      includedKm: parsedIncludedKm,
    });
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
            {isCountryChange
              ? t('pricePerKmModalCountryChangeTitle')
              : isActivationConfirm
                ? t('tariffModalConfirmTitle')
                : t('tariffModalTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription className={styles.description}>
            {isCountryChange
              ? t('pricePerKmModalCountryChangeBody')
              : isActivationConfirm
                ? t('tariffModalConfirmBody')
                : t('tariffModalBody')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('tariffModalBaseFareLabel')}</label>
            <span className={styles.fieldHint}>
              {minBaseFareSource === 'captain_average'
                ? t('tariffModalBaseFareHintMarket', { min: minBaseFare.toFixed(2) })
                : t('tariffModalBaseFareHint', { min: minBaseFare.toFixed(2) })}
            </span>
            <div className={styles.inputRow}>
              <input
                type="number"
                inputMode="decimal"
                min={minBaseFare}
                step="0.01"
                value={baseFare}
                onChange={(event) => setBaseFare(event.target.value)}
                placeholder={minBaseFare.toFixed(2)}
                disabled={isSaving}
                className={styles.input}
                autoFocus
              />
              {currency ? <span className={styles.currencyBadge}>{currency}</span> : null}
            </div>
          </div>

          {/* Sits directly under the opening charge because it qualifies it: this is the
              distance that charge already covers. */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('tariffModalIncludedKmLabel')}</label>
            <span className={styles.fieldHint}>{t('tariffModalIncludedKmHint')}</span>
            <div className={styles.inputRow}>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={includedKm}
                onChange={(event) => setIncludedKm(event.target.value)}
                placeholder="0"
                disabled={isSaving}
                className={styles.input}
              />
              <span className={styles.currencyBadge}>{t('tariffModalKmUnit')}</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('tariffModalPerKmLabel')}</label>
            <span className={styles.fieldHint}>{t('tariffModalPerKmHint')}</span>
            <div className={styles.inputRow}>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={pricePerKm}
                onChange={(event) => setPricePerKm(event.target.value)}
                placeholder={t('pricePerKmModalPlaceholder')}
                disabled={isSaving}
                className={styles.input}
              />
              {currency ? <span className={styles.currencyBadge}>{currency}</span> : null}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>{t('tariffModalPerMinLabel')}</label>
            <span className={styles.fieldHint}>{t('tariffModalPerMinHint')}</span>
            <div className={styles.inputRow}>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={pricePerMin}
                onChange={(event) => setPricePerMin(event.target.value)}
                placeholder="0.00"
                disabled={isSaving}
                className={styles.input}
              />
              {currency ? <span className={styles.currencyBadge}>{currency}</span> : null}
            </div>
          </div>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <AlertDialogFooter className={styles.footer}>
          <AlertDialogAction disabled={isSaving} onClick={handleSave} className={styles.confirm}>
            {isSaving
              ? t('pricePerKmModalSaving')
              : isActivationConfirm
                ? t('tariffModalConfirmAction')
                : t('pricePerKmModalSave')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
