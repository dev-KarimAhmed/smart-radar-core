'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import type { FinancialDelegate, DelegateFormData, DelegatesCopy } from './financial-delegates-types';

interface UseFinancialDelegatesProps {
  t: DelegatesCopy;
}

export function useFinancialDelegates({ t }: UseFinancialDelegatesProps) {
  const { toast } = useToast();
  const [delegates, setDelegates] = useState<FinancialDelegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('all');
  const [selectedGovFilter, setSelectedGovFilter] = useState('all');

  const [governorates, setGovernorates] = useState<Array<{ id: number; name_ar: string; country_id: number }>>([]);
  const [districts, setDistricts] = useState<Array<{ id: number; name_ar: string; governorate_id: number }>>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelegate, setEditingDelegate] = useState<FinancialDelegate | null>(null);
  const [formData, setFormData] = useState<DelegateFormData>({
    name: '',
    phone: '',
    whatsapp: '',
    countryId: '1',
    governorateId: '',
    governorateName: '',
    districtId: '',
    districtName: '',
    notes: '',
    isActive: true,
  });

  const [deleteTarget, setDeleteTarget] = useState<FinancialDelegate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDirectory = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/financial-delegates?type=directory');
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.governorates)) setGovernorates(data.governorates);
        if (Array.isArray(data.districts)) setDistricts(data.districts);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  const fetchDelegates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/financial-delegates');
      const data = await res.json();
      if (data.success && Array.isArray(data.delegates)) {
        setDelegates(data.delegates);
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
    void fetchDirectory();
    void fetchDelegates();
  }, [fetchDirectory, fetchDelegates]);

  const handleOpenAdd = () => {
    setEditingDelegate(null);
    setFormData({
      name: '',
      phone: '',
      whatsapp: '',
      countryId: '1',
      governorateId: '',
      governorateName: '',
      districtId: '',
      districtName: '',
      notes: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (delegate: FinancialDelegate) => {
    setEditingDelegate(delegate);
    setFormData({
      name: delegate.name,
      phone: delegate.phone,
      whatsapp: delegate.whatsapp || '',
      countryId: delegate.countryId ? String(delegate.countryId) : '1',
      governorateId: delegate.governorateId ? String(delegate.governorateId) : '',
      governorateName: delegate.governorateName || '',
      districtId: delegate.districtId ? String(delegate.districtId) : '',
      districtName: delegate.districtName || '',
      notes: delegate.notes || '',
      isActive: delegate.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({ title: t.incompleteDataTitle, description: t.incompleteDataDesc, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: editingDelegate?.id,
        name: formData.name.trim(),
        phone: formData.phone.trim().replace(/^\+/, ''),
        whatsapp: formData.whatsapp.trim() ? formData.whatsapp.trim().replace(/^\+/, '') : null,
        countryId: formData.countryId ? Number(formData.countryId) : 1,
        governorateId: formData.governorateId ? Number(formData.governorateId) : null,
        governorateName: formData.governorateName.trim() || null,
        districtId: formData.districtId ? Number(formData.districtId) : null,
        districtName: formData.districtName.trim() || null,
        notes: formData.notes.trim() || null,
        isActive: formData.isActive,
      };

      const method = editingDelegate ? 'PUT' : 'POST';
      const res = await adminFetch('/api/admin/financial-delegates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: t.opSuccess, description: data.message, variant: 'default' });
        setIsModalOpen(false);
        void fetchDelegates();
      } else {
        toast({ title: t.saveFailTitle, description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.errorTitle, description: t.saveErrorDesc, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (delegate: FinancialDelegate) => {
    try {
      const res = await adminFetch('/api/admin/financial-delegates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: delegate.id, isActive: !delegate.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t.updated, description: data.message });
        setDelegates((prev) =>
          prev.map((d) => (d.id === delegate.id ? { ...d, isActive: !delegate.isActive } : d))
        );
      } else {
        toast({ title: t.errorTitle, description: t.toggleError, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.networkErrorTitle, description: t.networkErrorDesc, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await adminFetch(`/api/admin/financial-delegates?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t.deleted, description: data.message });
        setDelegates((prev) => prev.filter((d) => d.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        toast({ title: t.deleteFail, description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.errorTitle, description: t.deleteError, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDelegates = delegates.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery) ||
      (d.governorateName && d.governorateName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.districtName && d.districtName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCountry =
      selectedCountryFilter === 'all' || String(d.countryId) === selectedCountryFilter;

    const matchesGov =
      selectedGovFilter === 'all' || String(d.governorateId) === selectedGovFilter;

    return matchesSearch && matchesCountry && matchesGov;
  });

  const formGovernorates = governorates.filter(
    (g) => g.country_id === Number(formData.countryId)
  );

  const formDistricts = districts.filter(
    (d) => String(d.governorate_id) === formData.governorateId
  );

  const activeCount = delegates.filter((d) => d.isActive).length;
  const coveredGovs = new Set(delegates.filter((d) => d.isActive && d.governorateName).map((d) => d.governorateName)).size;

  return {
    delegates,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    selectedCountryFilter,
    setSelectedCountryFilter,
    selectedGovFilter,
    setSelectedGovFilter,
    governorates,
    districts,
    isModalOpen,
    setIsModalOpen,
    editingDelegate,
    formData,
    setFormData,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    fetchDelegates,
    handleOpenAdd,
    handleOpenEdit,
    handleSave,
    handleToggle,
    handleDelete,
    filteredDelegates,
    formGovernorates,
    formDistricts,
    activeCount,
    coveredGovs,
  };
}
