'use client';

import React from 'react';
import {
  ChevronDown,
  Clock,
  Info,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { User } from '@/core/types';
import { cn } from '@/lib/utils';
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
  onOpenAdPackage?: () => void;
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
  onOpenAdPackage,
}: DriverWalletBalanceCardProps) {
  const radarHourPrice = wallet.radarHourPrice || 1;
  const totalMinutes = wallet.totalUsableMinutes;
  const bonusMinutes = wallet.bonusMinutesRemaining || 0;
  const currencySymbol = user?.currencyAr || user?.currencyEn || '';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-slate-900/95 via-[#071324] to-[#040812] shadow-2xl backdrop-blur-xl transition-all duration-300',
        isBalanceOpen ? 'p-5 sm:p-7 space-y-6' : 'p-4 sm:p-5'
      )}
    >
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />

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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-[#14F5D5] transition-transform duration-300 group-hover:scale-105 shadow-[0_0_15px_rgba(20,245,213,0.15)]">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h2 className="text-sm sm:text-base font-black text-white group-hover:text-cyan-300 transition-colors">
              {t('balance')}
            </h2>

            {/* Quick Summary Badges (Minutes Only) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2.5 py-0.5 text-xs font-mono font-bold text-[#14F5D5]">
                <Clock className="h-3 w-3" />
                <span>{walletIsReady ? t('durationFormat', toHoursMinutes(totalMinutes)) : '...'}</span>
              </span>
              {bonusMinutes > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                  +{bonusMinutes} {language === 'ar' ? 'مكافأة' : 'bonus'}
                </span>
              ) : null}
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
              'flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 group-hover:border-cyan-400/50 group-hover:bg-cyan-950/30 group-hover:text-cyan-300',
              isBalanceOpen ? 'rotate-180 border-cyan-500/40 bg-cyan-950/50 text-cyan-300' : ''
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

          {/* Main Radar Minutes Display */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900/40 to-slate-900/60 p-5 shadow-inner">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_20px_rgba(20,245,213,0.2)]">
                <Clock className="h-7 w-7 text-[#14F5D5]" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-3xl sm:text-4xl font-black text-[#14F5D5] tracking-tight">
                  {walletIsReady ? t('durationFormat', toHoursMinutes(totalMinutes)) : '...'}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono font-medium">
                    ({totalMinutes} {language === 'ar' ? 'دقيقة رادار للتشغيل' : 'operating radar mins'})
                  </span>
                  {bonusMinutes > 0 ? (
                    <span className="rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                      +{bonusMinutes} {language === 'ar' ? 'مكافأة' : 'bonus'}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {radarHourPrice > 0 && (
              <div className="hidden sm:flex flex-col items-end justify-center border-r border-white/10 pr-6 space-y-1">
                <span className="text-xs text-slate-400">{t('hourlyRateCard')}</span>
                <span className="font-mono text-base font-bold text-cyan-300">
                  {radarHourPrice.toFixed(2)} {currencySymbol}/ساعة
                </span>
                <span className="text-[11px] font-mono text-cyan-400/70">
                  ({(radarHourPrice / 60).toFixed(3)} {currencySymbol}/{language === 'ar' ? 'دقيقة' : 'min'})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-950/30 px-4 py-2.5 text-xs text-cyan-200/90 leading-relaxed">
            <Info className="h-4 w-4 shrink-0 text-cyan-400" />
            <span>{t('rateLinkingNote')}</span>
          </div>

          {/* اختار باقة اعلانك - زر أنيق ولطيف في أسفل البطاقة */}
          {onOpenAdPackage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAdPackage();
              }}
              className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-cyan-950/70 via-slate-900/80 to-emerald-950/50 p-3 sm:p-3.5 text-start transition-all hover:border-[#14F5D5] hover:shadow-[0_0_25px_rgba(20,245,213,0.25)] active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-[#14F5D5] transition-transform group-hover:scale-110 shadow-[0_0_12px_rgba(20,245,213,0.2)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="block font-black text-xs sm:text-sm text-white group-hover:text-[#14F5D5] transition-colors truncate">
                    {language === 'ar' ? 'الباقة الافتتاحية' : 'The Launch Package'}
                  </span>
                  <span className="block text-[11px] text-teal-300/90 font-sans truncate">
                    {language === 'ar' ? 'أول شهر مجاني بالكامل · استكشف 14 ميزة حصرية' : 'First month 100% free · Explore 14 exclusive features'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-[#14F5D5] px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-md shadow-teal-500/20 transition-all group-hover:scale-105 group-hover:brightness-110">
                  <span>{language === 'ar' ? 'عرض الباقة' : 'View Package'}</span>
                  <Sparkles className="h-3 w-3 text-slate-950" />
                </span>
              </div>
            </button>
          )}

          {walletIsMissing || walletHasError ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-100">
              <p className="font-bold">{walletIsMissing ? t('walletMissingTitle') : t('walletErrorTitle')}</p>
              <p className="mt-1 text-amber-200/80">{walletIsMissing ? t('walletMissingBody') : t('walletErrorBody')}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
