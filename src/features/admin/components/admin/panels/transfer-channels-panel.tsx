'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Check,
  Copy,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Power,
  Layers,
  Globe,
  ArrowUpDown,
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
import type { PaymentTransferChannel } from '@/features/admin/types/wallet-directory';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';

const copy = {
  ar: {
    title: 'أرقام وقنوات تحويل الرصيد (لشاشة الكابتن)',
    subtitle: 'إدارة أرقام الحسابات، المحافظ الرقمية، ووسائل الدفع (CliQ، زين كاش، فودافون كاش، إلخ) التي تظهر للكابتن لشحن رصيده.',
    refresh: 'تحديث',
    addNew: 'إضافة رقم تحويل جديد',
    totalChannels: 'إجمالي قنوات التحويل',
    activeChannels: 'القنوات المفعلة (تظهر للكابتن)',
    inactiveChannels: 'القنوات المعطلة',
    loading: 'جاري تحميل أرقام وقنوات التحويل...',
    emptyTitle: 'لا توجد قنوات تحويل مضافة حالياً',
    emptyDesc: 'اضغط على زر "إضافة رقم تحويل جديد" لإضافة قنوات الدفع التي ستظهر في شاشة الكابتن.',
    addNow: 'إضافة الآن',
    beneficiary: 'المستفيد:',
    active: 'مفعلة للكابتن',
    inactive: 'معطلة',
    jordan: 'الأردن',
    egypt: 'مصر',
    allCountries: 'كافة الدول',
    accountNumberLabel: 'رقم الحساب / الآلياس / الآيبان:',
    copied: 'تم النسخ',
    copy: 'نسخ',
    toggleAria: 'تفعيل أو تعطيل القناة',
    visibleToCaptain: 'ظاهرة للكابتن',
    hiddenFromCaptain: 'مخفية',
    edit: 'تعديل',
    delete: 'حذف',
    editTitle: 'تعديل رقم وقناة التحويل',
    addTitle: 'إضافة رقم تحويل جديد',
    modalDesc: 'أدخل بيانات وسيلة التحويل التي ستظهر مباشرة في شاشة الرصيد عند الكابتن.',
    channelNameAr: 'اسم القناة بالعربية *',
    channelNameArPh: 'مثال: كليك (CliQ)، زين كاش، فودافون كاش',
    channelNameEn: 'اسم القناة بالإنجليزية (اختياري)',
    channelNameEnPh: 'e.g. CliQ, Zain Cash, Vodafone Cash',
    accountNumber: 'رقم التحويل / المحفظة / الآلياس *',
    accountNumberPh: 'مثال: RADARWS1 أو 0790000001 أو رقم الحساب',
    beneficiaryLabel: 'اسم صاحب الحساب / المستفيد (اختياري)',
    beneficiaryPh: 'مثال: شركة بينكم',
    targetCountry: 'الدولة المخصصة لها القناة',
    allCountriesOption: 'كافة الدول (عامة)',
    jordanOption: 'الأردن (Jordan - JOD)',
    egyptOption: 'مصر (Egypt - EGP)',
    instructionsLabel: 'وصف أو تعليمات التحويل',
    instructionsPh: 'مثال: تحويل فوري بدون عمولات، يرجى كتابة الاسم في خانة الملاحظات وإرفاق الإشعار.',
    activateNow: 'تفعيل القناة فوراً للكابتن',
    updateSave: 'تحديث وحفظ',
    addChannel: 'إضافة القناة',
    cancel: 'إلغاء',
    confirmDeleteTitle: 'تأكيد حذف رقم التحويل',
    confirmDeleteDesc: (name: string, num: string) => `هل أنت متأكد من حذف قناة التحويل "${name}" (${num})؟ لن تظهر للكابتن بعد الحذف.`,
    confirmDeleteBtn: 'نعم، حذف القناة',
    back: 'تراجع',
    fetchFailTitle: 'فشل جلب أرقام التحويل',
    networkErrorTitle: 'خطأ شبكي',
    networkErrorDesc: 'تعذر الاتصال بالخادم',
    incompleteDataTitle: 'بيانات غير مكتملة',
    incompleteDataDesc: 'يرجى كتابة اسم القناة ورقم التحويل',
    opSuccess: 'نجاح العملية',
    saveFailTitle: 'فشل الحفظ',
    unexpectedError: 'حدث خطأ أثناء حفظ التغييرات',
    updated: 'تم التحديث',
    toggleFail: 'فشل تغيير حالة التفعيل',
    deleted: 'تم الحذف',
    deleteFail: 'فشل الحذف',
    deleteError: 'تعذر حذف القناة',
  },
  en: {
    title: 'Transfer & Payment Channels (Captain Portal)',
    subtitle: 'Manage bank accounts, digital wallets, and payment gateways (CliQ, Zain Cash, Vodafone Cash, etc.) visible to captains for wallet recharge.',
    refresh: 'Refresh',
    addNew: 'Add New Payment Channel',
    totalChannels: 'Total Channels',
    activeChannels: 'Active Channels (Visible to Captains)',
    inactiveChannels: 'Inactive Channels',
    loading: 'Loading transfer channels...',
    emptyTitle: 'No transfer channels added yet',
    emptyDesc: 'Click "Add New Payment Channel" to configure payment methods for captains.',
    addNow: 'Add Now',
    beneficiary: 'Beneficiary:',
    active: 'Active for Captains',
    inactive: 'Inactive',
    jordan: 'Jordan',
    egypt: 'Egypt',
    allCountries: 'All Countries',
    accountNumberLabel: 'Account / Alias / IBAN:',
    copied: 'Copied',
    copy: 'Copy',
    toggleAria: 'Activate or deactivate channel',
    visibleToCaptain: 'Visible to Captain',
    hiddenFromCaptain: 'Hidden',
    edit: 'Edit',
    delete: 'Delete',
    editTitle: 'Edit Payment Channel',
    addTitle: 'Add New Payment Channel',
    modalDesc: 'Configure channel details that appear directly on captain wallet recharge screen.',
    channelNameAr: 'Channel Name (Arabic) *',
    channelNameArPh: 'e.g. CliQ, Zain Cash, Vodafone Cash',
    channelNameEn: 'Channel Name (English) (Optional)',
    channelNameEnPh: 'e.g. CliQ, Zain Cash, Vodafone Cash',
    accountNumber: 'Account / Wallet / Alias *',
    accountNumberPh: 'e.g. RADARWS1 or 0790000001 or Account #',
    beneficiaryLabel: 'Account Holder / Beneficiary (Optional)',
    beneficiaryPh: 'e.g. Bynkcom LLC',
    targetCountry: 'Target Country',
    allCountriesOption: 'All Countries (Universal)',
    jordanOption: 'Jordan (Jordan - JOD)',
    egyptOption: 'Egypt (Egypt - EGP)',
    instructionsLabel: 'Instructions / Description',
    instructionsPh: 'e.g. Instant transfer without fees. Please write your name in notes.',
    activateNow: 'Activate channel immediately for captains',
    updateSave: 'Save Changes',
    addChannel: 'Add Channel',
    cancel: 'Cancel',
    confirmDeleteTitle: 'Confirm Channel Deletion',
    confirmDeleteDesc: (name: string, num: string) => `Are you sure you want to delete payment channel "${name}" (${num})? It will no longer appear for captains.`,
    confirmDeleteBtn: 'Yes, Delete Channel',
    back: 'Go Back',
    fetchFailTitle: 'Failed to load channels',
    networkErrorTitle: 'Network Error',
    networkErrorDesc: 'Could not reach server',
    incompleteDataTitle: 'Incomplete Details',
    incompleteDataDesc: 'Please enter channel name and transfer number',
    opSuccess: 'Operation Successful',
    saveFailTitle: 'Save Failed',
    unexpectedError: 'An error occurred while saving changes',
    updated: 'Updated',
    toggleFail: 'Failed to toggle channel status',
    deleted: 'Deleted',
    deleteFail: 'Deletion Failed',
    deleteError: 'Could not delete channel',
  },
} as const;

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
          {channels.map((channel) => {
            const isCopied = copiedId === channel.id;
            const displayName = isArabic ? channel.nameAr : (channel.nameEn || channel.nameAr);
            const displayDesc = isArabic ? channel.descriptionAr : (channel.descriptionEn || channel.descriptionAr);

            return (
              <Card
                key={channel.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl border transition-all duration-200",
                  channel.isActive
                    ? "border-emerald-500/30 bg-[#0B1120]/80 shadow-lg shadow-emerald-950/20"
                    : "border-slate-800 bg-slate-950/40 opacity-70"
                )}
              >
                <div className="p-5 space-y-4">
                  {/* Top: Name & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white">{displayName}</h3>
                        {channel.nameEn && isArabic && (
                          <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
                            {channel.nameEn}
                          </span>
                        )}
                      </div>
                      {channel.accountHolder && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          <span>{t.beneficiary} <strong className="text-slate-300">{channel.accountHolder}</strong></span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          channel.isActive
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : "border-slate-700 bg-slate-900 text-slate-500"
                        )}
                      >
                        {channel.isActive ? t.active : t.inactive}
                      </Badge>

                      {channel.countryId === 1 && (
                        <Badge variant="outline" className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-300">
                          {t.jordan}
                        </Badge>
                      )}
                      {channel.countryId === 2 && (
                        <Badge variant="outline" className="text-[10px] border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                          {t.egypt}
                        </Badge>
                      )}
                      {!channel.countryId && (
                        <Badge variant="outline" className="text-[10px] border-purple-500/30 bg-purple-500/10 text-purple-300">
                          {t.allCountries}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Middle: Account Number Box with Click-to-Copy */}
                  <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-bold">{t.accountNumberLabel}</span>
                      <strong className="text-base sm:text-lg font-mono font-black text-emerald-400 tracking-wider truncate block select-all">
                        {channel.accountNumber}
                      </strong>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(channel.id, channel.accountNumber)}
                      className={cn(
                        "h-8 px-3 rounded-lg text-xs font-bold transition-all shrink-0",
                        isCopied
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                          : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                      )}
                    >
                      {isCopied ? (
                        <>
                          <Check className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1", "text-emerald-400")} />
                          <span>{t.copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
                          <span>{t.copy}</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Description / Instructions */}
                  {displayDesc && (
                    <p className="text-xs text-slate-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/5 leading-relaxed">
                      {displayDesc}
                    </p>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={channel.isActive}
                        onCheckedChange={() => void handleToggleActive(channel)}
                        aria-label={t.toggleAria}
                      />
                      <span className="text-xs text-slate-400">{channel.isActive ? t.visibleToCaptain : t.hiddenFromCaptain}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(channel)}
                        className="h-8 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg"
                      >
                        <Edit2 className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
                        <span>{t.edit}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(channel)}
                        className="h-8 px-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg"
                      >
                        <Trash2 className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
                        <span>{t.delete}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 4. Add/Edit Channel Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg bg-[#0B0F19] border border-white/10 text-white p-6 rounded-3xl" dir={isArabic ? "rtl" : "ltr"}>
          <DialogHeader className={isArabic ? "text-right" : "text-left"}>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>{editingChannel ? t.editTitle : t.addTitle}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              {t.modalDesc}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">{t.channelNameAr}</Label>
              <Input
                required
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder={t.channelNameArPh}
                className="bg-black/40 border-white/10 text-white placeholder:text-slate-600 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">{t.channelNameEn}</Label>
              <Input
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder={t.channelNameEnPh}
                dir="ltr"
                className="bg-black/40 border-white/10 text-white placeholder:text-slate-600 rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">{t.accountNumber}</Label>
              <Input
                required
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder={t.accountNumberPh}
                dir="ltr"
                className="bg-black/40 border-white/10 text-emerald-400 placeholder:text-slate-600 rounded-xl font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">{t.beneficiaryLabel}</Label>
              <Input
                value={formData.accountHolder}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                placeholder={t.beneficiaryPh}
                className="bg-black/40 border-white/10 text-white placeholder:text-slate-600 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">{t.targetCountry}</Label>
              <select
                value={formData.countryId}
                onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="">{t.allCountriesOption}</option>
                <option value="1">{t.jordanOption}</option>
                <option value="2">{t.egyptOption}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">{t.instructionsLabel}</Label>
              <Input
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                placeholder={t.instructionsPh}
                className="bg-black/40 border-white/10 text-white placeholder:text-slate-600 rounded-xl text-xs"
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
                <span>{editingChannel ? t.updateSave : t.addChannel}</span>
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

      {/* 5. Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm bg-[#0B0F19] border border-rose-500/30 text-white p-6 rounded-3xl" dir={isArabic ? "rtl" : "ltr"}>
          <DialogHeader className={isArabic ? "text-right" : "text-left"}>
            <DialogTitle className="text-base font-black text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{t.confirmDeleteTitle}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300 leading-relaxed mt-2">
              {t.confirmDeleteDesc(deleteTarget?.nameAr || '', deleteTarget?.accountNumber || '')}
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
