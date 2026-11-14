'use client';

import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RiderUser } from '@/features/admin/types/rider-management';
import { RidersTableRow } from './riders-table-row';

interface RidersTableProps {
  loading: boolean;
  filteredRiders: RiderUser[];
  selectedRiderIds: Set<string>;
  onSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onOpenSimulation: (rider: RiderUser) => void;
  onInspect: (rider: RiderUser) => void;
  onSecurity: (rider: RiderUser) => void;
  onMessage: (rider: RiderUser) => void;
  isArabic: boolean;
  t: (key: string, values?: any) => string;
}

export function RidersTable({
  loading,
  filteredRiders,
  selectedRiderIds,
  onSelectAll,
  onToggleSelect,
  onOpenSimulation,
  onInspect,
  onSecurity,
  onMessage,
  isArabic,
  t,
}: RidersTableProps) {
  return (
    <Card className="rounded-2xl border border-white/10 bg-[#0B0F19]/95 overflow-hidden shadow-2xl backdrop-blur-xl">
      <CardContent className="p-0">
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-xs font-bold">{t('loadingTable')}</p>
          </div>
        ) : filteredRiders.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
            <ShieldCheck className="h-10 w-10 text-slate-600" />
            <p className="text-sm font-bold text-slate-300">{t('noRidersFound')}</p>
            <p className="text-xs text-slate-500">{t('noRidersFoundSub')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={cn("w-full text-xs", isArabic ? "text-right" : "text-left")}>
              <thead className="border-b border-white/10 bg-[#0F172A]/90 text-slate-200 text-xs font-black tracking-wide">
                <tr>
                  <th className="py-4 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredRiders.length > 0 && selectedRiderIds.size === filteredRiders.length}
                      onChange={onSelectAll}
                      className="rounded border-white/20 bg-black/60 text-cyan-500 focus:ring-cyan-500 h-4 w-4 cursor-pointer"
                      title={t('selectAll')}
                    />
                  </th>
                  <th className="py-4 px-4 font-black text-slate-200">{t('colIdentity')}</th>
                  <th className="py-4 px-4 font-black text-slate-200">{t('colLocation')}</th>
                  <th className="py-4 px-4 font-black text-slate-200">{t('colImmunity')}</th>
                  <th className="py-4 px-4 font-black text-slate-200">{t('colTrips')}</th>
                  <th className="py-4 px-4 font-black text-slate-200">{t('colCancellations')}</th>
                  <th className="py-4 px-4 font-black text-slate-200">{t('colStatus')}</th>
                  <th className="py-4 px-4 font-black text-slate-200">{t('colActivity')}</th>
                  <th className="py-4 px-4 font-black text-slate-200 text-center">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRiders.map((rider) => (
                  <RidersTableRow
                    key={rider.id}
                    rider={rider}
                    isSelected={selectedRiderIds.has(rider.id)}
                    onToggleSelect={() => onToggleSelect(rider.id)}
                    onOpenSimulation={() => onOpenSimulation(rider)}
                    onInspect={() => onInspect(rider)}
                    onSecurity={() => onSecurity(rider)}
                    onMessage={() => onMessage(rider)}
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
  );
}
