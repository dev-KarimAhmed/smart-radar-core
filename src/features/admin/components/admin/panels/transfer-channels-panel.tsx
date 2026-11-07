'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  Loader2,
  RefreshCw,
  Power,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import type { PaymentTransferChannel } from '@/features/admin/types/wallet-directory';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';
import { copy } from './transfer-channels-copy';
import { TransferChannelCard } from './transfer-channel-card';
import {
  TransferChannelFormDialog,
  TransferChannelDeleteDialog,
} from './transfer-channel-dialogs';

export { copy } from './transfer-channels-copy';
export { TransferChannelCard } from './transfer-channel-card';
export {
  TransferChannelFormDialog,
  TransferChannelDeleteDialog,
} from './transfer-channel-dialogs';

export function TransferChannelsPanel() {
  const { isArabic } = useDashboardLanguage();
  const t = copy[isArabic ? 'ar' : 'en'];
  const { toast } = useToast();
  const [channels, setChannels] = useState<PaymentTransferChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<PaymentTransferChannel | null>(null);
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    accountNumber: '',
    accountHolder: '',
    descriptionAr: '',
    descriptionEn: '',
    countryId: '1',
    isActive: true,
  });

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<PaymentTransferChannel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/transfer-channels');
      const data = await res.json();
      if (data.success && Array.isArray(data.channels)) {
        setChannels(data.channels);
      } else {
        toast({ title: t.fetchFailTitle, description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.networkErrorTitle, description: t.networkErrorDesc, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    void fetchChannels();
  }, [fetchChannels]);

  const handleOpenAdd = () => {
    setEditingChannel(null);
    setFormData({
      nameAr: '',
      nameEn: '',
      accountNumber: '',
      accountHolder: '',
      descriptionAr: '',
      descriptionEn: '',
      countryId: '1',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (channel: PaymentTransferChannel) => {
    setEditingChannel(channel);
    setFormData({
      nameAr: channel.nameAr,
      nameEn: channel.nameEn || '',
      accountNumber: channel.accountNumber,
      accountHolder: channel.accountHolder || '',
      descriptionAr: channel.descriptionAr || '',
      descriptionEn: channel.descriptionEn || '',
      countryId: channel.countryId ? String(channel.countryId) : '',
      isActive: channel.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAr.trim() || !formData.accountNumber.trim()) {
      toast({ title: t.incompleteDataTitle, description: t.incompleteDataDesc, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: editingChannel?.id,
        nameAr: formData.nameAr.trim(),
        nameEn: formData.nameEn.trim() || null,
        accountNumber: formData.accountNumber.trim(),
        accountHolder: formData.accountHolder.trim() || null,
        descriptionAr: formData.descriptionAr.trim() || null,
        descriptionEn: formData.descriptionEn.trim() || null,
        countryId: formData.countryId ? Number(formData.countryId) : null,
        isActive: formData.isActive,
      };

      const method = editingChannel ? 'PUT' : 'POST';
      const res = await adminFetch('/api/admin/transfer-channels', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: t.opSuccess, description: data.message, variant: 'default' });
        setIsModalOpen(false);
        void fetchChannels();
      } else {
        toast({ title: t.saveFailTitle, description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.saveFailTitle, description: t.unexpectedError, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (channel: PaymentTransferChannel) => {
    try {
      const res = await adminFetch('/api/admin/transfer-channels', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: channel.id, isActive: !channel.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t.updated, description: data.message });
        setChannels((prev) =>
          prev.map((c) => (c.id === channel.id ? { ...c, isActive: !channel.isActive } : c))
        );
      } else {
        toast({ title: t.toggleFail, description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.networkErrorTitle, description: t.networkErrorDesc, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await adminFetch(`/api/admin/transfer-channels?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t.deleted, description: data.message });
        setChannels((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        toast({ title: t.deleteFail, description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.deleteError, description: t.networkErrorDesc, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1500);
  };

  const activeCount = channels.filter((c) => c.isActive).length;
  const inactiveCount = channels.length - activeCount;

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
            onClick={fetchChannels}
            disabled={loading}
            className="h-10 px-3.5 border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold rounded-xl"
          >
            <RefreshCw className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5", loading && "animate-spin text-emerald-400")} />
            <span>{t.refresh}</span>
          </Button>

          <Button
            type="button"
            onClick={handleOpenAdd}
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
          <p className="mt-2 text-2xl font-mono font-black text-white">{channels.length}</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">{t.activeChannels}</span>
            <Power className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-emerald-300">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t.inactiveChannels}</span>
            <Power className="w-4 h-4 text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-slate-400">{inactiveCount}</p>
        </div>
      </div>

      {/* 3. Channels Cards Grid */}
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
          <p className="mt-3 text-xs text-slate-400 font-bold">{t.loading}</p>
        </div>
      ) : channels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-black text-white">{t.emptyTitle}</h3>
          <p className="text-xs text-slate-400 mt-1">{t.emptyDesc}</p>
          <Button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 px-4 rounded-xl"
          >
            <Plus className={cn("w-4 h-4", isArabic ? "ml-1" : "mr-1")} />
            <span>{t.addNow}</span>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {channels.map((channel) => (
            <TransferChannelCard
              key={channel.id}
              channel={channel}
              isArabic={isArabic}
              t={t}
              isCopied={copiedId === channel.id}
              onCopy={handleCopy}
              onToggleActive={handleToggleActive}
              onEdit={handleOpenEdit}
              onDeleteRequest={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* 4. Add/Edit Channel Modal */}
      <TransferChannelFormDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingChannel={editingChannel}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        saving={saving}
        isArabic={isArabic}
        t={t}
      />

      {/* 5. Delete Confirmation Modal */}
      <TransferChannelDeleteDialog
        deleteTarget={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        isArabic={isArabic}
        t={t}
      />
    </div>
  );
}
