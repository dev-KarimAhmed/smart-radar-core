import React from 'react';
import { useTranslations } from 'next-intl';
import { User, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { RiderUser } from '../riders-management-panel';

interface SimulationRiderSelectorProps {
  searchRider: string;
  setSearchRider: (v: string) => void;
  filteredRiders: RiderUser[];
  selectedRiderId: string | null;
  onSelectRider: (id: string) => void;
  isArabic: boolean;
}

export function SimulationRiderSelector({
  searchRider,
  setSearchRider,
  filteredRiders,
  selectedRiderId,
  onSelectRider,
  isArabic,
}: SimulationRiderSelectorProps) {
  const t = useTranslations('adminRiders');

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-amber-400" />
          <span>{t('simulationSelectRider')}</span>
        </label>
        <div className="relative w-full sm:w-64">
          <Search className="absolute start-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={searchRider}
            onChange={(e) => setSearchRider(e.target.value)}
            placeholder={t('simulationSearchRider')}
            className="h-8 text-xs bg-black/60 border-white/15 px-8 text-white rounded-xl placeholder:text-slate-500 focus:border-amber-400"
          />
        </div>
      </div>

      {/* Rider Pills List */}
      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-2xl border border-white/10 bg-black/40">
        {filteredRiders.map((r) => {
          const isSelected = selectedRiderId === r.id;
          const rRef = r.referral_activity;
          const rIsActive = rRef?.is_active ?? true;
          const rDays = rRef?.days_inactive ?? 0;

          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectRider(r.id)}
              className={cn(
                "text-xs font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 select-none",
                isSelected
                  ? "border-amber-400 bg-amber-500/30 text-amber-100 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  !rIsActive ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                )}
              />
              <span className="truncate max-w-[120px]">{r.full_name}</span>
              <span className="text-[10px] opacity-75 font-mono">
                ({rDays > 0 ? `${rDays}ي` : (isArabic ? 'نشط' : 'active')})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
