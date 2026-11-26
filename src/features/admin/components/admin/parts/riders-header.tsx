'use client';

import React from 'react';
import { Users, FlaskConical, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAdminPermissions } from '@/features/admin/context/admin-permissions-context';

interface RidersHeaderProps {
  isSimulationOpen: boolean;
  onToggleSimulation: () => void;
  onOpenBulkMessage: () => void;
  onRefresh: () => void;
  loading: boolean;
  t: (key: string, values?: any) => string;
}

export function RidersHeader({
  isSimulationOpen,
  onToggleSimulation,
  onOpenBulkMessage,
  onRefresh,
  loading,
  t,
}: RidersHeaderProps) {
  const { hasPermission } = useAdminPermissions();
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/10">
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-cyan-400" />
          {t('title')}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('subtitle')}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Inactivity & Activity Simulation Toggle Button */}
        {hasPermission('riders.simulation') && (
          <Button
            type="button"
            onClick={onToggleSimulation}
            className={cn(
              "font-black text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md",
              isSimulationOpen
                ? "bg-amber-500 text-slate-950 border border-amber-400 shadow-amber-500/25 ring-1 ring-amber-400/50"
                : "border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
            )}
            title={t('simulationSubtitle')}
          >
            <FlaskConical className="w-4 h-4" />
            <span>{t('simulationToggleBtn')}</span>
          </Button>
        )}

        {/* Global Bulk Message / Notification Button */}
        {hasPermission('riders.message') && (
          <Button
            type="button"
            onClick={onOpenBulkMessage}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
            title={t('bulkMessageTooltip')}
          >
            <Send className="w-4 h-4 ml-0.5" />
            <span>{t('bulkMessageBtn')}</span>
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={loading}
          className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={cn("w-4 h-4 text-cyan-400", loading && "animate-spin")} />
          <span>{t('refreshBtn')}</span>
        </Button>
      </div>
    </div>
  );
}

