'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CaptainMarketIndicator } from '../../hooks/use-captain-market-indicator';
import { MarketStatusIndicator } from '../market-status-indicator';
import { tariffModalStyles as styles } from './tariff-modal-styles';

interface TariffModeSelectorProps {
  isArabic: boolean;
  setupMode: 'FREE' | 'APP' | 'TAXI';
  setSetupMode: (mode: 'FREE' | 'APP' | 'TAXI') => void;
  setError: (err: string) => void;
  marketIndicator?: CaptainMarketIndicator | null;
  t: (key: string, values?: any) => string;
}

export function TariffModeSelector({
  isArabic,
  setupMode,
  setSetupMode,
  setError,
  marketIndicator,
  t,
}: TariffModeSelectorProps) {
  return (
    <>
      {/* Crucial Operational Alert */}
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-red-500/15 p-3.5 sm:p-4 text-start shadow-lg mb-2">
        <div className="flex items-center gap-2 font-black text-amber-300 text-xs sm:text-sm mb-1">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{isArabic ? '" تنبيه تشغيلي حاسم "' : '" Crucial Operational Alert "'}</span>
        </div>
        <p className="text-xs font-bold text-slate-200 leading-relaxed font-sans">
          {isArabic
            ? 'فك قيد استهلاك البطارية على هاتفك ثم ضعه على شاحن المركبة اثناء نشاطك حيث إن التتبع اللحظي يستهلك طاقة البطارية.'
            : 'Remove battery optimization restrictions on your phone and keep it plugged into your vehicle charger during activity, as live geolocation consumes battery power.'}
        </p>
      </div>

      {/* Label above activity modes */}
      <p className="text-center text-[11px] sm:text-xs font-black text-slate-300 mt-1.5 mb-0.5">
        {t('marketActivityTitle')}
      </p>

      {/* Pricing Setup Mode Selector Tabs */}
      <div className={styles.modeSelector}>
        <button
          type="button"
          onClick={() => {
            setSetupMode('FREE');
            setError('');
          }}
          className={cn(
            styles.modeButton,
            setupMode === 'FREE' ? styles.modeButtonActive : styles.modeButtonInactive
          )}
        >
          <span className={styles.modeButtonTitle}>{t('tariffFreePriceTitle')}</span>
          <span className={styles.modeButtonSubtitle}>{t('tariffFreePriceSubtitle')}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setSetupMode('APP');
            setError('');
          }}
          className={cn(
            styles.modeButton,
            setupMode === 'APP' ? styles.modeButtonActive : styles.modeButtonInactive
          )}
        >
          <span className={styles.modeButtonTitle}>{t('tariffAppPriceTitle')}</span>
          <span className={styles.modeButtonSubtitle}>{t('tariffAppPriceSubtitle')}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setSetupMode('TAXI');
            setError('');
          }}
          className={cn(
            styles.modeButton,
            setupMode === 'TAXI' ? styles.modeButtonActive : styles.modeButtonInactive
          )}
        >
          <span className={styles.modeButtonTitle}>{t('tariffTaxiPriceTitle')}</span>
          <span className={styles.modeButtonSubtitle}>{t('tariffTaxiPriceSubtitle')}</span>
        </button>
      </div>

      {/* Market Status Indicator Banner */}
      <div className={styles.marketIndicatorWrap}>
        <MarketStatusIndicator indicator={marketIndicator} size="full" />
      </div>

      {setupMode === 'APP' && (
        <div className={styles.appNoticeCard}>
          <p className={styles.appNoticeTitle}>
            <span>📱</span>
            <span>{t('tariffAppNoticeTitle')}</span>
          </p>
          <p className={styles.appNoticeBody}>{t('tariffAppNoticeBody')}</p>
        </div>
      )}

      {setupMode === 'TAXI' && (
        <div className={styles.taxiNoticeCard}>
          <p className={styles.taxiNoticeTitle}>
            <span>🚕</span>
            <span>{t('tariffTaxiNoticeTitle')}</span>
          </p>
          <p className={styles.taxiNoticeBody}>{t('tariffTaxiNoticeBody')}</p>
        </div>
      )}
    </>
  );
}
