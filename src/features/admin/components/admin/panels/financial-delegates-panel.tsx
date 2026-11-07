'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Plus,
  Loader2,
  RefreshCw,
  Search,
  MapPin,
  Building,
  Power,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';
import {
  type FinancialDelegate,
  copy,
} from './financial-delegates-copy';
import { FinancialDelegateCard } from './financial-delegate-card';
import {
  FinancialDelegateFormDialog,
  FinancialDelegateDeleteDialog,
} from './financial-delegate-dialogs';

export type { FinancialDelegate } from './financial-delegates-copy';
export { copy } from './financial-delegates-copy';
export { FinancialDelegateCard } from './financial-delegate-card';
export {
  FinancialDelegateFormDialog,
  FinancialDelegateDeleteDialog,
} from './financial-delegate-dialogs';

interface Governorate {
  id: number;
  country_id: number;
  name_ar: string;
}

interface District {
  id: number;
  governorate_id: number;
  name_ar: string;
}

export function FinancialDelegatesPanel() {
  const { isArabic, direction } = useDashboardLanguage();
  const t = copy[isArabic ? 'ar' : 'en'];
  const { toast } = useToast();

  const [delegates, setDelegates] = useState<FinancialDelegate[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGov, setFilterGov] = useState<string>('');
  const [filterCountry, setFilterCountry] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelegate, setEditingDelegate] = useState<FinancialDelegate | null>(null);
  const [formData, setFormData] = useState({
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

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<FinancialDelegate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/financial-delegates');
      const data = await res.json();
      if (data.success) {
        setDelegates(data.delegates || []);
        setGovernorates(data.governorates || []);
        setDistricts(data.districts || []);
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
    void fetchData();
  }, [fetchData]);

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
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim() || null,
        countryId: formData.countryId ? Number(formData.countryId) : null,
        governorateId: formData.governorateId ? Number(formData.governorateId) : null,
        districtId: formData.districtId ? Number(formData.districtId) : null,
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
        toast({ title: t.opSuccess, description: data.message });
        setIsModalOpen(false);
        void fetchData();
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
        toast({ title: t.errorTitle, description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.errorTitle, description: t.toggleError, variant: 'destructive' });
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
      toast({ title: t.deleteFail, description: t.deleteError, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Delegates List
  const filteredDelegates = delegates.filter((d) => {
    if (filterCountry !== 'all') {
      if (d.countryId && String(d.countryId) !== filterCountry) return false;
    }
    if (filterGov) {
      if (d.governorateId && String(d.governorateId) !== filterGov) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = d.name.toLowerCase().includes(q);
      const matchPhone = d.phone.includes(q);
      const matchGov = d.governorateName?.toLowerCase().includes(q);
      const matchDist = d.districtName?.toLowerCase().includes(q);
      return matchName || matchPhone || matchGov || matchDist;
    }
    return true;
  });

  const activeCount = delegates.filter((d) => d.isActive).length;
  const coveredGovs = new Set(delegates.map((d) => d.governorateId).filter(Boolean)).size;

  return (
    <div className={cn("space-y-6 font-sans", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* 1. Header & Controls */}
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
            onClick={fetchData}
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
            <span className="text-xs font-bold text-slate-400">{t.totalDelegates}</span>
            <Building className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-white">{delegates.length}</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">{t.activeDelegates}</span>
            <Power className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-emerald-300">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300">{t.coveredGovs}</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-amber-300">{coveredGovs} <span className="text-xs font-normal text-slate-400">{t.govsUnit}</span></p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-black/40 border border-white/10 p-3 rounded-2xl">
        <div className="relative flex-1">
          <Search className={cn("w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-500", isArabic ? "right-3" : "left-3")} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPh}
            className={cn("bg-black/60 border-slate-800 text-xs text-white placeholder:text-slate-500 rounded-xl h-10", isArabic ? "pr-9" : "pl-9")}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="h-10 px-3 rounded-xl bg-black/60 border border-slate-800 text-xs font-bold text-white outline-none"
          >
            <option value="all">{t.allCountries}</option>
            <option value="1">{t.jordan}</option>
            <option value="2">{t.egypt}</option>
          </select>

          <select
            value={filterGov}
            onChange={(e) => setFilterGov(e.target.value)}
            className="h-10 px-3 rounded-xl bg-black/60 border border-slate-800 text-xs font-bold text-white outline-none"
          >
            <option value="">{t.allGovs}</option>
            {governorates.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.name_ar}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Delegates Grid */}
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
          <p className="mt-3 text-xs text-slate-400 font-bold">{t.loading}</p>
        </div>
      ) : filteredDelegates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-black text-white">{t.emptySearch}</h3>
          <p className="text-xs text-slate-400 mt-1">{t.emptySearchDesc}</p>
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
          {filteredDelegates.map((delegate) => (
            <FinancialDelegateCard
              key={delegate.id}
              delegate={delegate}
              isArabic={isArabic}
              t={t}
              onToggle={handleToggle}
              onEdit={handleOpenEdit}
              onDeleteRequest={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* 5. Add / Edit Delegate Modal */}
      <FinancialDelegateFormDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingDelegate={editingDelegate}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        saving={saving}
        governorates={governorates}
        districts={districts}
        isArabic={isArabic}
        direction={direction}
        t={t}
      />

      {/* 6. Delete Confirmation Modal */}
      <FinancialDelegateDeleteDialog
        deleteTarget={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        isArabic={isArabic}
        direction={direction}
        t={t}
      />
    </div>
  );
}
