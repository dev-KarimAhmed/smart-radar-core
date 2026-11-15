'use client';

import React from 'react';
import {
  CreditCard,
  Plus,
  Loader2,
  RefreshCw,
  Power,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';
import { transferChannelsCopy } from './transfer-channels/transfer-channels-copy';
import { useTransferChannelsState } from './transfer-channels/use-transfer-channels-state';
import { TransferChannelCard } from './transfer-channels/transfer-channel-card';
import { TransferChannelModal } from './transfer-channels/transfer-channel-modal';
import { TransferChannelDeleteDialog } from './transfer-channels/transfer-channel-delete-dialog';

export function TransferChannelsPanel() {
  const { isArabic } = useDashboardLanguage();
  const t = transferChannelsCopy[isArabic ? 'ar' : 'en'];
  const state = useTransferChannelsState(t);

  return (
    <div className={cn("space-y-6 font-sans", isArabic ? "text-right" : "text-left")} dir={isArabic ? "rtl" : "ltr"}>
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-emerald-400" />
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
            onClick={state.fetchChannels}
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
            <span className="text-xs font-bold text-slate-400">{t.totalChannels}</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-white">{state.channels.length}</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">{t.activeChannels}</span>
            <Power className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-emerald-300">{state.activeCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t.inactiveChannels}</span>
            <Power className="w-4 h-4 text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-slate-400">{state.inactiveCount}</p>
        </div>
      </div>

      {/* 3. Channels Cards Grid */}
      {state.loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
          <p className="mt-3 text-xs text-slate-400 font-bold">{t.loading}</p>
        </div>
      ) : state.channels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-black text-white">{t.emptyTitle}</h3>
          <p className="text-xs text-slate-400 mt-1">{t.emptyDesc}</p>
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
          {state.channels.map((channel) => (
            <TransferChannelCard
              key={channel.id}
              channel={channel}
              t={t}
              isArabic={isArabic}
              copiedId={state.copiedId}
              onCopy={state.handleCopy}
              onToggleActive={state.handleToggleActive}
              onEdit={state.handleOpenEdit}
              onDelete={(target) => state.setDeleteTarget(target)}
            />
          ))}
        </div>
      )}

      {/* 4. Add/Edit Channel Modal */}
      <TransferChannelModal
        isOpen={state.isModalOpen}
        onOpenChange={state.setIsModalOpen}
        editingChannel={state.editingChannel}
        formData={state.formData}
        setFormData={state.setFormData}
        saving={state.saving}
        onSave={state.handleSave}
        t={t}
        isArabic={isArabic}
      />

      {/* 5. Delete Confirmation Modal */}
      <TransferChannelDeleteDialog
        deleteTarget={state.deleteTarget}
        onOpenChange={(open) => !open && state.setDeleteTarget(null)}
        isDeleting={state.isDeleting}
        onDelete={state.handleDelete}
        t={t}
        isArabic={isArabic}
      />
    </div>
  );
}

export default TransferChannelsPanel;
