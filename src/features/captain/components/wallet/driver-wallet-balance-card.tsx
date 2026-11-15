'use client';

import React from 'react';
import {
  ChevronDown,
  Clock,
  Info,
  Wallet,
  Zap,
} from 'lucide-react';
import type { User } from '@/core/types';
import { cn } from '@/lib/utils';
import { CaptainAdsSeatsManager } from '../captain-ads-seats-manager';
import { toHoursMinutes } from '../../types/driver-wallet-types';

interface DriverWalletBalanceCardProps {
  user: User | null;
  language: 'ar' | 'en';
  wallet: any;
  walletIsReady: boolean;
  walletIsMissing: boolean;
  walletHasError: boolean;
  isBalanceOpen: boolean;
  setIsBalanceOpen: React.Dispatch<React.SetStateAction<boolean>>;
  t: (key: string, values?: any) => string;
}

export function DriverWalletBalanceCard({
  user,
  language,
  wallet,
  walletIsReady,
  walletIsMissing,
  walletHasError,
  isBalanceOpen,
  setIsBalanceOpen,
  t,
}: DriverWalletBalanceCardProps) {
  const radarHourPrice = wallet.radarHourPrice || 1;
  const totalMinutes = wallet.totalUsableMinutes;
  const bonusMinutes = wallet.bonusMinutesRemaining || 0;
  const currencySymbol = user?.currencyAr || user?.currencyEn || '';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-slate-900/95 via-[#071324] to-[#040812] shadow-2xl backdrop-blur-xl transition-all duration-300',
        isBalanceOpen ? 'p-5 sm:p-7 space-y-6' : 'p-4 sm:p-5'
      )}
    >
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />

      {/* Clickable Header Dropdown Toggle */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsBalanceOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsBalanceOpen((prev) => !prev);
          }
        }}
        className={cn(
          'group relative z-10 flex w-full items-center justify-between cursor-pointer select-none transition-colors',
          isBalanceOpen ? 'border-b border-white/10 pb-4' : ''
        )}
        aria-expanded={isBalanceOpen}
        aria-label={t('balance')}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-400 transition-transform duration-300 group-hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h2 className="text-sm sm:text-base font-black text-white group-hover:text-emerald-300 transition-colors">
              {t('balance')}
            </h2>

            {/* Quick Summary Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-300">
                {walletIsReady ? `${wallet.balanceJD.toFixed(2)} ${currencySymbol}` : '...'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2.5 py-0.5 text-xs font-mono font-bold text-[#14F5D5]">
                <Clock className="h-3 w-3" />
                <span>{walletIsReady ? t('durationFormat', toHoursMinutes(totalMinutes)) : '...'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {radarHourPrice > 0 ? (
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3 py-1 text-xs font-mono font-bold text-cyan-300">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>
                {t('hourlyRateCard')}: {radarHourPrice.toFixed(2)} {currencySymbol}/ساعة
              </span>
            </span>
          ) : null}

          {/* Dropdown Chevron Toggle Icon */}
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 group-hover:border-emerald-400/50 group-hover:bg-emerald-950/30 group-hover:text-emerald-300',
              isBalanceOpen ? 'rotate-180 border-emerald-500/40 bg-emerald-950/50 text-emerald-300' : ''
            )}
          >
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Dropdown Content */}
      {isBalanceOpen && (
        <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          {radarHourPrice > 0 && (
            <div className="flex md:hidden items-center justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3 py-1 text-xs font-mono font-bold text-cyan-300">
                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                <span>
                  {t('hourlyRateCard')}: {radarHourPrice.toFixed(2)} {currencySymbol}/ساعة
                </span>
                <span className="text-cyan-400/70 text-[11px]">
                  ({(radarHourPrice / 60).toFixed(3)}/د)
                </span>
              </span>
            </div>
          )}

          {/* Main Balance & Radar Time Grid */}
          <div className="grid gap-6 sm:grid-cols-2 items-center">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-4xl sm:text-5xl font-black text-amber-400 tracking-tight">
                  {walletIsReady ? wallet.balanceJD.toFixed(2) : wallet.walletLoaded ? '-' : '...'}
                </span>
                <span className="text-xl font-bold text-slate-300">{currencySymbol}</span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'ar' ? 'الرصيد النقدي الفعلي في محفظتك' : 'Current wallet cash balance'}
              </p>
            </div>

            <div className="sm:border-r sm:border-white/10 sm:pr-6 space-y-1">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-2.5 text-cyan-300 shadow-[0_0_15px_rgba(20,245,213,0.15)]">
                  <Clock className="h-6 w-6 text-[#14F5D5]" />
                </div>
                <div>
                  <div className="font-mono text-2xl sm:text-3xl font-black text-[#14F5D5]">
                    {walletIsReady ? t('durationFormat', toHoursMinutes(totalMinutes)) : '...'}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400 font-mono">
                      ({totalMinutes} {language === 'ar' ? 'دقيقة رادار' : 'radar mins'})
                    </span>
                    {bonusMinutes > 0 ? (
                      <span className="rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                        +{bonusMinutes} {language === 'ar' ? 'مكافأة' : 'bonus'}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-950/30 px-4 py-2.5 text-xs text-cyan-200/90 leading-relaxed">
            <Info className="h-4 w-4 shrink-0 text-cyan-400" />
            <span>{t('rateLinkingNote')}</span>
          </div>

          {walletIsMissing || walletHasError ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-100">
              <p className="font-bold">{walletIsMissing ? t('walletMissingTitle') : t('walletErrorTitle')}</p>
              <p className="mt-1 text-amber-200/80">{walletIsMissing ? t('walletMissingBody') : t('walletErrorBody')}</p>
            </div>
          ) : null}

          <CaptainAdsSeatsManager user={user} language={language} />
        </div>
      )}
    </div>
  );
}
