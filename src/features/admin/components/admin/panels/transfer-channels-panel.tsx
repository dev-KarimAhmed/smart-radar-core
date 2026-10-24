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
import { cn } from '@/lib/utils';

export function TransferChannelsPanel() {
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
        toast({ title: 'فشل جلب أرقام التحويل', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ شبكي', description: 'تعذر الاتصال بالخادم', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
      toast({ title: 'بيانات غير مكتملة', description: 'يرجى كتابة اسم القناة ورقم التحويل', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const action = editingChannel ? 'update' : 'create';
      const payload = {
        action,
        id: editingChannel?.id,
        nameAr: formData.nameAr,
        nameEn: formData.nameEn,
        accountNumber: formData.accountNumber,
        accountHolder: formData.accountHolder,
        descriptionAr: formData.descriptionAr,
        descriptionEn: formData.descriptionEn,
        countryId: formData.countryId ? Number(formData.countryId) : null,
        isActive: formData.isActive,
      };

      const res = await adminFetch('/api/admin/transfer-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: 'نجاح العملية', description: data.message, variant: 'success' });
        setIsModalOpen(false);
        if (Array.isArray(data.channels)) {
          setChannels(data.channels);
        } else {
          void fetchChannels();
        }
      } else {
        toast({ title: 'فشل الحفظ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ غير متوقع', description: 'حدث خطأ أثناء حفظ التغييرات', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (channel: PaymentTransferChannel) => {
    try {
      const res = await adminFetch('/api/admin/transfer-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id: channel.id }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.channels)) {
        setChannels(data.channels);
        toast({ title: 'تم التحديث', description: data.message });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل تغيير حالة التفعيل', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await adminFetch('/api/admin/transfer-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: deleteTarget.id }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.channels)) {
        setChannels(data.channels);
        toast({ title: 'تم الحذف', description: data.message });
        setDeleteTarget(null);
      } else {
        toast({ title: 'فشل الحذف', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'تعذر حذف القناة', variant: 'destructive' });
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
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            <span>أرقام وقنوات تحويل الرصيد (لشاشة الكابتن)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            إدارة أرقام الحسابات، المحافظ الرقمية، ووسائل الدفع (CliQ، زين كاش، فودافون كاش، إلخ) التي تظهر للكابتن لشحن رصيده.
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
            <RefreshCw className={cn("w-4 h-4 ml-1.5", loading && "animate-spin text-emerald-400")} />
            <span>تحديث</span>
          </Button>

          <Button
            type="button"
            onClick={handleOpenAdd}
            className="h-10 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة رقم تحويل جديد</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي قنوات التحويل</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-white">{channels.length}</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">القنوات المفعلة (تظهر للكابتن)</span>
            <Power className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-emerald-300">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">القنوات المعطلة</span>
            <Power className="w-4 h-4 text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-mono font-black text-slate-400">{inactiveCount}</p>
        </div>
      </div>

      {/* 3. Channels Cards Grid */}
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
          <p className="mt-3 text-xs text-slate-400 font-bold">جاري تحميل أرقام وقنوات التحويل...</p>
        </div>
      ) : channels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-black text-white">لا توجد قنوات تحويل مضافة حالياً</h3>
          <p className="text-xs text-slate-400 mt-1">اضغط على زر "إضافة رقم تحويل جديد" لإضافة قنوات الدفع التي ستظهر في شاشة الكابتن.</p>
          <Button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 px-4 rounded-xl"
          >
            <Plus className="w-4 h-4 ml-1" />
            <span>إضافة الآن</span>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {channels.map((channel) => {
            const isCopied = copiedId === channel.id;

            return (
              <div
                key={channel.id}
                className={cn(
                  "relative rounded-2xl border p-5 transition-all flex flex-col justify-between gap-4",
                  channel.isActive
                    ? "border-emerald-500/25 bg-gradient-to-b from-[#0A1120] to-[#050912] shadow-lg shadow-black/40"
                    : "border-slate-800/80 bg-black/40 opacity-70"
                )}
              >
                <div>
                  {/* Top Row: Name & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black text-white">{channel.nameAr}</h3>
                        {channel.nameEn && (
                          <span className="text-xs font-mono text-slate-400">({channel.nameEn})</span>
                        )}
                      </div>
                      {channel.accountHolder && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          <span>المستفيد: <strong className="text-slate-300">{channel.accountHolder}</strong></span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-full border",
                          channel.isActive
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        )}
                      >
                        {channel.isActive ? 'مفعلة للكابتن' : 'معطلة'}
                      </Badge>
                      {channel.countryId === 1 && (
                        <Badge variant="outline" className="text-[10px] font-bold border-cyan-500/30 bg-cyan-950/40 text-cyan-300">
                          الأردن
                        </Badge>
                      )}
                      {channel.countryId === 2 && (
                        <Badge variant="outline" className="text-[10px] font-bold border-amber-500/30 bg-amber-950/40 text-amber-300">
                          مصر
                        </Badge>
                      )}
                      {!channel.countryId && (
                        <Badge variant="outline" className="text-[10px] font-bold border-purple-500/30 bg-purple-950/40 text-purple-300">
                          كافة الدول
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Account Number Box */}
                  <div className="mt-3.5 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/70 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-bold">رقم الحساب / الآلياس / الآيبان:</span>
                      <strong className="font-mono text-sm sm:text-base font-black text-amber-300 tracking-wider block truncate">
                        {channel.accountNumber}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(channel.id, channel.accountNumber)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition shrink-0 cursor-pointer active:scale-95",
                        isCopied
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-white/10 text-slate-200 hover:bg-white/15"
                      )}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Description / Instructions */}
                  {channel.descriptionAr && (
                    <p className="mt-2.5 text-xs text-slate-400 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                      {channel.descriptionAr}
                    </p>
                  )}
                </div>

                {/* Bottom Row: Actions */}
                <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={channel.isActive}
                      onCheckedChange={() => void handleToggle(channel)}
                      aria-label="تفعيل أو تعطيل القناة"
                    />
                    <span className="text-xs text-slate-400">{channel.isActive ? 'ظاهرة للكابتن' : 'مخفية'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(channel)}
                      className="h-8 px-2.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5 ml-1" />
                      <span>تعديل</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(channel)}
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

      {/* 4. Add/Edit Channel Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-[#080E1C] border border-slate-800 text-white p-6 rounded-3xl" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>{editingChannel ? 'تعديل رقم وقناة التحويل' : 'إضافة رقم تحويل جديد'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              أدخل بيانات وسيلة التحويل التي ستظهر مباشرة في شاشة الرصيد عند الكابتن.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-3">
            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-slate-300">اسم القناة بالعربية *</Label>
              <Input
                required
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="مثال: كليك (CliQ)، زين كاش، فودافون كاش"
                className="bg-black/60 border-slate-700 text-white text-xs h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-slate-300">اسم القناة بالإنجليزية (اختياري)</Label>
              <Input
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="e.g. CliQ, Zain Cash, Vodafone Cash"
                className="bg-black/60 border-slate-700 text-white text-xs h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-slate-300">رقم التحويل / المحفظة / الآلياس *</Label>
              <Input
                required
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="مثال: RADARWS1 أو 0790000001 أو رقم الحساب"
                className="bg-black/60 border-slate-700 text-amber-300 font-mono font-bold text-xs h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-slate-300">اسم صاحب الحساب / المستفيد (اختياري)</Label>
              <Input
                value={formData.accountHolder}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                placeholder="مثال: شركة بينكم"
                className="bg-black/60 border-slate-700 text-white text-xs h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-slate-300">الدولة المخصصة لها القناة</Label>
              <select
                value={formData.countryId}
                onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                className="w-full bg-black/60 border border-slate-700 text-white text-xs h-10 rounded-xl px-3 outline-none"
              >
                <option value="">كافة الدول (عامة)</option>
                <option value="1">الأردن (Jordan - JOD)</option>
                <option value="2">مصر (Egypt - EGP)</option>
              </select>
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-slate-300">وصف أو تعليمات التحويل</Label>
              <textarea
                rows={2}
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                placeholder="مثال: تحويل فوري بدون عمولات، يرجى كتابة الاسم في خانة الملاحظات وإرفاق الإشعار."
                className="w-full bg-black/60 border border-slate-700 text-white text-xs p-3 rounded-xl outline-none"
              />
            </div>

            <div className="flex items-center justify-between border border-white/10 bg-white/[0.03] p-3 rounded-xl">
              <span className="text-xs font-bold text-slate-200">تفعيل القناة فوراً للكابتن</span>
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
                <span>{editingChannel ? 'تحديث وحفظ' : 'إضافة القناة'}</span>
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

      {/* 5. Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm bg-[#0B0F19] border border-rose-500/30 text-white p-6 rounded-3xl" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-base font-black text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>تأكيد حذف رقم التحويل</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300 leading-relaxed mt-2">
              هل أنت متأكد من حذف قناة التحويل <strong className="text-white">"{deleteTarget?.nameAr}"</strong> ({deleteTarget?.accountNumber})؟ لن تظهر للكابتن بعد الحذف.
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
              <span>نعم، حذف القناة</span>
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

