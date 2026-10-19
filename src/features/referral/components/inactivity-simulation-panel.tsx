'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  FlaskConical,
  Clock,
  Sparkles,
  Send,
  Bell,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  simulateReferralInactivity,
  checkCaptainInactiveRiders,
  type ReferredRiderInfo,
} from '../services/captain-referral';

interface InactivitySimulationPanelProps {
  riders: ReferredRiderInfo[];
  onRefreshRiders?: () => void;
  isArabic?: boolean;
}

export function InactivitySimulationPanel({
  riders,
  onRefreshRiders,
  isArabic = true,
}: InactivitySimulationPanelProps) {
  const t = useTranslations('referral.simulation');
  const { toast } = useToast();
  const [selectedRiderId, setSelectedRiderId] = useState<string>(
    riders[0]?.rider_id || '',
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<{
    simulatedDays?: number;
    dispatchedCount?: number;
    timestamp?: string;
  } | null>(null);

  const selectedRider = riders.find((r) => r.rider_id === selectedRiderId) || riders[0];

  const handleSimulateDays = async (days: number) => {
    if (!selectedRider?.rider_id) {
      toast({
        variant: 'destructive',
        title: t('toastSelectRiderTitle'),
        description: t('toastSelectRiderDesc'),
      });
      return;
    }

    try {
      setIsSimulating(true);
      const res = await simulateReferralInactivity(selectedRider.rider_id, days);
      if (!res.success) {
        throw new Error(res.error || t('toastSimErrorDefault'));
      }

      setLastResult({
        simulatedDays: days,
        timestamp: new Date().toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US'),
      });

      toast({
        title: t('toastSimSuccessTitle'),
        description: t('toastSimSuccessDesc', {
          riderName: selectedRider.rider_name || t('defaultRider'),
          days,
        }),
      });

      if (onRefreshRiders) {
        onRefreshRiders();
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('toastSimErrorTitle'),
        description: err?.message || t('toastSimErrorDefault'),
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRunNotificationCheck = async () => {
    try {
      setIsChecking(true);
      const res = await checkCaptainInactiveRiders();
      const count = res.notifications_dispatched || 0;

      setLastResult((prev) => ({
        ...prev,
        dispatchedCount: count,
        timestamp: new Date().toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US'),
      }));

      toast({
        title: count > 0 ? t('toastSentTitle') : t('toastNoSentTitle'),
        description: count > 0 ? t('toastSentDesc', { count }) : t('toastNoSentDesc'),
      });

      if (onRefreshRiders) {
        onRefreshRiders();
      }

      // Trigger app notifications update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('radar_notifications_updated'));
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('toastCheckErrorTitle'),
        description: err?.message || t('toastCheckErrorDefault'),
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleOpenNotifications = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-app-notifications'));
      window.location.hash = '#notifications';
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-b from-amber-500/10 via-[#0B0F19]/90 to-[#0B0F19] p-4 text-white shadow-xl space-y-3.5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/20 text-amber-300">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-200 flex items-center gap-1.5">
              <span>{t('title')}</span>
              <span className="text-[9px] bg-amber-500/20 border border-amber-400/40 text-amber-300 px-1 rounded font-mono">
                {t('badge')}
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Select Rider if available */}
      {riders.length > 0 ? (
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300 block text-start">
            {t('selectRiderLabel')}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {riders.map((r) => {
              const isSelected = (selectedRider?.rider_id === r.rider_id);
              return (
                <button
                  key={r.rider_id}
                  type="button"
                  onClick={() => setSelectedRiderId(r.rider_id)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/25 text-amber-200 shadow-sm shadow-amber-500/20'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${r.is_active === false ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <span>{r.rider_name || t('defaultRider')}</span>
                  {r.days_inactive !== undefined && r.days_inactive > 0 && (
                    <span className="text-[9px] opacity-75 font-mono">({r.days_inactive}{t('daysSuffix')})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-3 text-start">
          <p className="text-xs text-amber-200 font-bold">
            {t('noRidersTitle')}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {t('noRidersDesc')}
          </p>
        </div>
      )}

      {/* Preset Action Buttons */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 block text-start">
          {t('controlLabel')}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* 11 Days Inactive */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isSimulating || !selectedRider?.rider_id}
            onClick={() => handleSimulateDays(11)}
            className="h-8 text-[11px] font-bold border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Clock className="h-3 w-3" />
            <span>{t('btn11Days')}</span>
          </Button>

          {/* 20 Days Inactive */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isSimulating || !selectedRider?.rider_id}
            onClick={() => handleSimulateDays(20)}
            className="h-8 text-[11px] font-bold border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Clock className="h-3 w-3" />
            <span>{t('btn20Days')}</span>
          </Button>

          {/* Active Today */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isSimulating || !selectedRider?.rider_id}
            onClick={() => handleSimulateDays(0)}
            className="h-8 text-[11px] font-bold border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Zap className="h-3 w-3" />
            <span>{t('btnToday')}</span>
          </Button>
        </div>
      </div>

      {/* Execute Check Button */}
      <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
        <Button
          type="button"
          disabled={isChecking}
          onClick={handleRunNotificationCheck}
          className="w-full sm:flex-1 h-9 rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 active:scale-[0.98] font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          {isChecking ? (
            <>
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
              <span>{t('btnChecking')}</span>
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>{t('btnCheckNow')}</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleOpenNotifications}
          className="w-full sm:w-auto h-9 px-3 rounded-xl border-teal-500/30 bg-teal-500/10 text-[#14F5D5] hover:bg-teal-500/20 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Bell className="h-3.5 w-3.5" />
          <span>{t('notificationsButton')}</span>
        </Button>
      </div>

      {/* Result Preview Box */}
      {lastResult && (
        <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 text-start space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="font-bold text-slate-200">
              {t('lastResultTitle')}
            </span>
            <span className="font-mono">{lastResult.timestamp}</span>
          </div>
          {lastResult.simulatedDays !== undefined && (
            <p className="text-[11px] text-amber-300">
              {lastResult.simulatedDays === 0
                ? t('statusActiveToday')
                : t('statusDaysAgo', { days: lastResult.simulatedDays })}
            </p>
          )}
          {lastResult.dispatchedCount !== undefined && (
            <p className={`text-[11px] font-bold ${lastResult.dispatchedCount > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
              {lastResult.dispatchedCount > 0 ? t('notifSuccess') : t('notifNone')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
