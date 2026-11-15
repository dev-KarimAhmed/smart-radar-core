'use client';

import React from 'react';
import {
  UserCheck,
  Plus,
  Loader2,
  RefreshCw,
  Search,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';
import {
  financialDelegatesCopy,
  type FinancialDelegate,
  type DelegateFormData,
  type DelegatesCopy,
} from './delegates/financial-delegates-types';
import { useFinancialDelegates } from './delegates/use-financial-delegates';
import { FinancialDelegateCard } from './delegates/financial-delegate-card';
import { FinancialDelegateModal } from './delegates/financial-delegate-modal';
import { FinancialDelegateDeleteDialog } from './delegates/financial-delegate-delete-dialog';

export * from './delegates/financial-delegates-types';
export * from './delegates/use-financial-delegates';
export * from './delegates/financial-delegate-card';
export * from './delegates/financial-delegate-modal';
export * from './delegates/financial-delegate-delete-dialog';

export function FinancialDelegatesPanel() {
  const { isArabic, direction } = useDashboardLanguage();
  const t: DelegatesCopy = financialDelegatesCopy[isArabic ? 'ar' : 'en'];

  const state = useFinancialDelegates({ t });

  return (
    <div className={cn("space-y-6 font-sans", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* 1. Header & Primary Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-emerald-400" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={state.fetchDelegates}
            disabled={state.loading}
            className="h-10 px-3.5 border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold rounded-xl"
          >
            <RefreshCw className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5", state.loading && "animate-spin text-emerald-400")} />
            <span>{t.refresh}</span>
          </Button>

          <Button
            type="button"
            onClick={state.handleOpenAdd}
            className="h-10 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addNew}</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">{t.totalDelegates}</span>
            <UserCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-white">{state.delegates.length}</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">{t.activeDelegates}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-emerald-300">{state.activeCount}</p>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300">{t.coveredGovs}</span>
            <MapPin className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-indigo-200">{state.coveredGovs} {t.govsUnit}</p>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-black/40 border border-white/5 p-3 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className={cn("w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2", isArabic ? "right-3" : "left-3")} />
          <Input
            value={state.searchQuery}
            onChange={(e) => state.setSearchQuery(e.target.value)}
            placeholder={t.searchPh}
            className={cn("bg-black/60 border-slate-800 text-white text-xs h-9 rounded-xl", isArabic ? "pr-9 pl-3" : "pl-9 pr-3")}
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={state.selectedCountryFilter}
            onChange={(e) => {
              state.setSelectedCountryFilter(e.target.value);
              state.setSelectedGovFilter('all');
            }}
            className="bg-black/60 border border-slate-800 text-white text-xs h-9 rounded-xl px-3 outline-none"
          >
            <option value="all">{t.allCountries}</option>
            <option value="1">{t.jordan}</option>
            <option value="2">{t.egypt}</option>
          </select>

          <select
            value={state.selectedGovFilter}
            onChange={(e) => state.setSelectedGovFilter(e.target.value)}
            className="bg-black/60 border border-slate-800 text-white text-xs h-9 rounded-xl px-3 outline-none"
          >
            <option value="all">{t.allGovs}</option>
            {state.governorates
              .filter((g) => state.selectedCountryFilter === 'all' || g.country_id === Number(state.selectedCountryFilter))
              .map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.name_ar}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* 4. Delegates Grid */}
      {state.loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
          <p className="mt-3 text-xs text-slate-400 font-bold">{t.loading}</p>
        </div>
      ) : state.filteredDelegates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-black text-white">{t.emptySearch}</h3>
          <p className="text-xs text-slate-400 mt-1">{t.emptySearchDesc}</p>
          <Button
            type="button"
            onClick={state.handleOpenAdd}
            className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 px-4 rounded-xl"
          >
            <Plus className={cn("w-4 h-4", isArabic ? "ml-1" : "mr-1")} />
            <span>{t.addNow}</span>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {state.filteredDelegates.map((delegate) => (
            <FinancialDelegateCard
              key={delegate.id}
              delegate={delegate}
              t={t}
              isArabic={isArabic}
              onToggle={state.handleToggle}
              onEdit={state.handleOpenEdit}
              onDelete={(d) => state.setDeleteTarget(d)}
            />
          ))}
        </div>
      )}

      {/* 5. Add / Edit Delegate Modal */}
      <FinancialDelegateModal
        isOpen={state.isModalOpen}
        onOpenChange={state.setIsModalOpen}
        editingDelegate={state.editingDelegate}
        formData={state.formData}
        setFormData={state.setFormData}
        governorates={state.governorates}
        districts={state.districts}
        formGovernorates={state.formGovernorates}
        formDistricts={state.formDistricts}
        saving={state.saving}
        onSave={state.handleSave}
        t={t}
        isArabic={isArabic}
        direction={direction}
      />

      {/* 6. Delete Confirmation Modal */}
      <FinancialDelegateDeleteDialog
        deleteTarget={state.deleteTarget}
        onOpenChange={(open) => !open && state.setDeleteTarget(null)}
        isDeleting={state.isDeleting}
        onDelete={state.handleDelete}
        t={t}
        isArabic={isArabic}
        direction={direction}
      />
    </div>
  );
}
