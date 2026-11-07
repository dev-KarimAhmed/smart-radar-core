import React from 'react';
import { Users, RefreshCw, Zap, Send, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { styles } from './captains-types';
import type { WelcomeHoursConfigState } from './dialogs/captain-welcome-hours-dialog';

interface CaptainHeaderProps {
  t: (key: string, params?: Record<string, any>) => string;
  isArabic: boolean;
  welcomeConfig: WelcomeHoursConfigState;
  onOpenWelcomeHours: () => void;
  onOpenBulkTopup: () => void;
  onOpenBulkMessage: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const CaptainHeader: React.FC<CaptainHeaderProps> = ({
  t,
  isArabic,
  welcomeConfig,
  onOpenWelcomeHours,
  onOpenBulkTopup,
  onOpenBulkMessage,
  onRefresh,
  loading,
}) => {
  return (
    <div className={styles.header}>
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-[#14B8A6]" />
          {t('title')}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('subtitle')}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Sovereign Welcome Flight Hours Config Button */}
        <Button
          type="button"
          onClick={onOpenWelcomeHours}
          className={cn(
            "font-black text-xs h-10 px-3.5 rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 border",
            welcomeConfig.enabled
              ? "bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/30 shadow-emerald-900/20"
              : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 shadow-black/20"
          )}
          title={t('welcomeHoursTooltip')}
        >
          <Gift className="w-4 h-4 text-emerald-400" />
          <span>
            {welcomeConfig.enabled
              ? t('welcomeHoursBtnActive', { hours: welcomeConfig.hours })
              : t('welcomeHoursBtnDisabled')}
          </span>
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              welcomeConfig.enabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
            )}
          />
        </Button>

        {/* Global Bulk Topup Button */}
        <Button
          type="button"
          onClick={onOpenBulkTopup}
          className="bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#14B8A6]/20 transition-all cursor-pointer active:scale-95"
          title={t('bulkTopupTooltip')}
        >
          <Zap className="w-4 h-4" />
          <span>{t('bulkTopupBtn')}</span>
        </Button>

        {/* Global Bulk Message / Notification Button */}
        <Button
          type="button"
          onClick={onOpenBulkMessage}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
          title={t('bulkMessageTooltip')}
        >
          <Send className={cn("w-4 h-4", isArabic ? "ml-0.5" : "mr-0.5")} />
          <span>{t('bulkMessageBtn')}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={loading}
          className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={cn("w-4 h-4 text-[#14B8A6]", loading && "animate-spin")} />
          <span>{t('refreshBtn')}</span>
        </Button>
      </div>
    </div>
  );
};
