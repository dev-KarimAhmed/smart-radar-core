import React from 'react';
import { useTranslations } from 'next-intl';
import { Clock, Zap, Send, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RiderUser } from '../riders-management-panel';

interface SimulationControlsProps {
  selectedRider: RiderUser | null;
  customDays: string;
  setCustomDays: (v: string) => void;
  isSimulating: boolean;
  isChecking: boolean;
  onSimulateDays: (days: number) => void;
  onRunNotificationCheck: () => void;
  lastResult: { message: string; timestamp: string } | null;
}

export function SimulationControls({
  selectedRider,
  customDays,
  setCustomDays,
  isSimulating,
  isChecking,
  onSimulateDays,
  onRunNotificationCheck,
  lastResult,
}: SimulationControlsProps) {
  const t = useTranslations('adminRiders');

  return (
    <>
      {/* Preset Time Simulation Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-black text-slate-300 block text-start">
          {t('simulationControlHeading')}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {/* 11 Days Inactive */}
          <Button
            type="button"
            variant="outline"
            disabled={isSimulating || !selectedRider}
            onClick={() => onSimulateDays(11)}
            className="h-9 text-xs font-black border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/10"
          >
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>{t('simulationBtn11Days')}</span>
          </Button>

          {/* 20 Days Inactive */}
          <Button
            type="button"
            variant="outline"
            disabled={isSimulating || !selectedRider}
            onClick={() => onSimulateDays(20)}
            className="h-9 text-xs font-black border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/10"
          >
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>{t('simulationBtn20Days')}</span>
          </Button>

          {/* Active Today */}
          <Button
            type="button"
            variant="outline"
            disabled={isSimulating || !selectedRider}
            onClick={() => onSimulateDays(0)}
            className="h-9 text-xs font-black border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/10"
          >
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span>{t('simulationBtnToday')}</span>
          </Button>

          {/* Custom Days Input */}
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min="0"
              max="365"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              placeholder={t('simulationCustomDaysPlaceholder')}
              className="h-9 text-xs font-mono font-bold bg-black/60 border-white/20 text-white rounded-xl focus:border-amber-400 px-2.5 text-center"
            />
            <Button
              type="button"
              disabled={isSimulating || !selectedRider || !customDays}
              onClick={() => onSimulateDays(Number(customDays) || 0)}
              className="h-9 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-all"
            >
              <span>{t('simulationBtnCustom')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Action Banner: Run Notification Check */}
      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button
          type="button"
          disabled={isChecking}
          onClick={onRunNotificationCheck}
          className="w-full sm:w-auto px-6 h-10 rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:brightness-110 active:scale-[0.98] font-black text-xs text-slate-950 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          {isChecking ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span>{isChecking ? t('simulationChecking') : t('simulationRunCheckBtn')}</span>
        </Button>

        {lastResult && (
          <div className="text-xs text-slate-300 flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-white">{lastResult.message}</span>
            <span className="text-[10px] text-slate-400 font-mono">({lastResult.timestamp})</span>
          </div>
        )}
      </div>
    </>
  );
}
