'use client';

import React from 'react';
import { Loader2, Car, Check, Zap, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CaptainUser } from '@/features/admin/types/driver-management';
import { DriversTableRow } from './drivers-table-row';

interface DriversDataTableProps {
  captains: CaptainUser[];
  filteredCaptains: CaptainUser[];
  loading: boolean;
  selectedCaptainIds: Set<string>;
  onToggleSelectOne: (id: string) => void;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onOpenBulkTopupForSelected: () => void;
  onOpenBulkMessageForSelected: () => void;
  onInspect: (cap: CaptainUser) => void;
  onTopup: (cap: CaptainUser) => void;
  onSecurity: (cap: CaptainUser) => void;
  onMessage: (cap: CaptainUser) => void;
  onToggleLanguage: (captainId: string, currentLang?: string) => void;
  isArabic: boolean;
  t: (key: string, values?: Record<string, any>) => string;
}

const styles = {
  tableCard: "rounded-2xl border border-white/10 bg-[#0B0F19]/90 overflow-hidden shadow-2xl backdrop-blur-xl",
  tableHead: "border-b border-white/10 bg-[#0F172A]/90 text-slate-200 text-xs font-black tracking-wide",
} as const;

export function DriversDataTable({
  filteredCaptains,
  loading,
  selectedCaptainIds,
  onToggleSelectOne,
  onToggleSelectAll,
  onClearSelection,
  onOpenBulkTopupForSelected,
  onOpenBulkMessageForSelected,
  onInspect,
  onTopup,
  onSecurity,
  onMessage,
  onToggleLanguage,
  isArabic,
  t,
}: DriversDataTableProps) {
  const allFilteredSelected =
    filteredCaptains.length > 0 && filteredCaptains.every((c) => selectedCaptainIds.has(c.id));
  const someFilteredSelected =
    filteredCaptains.some((c) => selectedCaptainIds.has(c.id));

  return (
    <>
      {/* Floating / Sticky Bulk Action Bar */}
      {selectedCaptainIds.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 p-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#14B8A6]/20 via-[#0B0F19]/95 to-indigo-950/40 border border-[#14B8A6]/40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#14B8A6]"></span>
            </span>
            <div className="text-xs font-bold text-white">
              {t('selectedCaptainAlert', { count: selectedCaptainIds.size })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onOpenBulkTopupForSelected}
              className="bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-xs h-8 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{t('bulkTopupSelected', { count: selectedCaptainIds.size })}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={onOpenBulkMessageForSelected}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-8 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('bulkMessageSelected', { count: selectedCaptainIds.size })}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onClearSelection}
              className="border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 text-xs h-8 px-3 rounded-xl transition-all cursor-pointer"
            >
              <span>{t('clearSelection')}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Fleet Data Table */}
      <Card className={styles.tableCard}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
              <p className="text-xs font-bold">{t('loadingTable')}</p>
            </div>
          ) : filteredCaptains.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
              <Car className="h-10 w-10 text-slate-600" />
              <p className="text-sm font-bold text-slate-300">{t('noCaptainsFound')}</p>
              <p className="text-xs text-slate-500">{t('noCaptainsFoundSub')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={cn("w-full text-xs", isArabic ? "text-right" : "text-left")}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className="py-4 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={onToggleSelectAll}
                        className={cn(
                          "w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer mx-auto",
                          allFilteredSelected
                            ? "bg-[#14B8A6] border-[#14B8A6] text-[#0B0F19]"
                            : someFilteredSelected
                            ? "bg-[#14B8A6]/30 border-[#14B8A6] text-[#14B8A6]"
                            : "border-white/20 bg-black/40 hover:border-white/40"
                        )}
                        title={allFilteredSelected ? t('deselectAllTooltip') : t('selectAllTooltip')}
                      >
                        {allFilteredSelected ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : someFilteredSelected ? (
                          <div className="w-2 h-0.5 bg-[#14B8A6] rounded" />
                        ) : null}
                      </button>
                    </th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colIdentity')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colVehicle')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colFlightMinutes')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colRankRating')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colVerification')}</th>
                    <th className="py-4 px-4 font-black text-slate-200">{t('colOperational')}</th>
                    <th className="py-4 px-4 font-black text-slate-200 text-center">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCaptains.map((captain) => (
                    <DriversTableRow
                      key={captain.id}
                      captain={captain}
                      isSelected={selectedCaptainIds.has(captain.id)}
                      onToggleSelect={onToggleSelectOne}
                      onInspect={onInspect}
                      onTopup={onTopup}
                      onSecurity={onSecurity}
                      onMessage={onMessage}
                      onToggleLanguage={onToggleLanguage}
                      isArabic={isArabic}
                      t={t}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

