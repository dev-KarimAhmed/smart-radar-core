'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import type { User } from '@/core/types';
import { useToast } from '@/hooks/use-toast';
import { useDriverProfileState } from '../hooks/use-driver-profile-state';
import { styles } from './profile/driver-profile-shared';
import { DriverAccountPanel } from './profile/driver-account-panel';
import { DriverVehiclePanel } from './profile/driver-vehicle-panel';
import { DriverTariffPanel } from './profile/driver-tariff-panel';
import { DriverReferralCard } from '@/features/referral/components/driver-referral-card';

interface DriverProfileTabProps {
  user: User | null;
  language: 'ar' | 'en';
}

// Helper skeletons matching exact loaded component layouts and heights
function FieldSkeleton({ hasAction = true }: { hasAction?: boolean }) {
  return (
    <div className="flex min-h-[72px] items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-black/45 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-28 rounded-md bg-emerald-500/20" />
        <div className="h-4.5 w-36 rounded-md bg-white/10" />
      </div>
      {hasAction ? (
        <div className="h-8 w-8 shrink-0 rounded-xl border border-emerald-500/20 bg-emerald-500/10" />
      ) : null}
    </div>
  );
}

function RecoveryEmailSkeleton() {
  return (
    <div className="space-y-2.5 border-t border-white/5 py-3">
      <div className="h-3.5 w-36 rounded-md bg-emerald-500/20" />
      <div className="h-3 w-4/5 rounded-md bg-slate-700/40" />
      <div className="h-11 rounded-2xl border border-slate-800/80 bg-black/45" />
    </div>
  );
}

function ReferralCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-teal-500/25 bg-[#0B0F19]/90 p-4 sm:p-5 shadow-xl backdrop-blur-xl animate-pulse">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/50 to-transparent" />
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl border border-teal-500/30 bg-teal-500/10" />
          <div className="h-4 w-44 rounded-lg bg-white/10" />
        </div>
        <div className="h-6 w-20 rounded-full border border-teal-500/30 bg-teal-500/10" />
      </div>
      <div className="mb-3 h-3.5 w-5/6 rounded bg-slate-700/40" />
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl border border-white/10 bg-black/40 p-2">
        <div className="mx-2 h-4 flex-1 rounded bg-white/5" />
        <div className="flex items-center gap-2">
          <div className="h-8.5 w-24 rounded-xl border border-teal-500/30 bg-teal-500/15" />
          <div className="h-8.5 w-8.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15" />
        </div>
      </div>
    </div>
  );
}

export function DriverProfileTab({ user, language }: DriverProfileTabProps) {
  const t = useTranslations('captainProfile');
  const { toast } = useToast();
  const state = useDriverProfileState(user, toast);

  if (state.isLoadingProfile) {
    return (
      <section className={styles.style300_16}>
        {/* Top Status Bar */}
        <div className="flex items-center gap-3 rounded-2xl border border-teal-500/20 bg-[#0B0F19]/90 px-4 py-3 backdrop-blur-xl">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-teal-500/30 bg-teal-500/10">
            <Loader2 className="h-4 w-4 animate-spin text-[#14F5D5]" />
          </div>
          <div className="text-start">
            <p className="text-xs font-black text-white">{t('loadingTitle')}</p>
            <p className="text-[11px] text-slate-400">{t('loadingBody')}</p>
          </div>
        </div>

        {/* 2-Column Grid Matching Post-Load Layout & Full Real Heights */}
        <div className={styles.style430_61}>
          {/* Column 1: Referral Card Skeleton + Account Panel Skeleton */}
          <div className="space-y-5">
            <ReferralCardSkeleton />

            {/* Account Panel Skeleton (Matches exact 8 fields + recovery email block) */}
            <div className={`${styles.style460_69} h-fit space-y-3 animate-pulse`}>
              <div className="mb-4 flex items-center gap-2">
                <div className="h-5 w-5 rounded-md bg-emerald-500/20" />
                <div className="h-5 w-28 rounded-md bg-white/10" />
              </div>
              {/* Full Name */}
              <FieldSkeleton hasAction={false} />
              {/* Nickname */}
              <FieldSkeleton hasAction={true} />
              {/* Phone */}
              <FieldSkeleton hasAction={true} />
              {/* Recovery Email Block */}
              <RecoveryEmailSkeleton />
              {/* Account Number */}
              <FieldSkeleton hasAction={false} />
              {/* Role */}
              <FieldSkeleton hasAction={false} />
              {/* Tier */}
              <FieldSkeleton hasAction={false} />
              {/* National ID */}
              <FieldSkeleton hasAction={false} />
              {/* Driver License */}
              <FieldSkeleton hasAction={false} />
            </div>
          </div>

          {/* Column 2: Vehicle Panel Skeleton + Tariff Panel Skeleton */}
          <div className="space-y-5">
            {/* Vehicle Panel Skeleton (Matches exact 10 vehicle fields) */}
            <div className={`${styles.style460_69} h-fit space-y-3 animate-pulse`}>
              <div className="mb-4 flex items-center gap-2">
                <div className="h-5 w-5 rounded-md bg-emerald-500/20" />
                <div className="h-5 w-32 rounded-md bg-white/10" />
              </div>
              {/* Plate */}
              <FieldSkeleton hasAction={true} />
              {/* Make */}
              <FieldSkeleton hasAction={true} />
              {/* Model */}
              <FieldSkeleton hasAction={true} />
              {/* Color */}
              <FieldSkeleton hasAction={false} />
              {/* Year */}
              <FieldSkeleton hasAction={true} />
              {/* Affiliation Type */}
              <FieldSkeleton hasAction={true} />
              {/* Office / Company Name */}
              <FieldSkeleton hasAction={true} />
              {/* Side ID / Company Code */}
              <FieldSkeleton hasAction={true} />
              {/* Facebook URL */}
              <FieldSkeleton hasAction={true} />
              {/* Instagram URL */}
              <FieldSkeleton hasAction={true} />
            </div>

            {/* Tariff Panel Skeleton (Matches exact 4 tariff fields) */}
            <div className={`${styles.style460_69} h-fit space-y-3 animate-pulse`}>
              <div className="mb-4 flex items-center gap-2">
                <div className="h-5 w-5 rounded-md bg-emerald-500/20" />
                <div className="h-5 w-36 rounded-md bg-white/10" />
              </div>
              {/* Base Fare */}
              <FieldSkeleton hasAction={true} />
              {/* Included Km */}
              <FieldSkeleton hasAction={true} />
              {/* Price Per Km */}
              <FieldSkeleton hasAction={true} />
              {/* Price Per Min */}
              <FieldSkeleton hasAction={true} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (state.profileLoadFailed) {
    return (
      <section className={styles.style273_10}>
        <div className={styles.style274_11}>
          <div className={styles.style275_12}>
            <div>
              <p className={styles.style277_13}>
                {t('loadErrorTitle')}
              </p>
              <p className={styles.style280_14}>
                {t('loadErrorBody')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => state.setProfileReloadToken((value: number) => value + 1)}
              className={styles.style289_15}
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.style300_16}>
      <div className={styles.style430_61}>
        <div className="w-full min-w-0 space-y-5">
          <DriverReferralCard user={user} isArabic={language === 'ar'} />
          <DriverAccountPanel state={state} user={user} />
        </div>
        <div className="w-full min-w-0 space-y-5">
          <DriverVehiclePanel state={state} language={language} />
          <DriverTariffPanel state={state} />
        </div>
      </div>
    </section>
  );
}
