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
  CreditCard,
  UserCheck,
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
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { HourlyRatesManagementPanel } from './hourly-rates-management-panel';
import { TransferChannelsPanel } from './panels/transfer-channels-panel';
import { FinancialDelegatesPanel } from './panels/financial-delegates-panel';

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
  const t = useTranslations('adminWallet');
  const { direction, isArabic } = useDashboardLanguage();
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'receipts' | 'direct' | 'vouchers' | 'ledger' | 'rates' | 'channels' | 'delegates'>('receipts');

  useEffect(() => {
    const handleSubtab = (e: any) => {
      if (e.detail?.subtab) {
        setActiveSubTab(e.detail.subtab);
      }
    };
    window.addEventListener('admin-wallet-subtab', handleSubtab);
    return () => window.removeEventListener('admin-wallet-subtab', handleSubtab);
  }, []);

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
  const [receiptMessageTitle, setReceiptMessageTitle] = useState(isArabic ? 'إشعار بخصوص إيصال الشحن' : 'Notification Regarding Recharge Receipt');
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
  const loadSubTabData = useCallback(async (tab: 'receipts' | 'direct' | 'vouchers' | 'ledger' | 'rates' | 'channels' | 'delegates') => {
    if (tab === 'rates' || tab === 'channels' || tab === 'delegates') return;
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
        throw new Error(data.error || (isArabic ? 'فشل اعتماد الإيصال' : 'Failed to approve receipt'));
      }

      toast({
        title: isArabic ? 'تم اعتماد الإيصال بنجاح' : 'Receipt Approved Successfully',
        description: data.message,
      });

      setReceiptToApprove(null);
      setApproveAdminNote('');
      void loadOverview();
      void loadSubTabData('receipts');
    } catch (err: any) {
      console.error('[WalletTab] approve error:', err);
      toast({
        title: isArabic ? 'خطأ في الاعتماد' : 'Approval Error',
        description: err.message || (isArabic ? 'حدث خطأ أثناء اعتماد الإيصال' : 'An error occurred while approving receipt'),
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
          reason: rejectReason || (isArabic ? 'الإيصال غير واضح أو لم يتم استلام الحوالة' : 'Receipt is unclear or transfer was not received'),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || (isArabic ? 'فشل رفض الإيصال' : 'Failed to reject receipt'));
      }

      toast({
        title: isArabic ? 'تم رفض الإيصال' : 'Receipt Rejected',
        description: data.message,
      });

      setReceiptToReject(null);
      setRejectReason('');
      void loadOverview();
      void loadSubTabData('receipts');
    } catch (err: any) {
      console.error('[WalletTab] reject error:', err);
      toast({
        title: isArabic ? 'خطأ أثناء الرفض' : 'Rejection Error',
        description: err.message || (isArabic ? 'تعذر رفض الإيصال' : 'Could not reject receipt'),
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
      toast({
        variant: 'destructive',
        title: isArabic ? 'تنبيه' : 'Notice',
        description: isArabic ? 'يرجى اختيار الكابتن المعلن المراد شحن حسابه' : 'Please select a captain to recharge',
      });
      return;
    }

    const cashNum = Number(directCashAmount) || 0;
    const minutesNum = Number(directMinutes) || 0;

    if (cashNum <= 0 && minutesNum <= 0) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'بيانات غير كافية' : 'Insufficient Data',
        description: isArabic ? 'يرجى إدخال مبلغ نقدي أو عدد دقائق للشحن' : 'Please enter a cash amount or minutes to recharge',
      });
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
        throw new Error(data.error || (isArabic ? 'فشلت عملية الشحن المباشر' : 'Direct top-up failed'));
      }

      toast({
        title: isArabic ? 'تم الشحن بنجاح' : 'Recharge Completed Successfully',
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
        title: isArabic ? 'خطأ أثناء الشحن' : 'Top-up Error',
        description: err.message || (isArabic ? 'تعذر تنفيذ عملية الشحن المباشر' : 'Could not execute direct top-up'),
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
        throw new Error(data.error || (isArabic ? 'فشل توليد القسائم' : 'Failed to generate vouchers'));
      }

      toast({
        title: isArabic ? 'تم توليد القسائم بنجاح' : 'Vouchers Generated Successfully',
        description: data.message,
      });

      void loadOverview();
      void loadSubTabData('vouchers');
    } catch (err: any) {
      console.error('[WalletTab] generate vouchers error:', err);
      toast({
        title: isArabic ? 'خطأ في التوليد' : 'Generation Error',
        description: err.message || (isArabic ? 'تعذر توليد القسائم' : 'Could not generate vouchers'),
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
        throw new Error(data.error || (isArabic ? 'فشل تغيير حالة الشحن الذاتي' : 'Failed to toggle self top-up state'));
      }

      setOverview(prev => prev ? { ...prev, selfTopupEnabled: targetState } : null);
      toast({
        title: isArabic ? 'تم تحديث الإعدادات' : 'Settings Updated',
        description: data.message,
      });
    } catch (err: any) {
      console.error('[WalletTab] toggle flag error:', err);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: err.message || (isArabic ? 'تعذر تبديل حالة الشحن الذاتي' : 'Could not toggle self top-up state'),
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
    toast({
      title: isArabic ? 'تم نسخ الكود' : 'Code Copied',
      description: code,
    });
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
    <div className={cn("space-y-6 font-sans", isArabic ? "text-right" : "text-left")} dir={direction}>
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
              {t('captainLiquidity')}
            </Badge>
          </div>
          <div className="mt-2.5 text-xs font-bold text-slate-300">{t('totalCashBalance')}</div>
          <div className="mt-1">
            {loadingOverview ? (
              <span className="font-mono text-2xl font-black text-amber-400">...</span>
            ) : (overview?.egpBalance ?? 0) > 0 && (overview?.jodBalance ?? 0) > 0 ? (
              <div className="space-y-0.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xl font-black text-amber-400">
                    {overview?.jodBalance?.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-amber-500/80 font-sans">{t('jodLabel')}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-white/5 pt-0.5">
                  <span className="font-mono text-base font-bold text-amber-300">
                    {overview?.egpBalance?.toFixed(2)}
                  </span>
                  <span className="text-[11px] font-bold text-amber-400/70 font-sans">{t('egpLabel')}</span>
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
                  {(overview?.egpBalance ?? 0) > 0 ? t('egpFull') : t('jodFull')}
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
              {loadingOverview ? '...' : t('flightHoursEst', { hours: overview?.totalFlightHours || 0 })}
            </Badge>
          </div>
          <div className="mt-2.5 text-xs font-bold text-slate-300">{t('flightMinutesLoaded')}</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-black text-teal-400">
              {loadingOverview ? '...' : `${overview?.totalPaidMinutes.toLocaleString() || '0'}`}
            </span>
            <span className="text-xs font-bold text-teal-500/80">{t('flightMinutesUnit')}</span>
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
                {t('immediateReview')}
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                {t('allSettled')}
              </Badge>
            )}
          </div>
          <div className="mt-2.5 text-xs font-bold text-slate-300">{t('pendingReceipts')}</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={cn(
              "font-mono text-2xl font-black",
              (overview?.pendingReceiptsCount ?? 0) > 0 ? "text-rose-400" : "text-white"
            )}>
              {loadingOverview ? '...' : overview?.pendingReceiptsCount || 0}
            </span>
            <span className="text-xs font-bold text-slate-500">{t('receiptsNeedAudit')}</span>
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
                title={t('selfTopupTooltip')}
              >
                {togglingSelfTopup ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : overview?.selfTopupEnabled ? (
                  <ToggleRight className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{t('selfTopupLabel', { status: overview?.selfTopupEnabled ? t('enabled') : t('disabled') })}</span>
              </Button>
            </div>
            <div className="mt-2.5 text-xs font-bold text-slate-300">{t('vouchersAvailable')}</div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-black text-indigo-400">
              {loadingOverview ? '...' : overview?.unusedVouchersCount || 0}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {t('vouchersOutOfTotal', { total: overview?.totalVouchersCount || 0 })}
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
            <span>{t('subtabReceipts')}</span>
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
            <span>{t('subtabDirectTopup')}</span>
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
            <span>{t('subtabVouchers')}</span>
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
            <span>{t('subtabTransactions')}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('rates')}
            className={cn(
              "py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeSubTab === 'rates'
                ? "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#14B8A6]/90"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            )}
          >
            <Clock className="w-4 h-4" />
            <span>{t('subtabHourlyRates')}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('channels')}
            className={cn(
              "py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeSubTab === 'channels'
                ? "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#14B8A6]/90"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            )}
          >
            <CreditCard className="w-4 h-4" />
            <span>أرقام التحويل</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('delegates')}
            className={cn(
              "py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeSubTab === 'delegates'
                ? "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#14B8A6]/90"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            )}
          >
            <UserCheck className="w-4 h-4" />
            <span>المناديب المالية</span>
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
          <span>{t('refresh')}</span>
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
                  {st === 'PENDING' && t('receiptFilterPending')}
                  {st === 'ALL' && t('receiptFilterAll')}
                  {st === 'COMPLETED' && t('receiptFilterApproved')}
                  {st === 'REJECTED' && t('receiptFilterRejected')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400", isArabic ? "right-3" : "left-3")} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchReceiptsPlaceholder')}
                className={cn("bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl", isArabic ? "pr-9 text-right" : "pl-9 text-left")}
              />
            </div>
          </div>

          {/* Receipts Table / Cards */}
          {loadingData ? (
            <div className="p-12 text-center bg-[#0B0F19]/60 rounded-3xl border border-white/5">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-3" />
              <p className="text-slate-400 text-xs">{t('loadingReceipts')}</p>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="p-12 text-center bg-[#0B0F19]/60 rounded-3xl border border-white/5 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">{t('noReceiptsMatch')}</h3>
              <p className="text-xs text-slate-400">{t('noReceiptsMatchSub')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl">
              <table className={cn("w-full text-xs", isArabic ? "text-right" : "text-left")}>
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                    <th className="py-3.5 px-4 font-bold">{t('colCaptain')}</th>
                    <th className="py-3.5 px-4 font-bold">{t('colChannelAmount')}</th>
                    <th className="py-3.5 px-4 font-bold">{t('colReceiptImage')}</th>
                    <th className="py-3.5 px-4 font-bold">{t('colSentAt')}</th>
                    <th className="py-3.5 px-4 font-bold">{t('colStatus')}</th>
                    <th className="py-3.5 px-4 font-bold text-center">{t('colActions')}</th>
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
                            <span dir="ltr">{rcpt.captainPhone}</span>
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
                          <span className="text-slate-500 text-[11px]">{t('noAttachment')}</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {new Date(rcpt.createdAt).toLocaleString(isArabic ? 'ar-JO' : 'en-US', {
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
                            {t('pendingBadge')}
                          </Badge>
                        )}
                        {rcpt.status === 'COMPLETED' && (
                          <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                            {t('approvedBadge')}
                          </Badge>
                        )}
                        {rcpt.status === 'REJECTED' && (
                          <Badge className="bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold text-[10px]">
                            {t('rejectedBadge')}
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
                                <span>{t('btnApprove')}</span>
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
                                <span>{t('btnReject')}</span>
                              </Button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono ml-2">
                              {rcpt.metadata?.approved_by ? t('approvedBadge') : rcpt.metadata?.rejected_by ? t('rejectedBadge') : t('approvedBadge')}
                            </span>
                          )}

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setMessageReceiptItem(rcpt);
                              setReceiptMessageTitle(isArabic ? 'إشعار بخصوص إيصال الشحن' : 'Notification Regarding Recharge Receipt');
                              setReceiptMessageBody('');
                              setReceiptMessageType('admin_message');
                            }}
                            className="h-8 px-2.5 rounded-xl border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-bold flex items-center gap-1"
                            title={t('btnMessageTooltip')}
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                            <span>{t('btnMessage')}</span>
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
        <Card className={cn("bg-[#0B0F19]/90 border border-teal-500/20 rounded-3xl p-6 text-white shadow-2xl", isArabic ? "text-right" : "text-left")}>
          <CardHeader className="p-0 mb-6">
            <div className="flex items-center gap-2.5 text-teal-400">
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-white">
                  {t('directTopupHeading')}
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-0.5">
                  {t('directTopupSubheading')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleDirectTopupSubmit} className="space-y-6">
            {/* Step 1: Select Captain */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300">
                {t('selectCaptainLabel')}
              </Label>
              <div className="relative">
                <select
                  value={selectedCaptain?.id || ''}
                  onChange={(e) => {
                    const cap = captainsList.find(c => c.id === e.target.value) || null;
                    setSelectedCaptain(cap);
                  }}
                  className={cn("w-full h-11 bg-black/60 border border-white/10 focus:border-teal-500/50 rounded-xl px-3 text-white text-xs outline-none cursor-pointer", isArabic ? "text-right" : "text-left")}
                  required
                >
                  <option value="" disabled className="bg-[#0B0F19] text-slate-400">
                    {loadingCaptains ? t('loadingCaptainsText') : t('chooseCaptainOption')}
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
                    <span className="text-slate-400 text-[11px] block">{t('currentCashBalance')}</span>
                    <span className="font-mono text-base font-black text-amber-400">
                      {selectedCaptain.wallet?.balance?.toFixed(2) || '0.00'} {selectedCaptain.currency || (selectedCaptain.phone?.startsWith('+20') ? (isArabic ? 'ج.م' : 'EGP') : (isArabic ? 'د.أ' : 'JOD'))}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">{t('currentFlightMinutes')}</span>
                    <span className="font-mono text-base font-black text-teal-400">
                      {t('minutesWithHours', { minutes: selectedCaptain.wallet?.total_minutes || 0, hours: (((selectedCaptain.wallet?.total_minutes || 0) / 60).toFixed(1)) })}
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
                    {t('cashTopupOption', { currency: selectedCaptain ? (selectedCaptain.currency || (selectedCaptain.phone?.startsWith('+20') ? (isArabic ? 'ج.م' : 'EGP') : (isArabic ? 'د.أ' : 'JOD'))) : (isArabic ? 'العملة المحلية' : 'Local Currency') })}
                  </Label>
                  <span className="text-[10px] text-slate-500">{t('addedToWallet')}</span>
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
                      +{amt} {selectedCaptain ? (selectedCaptain.currency || (selectedCaptain.phone?.startsWith('+20') ? (isArabic ? 'ج.م' : 'EGP') : (isArabic ? 'د.أ' : 'JOD'))) : (isArabic ? 'د.أ' : 'JOD')}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={directCashAmount}
                  onChange={(e) => setDirectCashAmount(e.target.value)}
                  placeholder={t('cashAmountPlaceholder', { currency: selectedCaptain ? (selectedCaptain.currency || (selectedCaptain.phone?.startsWith('+20') ? (isArabic ? 'الجنيه' : 'EGP') : (isArabic ? 'الدينار' : 'JOD'))) : (isArabic ? 'العملة' : 'Currency') })}
                  className={cn("bg-black/60 border-white/10 text-white font-mono text-sm h-10 rounded-xl focus:border-amber-500/50", isArabic ? "text-right" : "text-left")}
                />
              </div>

              {/* Radar Minutes Recharge */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-teal-300">
                    {t('minutesTopupOption')}
                  </Label>
                  <span className="text-[10px] text-slate-500">{t('directMinutesSubtitle')}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { m: '60', l: isArabic ? '+1 س' : '+1 hr' },
                    { m: '300', l: isArabic ? '+5 س' : '+5 hrs' },
                    { m: '600', l: isArabic ? '+10 س' : '+10 hrs' },
                    { m: '1440', l: isArabic ? '+24 س' : '+24 hrs' },
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
                  placeholder={t('minutesPlaceholder')}
                  className={cn("bg-black/60 border-white/10 text-white font-mono text-sm h-10 rounded-xl focus:border-teal-500/50", isArabic ? "text-right" : "text-left")}
                />
              </div>
            </div>

            {/* Step 3: Validity extension & Note */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">
                  {t('extendValidityLabel')}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { days: 30, l: t('daysUnit', { days: 30 }) },
                    { days: 60, l: t('daysUnit', { days: 60 }) },
                    { days: 90, l: t('daysUnit', { days: 90 }) },
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
                  {t('adminNoteLabel')}
                </Label>
                <Input
                  value={directNote}
                  onChange={(e) => setDirectNote(e.target.value)}
                  placeholder={t('adminNotePlaceholder')}
                  className={cn("bg-black/60 border-white/10 text-white text-xs h-10 rounded-xl", isArabic ? "text-right" : "text-left")}
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
                  <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                  {t('processingTopup')}
                </>
              ) : (
                <>
                  <Zap className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                  {t('confirmDirectTopupBtn')}
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
          <Card className={cn("bg-[#0B0F19]/90 border border-indigo-500/20 rounded-3xl p-5 text-white shadow-2xl", isArabic ? "text-right" : "text-left")}>
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Ticket className="w-5 h-5" />
                <CardTitle className="text-base font-black text-white">
                  {t('vouchersHeading')}
                </CardTitle>
              </div>
              <CardDescription className="text-slate-400 text-xs mt-1">
                {t('vouchersSubheading')}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleGenerateVouchers} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className={cn("space-y-1", isArabic ? "text-right" : "text-left")}>
                <Label className="text-xs font-bold text-slate-300">{t('voucherValueLabel')}</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { m: 60, l: isArabic ? '1 س' : '1 hr' },
                    { m: 300, l: isArabic ? '5 س' : '5 hrs' },
                    { m: 600, l: isArabic ? '10 س' : '10 hrs' },
                    { m: 1440, l: isArabic ? 'يوم' : '1 day' },
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

              <div className={cn("space-y-1", isArabic ? "text-right" : "text-left")}>
                <Label className="text-xs font-bold text-slate-300">{t('voucherCountLabel')}</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={voucherCount}
                  onChange={(e) => setVoucherCount(Number(e.target.value))}
                  className={cn("bg-black/60 border-white/10 text-white font-mono text-sm h-10 rounded-xl", isArabic ? "text-right" : "text-left")}
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
                    <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                    {t('generatingCodes')}
                  </>
                ) : (
                  <>
                    <Sparkles className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                    {t('generateCodesBtn')}
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Vouchers Table */}
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl">
            <table className={cn("w-full text-xs", isArabic ? "text-right" : "text-left")}>
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                  <th className="py-3 px-4 font-bold">{t('colVoucherCode')}</th>
                  <th className="py-3 px-4 font-bold">{t('colMinutesValue')}</th>
                  <th className="py-3 px-4 font-bold">{t('colVoucherStatus')}</th>
                  <th className="py-3 px-4 font-bold">{t('colRedeemedBy')}</th>
                  <th className="py-3 px-4 font-bold">{t('colCreatedAt')}</th>
                  <th className="py-3 px-4 font-bold text-center">{t('colCopy')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredVouchers.map((v) => (
                  <tr key={v.code} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-black text-sm text-indigo-300">
                      {v.code}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {v.minutesValue} {t('flightMinutesUnit')} <span className="text-slate-500 text-[10px]">({v.hoursValue} {isArabic ? 'س' : 'hrs'})</span>
                    </td>
                    <td className="py-3 px-4">
                      {v.status === 'UNUSED' ? (
                        <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          {t('voucherUnused')}
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                          {t('voucherRedeemed')}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {v.redeemedBy ? (
                        <div>
                          <p className="font-bold text-white text-xs">{v.redeemedBy.name}</p>
                          <p className="font-mono text-[10px] text-slate-400" dir="ltr">{v.redeemedBy.phone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(v.createdAt).toLocaleDateString(isArabic ? 'ar-JO' : 'en-US')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyCode(v.code)}
                        className="h-8 px-2.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300"
                        title={t('copyCodeTooltip')}
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
          <table className={cn("w-full text-xs", isArabic ? "text-right" : "text-left")}>
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                <th className="py-3.5 px-4 font-bold">{t('colUser')}</th>
                <th className="py-3.5 px-4 font-bold">{t('colTransactionType')}</th>
                <th className="py-3.5 px-4 font-bold">{t('colLedgerAmount')}</th>
                <th className="py-3.5 px-4 font-bold">{t('colLedgerStatus')}</th>
                <th className="py-3.5 px-4 font-bold">{t('colLedgerDescription')}</th>
                <th className="py-3.5 px-4 font-bold">{t('colLedgerTime')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ledger.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-white">{item.userName}</p>
                    <p className="font-mono text-[10px] text-slate-400" dir="ltr">{item.userPhone || item.userSerial}</p>
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
                    {new Date(item.createdAt).toLocaleString(isArabic ? 'ar-JO' : 'en-US', {
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

      {/* ----------------- SUBTAB 5: HOURLY RATES REGIONAL ----------------- */}
      {activeSubTab === 'rates' && (
        <HourlyRatesManagementPanel />
      )}

      {/* ----------------- SUBTAB 6: TRANSFER CHANNELS ----------------- */}
      {activeSubTab === 'channels' && (
        <TransferChannelsPanel />
      )}

      {/* ----------------- SUBTAB 7: FINANCIAL DELEGATES ----------------- */}
      {activeSubTab === 'delegates' && (
        <FinancialDelegatesPanel />
      )}

      {/* ========================================================================= */}
      {/* 4. MODALS & PREVIEWS                                                      */}
      {/* ========================================================================= */}

      {/* MODAL 1: Receipt Image Full Preview */}
      <Dialog open={!!selectedReceiptForPreview} onOpenChange={(open) => !open && setSelectedReceiptForPreview(null)}>
        <DialogContent className={cn("max-w-2xl bg-[#0B0F19] border border-white/10 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
          {selectedReceiptForPreview && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center justify-between">
                  <span>{t('previewModalTitle', { name: selectedReceiptForPreview.captainName })}</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {selectedReceiptForPreview.amount.toFixed(2)} {selectedReceiptForPreview.currency}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">
                  {selectedReceiptForPreview.channel} • {new Date(selectedReceiptForPreview.createdAt).toLocaleString(isArabic ? 'ar-JO' : 'en-US')}
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
                  <div className="p-12 text-slate-500">{t('noImageAvailable')}</div>
                )}
              </div>

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedReceiptForPreview(null)}
                  className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
                >
                  {t('close')}
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
                      <CheckCircle2 className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
                      {t('approveReceipt')}
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
                      <XCircle className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
                      {t('rejectReceipt')}
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
        <DialogContent className={cn("max-w-md bg-[#0B0F19] border border-teal-500/30 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
          {receiptToApprove && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  {t('approveModalTitle')}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  {t('approveModalDesc', { name: receiptToApprove.captainName, amount: receiptToApprove.amount.toFixed(2), currency: receiptToApprove.currency })}
                </DialogDescription>
              </DialogHeader>

              {/* Credit Type Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300 block">{t('creditMethodLabel')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApproveCreditType('CASH')}
                    className={cn(
                      "p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between",
                      isArabic ? "text-right" : "text-left",
                      approveCreditType === 'CASH'
                        ? "border-amber-500 bg-amber-500/15 text-white"
                        : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                    )}
                  >
                    <span className="font-bold text-xs text-amber-300">{t('cashOptionTitle', { currency: receiptToApprove.currency })}</span>
                    <span className="text-[10px] text-slate-400 mt-1">{t('cashOptionSub', { amount: receiptToApprove.amount, currency: receiptToApprove.currency })}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApproveCreditType('MINUTES')}
                    className={cn(
                      "p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between",
                      isArabic ? "text-right" : "text-left",
                      approveCreditType === 'MINUTES'
                        ? "border-teal-500 bg-teal-500/15 text-white"
                        : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                    )}
                  >
                    <span className="font-bold text-xs text-teal-300">{t('minutesOptionTitle')}</span>
                    <span className="text-[10px] text-slate-400 mt-1">{t('minutesOptionSub')}</span>
                  </button>
                </div>
              </div>

              {approveCreditType === 'MINUTES' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">{t('minutesCountLabel')}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={approveCustomMinutes}
                    onChange={(e) => setApproveCustomMinutes(Number(e.target.value))}
                    className={cn("bg-black/60 border-white/10 text-white font-mono text-sm h-10 rounded-xl", isArabic ? "text-right" : "text-left")}
                  />
                  <span className="text-[10px] text-slate-400">
                    {t('minutesHoursEquiv', { hours: (approveCustomMinutes / 60).toFixed(1) })}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">{t('confirmNoteLabel')}</Label>
                <Input
                  value={approveAdminNote}
                  onChange={(e) => setApproveAdminNote(e.target.value)}
                  placeholder={t('adminNotePlaceholder2')}
                  className={cn("bg-black/60 border-white/10 text-white text-xs h-10 rounded-xl", isArabic ? "text-right" : "text-left")}
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
                  {t('cancel')}
                </Button>

                <Button
                  type="button"
                  onClick={handleApproveReceipt}
                  disabled={submittingModalAction}
                  className="bg-teal-500 hover:bg-teal-600 text-[#0B0F19] font-black text-xs sm:text-sm h-10 px-5 rounded-xl transition-all"
                >
                  {submittingModalAction ? (
                    <>
                      <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                      {t('approving')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                      {t('confirmApproveBtn')}
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
        <DialogContent className={cn("max-w-md bg-[#0B0F19] border border-rose-500/30 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
          {receiptToReject && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-400" />
                  {t('rejectModalTitle')}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  {t('rejectModalDesc', { name: receiptToReject.captainName, amount: receiptToReject.amount.toFixed(2), currency: receiptToReject.currency })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">{t('rejectReasonLabel')}</Label>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('rejectReasonDefault')}
                  className={cn("bg-black/60 border-white/10 text-white text-xs h-10 rounded-xl", isArabic ? "text-right" : "text-left")}
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
                  {t('back')}
                </Button>

                <Button
                  type="button"
                  onClick={handleRejectReceipt}
                  disabled={submittingModalAction}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm h-10 px-5 rounded-xl transition-all"
                >
                  {submittingModalAction ? (
                    <>
                      <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                      {t('rejecting')}
                    </>
                  ) : (
                    <>
                      <XCircle className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                      {t('confirmRejectBtn')}
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
        <DialogContent className={cn("max-w-md bg-[#0B0F19] border border-teal-500/40 text-white rounded-3xl p-6 shadow-2xl backdrop-blur-xl", isArabic ? "text-right" : "text-left")} dir={direction}>
          {messageReceiptItem && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30">
                    <MessageSquare className="w-5 h-5 text-teal-400" />
                  </div>
                  <span>{t('msgCaptainTitle')}</span>
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  {t('msgCaptainSubtitle')}
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
                    <span dir="ltr">{messageReceiptItem.captainPhone}</span> • {messageReceiptItem.amount} {messageReceiptItem.currency} ({messageReceiptItem.channel})
                  </p>
                </div>

                {messageReceiptItem.captainPhone && (
                  <a
                    href={`https://wa.me/${messageReceiptItem.captainPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(isArabic ? `مرحباً كابتن معلن ${messageReceiptItem.captainName}، بخصوص إيصال الشحن المرسل بقيمة ${messageReceiptItem.amount} ${messageReceiptItem.currency}...` : `Hello Captain ${messageReceiptItem.captainName}, regarding the recharge receipt for ${messageReceiptItem.amount} ${messageReceiptItem.currency}...`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all shrink-0 cursor-pointer"
                    title={t('openWhatsApp')}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('whatsapp')}</span>
                  </a>
                )}
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">{t('msgTitleLabel')}</Label>
                <Input
                  value={receiptMessageTitle}
                  onChange={(e) => setReceiptMessageTitle(e.target.value)}
                  placeholder={t('msgTitleLabel')}
                  className={cn("bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl focus:border-teal-500", isArabic ? "text-right" : "text-left")}
                />
              </div>

              {/* Fast Templates */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">{t('quickTemplates')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    t('tplReuploadClearer'),
                    t('tplProvideRefNumber'),
                    t('tplReceiptUnderReview'),
                    t('tplConfirmWalletNumber')
                  ].map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReceiptMessageBody(tpl)}
                      className={cn("text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer", isArabic ? "text-right" : "text-left")}
                    >
                      {tpl.length > 32 ? tpl.slice(0, 32) + '...' : tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message body */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">{t('msgBodyLabel')}</Label>
                <textarea
                  value={receiptMessageBody}
                  onChange={(e) => setReceiptMessageBody(e.target.value)}
                  placeholder={t('msgBodyPlaceholder')}
                  rows={3}
                  className={cn("w-full bg-black/60 border border-white/10 text-white text-xs p-3 rounded-xl focus:border-teal-500 outline-none resize-none font-sans leading-relaxed", isArabic ? "text-right" : "text-left")}
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
                  {t('cancel')}
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
                        throw new Error(data.error || (isArabic ? 'فشل إرسال الرسالة' : 'Failed to send message'));
                      }

                      toast({
                        title: isArabic ? 'تم إرسال الرسالة بنجاح' : 'Message Sent Successfully',
                        description: data.message || (isArabic ? 'تم إرسال الإشعار اللحظي إلى الكابتن المعلن.' : 'Instant notification sent to captain.'),
                      });

                      setMessageReceiptItem(null);
                      setReceiptMessageBody('');
                    } catch (err: any) {
                      toast({
                        variant: 'destructive',
                        title: isArabic ? 'خطأ أثناء الإرسال' : 'Error Sending',
                        description: err.message || (isArabic ? 'تعذر إرسال الإشعار للكابتن المعلن' : 'Could not send notification to captain'),
                      });
                    } finally {
                      setSubmittingReceiptMessage(false);
                    }
                  }}
                  className="bg-teal-500 hover:bg-teal-600 text-[#0B0F19] font-black text-xs h-10 px-6 rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  {submittingReceiptMessage ? (
                    <>
                      <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-1" : "mr-1")} />
                      {t('sendingMsg')}
                    </>
                  ) : (
                    <>
                      <Send className={cn("w-4 h-4", isArabic ? "ml-1" : "mr-1")} />
                      {t('sendMsgBtn')}
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

