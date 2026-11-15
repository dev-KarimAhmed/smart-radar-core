import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import type { PaymentTransferChannel } from '@/features/admin/types/wallet-directory';
import type { TransferChannelsCopy } from './transfer-channels-copy';

export interface FormDataState {
  nameAr: string;
  nameEn: string;
  accountNumber: string;
  accountHolder: string;
  descriptionAr: string;
  descriptionEn: string;
  countryId: string;
  isActive: boolean;
}

const initialFormData: FormDataState = {
  nameAr: '',
  nameEn: '',
  accountNumber: '',
  accountHolder: '',
  descriptionAr: '',
  descriptionEn: '',
  countryId: '1',
  isActive: true,
};

export function useTransferChannelsState(t: TransferChannelsCopy) {
  const { toast } = useToast();
  const [channels, setChannels] = useState<PaymentTransferChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<PaymentTransferChannel | null>(null);
  const [formData, setFormData] = useState<FormDataState>(initialFormData);

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
    setFormData(initialFormData);
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

  return {
    channels,
    loading,
    saving,
    copiedId,
    isModalOpen,
    setIsModalOpen,
    editingChannel,
    formData,
    setFormData,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    activeCount,
    inactiveCount,
    fetchChannels,
    handleOpenAdd,
    handleOpenEdit,
    handleSave,
    handleToggleActive,
    handleDelete,
    handleCopy,
  };
}
