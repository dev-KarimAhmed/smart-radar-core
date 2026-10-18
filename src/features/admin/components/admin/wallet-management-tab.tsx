'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { useToast } from '@/hooks/use-toast';
import {
  Wallet,
  Receipt,
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Search,
  Zap,
  RefreshCw,
  Eye,
  Copy,
  Check,
  Send,
  Phone,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  DollarSign,
  Calendar,
  Layers,
  MessageSquare,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface WalletOverview {
  totalCashBalance: number;
  jodBalance?: number;
  egpBalance?: number;
  totalPaidMinutes: number;
  totalFlightHours: number;
  pendingReceiptsCount: number;
  unusedVouchersCount: number;
  totalVouchersCount: number;
  selfTopupEnabled: boolean;
}

interface ReceiptItem {
  id: string;
  profileId: string;
  captainName: string;
  captainPhone: string;
  captainSerial: string;
  governorate: string;
  district: string;
  amount: number;
  currency: string;
  channel: string;
  receiptPath: string | null;
  receiptImageUrl: string | null;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  description: string;
  metadata: any;
  createdAt: string;
}

interface VoucherItem {
  code: string;
  minutesValue: number;
  hoursValue: number;
  status: 'UNUSED' | 'REDEEMED';
  redeemedBy: {
    name: string;
    phone: string;
    serial: string;
  } | null;
  redeemedAt: string | null;
  createdAt: string;
}

interface LedgerItem {
  id: string;
  profileId: string;
  userName: string;
  userPhone: string;
  userSerial: string;
  userRole: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
}

interface CaptainOption {
  id: string;
  serial_id: string;
  full_name: string;
  phone: string;
  governorate: string;
  country_id?: number;
  currency?: string;
  currency_ar?: string;
  currency_code?: string;
  wallet: {
    balance: number;
    total_minutes: number;
    currency_code?: string;
    currency_ar?: string;
  };
}

export function WalletManagementTab() {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'receipts' | 'direct' | 'vouchers' | 'ledger'>('receipts');

  // Loading & Data States
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [overview, setOverview] = useState<WalletOverview | null>(null);
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);

  // Search & Filter States
  const [receiptStatusFilter, setReceiptStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<ReceiptItem | null>(null);
  const [receiptToApprove, setReceiptToApprove] = useState<ReceiptItem | null>(null);
  const [receiptToReject, setReceiptToReject] = useState<ReceiptItem | null>(null);
  const [approveCreditType, setApproveCreditType] = useState<'CASH' | 'MINUTES'>('CASH');
  const [approveCustomMinutes, setApproveCustomMinutes] = useState<number>(60);
  const [approveAdminNote, setApproveAdminNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submittingModalAction, setSubmittingModalAction] = useState(false);

  // Receipt Message Modal State
  const [messageReceiptItem, setMessageReceiptItem] = useState<ReceiptItem | null>(null);
  const [receiptMessageTitle, setReceiptMessageTitle] = useState('إشعار بخصوص إيصال الشحن');
  const [receiptMessageBody, setReceiptMessageBody] = useState('');
  const [receiptMessageType, setReceiptMessageType] = useState<'info' | 'admin_message' | 'warning' | 'urgent'>('admin_message');
  const [submittingReceiptMessage, setSubmittingReceiptMessage] = useState(false);

  // Direct Topup State
  const [captainsList, setCaptainsList] = useState<CaptainOption[]>([]);
  const [loadingCaptains, setLoadingCaptains] = useState(false);
  const [selectedCaptain, setSelectedCaptain] = useState<CaptainOption | null>(null);
  const [directCashAmount, setDirectCashAmount] = useState<string>('10');
  const [directMinutes, setDirectMinutes] = useState<string>('0');
  const [directExtendDays, setDirectExtendDays] = useState<number>(30);
  const [directNote, setDirectNote] = useState('');
  const [submittingDirectTopup, setSubmittingDirectTopup] = useState(false);

  // Voucher Generator State
  const [voucherMinutes, setVoucherMinutes] = useState<number>(60);
  const [voucherCount, setVoucherCount] = useState<number>(5);
  const [generatingVouchers, setGeneratingVouchers] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Self Topup toggle
  const [togglingSelfTopup, setTogglingSelfTopup] = useState(false);

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      const res = await adminFetch('/api/admin/wallet?view=overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.overview);
      }
    } catch (err) {
      console.error('[WalletTab] loadOverview error:', err);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  // Load Subtab Data
  const loadSubTabData = useCallback(async (tab: 'receipts' | 'direct' | 'vouchers' | 'ledger') => {
    try {
      setLoadingData(true);

      if (tab === 'receipts') {
        const res = await adminFetch('/api/admin/wallet?view=receipts');
        const data = await res.json();
        if (data.success) setReceipts(data.receipts || []);
      } else if (tab === 'vouchers') {
        const res = await adminFetch('/api/admin/wallet?view=vouchers');
        const data = await res.json();
        if (data.success) setVouchers(data.vouchers || []);
      } else if (tab === 'ledger') {
        const res = await adminFetch('/api/admin/wallet?view=ledger');
        const data = await res.json();
        if (data.success) setLedger(data.ledger || []);
      } else if (tab === 'direct') {
        // Fetch captains for dropdown
        setLoadingCaptains(true);
        const res = await adminFetch('/api/admin/users?role=CAPTAIN');
        const data = await res.json();
        if (data.success) setCaptainsList(data.users || []);
        setLoadingCaptains(false);
      }
    } catch (err) {
      console.error('[WalletTab] loadSubTabData error:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Initial mount load
  useEffect(() => {
    void loadOverview();
    void loadSubTabData(activeSubTab);
  }, [loadOverview, loadSubTabData, activeSubTab]);

  // Handle Approve Receipt
  const handleApproveReceipt = async () => {
    if (!receiptToApprove) return;
    setSubmittingModalAction(true);
    try {
      const res = await adminFetch('/api/admin/wallet', {
        method: 'POST',
        body: JSON.stringify({
          action: 'approve_receipt',
          transactionId: receiptToApprove.id,
          creditType: approveCreditType,
          minutesToGrant: approveCreditType === 'MINUTES' ? approveCustomMinutes : 0,
          adminNote: approveAdminNote,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل اعتماد الإيصال');
      }

      toast({
        title: 'تم اعتماد الإيصال بنجاح',
        description: data.message,
      });

      setReceiptToApprove(null);
      setApproveAdminNote('');
      void loadOverview();
      void loadSubTabData('receipts');
    } catch (err: any) {
      console.error('[WalletTab] approve error:', err);
      toast({
        title: 'خطأ في الاعتماد',
        description: err.message || 'حدث خطأ أثناء اعتماد الإيصال',
        variant: 'destructive',
      });
    } finally {
      setSubmittingModalAction(false);
    }
  };

  // Handle Reject Receipt
  const handleRejectReceipt = async () => {
    if (!receiptToReject) return;
    setSubmittingModalAction(true);
    try {
      const res = await adminFetch('/api/admin/wallet', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reject_receipt',
          transactionId: receiptToReject.id,
          reason: rejectReason || 'الإيصال غير واضح أو لم يتم استلام الحوالة',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل رفض الإيصال');
      }

      toast({
        title: 'تم رفض الإيصال',
        description: data.message,
      });

      setReceiptToReject(null);
      setRejectReason('');
      void loadOverview();
      void loadSubTabData('receipts');
    } catch (err: any) {
      console.error('[WalletTab] reject error:', err);
      toast({
        title: 'خطأ أثناء الرفض',
        description: err.message || 'تعذر رفض الإيصال',
        variant: 'destructive',
      });
    } finally {
      setSubmittingModalAction(false);
    }
  };

  // Handle Direct Topup Submit
  const handleDirectTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaptain) {
      toast({ variant: 'destructive', title: 'تنبيه', description: 'يرجى اختيار الكابتن المراد شحن حسابه' });
      return;
    }

    const cashNum = Number(directCashAmount) || 0;
    const minutesNum = Number(directMinutes) || 0;

    if (cashNum <= 0 && minutesNum <= 0) {
      toast({ variant: 'destructive', title: 'بيانات غير كافية', description: 'يرجى إدخال مبلغ نقدي أو عدد دقائق للشحن' });
      return;
    }

    setSubmittingDirectTopup(true);
    try {
      const res = await adminFetch('/api/admin/wallet', {
        method: 'POST',
        body: JSON.stringify({
          action: 'direct_topup',
          captainId: selectedCaptain.id,
          cashAmount: cashNum,
          minutes: minutesNum,
          extendDays: directExtendDays,
          note: directNote,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشلت عملية الشحن المباشر');
      }

      toast({
        title: 'تم الشحن بنجاح',
        description: data.message,
      });

      // Reset
      setSelectedCaptain(null);
      setDirectCashAmount('10');
      setDirectMinutes('0');
      setDirectNote('');
      void loadOverview();
      void loadSubTabData('direct');
    } catch (err: any) {
      console.error('[WalletTab] directTopup error:', err);
      toast({
        title: 'خطأ أثناء الشحن',
        description: err.message || 'تعذر تنفيذ عملية الشحن المباشر',
        variant: 'destructive',
      });
    } finally {
      setSubmittingDirectTopup(false);
    }
  };

  // Handle Generate Vouchers
  const handleGenerateVouchers = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingVouchers(true);
    try {
      const res = await adminFetch('/api/admin/wallet', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate_vouchers',
          count: voucherCount,
          minutesValue: voucherMinutes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل توليد القسائم');
      }

      toast({
        title: 'تم توليد القسائم بنجاح',
        description: data.message,
      });

      void loadOverview();
      void loadSubTabData('vouchers');
    } catch (err: any) {
      console.error('[WalletTab] generate vouchers error:', err);
      toast({
        title: 'خطأ في التوليد',
        description: err.message || 'تعذر توليد القسائم',
        variant: 'destructive',
      });
    } finally {
      setGeneratingVouchers(false);
    }
  };

  // Handle Toggle Self Topup Flag
  const handleToggleSelfTopup = async () => {
    if (!overview) return;
    setTogglingSelfTopup(true);
    const targetState = !overview.selfTopupEnabled;
    try {
      const res = await adminFetch('/api/admin/wallet', {
        method: 'POST',
        body: JSON.stringify({
          action: 'toggle_self_topup',
          enabled: targetState,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل تغيير حالة الشحن الذاتي');
      }

      setOverview(prev => prev ? { ...prev, selfTopupEnabled: targetState } : null);
      toast({
        title: 'تم تحديث الإعدادات',
        description: data.message,
      });
    } catch (err: any) {
      console.error('[WalletTab] toggle flag error:', err);
      toast({
        title: 'خطأ',
        description: err.message || 'تعذر تبديل حالة الشحن الذاتي',
        variant: 'destructive',
      });
    } finally {
      setTogglingSelfTopup(false);
    }
  };

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: 'تم نسخ الكود', description: code });
  };

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (receiptStatusFilter !== 'ALL' && r.status !== receiptStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          r.captainName.toLowerCase().includes(q) ||
          r.captainPhone.includes(q) ||
          r.captainSerial.toLowerCase().includes(q) ||
          r.channel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [receipts, receiptStatusFilter, searchQuery]);

  // Filtered vouchers
  const filteredVouchers = useMemo(() => {
    if (!searchQuery.trim()) return vouchers;
    const q = searchQuery.toLowerCase().trim();
    return vouchers.filter((v) =>
      v.code.toLowerCase().includes(q) ||
      (v.redeemedBy && (v.redeemedBy.name.toLowerCase().includes(q) || v.redeemedBy.phone.includes(q)))
    );
  }, [vouchers, searchQuery]);

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* ========================================================================= */}
      {/* 1. FINANCIAL KPIS & QUICK METRICS BAR                                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Total Cash Balance */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-[#0B0F19]/95 p-4 transition-all hover:border-amber-500/40 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
              سيولة الكباتن
            </Badge>
          </div>
          <div className="mt-2.5 text-xs font-bold text-slate-300">إجمالي الرصيد النقدي</div>
          <div className="mt-1">
            {loadingOverview ? (
              <span className="font-mono text-2xl font-black text-amber-400">...</span>
            ) : (overview?.egpBalance ?? 0) > 0 && (overview?.jodBalance ?? 0) > 0 ? (
              <div className="space-y-0.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xl font-black text-amber-400">
                    {overview?.jodBalance?.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-amber-500/80 font-sans">د.أ (الأردن)</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-white/5 pt-0.5">
                  <span className="font-mono text-base font-bold text-amber-300">
                    {overview?.egpBalance?.toFixed(2)}
                  </span>
                  <span className="text-[11px] font-bold text-amber-400/70 font-sans">ج.م (مصر)</span>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl font-black text-amber-400">
                  {((overview?.jodBalance ?? 0) > 0
                    ? overview?.jodBalance?.toFixed(2)
                    : overview?.egpBalance?.toFixed(2)) || overview?.totalCashBalance.toFixed(2) || '0.00'}
                </span>
                <span className="text-xs font-bold text-amber-500/80">
                  {(overview?.egpBalance ?? 0) > 0 ? 'جنيه مصري (ج.م)' : 'دينار أردني (د.أ)'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* KPI 2: Total Flight Minutes */}
        <div className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-[#0B0F19]/95 p-4 transition-all hover:border-teal-500/40 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/30 text-[10px] font-mono">
              {loadingOverview ? '...' : `≈ ${overview?.totalFlightHours || 0} ساعة`}
            </Badge>
          </div>
          <div className="mt-2.5 text-xs font-bold text-slate-300">دقائق الرادار المشحونة</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-black text-teal-400">
              {loadingOverview ? '...' : `${overview?.totalPaidMinutes.toLocaleString() || '0'}`}
            </span>
            <span className="text-xs font-bold text-teal-500/80">دقيقة طيران</span>
          </div>
        </div>

        {/* KPI 3: Pending Recharge Receipts */}
        <div className={cn(
          "relative overflow-hidden rounded-2xl border p-4 transition-all shadow-xl backdrop-blur-xl",
          (overview?.pendingReceiptsCount ?? 0) > 0
            ? "border-rose-500/40 bg-[#0B0F19]/95 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
            : "border-white/10 bg-[#0B0F19]/95"
        )}>
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border",
              (overview?.pendingReceiptsCount ?? 0) > 0
                ? "bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse"
                : "bg-white/5 text-slate-400 border-white/10"
            )}>
              <Receipt className="h-5 w-5" />
            </div>
            {(overview?.pendingReceiptsCount ?? 0) > 0 ? (
              <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                يتطلب تدقيق
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                مكتمل 100%
              </Badge>
            )}
          </div>
          <div className="mt-2.5 text-xs font-bold text-slate-300">إيصالات الشحن المعلقة</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={cn(
              "font-mono text-2xl font-black",
              (overview?.pendingReceiptsCount ?? 0) > 0 ? "text-rose-400" : "text-white"
            )}>
              {loadingOverview ? '...' : overview?.pendingReceiptsCount || 0}
            </span>
            <span className="text-xs font-bold text-slate-500">إيصال بحاجة مراجعة</span>
          </div>
        </div>

        {/* KPI 4: Unused Vouchers & Test Flag */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-[#0B0F19]/95 p-4 transition-all hover:border-indigo-500/40 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Ticket className="h-5 w-5" />
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={togglingSelfTopup || loadingOverview}
                onClick={handleToggleSelfTopup}
                className={cn(
                  "h-7 px-2.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1",
                  overview?.selfTopupEnabled
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "bg-white/5 border-white/10 text-slate-400"
                )}
                title="الشحن الذاتي التجريبي للكباتن من التطبيق"
              >
                {togglingSelfTopup ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : overview?.selfTopupEnabled ? (
                  <ToggleRight className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>الشحن الذاتي: {overview?.selfTopupEnabled ? 'مفعل' : 'معطل'}</span>
              </Button>
            </div>
            <div className="mt-2.5 text-xs font-bold text-slate-300">قسائم الشحن المتاحة</div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-black text-indigo-400">
              {loadingOverview ? '...' : overview?.unusedVouchersCount || 0}
            </span>
            <span className="text-xs font-bold text-slate-500">
              من أصل {overview?.totalVouchersCount || 0} قسيمة
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-NAVIGATION TABS                                                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#050A0F]/90 border border-white/10 p-2 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('receipts')}
            className={cn(
              "py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeSubTab === 'receipts'
                ? "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#14B8A6]/90"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            )}
          >
            <Receipt className="w-4 h-4" />
            <span>إيصالات التحويل</span>
            {(overview?.pendingReceiptsCount ?? 0) > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {overview?.pendingReceiptsCount}
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('direct')}
            className={cn(
              "py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeSubTab === 'direct'
                ? "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#14B8A6]/90"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            )}
          >
            <Zap className="w-4 h-4" />
            <span>شحن مباشر لكابتن</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('vouchers')}
            className={cn(
              "py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeSubTab === 'vouchers'
                ? "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#14B8A6]/90"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            )}
          >
            <Ticket className="w-4 h-4" />
            <span>قسائم وكروت الشحن</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('ledger')}
            className={cn(
              "py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeSubTab === 'ledger'
                ? "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#14B8A6]/90"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            )}
          >
            <Layers className="w-4 h-4" />
            <span>سجل المعاملات</span>
          </Button>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            void loadOverview();
            void loadSubTabData(activeSubTab);
          }}
          disabled={loadingData || loadingOverview}
          className="border-white/10 text-slate-300 hover:bg-white/5 h-9 px-3 rounded-xl text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", (loadingData || loadingOverview) && "animate-spin text-teal-400")} />
          <span>تحديث</span>
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* 3. SUBTAB CONTENT                                                         */}
      {/* ========================================================================= */}

      {/* ----------------- SUBTAB 1: RECEIPTS AUDIT ----------------- */}
      {activeSubTab === 'receipts' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0B0F19]/80 border border-white/5 p-3 rounded-2xl">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(['PENDING', 'ALL', 'COMPLETED', 'REJECTED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setReceiptStatusFilter(st)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                    receiptStatusFilter === st
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                      : "bg-white/5 text-slate-400 hover:text-white border border-transparent"
                  )}
                >
                  {st === 'PENDING' && 'قيد المراجعة'}
                  {st === 'ALL' && 'كافة الإيصالات'}
                  {st === 'COMPLETED' && 'المقبولة'}
                  {st === 'REJECTED' && 'المرفوضة'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الكابتن أو هاتفه أو القناة..."
                className="bg-black/60 border-white/10 text-white text-xs h-9 pr-9 rounded-xl text-right"
              />
            </div>
          </div>

          {/* Receipts Table / Cards */}
          {loadingData ? (
            <div className="p-12 text-center bg-[#0B0F19]/60 rounded-3xl border border-white/5">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-3" />
              <p className="text-slate-400 text-xs">جاري تحميل إيصالات الشحن...</p>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="p-12 text-center bg-[#0B0F19]/60 rounded-3xl border border-white/5 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">لا توجد إيصالات تطابق هذا الفلتر</h3>
              <p className="text-xs text-slate-400">كافة الإيصالات المسجلة تمت معالجتها بدقة.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                    <th className="py-3.5 px-4 font-bold">الكابتن</th>
                    <th className="py-3.5 px-4 font-bold">قناة الدفع والمبلغ</th>
                    <th className="py-3.5 px-4 font-bold">صورة الإيصال</th>
                    <th className="py-3.5 px-4 font-bold">تاريخ الإرسال</th>
                    <th className="py-3.5 px-4 font-bold">الحالة</th>
                    <th className="py-3.5 px-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredReceipts.map((rcpt) => (
                    <tr key={rcpt.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Captain */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white text-sm">{rcpt.captainName}</p>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                            <span>{rcpt.captainPhone}</span>
                            <span>•</span>
                            <span className="text-teal-400">{rcpt.captainSerial}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{rcpt.governorate} - {rcpt.district}</span>
                        </div>
                      </td>

                      {/* Amount & Channel */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="font-mono text-base font-black text-amber-400">
                            {rcpt.amount.toFixed(2)} {rcpt.currency}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-white/5 border border-white/10 text-slate-300 text-[10px] font-normal">
                              {rcpt.channel}
                            </Badge>
                          </div>
                        </div>
                      </td>

                      {/* Receipt Image */}
                      <td className="py-3.5 px-4">
                        {rcpt.receiptImageUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptForPreview(rcpt)}
                            className="group relative h-12 w-16 overflow-hidden rounded-xl border border-white/10 bg-black/40 hover:border-teal-500/50 transition-all cursor-pointer"
                          >
                            <img
                              src={rcpt.receiptImageUrl}
                              alt="Receipt"
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">لا يوجد مرفق</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {new Date(rcpt.createdAt).toLocaleString('ar', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {rcpt.status === 'PENDING' && (
                          <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
                            قيد المراجعة
                          </Badge>
                        )}
                        {rcpt.status === 'COMPLETED' && (
                          <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                            تم الاعتماد
                          </Badge>
                        )}
                        {rcpt.status === 'REJECTED' && (
                          <Badge className="bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold text-[10px]">
                            مرفوض
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {rcpt.status === 'PENDING' ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  setReceiptToApprove(rcpt);
                                  setApproveCreditType('CASH');
                                  setApproveCustomMinutes(Math.round(rcpt.amount * 60));
                                  setApproveAdminNote('');
                                }}
                                className="h-8 px-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-[#0B0F19] text-xs font-black flex items-center gap-1 shadow-sm active:scale-95"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>موافقة</span>
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReceiptToReject(rcpt);
                                  setRejectReason('');
                                }}
                                className="h-8 px-2.5 rounded-xl border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>رفض</span>
                              </Button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono ml-2">
                              {rcpt.metadata?.approved_by ? 'معتمد' : rcpt.metadata?.rejected_by ? 'مرفوض' : 'مكتمل'}
                            </span>
                          )}

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setMessageReceiptItem(rcpt);
                              setReceiptMessageTitle('إشعار بخصوص إيصال الشحن');
                              setReceiptMessageBody('');
                              setReceiptMessageType('admin_message');
                            }}
                            className="h-8 px-2.5 rounded-xl border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-bold flex items-center gap-1"
                            title="إرسال رسالة وتنبيه للكابتن بخصوص هذا الإيصال"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                            <span>مراسلة</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ----------------- SUBTAB 2: DIRECT TOP-UP ----------------- */}
      {activeSubTab === 'direct' && (
        <Card className="bg-[#0B0F19]/90 border border-teal-500/20 rounded-3xl p-6 text-white text-right shadow-2xl">
          <CardHeader className="p-0 mb-6">
            <div className="flex items-center gap-2.5 text-teal-400">
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-white">
                  الشحن الإداري المباشر لأي كابتن
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-0.5">
                  تغذية رصيد الكابتن فورياً بمبلغ نقدي (JD) أو دقائق رادار مع تمديد الصلاحية وإرسال إشعار فوري لهاتف الكابتن.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleDirectTopupSubmit} className="space-y-6">
            {/* Step 1: Select Captain */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300">
                اختر الكابتن المراد شحنه:
              </Label>
              <div className="relative">
                <select
                  value={selectedCaptain?.id || ''}
                  onChange={(e) => {
                    const cap = captainsList.find(c => c.id === e.target.value) || null;
                    setSelectedCaptain(cap);
                  }}
                  className="w-full h-11 bg-black/60 border border-white/10 focus:border-teal-500/50 rounded-xl px-3 text-white text-xs text-right outline-none cursor-pointer"
                  required
                >
                  <option value="" disabled className="bg-[#0B0F19] text-slate-400">
                    {loadingCaptains ? 'جاري تحميل قائمة الكباتن...' : '-- اختر كابتن من القائمة --'}
                  </option>
                  {captainsList.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0B0F19] text-white">
                      {c.full_name} ({c.phone}) - {c.serial_id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Captain Balance Preview */}
              {selectedCaptain && (
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-black/40 border border-teal-500/20 text-xs mt-2">
                  <div>
                    <span className="text-slate-400 text-[11px] block">الرصيد النقدي الحالي:</span>
                    <span className="font-mono text-base font-black text-amber-400">
                      {selectedCaptain.wallet?.balance?.toFixed(2) || '0.00'} {selectedCaptain.currency || (selectedCaptain.phone?.startsWith('+20') ? 'ج.م' : 'د.أ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">دقائق الرادار المتبقية:</span>
                    <span className="font-mono text-base font-black text-teal-400">
                      {selectedCaptain.wallet?.total_minutes || 0} دقيقة (≈ {((selectedCaptain.wallet?.total_minutes || 0) / 60).toFixed(1)} س)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Recharge Amounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Cash Recharge */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-amber-300">
                    1. شحن رصيد نقدي ({selectedCaptain ? (selectedCaptain.currency || (selectedCaptain.phone?.startsWith('+20') ? 'جنيه مصري ج.م' : 'دينار أردني د.أ')) : 'العملة المحلية'})
                  </Label>
                  <span className="text-[10px] text-slate-500">يضاف لمحفظة الكابتن</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['5', '10', '20', '50'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDirectCashAmount(amt)}
                      className={cn(
                        "py-1.5 rounded-xl border text-xs font-mono font-bold transition",
                        directCashAmount === amt
                          ? "border-amber-500 bg-amber-500/20 text-amber-300"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      )}
                    >
                      +{amt} {selectedCaptain ? (selectedCaptain.currency || (selectedCaptain.phone?.startsWith('+20') ? 'ج.م' : 'د.أ')) : 'د.أ'}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={directCashAmount}
                  onChange={(e) => setDirectCashAmount(e.target.value)}
                  placeholder={`المبلغ بـ ${selectedCaptain ? (selectedCaptain.currency || (selectedCaptain.phone?.startsWith('+20') ? 'الجنيه' : 'الدينار')) : 'العملة'}...`}
                  className="bg-black/60 border-white/10 text-white font-mono text-sm h-10 rounded-xl focus:border-amber-500/50 text-right"
                />
              </div>

              {/* Radar Minutes Recharge */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-teal-300">
                    2. شحن باقة دقائق طيران رادار
                  </Label>
                  <span className="text-[10px] text-slate-500">دقائق تشغيلية مباشرة</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { m: '60', l: '+1 س' },
                    { m: '300', l: '+5 س' },
                    { m: '600', l: '+10 س' },
                    { m: '1440', l: '+24 س' },
                  ].map((pkg) => (
                    <button
                      key={pkg.m}
                      type="button"
                      onClick={() => setDirectMinutes(pkg.m)}
                      className={cn(
                        "py-1.5 rounded-xl border text-xs font-mono font-bold transition",
                        directMinutes === pkg.m
                          ? "border-teal-500 bg-teal-500/20 text-teal-300"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      )}
                    >
                      {pkg.l}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  min="0"
                  value={directMinutes}
                  onChange={(e) => setDirectMinutes(e.target.value)}
                  placeholder="عدد الدقائق (اختياري)..."
                  className="bg-black/60 border-white/10 text-white font-mono text-sm h-10 rounded-xl focus:border-teal-500/50 text-right"
                />
              </div>
            </div>

            {/* Step 3: Validity extension & Note */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">
                  تمديد صلاحية الباقة:
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { days: 30, l: '+30 يوماً' },
                    { days: 60, l: '+60 يوماً' },
                    { days: 90, l: '+90 يوماً' },
                  ].map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setDirectExtendDays(opt.days)}
                      className={cn(
                        "py-2 rounded-xl border text-xs font-bold transition",
                        directExtendDays === opt.days
                          ? "border-teal-500 bg-teal-500/15 text-teal-300"
                          : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                      )}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">
                  ملاحظة إدارية (تظهر بسجل الكابتن):
                </Label>
                <Input
                  value={directNote}
                  onChange={(e) => setDirectNote(e.target.value)}
                  placeholder="مثال: شحن نقدي مباشر عبر المكتب..."
                  className="bg-black/60 border-white/10 text-white text-xs h-10 rounded-xl text-right"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submittingDirectTopup || !selectedCaptain}
              className="w-full bg-teal-500 hover:bg-teal-600 text-[#0B0F19] font-black text-sm h-11 rounded-xl shadow-lg transition-all"
            >
              {submittingDirectTopup ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري تنفيذ عملية الشحن...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 ml-1.5" />
                  تأكيد الشحن الفوري للكابتن
                </>
              )}
            </Button>
          </form>
        </Card>
      )}

      {/* ----------------- SUBTAB 3: VOUCHERS GENERATOR ----------------- */}
      {activeSubTab === 'vouchers' && (
        <div className="space-y-6">
          {/* Generator Form Card */}
          <Card className="bg-[#0B0F19]/90 border border-indigo-500/20 rounded-3xl p-5 text-white shadow-2xl">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Ticket className="w-5 h-5" />
                <CardTitle className="text-base font-black text-white">
                  توليد قسائم وكروت شحن رقمية جديدة (Vouchers)
                </CardTitle>
              </div>
              <CardDescription className="text-slate-400 text-xs mt-1">
                توليد كروت شحن بأكواد فريدة يمكن إرسالها للكباتن لشحن دقائق الرادار فورياً من تطبيقهم.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleGenerateVouchers} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1 text-right">
                <Label className="text-xs font-bold text-slate-300">قيمة القسيمة (دقائق طيران):</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { m: 60, l: '1 س' },
                    { m: 300, l: '5 س' },
                    { m: 600, l: '10 س' },
                    { m: 1440, l: 'يوم' },
                  ].map((p) => (
                    <button
                      key={p.m}
                      type="button"
                      onClick={() => setVoucherMinutes(p.m)}
                      className={cn(
                        "py-2 rounded-xl border text-xs font-bold transition",
                        voucherMinutes === p.m
                          ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                          : "border-white/10 bg-white/5 text-slate-300"
                      )}
                    >
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-right">
                <Label className="text-xs font-bold text-slate-300">العدد المراد توليده:</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={voucherCount}
                  onChange={(e) => setVoucherCount(Number(e.target.value))}
                  className="bg-black/60 border-white/10 text-white font-mono text-sm h-10 rounded-xl text-right"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={generatingVouchers}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm h-10 rounded-xl transition-all"
              >
                {generatingVouchers ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 ml-1.5" />
                    توليد الأكواد الآن
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Vouchers Table */}
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                  <th className="py-3 px-4 font-bold">كود القسيمة</th>
                  <th className="py-3 px-4 font-bold">القيمة بالدقائق</th>
                  <th className="py-3 px-4 font-bold">الحالة</th>
                  <th className="py-3 px-4 font-bold">مستخدم بواسطة</th>
                  <th className="py-3 px-4 font-bold">تاريخ التوليد</th>
                  <th className="py-3 px-4 font-bold text-center">نسخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredVouchers.map((v) => (
                  <tr key={v.code} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-black text-sm text-indigo-300">
                      {v.code}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {v.minutesValue} دقيقة <span className="text-slate-500 text-[10px]">({v.hoursValue} س)</span>
                    </td>
                    <td className="py-3 px-4">
                      {v.status === 'UNUSED' ? (
                        <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          غير مستخدمة
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                          تم الاستخدام
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {v.redeemedBy ? (
                        <div>
                          <p className="font-bold text-white text-xs">{v.redeemedBy.name}</p>
                          <p className="font-mono text-[10px] text-slate-400">{v.redeemedBy.phone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(v.createdAt).toLocaleDateString('ar')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyCode(v.code)}
                        className="h-8 px-2.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300"
                        title="نسخ كود القسيمة"
                      >
                        {copiedCode === v.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- SUBTAB 4: FINANCIAL LEDGER ----------------- */}
      {activeSubTab === 'ledger' && (
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                <th className="py-3.5 px-4 font-bold">المستخدم</th>
                <th className="py-3.5 px-4 font-bold">نوع المعاملة</th>
                <th className="py-3.5 px-4 font-bold">المبلغ</th>
                <th className="py-3.5 px-4 font-bold">الحالة</th>
                <th className="py-3.5 px-4 font-bold">التفاصيل والبيان</th>
                <th className="py-3.5 px-4 font-bold">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ledger.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-white">{item.userName}</p>
                    <p className="font-mono text-[10px] text-slate-400">{item.userPhone || item.userSerial}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-300 capitalize">
                    {item.type}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-400 text-sm">
                    {item.amount > 0 ? `+${item.amount.toFixed(2)}` : item.amount.toFixed(2)} {item.currency}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={cn(
                      "text-[10px] font-bold",
                      item.status === 'COMPLETED' ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-white/5 text-slate-400"
                    )}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-xs truncate text-[11px]">
                    {item.description}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {new Date(item.createdAt).toLocaleString('ar', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALS & PREVIEWS                                                      */}
      {/* ========================================================================= */}

      {/* MODAL 1: Receipt Image Full Preview */}
      <Dialog open={!!selectedReceiptForPreview} onOpenChange={(open) => !open && setSelectedReceiptForPreview(null)}>
        <DialogContent className="max-w-2xl bg-[#0B0F19] border border-white/10 text-white rounded-3xl p-6 text-right" dir="rtl">
          {selectedReceiptForPreview && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center justify-between">
                  <span>إيصال تحويل: {selectedReceiptForPreview.captainName}</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {selectedReceiptForPreview.amount.toFixed(2)} {selectedReceiptForPreview.currency}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">
                  {selectedReceiptForPreview.channel} • {new Date(selectedReceiptForPreview.createdAt).toLocaleString('ar')}
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black flex items-center justify-center max-h-[60vh]">
                {selectedReceiptForPreview.receiptImageUrl ? (
                  <img
                    src={selectedReceiptForPreview.receiptImageUrl}
                    alt="Receipt Full Preview"
                    className="max-h-[60vh] w-auto object-contain"
                  />
                ) : (
                  <div className="p-12 text-slate-500">لا تتوفر صورة للإيصال</div>
                )}
              </div>

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedReceiptForPreview(null)}
                  className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
                >
                  إغلاق
                </Button>

                {selectedReceiptForPreview.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        const target = selectedReceiptForPreview;
                        setSelectedReceiptForPreview(null);
                        setReceiptToApprove(target);
                        setApproveCreditType('CASH');
                        setApproveCustomMinutes(Math.round(target.amount * 60));
                      }}
                      className="bg-teal-500 hover:bg-teal-600 text-[#0B0F19] text-xs font-black h-9 rounded-xl"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                      اعتماد الإيصال
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const target = selectedReceiptForPreview;
                        setSelectedReceiptForPreview(null);
                        setReceiptToReject(target);
                      }}
                      className="border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold h-9 rounded-xl"
                    >
                      <XCircle className="w-3.5 h-3.5 ml-1" />
                      رفض
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Approve Receipt */}
      <Dialog open={!!receiptToApprove} onOpenChange={(open) => !open && setReceiptToApprove(null)}>
        <DialogContent className="max-w-md bg-[#0B0F19] border border-teal-500/30 text-white rounded-3xl p-6 text-right" dir="rtl">
          {receiptToApprove && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  اعتماد إيصال الشحن وتغذية الرصيد
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  الموافقة على تحويل الكابتن <span className="text-white font-bold">{receiptToApprove.captainName}</span> بمبلغ{' '}
                  <span className="text-amber-400 font-mono font-bold">{receiptToApprove.amount.toFixed(2)} {receiptToApprove.currency}</span>.
                </DialogDescription>
              </DialogHeader>

              {/* Credit Type Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300 block">طريقة إضافة الرصيد لحساب الكابتن:</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApproveCreditType('CASH')}
                    className={cn(
                      "p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between",
                      approveCreditType === 'CASH'
                        ? "border-amber-500 bg-amber-500/15 text-white"
                        : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                    )}
                  >
                    <span className="font-bold text-xs text-amber-300">رصيد نقدي ({receiptToApprove.currency})</span>
                    <span className="text-[10px] text-slate-400 mt-1">إيداع {receiptToApprove.amount} {receiptToApprove.currency} بالمحفظة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApproveCreditType('MINUTES')}
                    className={cn(
                      "p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between",
                      approveCreditType === 'MINUTES'
                        ? "border-teal-500 bg-teal-500/15 text-white"
                        : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                    )}
                  >
                    <span className="font-bold text-xs text-teal-300">دقائق طيران رادار</span>
                    <span className="text-[10px] text-slate-400 mt-1">تحويل مباشر لدقائق رادار</span>
                  </button>
                </div>
              </div>

              {approveCreditType === 'MINUTES' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">عدد الدقائق المراد منحها:</Label>
                  <Input
                    type="number"
                    min="1"
                    value={approveCustomMinutes}
                    onChange={(e) => setApproveCustomMinutes(Number(e.target.value))}
                    className="bg-black/60 border-white/10 text-white font-mono text-sm h-10 rounded-xl text-right"
                  />
                  <span className="text-[10px] text-slate-400">
                    يعادل تقريباً {(approveCustomMinutes / 60).toFixed(1)} ساعة طيران.
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">ملاحظة تأكيدية (اختياري):</Label>
                <Input
                  value={approveAdminNote}
                  onChange={(e) => setApproveAdminNote(e.target.value)}
                  placeholder="ملاحظات المشرف..."
                  className="bg-black/60 border-white/10 text-white text-xs h-10 rounded-xl text-right"
                />
              </div>

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReceiptToApprove(null)}
                  disabled={submittingModalAction}
                  className="border-white/10 text-slate-300 text-xs h-10 rounded-xl"
                >
                  إلغاء
                </Button>

                <Button
                  type="button"
                  onClick={handleApproveReceipt}
                  disabled={submittingModalAction}
                  className="bg-teal-500 hover:bg-teal-600 text-[#0B0F19] font-black text-xs sm:text-sm h-10 px-5 rounded-xl transition-all"
                >
                  {submittingModalAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      جاري الاعتماد...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 ml-1.5" />
                      تأكيد الاعتماد والشحن
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Reject Receipt */}
      <Dialog open={!!receiptToReject} onOpenChange={(open) => !open && setReceiptToReject(null)}>
        <DialogContent className="max-w-md bg-[#0B0F19] border border-rose-500/30 text-white rounded-3xl p-6 text-right" dir="rtl">
          {receiptToReject && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-400" />
                  رفض إيصال الشحن
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  رفض إيصال الكابتن <span className="text-white font-bold">{receiptToReject.captainName}</span> بمبلغ{' '}
                  <span className="font-mono text-amber-400">{receiptToReject.amount.toFixed(2)} {receiptToReject.currency}</span>.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">سبب الرفض (يصل للكابتن كإشعار):</Label>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="مثال: صورة الإيصال غير واضحة، أو الحوالة لم تصل..."
                  className="bg-black/60 border-white/10 text-white text-xs h-10 rounded-xl text-right"
                  required
                />
              </div>

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReceiptToReject(null)}
                  disabled={submittingModalAction}
                  className="border-white/10 text-slate-300 text-xs h-10 rounded-xl"
                >
                  تراجع
                </Button>

                <Button
                  type="button"
                  onClick={handleRejectReceipt}
                  disabled={submittingModalAction}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm h-10 px-5 rounded-xl transition-all"
                >
                  {submittingModalAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      جاري الرفض...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 ml-1.5" />
                      تأكيد الرفض
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 4: Message Captain Regarding Receipt */}
      <Dialog open={!!messageReceiptItem} onOpenChange={(open) => !open && setMessageReceiptItem(null)}>
        <DialogContent className="max-w-md bg-[#0B0F19] border border-teal-500/40 text-white rounded-3xl p-6 text-right shadow-2xl backdrop-blur-xl" dir="rtl">
          {messageReceiptItem && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30">
                    <MessageSquare className="w-5 h-5 text-teal-400" />
                  </div>
                  <span>إرسال رسالة للكابتن</span>
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  إرسال إشعار فوري للكابتن بخصوص إيصال الشحن أو التحويل المالي.
                </DialogDescription>
              </DialogHeader>

              {/* Captain mini info banner */}
              <div className="bg-[#161F30]/60 border border-white/10 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{messageReceiptItem.captainName}</span>
                    <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-mono">
                      {messageReceiptItem.captainSerial}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {messageReceiptItem.captainPhone} • {messageReceiptItem.amount} {messageReceiptItem.currency} ({messageReceiptItem.channel})
                  </p>
                </div>

                {messageReceiptItem.captainPhone && (
                  <a
                    href={`https://wa.me/${messageReceiptItem.captainPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً كابتن ${messageReceiptItem.captainName}، بخصوص إيصال الشحن المرسل بقيمة ${messageReceiptItem.amount} ${messageReceiptItem.currency}...`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all shrink-0"
                    title="فتح محادثة واتساب"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>واتساب</span>
                  </a>
                )}
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">عنوان الرسالة / الإشعار</Label>
                <Input
                  value={receiptMessageTitle}
                  onChange={(e) => setReceiptMessageTitle(e.target.value)}
                  placeholder="مثال: إشعار بخصوص إيصال الشحن"
                  className="bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl focus:border-teal-500 text-right"
                />
              </div>

              {/* Fast Templates */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">قوالب نصوص سريعة جاهزة:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "يرجى إعادة رفع صورة إشعار التحويل بشكل أوضح تظهر كافة التفاصيل.",
                    "لم نتمكن من مطابقة الرقم المرجعي للحوالة، يرجى تزويدنا به للتأكيد.",
                    "تم استلام حوالتك بنجاح وجاري تدقيقها واعتماد الرصيد بمحفظتك.",
                    "نرجو التأكد من إرسال الحوالة إلى الرقم المعتمد للمحفظة.",
                  ].map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReceiptMessageBody(tpl)}
                      className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-2.5 py-1 rounded-lg transition-colors text-right"
                    >
                      {tpl.length > 32 ? tpl.slice(0, 32) + '...' : tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message body */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">نص الرسالة</Label>
                <textarea
                  value={receiptMessageBody}
                  onChange={(e) => setReceiptMessageBody(e.target.value)}
                  placeholder="اكتب التوجيه أو الاستفسار الموجه للكابتن هنا..."
                  rows={3}
                  className="w-full bg-black/60 border border-white/10 text-white text-xs p-3 rounded-xl focus:border-teal-500 outline-none resize-none text-right font-sans leading-relaxed"
                  required
                />
              </div>

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMessageReceiptItem(null)}
                  disabled={submittingReceiptMessage}
                  className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
                >
                  إلغاء
                </Button>

                <Button
                  type="button"
                  disabled={submittingReceiptMessage || !receiptMessageBody.trim()}
                  onClick={async () => {
                    setSubmittingReceiptMessage(true);
                    try {
                      const res = await adminFetch('/api/admin/wallet', {
                        method: 'POST',
                        body: JSON.stringify({
                          action: 'send_message',
                          captainId: messageReceiptItem.profileId,
                          title: receiptMessageTitle.trim(),
                          message: receiptMessageBody.trim(),
                          type: receiptMessageType,
                        }),
                      });

                      const data = await res.json();
                      if (!res.ok || !data.success) {
                        throw new Error(data.error || 'فشل إرسال الرسالة');
                      }

                      toast({
                        title: 'تم إرسال الرسالة بنجاح',
                        description: data.message || 'تم إرسال الإشعار اللحظي إلى الكابتن.',
                      });

                      setMessageReceiptItem(null);
                      setReceiptMessageBody('');
                    } catch (err: any) {
                      toast({
                        variant: 'destructive',
                        title: 'خطأ أثناء الإرسال',
                        description: err.message || 'تعذر إرسال الإشعار للكابتن',
                      });
                    } finally {
                      setSubmittingReceiptMessage(false);
                    }
                  }}
                  className="bg-teal-500 hover:bg-teal-600 text-[#0B0F19] font-black text-xs h-10 px-6 rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  {submittingReceiptMessage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-1" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-1" />
                      إرسال الرسالة للكابتن
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

