'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Phone,
  MessageCircle,
  MapPin,
  Check,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  Layers,
  Building,
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
import type { FinancialDelegate } from '@/features/admin/types/wallet-directory';
import { cn } from '@/lib/utils';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

interface GeoEntity {
  id: number;
  name_ar: string;
  name_en?: string;
  country_id?: number;
  governorate_id?: number;
}

export function FinancialDelegatesPanel() {
  const { direction, isArabic } = useDashboardLanguage();
  const { toast } = useToast();
  const [delegates, setDelegates] = useState<FinancialDelegate[]>([]);
  const [countries, setCountries] = useState<GeoEntity[]>([]);
  const [governorates, setGovernorates] = useState<GeoEntity[]>([]);
  const [districts, setDistricts] = useState<GeoEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('all');
  const [selectedGovFilter, setSelectedGovFilter] = useState<string>('all');

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

  const fetchDelegates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/financial-delegates');
      const data = await res.json();
      if (data.success) {
        setDelegates(data.delegates || []);
        setCountries(data.countries || []);
        setGovernorates(data.governorates || []);
        setDistricts(data.districts || []);
      } else {
        toast({ title: 'فشل جلب المناديب', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ شبكي', description: 'تعذر الاتصال بالخادم', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchDelegates();
  }, [fetchDelegates]);

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
      whatsapp: delegate.whatsapp || delegate.phone,
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

  // Filtered Governorates based on selected form country
  const formGovernorates = useMemo(() => {
    const cId = Number(formData.countryId);
    if (!cId) return governorates;
    return governorates.filter((g) => g.country_id === cId);
  }, [governorates, formData.countryId]);

  // Filtered Districts based on selected form governorate
  const formDistricts = useMemo(() => {
    const gId = Number(formData.governorateId);
    if (!gId) return [];
    return districts.filter((d) => d.governorate_id === gId);
  }, [districts, formData.governorateId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({ title: 'بيانات غير مكتملة', description: 'يرجى إدخال اسم المندوب ورقم هاتفه', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const action = editingDelegate ? 'update' : 'create';
      const payload = {
        action,
        id: editingDelegate?.id,
        name: formData.name,
        phone: formData.phone,
        whatsapp: formData.whatsapp || formData.phone,
        countryId: Number(formData.countryId) || 1,
        governorateId: formData.governorateId ? Number(formData.governorateId) : null,
        governorateName: formData.governorateName || undefined,
        districtId: formData.districtId ? Number(formData.districtId) : null,
        districtName: formData.districtName || undefined,
        notes: formData.notes,
        isActive: formData.isActive,
      };

      const res = await adminFetch('/api/admin/financial-delegates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: 'نجاح العملية', description: data.message, variant: 'success' });
        setIsModalOpen(false);
        if (Array.isArray(data.delegates)) {
          setDelegates(data.delegates);
        } else {
          void fetchDelegates();
        }
      } else {
        toast({ title: 'فشل الحفظ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حفظ التغييرات', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (delegate: FinancialDelegate) => {
    try {
      const res = await adminFetch('/api/admin/financial-delegates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id: delegate.id }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.delegates)) {
        setDelegates(data.delegates);
        toast({ title: 'تم التحديث', description: data.message });
      }
    } catch {
      toast({ title: 'خطأ', description: 'تعذر تعديل حالة المندوب', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await adminFetch('/api/admin/financial-delegates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: deleteTarget.id }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.delegates)) {
        setDelegates(data.delegates);
        toast({ title: 'تم الحذف', description: data.message });
        setDeleteTarget(null);
      } else {
        toast({ title: 'فشل الحذف', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'تعذر حذف المندوب', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter delegates list
  const filteredDelegates = useMemo(() => {
    return delegates.filter((d) => {
      if (selectedCountryFilter !== 'all') {
        const cId = Number(selectedCountryFilter);
        if (d.countryId && d.countryId !== cId) return false;
      }
      if (selectedGovFilter !== 'all') {
        const gId = Number(selectedGovFilter);
        if (d.governorateId && d.governorateId !== gId) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName = d.name.toLowerCase().includes(q);
        const inPhone = d.phone.includes(q);
        const inGov = (d.governorateName || '').toLowerCase().includes(q);
        const inDist = (d.districtName || '').toLowerCase().includes(q);
        return inName || inPhone || inGov || inDist;
      }
      return true;
    });
  }, [delegates, selectedCountryFilter, selectedGovFilter, searchQuery]);

  const activeCount = delegates.filter((d) => d.isActive).length;
  const coveredGovs = new Set(delegates.filter((d) => d.isActive && d.governorateName).map((d) => d.governorateName)).size;

  return (
    <div className={cn("space-y-6 font-sans", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* 1. Header & Primary Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-emerald-400" />
            <span>المناديب المالية وشحن الرصيد (بناءً على المحافظة والمنطقة)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            إضافة وتعديل وحذف أرقام المناديب المالية الميدانيين وتعيين تغطيتهم الجغرافية لكل محافظة أو منطقة لظهورها التلقائي للكابتن.
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
            <RefreshCw className={cn("w-4 h-4 ml-1.5", loading && "animate-spin text-emerald-400")} />
            <span>تحديث</span>
          </Button>

          <Button
            type="button"
            onClick={handleOpenAdd}
            className="h-10 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مندوب مالي جديد</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي المناديب المسجلين</span>
            <UserCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-white">{delegates.length}</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">المناديب الفاعلون (يظهرون للكباتن)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-emerald-300">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300">المحافظات المغطاة</span>
            <MapPin className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-indigo-200">{coveredGovs} محافظات</p>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-black/40 border border-white/5 p-3 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الهاتف، المحافظة..."
            className="bg-black/60 border-slate-800 text-white text-xs h-9 pr-9 pl-3 rounded-xl"
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
            <option value="all">كل الدول</option>
            <option value="1">الأردن</option>
            <option value="2">مصر</option>
          </select>

          <select
            value={selectedGovFilter}
            onChange={(e) => setSelectedGovFilter(e.target.value)}
            className="bg-black/60 border border-slate-800 text-white text-xs h-9 rounded-xl px-3 outline-none"
          >
            <option value="all">كل المحافظات</option>
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
          <p className="mt-3 text-xs text-slate-400 font-bold">جاري تحميل دليل المناديب المالية...</p>
        </div>
      ) : filteredDelegates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-black text-white">لا توجد مناديب تطابق معايير البحث</h3>
          <p className="text-xs text-slate-400 mt-1">اضغط على زر "إضافة مندوب مالي جديد" لإضافة مندوب لمنطقة أو محافظة معينة.</p>
          <Button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 px-4 rounded-xl"
          >
            <Plus className="w-4 h-4 ml-1" />
            <span>إضافة مندوب الآن</span>
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
                            <span>منطقة: {delegate.districtName}</span>
                          </Badge>
                        ) : null}
                        {delegate.governorateName ? (
                          <Badge variant="outline" className="text-[11px] font-bold border-cyan-500/30 bg-cyan-950/40 text-cyan-300 flex items-center gap-1">
                            <Building className="w-3 h-3 text-cyan-400" />
                            <span>محافظة: {delegate.governorateName}</span>
                          </Badge>
                        ) : null}
                        {!hasSpecificGeo ? (
                          <Badge variant="outline" className="text-[11px] font-bold border-indigo-500/30 bg-indigo-950/40 text-indigo-300">
                            مندوب عام لكافة المناطق
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
                      {delegate.isActive ? 'مفعل' : 'معطل'}
                    </Badge>
                  </div>

                  {/* Phone & Contact Test Buttons */}
                  <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-bold">رقم الهاتف والتواصل:</span>
                      <strong className="font-mono text-sm font-black text-amber-300 block truncate" dir="ltr">
                        +{delegate.phone}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${delegate.phone}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs font-bold text-slate-200 transition"
                        title="اتصال مباشر"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>اتصال</span>
                      </a>
                      <a
                        href={`https://wa.me/${delegate.whatsapp || delegate.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-xs font-black text-white transition shadow-sm"
                        title="محادثة واتساب"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>واتساب</span>
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
                      aria-label="تفعيل أو تعطيل المندوب"
                    />
                    <span className="text-xs text-slate-400">{delegate.isActive ? 'ظاهر في بطاقة الكابتن' : 'مخفي'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(delegate)}
                      className="h-8 px-2.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5 ml-1" />
                      <span>تعديل</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(delegate)}
                      className="h-8 px-2.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5 ml-1" />
                      <span>حذف</span>
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
        <DialogContent className="max-w-md bg-[#080E1C] border border-slate-800 text-white p-6 rounded-3xl" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <span>{editingDelegate ? 'تعديل بيانات المندوب المالي' : 'إضافة مندوب مالي جديد'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              عيّن المندوب ومحافظته أو منطقته ليظهر تلقائياً لكباتن تلك المنطقة في بطاقة الشحن المالي.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-3">
            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-slate-300">اسم المندوب المالي *</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: أبو محمد - مندوب وادي السير"
                className="bg-black/60 border-slate-700 text-white text-xs h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-bold text-slate-300">رقم الهاتف (للاتصال) *</Label>
                <Input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="962790000001"
                  className="bg-black/60 border-slate-700 text-amber-300 font-mono text-xs h-10 rounded-xl"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-bold text-slate-300">رقم الواتساب</Label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="نفس الهاتف إن ترك فارغاً"
                  className="bg-black/60 border-slate-700 text-white font-mono text-xs h-10 rounded-xl"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-slate-300">الدولة</Label>
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
                <option value="1">الأردن (Jordan)</option>
                <option value="2">مصر (Egypt)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-bold text-slate-300">المحافظة</Label>
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
                  <option value="">عام (كل المحافظات)</option>
                  {formGovernorates.map((g) => (
                    <option key={g.id} value={String(g.id)}>
                      {g.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 text-right">
                <Label className="text-xs font-bold text-slate-300">المنطقة / اللواء</Label>
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
                  <option value="">كامل المحافظة</option>
                  {formDistricts.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name_ar}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-slate-300">ملاحظات / ساعات العمل والتواجد</Label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="مثال: متواجد يومياً من 10 صباحاً حتى 10 مساءً للشحن المباشر نقداً."
                className="w-full bg-black/60 border border-slate-700 text-white text-xs p-3 rounded-xl outline-none"
              />
            </div>

            <div className="flex items-center justify-between border border-white/10 bg-white/[0.03] p-3 rounded-xl">
              <span className="text-xs font-bold text-slate-200">تفعيل المندوب فوراً لكباتن المنطقة</span>
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
                {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Check className="w-4 h-4 ml-1" />}
                <span>{editingDelegate ? 'تحديث وحفظ' : 'إضافة المندوب'}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs h-10 rounded-xl"
              >
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm bg-[#0B0F19] border border-rose-500/30 text-white p-6 rounded-3xl" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-base font-black text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>تأكيد حذف المندوب المالي</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300 leading-relaxed mt-2">
              هل أنت متأكد من حذف المندوب <strong className="text-white">"{deleteTarget?.name}"</strong>؟ لن يظهر في بطاقة التواصل لكباتن منطقته.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:justify-start pt-4">
            <Button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs h-10 px-5 rounded-xl flex items-center gap-1.5"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Trash2 className="w-4 h-4 ml-1" />}
              <span>نعم، حذف المندوب</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
              className="text-slate-400 hover:text-white text-xs h-10 rounded-xl"
            >
              تراجع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

