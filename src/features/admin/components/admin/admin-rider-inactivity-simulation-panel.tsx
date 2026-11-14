'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { FlaskConical, X } from 'lucide-react';
import type { RiderUser } from './riders-management-panel';
import { SimulationRiderSelector } from './simulation/simulation-rider-selector';
import { SimulationRiderCard } from './simulation/simulation-rider-card';
import { SimulationControls } from './simulation/simulation-controls';
import { useRiderSimulation } from './simulation/use-rider-simulation';

interface AdminRiderInactivitySimulationPanelProps {
  riders: RiderUser[];
  selectedRiderId: string | null;
  onSelectRider: (riderId: string) => void;
  onRefresh: () => Promise<void> | void;
  onClose: () => void;
  isArabic?: boolean;
}

export function AdminRiderInactivitySimulationPanel({
  riders,
  selectedRiderId,
  onSelectRider,
  onRefresh,
  onClose,
  isArabic = true,
}: AdminRiderInactivitySimulationPanelProps) {
  const t = useTranslations('adminRiders');

  const [searchRider, setSearchRider] = useState('');
  const [customDays, setCustomDays] = useState('');

  // Filter riders for the quick selection pills
  const filteredRiders = useMemo(() => {
    const q = searchRider.toLowerCase().trim();
    if (!q) return riders.slice(0, 30);
    return riders.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.serial_id.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [riders, searchRider]);

  const selectedRider = useMemo(() => {
    if (!selectedRiderId) return riders[0] || null;
    return riders.find((r) => r.id === selectedRiderId) || riders[0] || null;
  }, [riders, selectedRiderId]);

  const {
    isSimulating,
    isChecking,
    isUpdatingStatus,
    lastResult,
    handleSimulateDays,
    handleUpdateStatus,
    handleRunNotificationCheck,
  } = useRiderSimulation({
    selectedRider,
    onRefresh,
    isArabic,
  });

  return (
    <div className="relative rounded-3xl border border-amber-500/35 bg-gradient-to-b from-amber-500/15 via-[#0B0F19]/95 to-[#0B0F19] p-4 sm:p-5 text-white shadow-2xl space-y-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-500/20">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-amber-200 flex items-center gap-2">
              <span>{t('simulationPanelTitle')}</span>
              <span className="text-[10px] bg-amber-500/20 border border-amber-400/40 text-amber-300 px-1.5 py-0.5 rounded-md font-mono font-black">
                {t('simulationBadge')}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t('simulationSubtitle')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={isArabic ? 'إغلاق المحاكاة' : 'Close simulation'}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 1. Rider Selector */}
      <SimulationRiderSelector
        searchRider={searchRider}
        setSearchRider={setSearchRider}
        filteredRiders={filteredRiders}
        selectedRiderId={selectedRider?.id || null}
        onSelectRider={onSelectRider}
        isArabic={isArabic}
      />

      {/* 2. Target Rider Card Info */}
      {selectedRider && (
        <SimulationRiderCard
          selectedRider={selectedRider}
          isUpdatingStatus={isUpdatingStatus}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* 3. Preset Time Simulation Controls & Action Banner */}
      <SimulationControls
        selectedRider={selectedRider}
        customDays={customDays}
        setCustomDays={setCustomDays}
        isSimulating={isSimulating}
        isChecking={isChecking}
        onSimulateDays={handleSimulateDays}
        onRunNotificationCheck={handleRunNotificationCheck}
        lastResult={lastResult}
      />
    </div>
  );
}
