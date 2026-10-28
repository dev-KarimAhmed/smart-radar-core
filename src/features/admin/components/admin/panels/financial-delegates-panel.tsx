'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Check,
  Phone,
  MessageCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Search,
  MapPin,
  Building,
  Power,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';

export interface FinancialDelegate {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string | null;
  countryId?: number | null;
  governorateId?: number | null;
  governorateName?: string | null;
  districtId?: number | null;
  districtName?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt?: string;
}

const copy = {
  ar: {
    title: 'المناديب المالية وشحن الرصيد (بناءً على المحافظة والمنطقة)',
    subtitle: 'إضافة وتعديل وحذف أرقام المناديب المالية الميدانيين وتعيين تغطيتهم الجغرافية لكل محافظة أو منطقة لظهورها التلقائي للكابتن.',
    refresh: 'تحديث',
    addNew: 'إضافة مندوب مالي جديد',
    totalDelegates: 'إجمالي المناديب المسجلين',
    activeDelegates: 'المناديب الفاعلون (يظهرون للكباتن)',
    coveredGovs: 'المحافظات المغطاة',
    govsUnit: 'محافظات',
    searchPh: 'بحث بالاسم، الهاتف، المحافظة...',
    allCountries: 'كل الدول',
    jordan: 'الأردن',
    egypt: 'مصر',
    allGovs: 'كل المحافظات',
    loading: 'جاري تحميل دليل المناديب المالية...',
    emptySearch: 'لا توجد مناديب تطابق معايير البحث',
    emptySearchDesc: 'اضغط على زر "إضافة مندوب مالي جديد" لإضافة مندوب لمنطقة أو محافظة معينة.',
    addNow: 'إضافة مندوب الآن',
    districtLabel: 'منطقة:',
    govLabel: 'محافظة:',
    generalDelegate: 'مندوب عام لكافة المناطق',
    active: 'مفعل',
    inactive: 'معطل',
    phoneLabel: 'رقم الهاتف والتواصل:',
    call: 'اتصال',
    whatsapp: 'واتساب',
    directCall: 'اتصال مباشر',
    whatsappChat: 'محادثة واتساب',
    toggleAria: 'تفعيل أو تعطيل المندوب',
    visibleToCaptain: 'ظاهر في بطاقة الكابتن',
    hiddenFromCaptain: 'مخفي',
    edit: 'تعديل',
    delete: 'حذف',
    editModalTitle: 'تعديل بيانات المندوب المالي',
    addModalTitle: 'إضافة مندوب مالي جديد',
    modalDesc: 'عيّن المندوب ومحافظته أو منطقته ليظهر تلقائياً لكباتن تلك المنطقة في بطاقة الشحن المالي.',
    delegateName: 'اسم المندوب المالي *',
    delegateNamePh: 'مثال: أبو محمد - مندوب وادي السير',
    phoneInput: 'رقم الهاتف (للاتصال) *',
    whatsappInput: 'رقم الواتساب',
    whatsappPh: 'نفس الهاتف إن ترك فارغاً',
    country: 'الدولة',
    jordanOption: 'الأردن (Jordan)',
    egyptOption: 'مصر (Egypt)',
    gov: 'المحافظة',
    allGovsOption: 'عام (كل المحافظات)',
    district: 'المنطقة / اللواء',
    wholeGovOption: 'كامل المحافظة',
    notesLabel: 'ملاحظات / ساعات العمل والتواجد',
    notesPh: 'مثال: متواجد يومياً من 10 صباحاً حتى 10 مساءً للشحن المباشر نقداً.',
    activateNow: 'تفعيل المندوب فوراً لكباتن المنطقة',
    saveUpdate: 'تحديث وحفظ',
    addDelegate: 'إضافة المندوب',
    cancel: 'إلغاء',
    confirmDeleteTitle: 'تأكيد حذف المندوب المالي',
    confirmDeleteDesc: (name: string) => `هل أنت متأكد من حذف المندوب "${name}"؟ لن يظهر في بطاقة التواصل لكباتن منطقته.`,
    confirmDeleteBtn: 'نعم، حذف المندوب',
    back: 'تراجع',
    fetchFailTitle: 'فشل جلب المناديب',
    networkErrorTitle: 'خطأ شبكي',
    networkErrorDesc: 'تعذر الاتصال بالخادم',
    incompleteDataTitle: 'بيانات غير مكتملة',
    incompleteDataDesc: 'يرجى إدخال اسم المندوب ورقم هاتفه',
    opSuccess: 'نجاح العملية',
    saveFailTitle: 'فشل الحفظ',
    errorTitle: 'خطأ',
    saveErrorDesc: 'حدث خطأ أثناء حفظ التغييرات',
    updated: 'تم التحديث',
    toggleError: 'تعذر تعديل حالة المندوب',
    deleted: 'تم الحذف',
    deleteFail: 'فشل الحذف',
    deleteError: 'تعذر حذف المندوب',
  },
  en: {
    title: 'Financial Delegates & Cash Recharge (By Governorate & Sector)',
    subtitle: 'Manage on-field financial delegates and their geographic coverage for automatic display in captain recharge vouchers.',
    refresh: 'Refresh',
    addNew: 'Add New Financial Delegate',
    totalDelegates: 'Total Registered Delegates',
    activeDelegates: 'Active Delegates (Visible to Captains)',
    coveredGovs: 'Covered Governorates',
    govsUnit: 'governorates',
    searchPh: 'Search by name, phone, governorate...',
    allCountries: 'All Countries',
    jordan: 'Jordan',
    egypt: 'Egypt',
    allGovs: 'All Governorates',
    loading: 'Loading financial delegates directory...',
    emptySearch: 'No delegates match search criteria',
    emptySearchDesc: 'Click "Add New Financial Delegate" to assign a delegate to a specific sector or city.',
    addNow: 'Add Delegate Now',
    districtLabel: 'District:',
    govLabel: 'Gov:',
    generalDelegate: 'Universal Delegate (All Regions)',
    active: 'Active',
    inactive: 'Inactive',
    phoneLabel: 'Phone & Contact:',
    call: 'Call',
    whatsapp: 'WhatsApp',
    directCall: 'Direct Phone Call',
    whatsappChat: 'WhatsApp Chat',
    toggleAria: 'Toggle delegate status',
    visibleToCaptain: 'Visible to Captains',
    hiddenFromCaptain: 'Hidden',
    edit: 'Edit',
    delete: 'Delete',
    editModalTitle: 'Edit Financial Delegate',
    addModalTitle: 'Add New Financial Delegate',
    modalDesc: 'Assign delegate and target coverage area to appear automatically for local captains.',
    delegateName: 'Delegate Full Name *',
    delegateNamePh: 'e.g. Abu Mohammad - Wadi Al Seer Agent',
    phoneInput: 'Phone Number (Calls) *',
    whatsappInput: 'WhatsApp Number',
    whatsappPh: 'Same as phone if left empty',
    country: 'Country',
    jordanOption: 'Jordan (Jordan)',
    egyptOption: 'Egypt (Egypt)',
    gov: 'Governorate',
    allGovsOption: 'Universal (All Governorates)',
    district: 'District / Area',
    wholeGovOption: 'Entire Governorate',
    notesLabel: 'Notes / Working Hours & Location',
    notesPh: 'e.g. Available daily 10 AM to 10 PM for direct cash recharge.',
    activateNow: 'Activate delegate immediately for captains',
    saveUpdate: 'Save Changes',
    addDelegate: 'Add Delegate',
    cancel: 'Cancel',
    confirmDeleteTitle: 'Confirm Delegate Deletion',
    confirmDeleteDesc: (name: string) => `Are you sure you want to delete delegate "${name}"? They will no longer appear for local captains.`,
    confirmDeleteBtn: 'Yes, Delete Delegate',
    back: 'Go Back',
    fetchFailTitle: 'Failed to load delegates',
    networkErrorTitle: 'Network Error',
    networkErrorDesc: 'Could not reach server',
    incompleteDataTitle: 'Incomplete Details',
    incompleteDataDesc: 'Please enter delegate name and phone number',
    opSuccess: 'Operation Successful',
    saveFailTitle: 'Save Failed',
    errorTitle: 'Error',
    saveErrorDesc: 'An error occurred while saving changes',
    updated: 'Updated',
    toggleError: 'Could not toggle delegate status',
    deleted: 'Deleted',
    deleteFail: 'Deletion Failed',
    deleteError: 'Could not delete delegate',
  },
} as const;

export function FinancialDelegatesPanel() {
  const { isArabic, direction } = useDashboardLanguage();
  const t = copy[isArabic ? 'ar' : 'en'];
  const { toast } = useToast();
  const [delegates, setDelegates] = useState<FinancialDelegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('all');
  const [selectedGovFilter, setSelectedGovFilter] = useState('all');

  // Directory Data
  const [governorates, setGovernorates] = useState<Array<{ id: number; name_ar: string; country_id: number }>>([]);
  const [districts, setDistricts] = useState<Array<{ id: number; name_ar: string; governorate_id: number }>>([]);

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

  // Fetch Directory (Govs & Districts)
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

  // Filtered List
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
            onClick={fetchDelegates}
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
            <UserCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-white">{delegates.length}</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">{t.activeDelegates}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-emerald-300">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300">{t.coveredGovs}</span>
            <MapPin className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-indigo-200">{coveredGovs} {t.govsUnit}</p>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-black/40 border border-white/5 p-3 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className={cn("w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2", isArabic ? "right-3" : "left-3")} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPh}
            className={cn("bg-black/60 border-slate-800 text-white text-xs h-9 rounded-xl", isArabic ? "pr-9 pl-3" : "pl-9 pr-3")}
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedCountryFilter}
            onChange={(e) => {
              setSelectedCountryFilter(e.target.value);
              setSelectedGovFilter('all');
            }}
            className="bg-black/60 border border-slate-800 text-white text-xs h-9 rounded-xl px-3 outline-none"
          >
            <option value="all">{t.allCountries}</option>
            <option value="1">{t.jordan}</option>
            <option value="2">{t.egypt}</option>
          </select>

          <select
            value={selectedGovFilter}
            onChange={(e) => setSelectedGovFilter(e.target.value)}
            className="bg-black/60 border border-slate-800 text-white text-xs h-9 rounded-xl px-3 outline-none"
          >
            <option value="all">{t.allGovs}</option>
            {governorates
              .filter((g) => selectedCountryFilter === 'all' || g.country_id === Number(selectedCountryFilter))
              .map((g) => (
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
          {filteredDelegates.map((delegate) => {
            const hasSpecificGeo = Boolean(delegate.governorateName || delegate.districtName);

            return (
              <div
                key={delegate.id}
                className={cn(
                  "relative rounded-2xl border p-5 transition-all flex flex-col justify-between gap-4",
                  delegate.isActive
                    ? "border-emerald-500/25 bg-gradient-to-b from-[#0A1120] to-[#050912] shadow-lg shadow-black/40"
                    : "border-slate-800/80 bg-black/40 opacity-70"
                )}
              >
                <div>
                  {/* Top Row: Delegate Name & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-white truncate">{delegate.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {delegate.districtName ? (
                          <Badge variant="outline" className="text-[11px] font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            <span>{t.districtLabel} {delegate.districtName}</span>
                          </Badge>
                        ) : null}
                        {delegate.governorateName ? (
                          <Badge variant="outline" className="text-[11px] font-bold border-cyan-500/30 bg-cyan-950/40 text-cyan-300 flex items-center gap-1">
                            <Building className="w-3 h-3 text-cyan-400" />
                            <span>{t.govLabel} {delegate.governorateName}</span>
                          </Badge>
                        ) : null}
                        {!hasSpecificGeo ? (
                          <Badge variant="outline" className="text-[11px] font-bold border-indigo-500/30 bg-indigo-950/40 text-indigo-300">
                            {t.generalDelegate}
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0",
                        delegate.isActive
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      )}
                    >
                      {delegate.isActive ? t.active : t.inactive}
                    </Badge>
                  </div>

                  {/* Phone & Contact Test Buttons */}
                  <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-bold">{t.phoneLabel}</span>
                      <strong className="font-mono text-sm font-black text-amber-300 block truncate" dir="ltr">
                        +{delegate.phone}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${delegate.phone}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs font-bold text-slate-200 transition"
                        title={t.directCall}
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t.call}</span>
                      </a>
                      <a
                        href={`https://wa.me/${delegate.whatsapp || delegate.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-xs font-black text-white transition shadow-sm"
                        title={t.whatsappChat}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{t.whatsapp}</span>
                      </a>
                    </div>
                  </div>

                  {/* Notes / Availability */}
                  {delegate.notes && (
                    <p className="mt-2.5 text-xs text-slate-400 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                      {delegate.notes}
                    </p>
                  )}
                </div>

                {/* Bottom Row: Actions */}
                <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={delegate.isActive}
                      onCheckedChange={() => void handleToggle(delegate)}
                      aria-label={t.toggleAria}
                    />
                    <span className="text-xs text-slate-400">{delegate.isActive ? t.visibleToCaptain : t.hiddenFromCaptain}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(delegate)}
                      className="h-8 px-2.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                      <Edit2 className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
                      <span>{t.edit}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(delegate)}
                      className="h-8 px-2.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
                    >
                      <Trash2 className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
                      <span>{t.delete}</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Add / Edit Delegate Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-[#080E1C] border border-slate-800 text-white p-6 rounded-3xl" dir={direction}>
          <DialogHeader className={isArabic ? "text-right" : "text-left"}>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <span>{editingDelegate ? t.editModalTitle : t.addModalTitle}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {t.modalDesc}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-3">
            <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
              <Label className="text-xs font-bold text-slate-300">{t.delegateName}</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t.delegateNamePh}
                className="bg-black/60 border-slate-700 text-white text-xs h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
                <Label className="text-xs font-bold text-slate-300">{t.phoneInput}</Label>
                <Input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="962790000001"
                  className="bg-black/60 border-slate-700 text-amber-300 font-mono text-xs h-10 rounded-xl"
                  dir="ltr"
                />
              </div>

              <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
                <Label className="text-xs font-bold text-slate-300">{t.whatsappInput}</Label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder={t.whatsappPh}
                  className="bg-black/60 border-slate-700 text-white font-mono text-xs h-10 rounded-xl"
                  dir="ltr"
                />
              </div>
            </div>

            <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
              <Label className="text-xs font-bold text-slate-300">{t.country}</Label>
              <select
                value={formData.countryId}
                onChange={(e) => {
                  const newCId = e.target.value;
                  setFormData({
                    ...formData,
                    countryId: newCId,
                    governorateId: '',
                    governorateName: '',
                    districtId: '',
                    districtName: '',
                  });
                }}
                className="w-full bg-black/60 border border-slate-700 text-white text-xs h-10 rounded-xl px-3 outline-none"
              >
                <option value="1">{t.jordanOption}</option>
                <option value="2">{t.egyptOption}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
                <Label className="text-xs font-bold text-slate-300">{t.gov}</Label>
                <select
                  value={formData.governorateId}
                  onChange={(e) => {
                    const gId = e.target.value;
                    const found = governorates.find((g) => String(g.id) === gId);
                    setFormData({
                      ...formData,
                      governorateId: gId,
                      governorateName: found ? found.name_ar : '',
                      districtId: '',
                      districtName: '',
                    });
                  }}
                  className="w-full bg-black/60 border border-slate-700 text-white text-xs h-10 rounded-xl px-3 outline-none"
                >
                  <option value="">{t.allGovsOption}</option>
                  {formGovernorates.map((g) => (
                    <option key={g.id} value={String(g.id)}>
                      {g.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
                <Label className="text-xs font-bold text-slate-300">{t.district}</Label>
                <select
                  value={formData.districtId}
                  disabled={!formData.governorateId}
                  onChange={(e) => {
                    const dId = e.target.value;
                    const found = districts.find((d) => String(d.id) === dId);
                    setFormData({
                      ...formData,
                      districtId: dId,
                      districtName: found ? found.name_ar : '',
                    });
                  }}
                  className="w-full bg-black/60 border border-slate-700 text-white text-xs h-10 rounded-xl px-3 outline-none disabled:opacity-40"
                >
                  <option value="">{t.wholeGovOption}</option>
                  {formDistricts.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name_ar}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
              <Label className="text-xs font-bold text-slate-300">{t.notesLabel}</Label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t.notesPh}
                className="w-full bg-black/60 border border-slate-700 text-white text-xs p-3 rounded-xl outline-none"
              />
            </div>

            <div className="flex items-center justify-between border border-white/10 bg-white/[0.03] p-3 rounded-xl">
              <span className="text-xs font-bold text-slate-200">{t.activateNow}</span>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(val) => setFormData({ ...formData, isActive: val })}
              />
            </div>

            <DialogFooter className="gap-2 sm:justify-start pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-10 px-6 rounded-xl flex items-center gap-1.5"
              >
                {saving ? <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-1" : "mr-1")} /> : <Check className={cn("w-4 h-4", isArabic ? "ml-1" : "mr-1")} />}
                <span>{editingDelegate ? t.saveUpdate : t.addDelegate}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs h-10 rounded-xl"
              >
                {t.cancel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm bg-[#0B0F19] border border-rose-500/30 text-white p-6 rounded-3xl" dir={direction}>
          <DialogHeader className={isArabic ? "text-right" : "text-left"}>
            <DialogTitle className="text-base font-black text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{t.confirmDeleteTitle}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300 leading-relaxed mt-2">
              {t.confirmDeleteDesc(deleteTarget?.name || '')}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:justify-start pt-4">
            <Button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs h-10 px-5 rounded-xl flex items-center gap-1.5"
            >
              {isDeleting ? <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-1" : "mr-1")} /> : <Trash2 className={cn("w-4 h-4", isArabic ? "ml-1" : "mr-1")} />}
              <span>{t.confirmDeleteBtn}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
              className="text-slate-400 hover:text-white text-xs h-10 rounded-xl"
            >
              {t.back}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
