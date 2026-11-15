'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { BulkScope } from '@/features/admin/types/driver-management';

interface DriversBulkScopeSelectorProps {
  bulkScope: BulkScope;
  setBulkScope: (scope: BulkScope) => void;
  totalCaptainsCount: number;
  selectedCount: number;
  filteredCount: number;
  themeColor?: 'teal' | 'cyan';
  t: (key: string, values?: Record<string, any>) => string;
}

export function DriversBulkScopeSelector({
  bulkScope,
  setBulkScope,
  totalCaptainsCount,
  selectedCount,
  filteredCount,
  themeColor = 'teal',
  t,
}: DriversBulkScopeSelectorProps) {
  const activeClass = themeColor === 'cyan'
    ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm ring-1 ring-cyan-500/40"
    : "bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6] shadow-sm ring-1 ring-[#14B8A6]/40";

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-300">{t('targetScopeLabel')}</label>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setBulkScope('all')}
          className={cn(
            "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
            bulkScope === 'all'
              ? activeClass
              : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
          )}
        >
          <span>{t('scopeAllCaptains')}</span>
          <span className="text-[11px] font-mono opacity-80">({totalCaptainsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setBulkScope('selected')}
          className={cn(
            "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
            bulkScope === 'selected'
              ? activeClass
              : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
          )}
        >
          <span>{t('scopeSelectedCaptains')}</span>
          <span className="text-[11px] font-mono opacity-80">({selectedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setBulkScope('filtered')}
          className={cn(
            "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
            bulkScope === 'filtered'
              ? activeClass
              : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
          )}
        >
          <span>{t('scopeFilteredCaptains')}</span>
          <span className="text-[11px] font-mono opacity-80">({filteredCount})</span>
        </button>
      </div>
    </div>
  );
}

