'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase-client';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import {
  Users,
  Search,
  Star,
  Heart,
  ShieldAlert,
  ShieldCheck,
  Phone,
  Clock,
  Car,
  CheckCircle2,
  Check,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Zap,
  Sliders,
  Eye,
  FileText,
  Filter,
  Loader2,
  ExternalLink,
  PlusCircle,
  Award,
  ChevronDown,
  RefreshCw,
  BadgeAlert,
  DollarSign,
  MessageSquare,
  Send,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getRankTheme } from '@/core/utils';

export interface CaptainUser {
  id: string;
  serial_id: string;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'IDLE' | 'BUSY' | 'SUSPENDED' | 'BANNED';
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  rating: number;
  rating_count: number;
  heart_count: number;
  penalty_count: number;
  trust_score: number;
  governorate: string;
  district: string;
  created_at: string;
  vehicle: {
    brand: string;
    model: string;
    year: number;
    color: string;
    plate: string;
    type: string;
    affiliation_type: string;
    office_phone: string;
    side_id: string;
  };
  verification_status: 'APPROVED' | 'PENDING' | 'REJECTED';
  documents: {
    identity_url: string | null;
    driving_license_url: string | null;
    vehicle_registration_url: string | null;
    criminal_record_url: string | null;
  };
  wallet: {
    balance: number;
    paid_minutes_remaining: number;
    bonus_minutes_remaining: number;
    total_minutes: number;
    active_package_name: string | null;
    time_bundle_expires_at: string | null;
    currency_code: string;
    currency_ar?: string;
  };
  currency?: string;
}

export const getCaptainCurrency = (cap?: CaptainUser | null): string => {
  if (!cap) return 'د.أ';
  return (
    (cap as any).currency ||
    cap.wallet?.currency_ar ||
    (cap.wallet?.currency_code === 'EGP' ? 'ج.م' : undefined) ||
    (cap.phone?.startsWith('+20') ? 'ج.م' : 'د.أ')
  );
};

const styles = {
  header: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/10",
  kpiGrid: "grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6",
  kpiCard: "rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg relative overflow-hidden",
  kpiTitle: "text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5",
  kpiValue: "text-2xl font-black text-white font-mono",
  searchContainer: "relative w-full sm:w-80",
  searchInput: "bg-black/70 border-white/15 text-white pl-3 pr-9 h-10 text-xs rounded-xl focus:border-[#14B8A6] text-right font-medium placeholder:text-slate-500",
  searchIcon: "absolute right-3 top-3 h-4 w-4 text-slate-400",
  tableCard: "rounded-2xl border border-white/10 bg-[#0B0F19]/95 overflow-hidden shadow-2xl backdrop-blur-xl",
  tableHead: "border-b border-white/10 bg-[#0F172A]/90 text-slate-200 text-xs font-black tracking-wide",
  tableRow: "border-b border-white/[0.06] transition-colors hover:bg-white/[0.03]",
  avatar: "flex h-10 w-10 items-center justify-center rounded-xl bg-[#14B8A6]/15 text-[#14B8A6] font-black border border-[#14B8A6]/30 text-xs",
  statusBadge: "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-sm",
} as const;

export function DriversManagementTab() {
  const { toast } = useToast();
  const [captains, setCaptains] = useState<CaptainUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<string>('ALL');
  const [rankFilter, setRankFilter] = useState<string>('ALL');

  // Modals state
  const [inspectCaptain, setInspectCaptain] = useState<CaptainUser | null>(null);
  const [topupCaptain, setTopupCaptain] = useState<CaptainUser | null>(null);
  const [securityCaptain, setSecurityCaptain] = useState<CaptainUser | null>(null);
  const [messageCaptain, setMessageCaptain] = useState<CaptainUser | null>(null);

  // Message modal inputs
  const [messageTitle, setMessageTitle] = useState('رسالة من إدارة المنظومة');
  const [messageBody, setMessageBody] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'admin_message' | 'warning' | 'urgent'>('admin_message');
  const [submittingMessage, setSubmittingMessage] = useState(false);

  // Topup modal inputs
  const [minutesToAdd, setMinutesToAdd] = useState<number>(60);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [cashBalanceToAdd, setCashBalanceToAdd] = useState<number>(10);
  const [topupMode, setTopupMode] = useState<'minutes' | 'cash'>('minutes');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Security modal inputs
  const [targetStatus, setTargetStatus] = useState<string>('IDLE');
  const [targetTier, setTargetTier] = useState<string>('SILVER');
  const [securityReason, setSecurityReason] = useState<string>('');

  // Multi-selection state
  const [selectedCaptainIds, setSelectedCaptainIds] = useState<Set<string>>(new Set());

  // Bulk Modals state
  const [isBulkTopupOpen, setIsBulkTopupOpen] = useState(false);
  const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
  const [bulkScope, setBulkScope] = useState<'all' | 'selected' | 'filtered'>('all');

  // Bulk Topup inputs
  const [bulkTopupType, setBulkTopupType] = useState<'minutes' | 'cash'>('minutes');
  const [bulkMinutes, setBulkMinutes] = useState<number>(60);
  const [bulkExtendDays, setBulkExtendDays] = useState<number>(30);
  const [bulkCashAmount, setBulkCashAmount] = useState<number>(10);
  const [submittingBulkTopup, setSubmittingBulkTopup] = useState(false);

  // Bulk Message inputs
  const [bulkMsgTitle, setBulkMsgTitle] = useState('إشعار من إدارة المنظومة');
  const [bulkMsgBody, setBulkMsgBody] = useState('');
  const [bulkMsgType, setBulkMsgType] = useState<'info' | 'admin_message' | 'warning' | 'urgent'>('admin_message');
  const [submittingBulkMsg, setSubmittingBulkMsg] = useState(false);

  const fetchCaptains = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await adminFetch('/api/admin/users?role=CAPTAIN');
      const data = await res.json();
      if (data?.success && Array.isArray(data.users)) {
        setCaptains(data.users);
      } else {
        throw new Error(data?.error || 'فشل تحميل بيانات الكباتن');
      }
    } catch (err: any) {
      console.warn('[DriversManagementTab] fetch error:', err);
      toast({
        variant: 'destructive',
        title: 'خطأ استدعاء الأسطول',
        description: err.message || 'تعذر جلب بيانات الكباتن من قاعدة البيانات',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchCaptains();
  }, [fetchCaptains]);

  // Execute admin action helper
  const executeAdminAction = async (payload: Record<string, any>, successMsg: string) => {
    setSubmittingAction(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'حدث خطأ أثناء معالجة الإجراء');
      }

      toast({
        title: '⚡ تم تنفيذ الإجراء بنجاح',
        description: result.message || successMsg,
      });

      await fetchCaptains(true);
      return true;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'فشل العملية',
        description: err.message || 'تعذر تطبيق الإجراء',
      });
      return false;
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filtered captains
  const filteredCaptains = useMemo(() => {
    return captains.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.serial_id.toLowerCase().includes(q) ||
        c.vehicle.plate.toLowerCase().includes(q) ||
        c.vehicle.brand.toLowerCase().includes(q) ||
        c.vehicle.model.toLowerCase().includes(q) ||
        c.governorate.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' ||
        String(c.status || '').toUpperCase() === statusFilter.toUpperCase();

      const matchesVerification =
        verificationFilter === 'ALL' ||
        (verificationFilter === 'APPROVED'
          ? c.verification_status === 'APPROVED'
          : c.verification_status !== 'APPROVED');

      const matchesRank =
        rankFilter === 'ALL' ||
        String(c.tier || '').toUpperCase() === rankFilter.toUpperCase();

      return matchesSearch && matchesStatus && matchesVerification && matchesRank;
    });
  }, [captains, searchQuery, statusFilter, verificationFilter, rankFilter]);

  // Statistics KPI
  const stats = useMemo(() => {
    const total = captains.length;
    const active = captains.filter(c => c.status === 'ACTIVE' || c.status === 'BUSY').length;
    const pendingVerification = captains.filter(c => c.verification_status === 'PENDING').length;
    const flagged = captains.filter(c => c.status === 'SUSPENDED' || c.status === 'BANNED' || c.penalty_count > 0).length;
    return { total, active, pendingVerification, flagged };
  }, [captains]);

  // Multi-selection helpers
  const toggleSelectOne = (id: string) => {
    setSelectedCaptainIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (filteredCaptains.length === 0) return;
    const allFilteredSelected = filteredCaptains.every((c) => selectedCaptainIds.has(c.id));
    if (allFilteredSelected) {
      setSelectedCaptainIds((prev) => {
        const next = new Set(prev);
        filteredCaptains.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedCaptainIds((prev) => {
        const next = new Set(prev);
        filteredCaptains.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  const clearSelection = () => {
    setSelectedCaptainIds(new Set());
  };

  const getTargetUserIds = (scope: 'all' | 'selected' | 'filtered'): string[] | undefined => {
    if (scope === 'all') {
      return undefined; // backend targets all captains in profiles
    }
    if (scope === 'selected') {
      return Array.from(selectedCaptainIds);
    }
    if (scope === 'filtered') {
      return filteredCaptains.map((c) => c.id);
    }
    return undefined;
  };

  const getTargetCount = (scope: 'all' | 'selected' | 'filtered'): number => {
    if (scope === 'all') return captains.length;
    if (scope === 'selected') return selectedCaptainIds.size;
    if (scope === 'filtered') return filteredCaptains.length;
    return 0;
  };

  const handleBulkTopup = async () => {
    const targetIds = getTargetUserIds(bulkScope);
    if (bulkScope === 'selected' && (!targetIds || targetIds.length === 0)) {
      toast({
        variant: 'destructive',
        title: 'تنبيه',
        description: 'يرجى تحديد كابتن واحد على الأقل أولاً.',
      });
      return;
    }
    if (bulkScope === 'filtered' && (!targetIds || targetIds.length === 0)) {
      toast({
        variant: 'destructive',
        title: 'تنبيه',
        description: 'لا يوجد كباتن مطابقين للفلاتر الحالية.',
      });
      return;
    }

    setSubmittingBulkTopup(true);
    try {
      const payload: Record<string, any> = {
        action: 'bulk_topup',
        topupType: bulkTopupType,
        userIds: targetIds,
      };

      if (bulkTopupType === 'minutes') {
        payload.minutes = bulkMinutes;
        payload.extendDays = bulkExtendDays;
      } else {
        payload.amount = bulkCashAmount;
      }

      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'فشلت عملية الشحن الجماعي');
      }

      toast({
        title: '⚡ تم الشحن بنجاح',
        description: result.message || 'تم تحديث أرصدة الكباتن وإشعارهم بنجاح.',
      });

      setIsBulkTopupOpen(false);
      await fetchCaptains(true);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ في الشحن الجماعي',
        description: err.message || 'تعذر إتمام عملية الشحن الجماعي',
      });
    } finally {
      setSubmittingBulkTopup(false);
    }
  };

  const handleBulkSendMessage = async () => {
    if (!bulkMsgBody.trim()) {
      toast({
        variant: 'destructive',
        title: 'نص الرسالة مطلوب',
        description: 'يرجى كتابة نص الإشعار قبل الإرسال.',
      });
      return;
    }

    const targetIds = getTargetUserIds(bulkScope);
    if (bulkScope === 'selected' && (!targetIds || targetIds.length === 0)) {
      toast({
        variant: 'destructive',
        title: 'تنبيه',
        description: 'يرجى تحديد كابتن واحد على الأقل أولاً.',
      });
      return;
    }
    if (bulkScope === 'filtered' && (!targetIds || targetIds.length === 0)) {
      toast({
        variant: 'destructive',
        title: 'تنبيه',
        description: 'لا يوجد كباتن مطابقين للفلاتر الحالية.',
      });
      return;
    }

    setSubmittingBulkMsg(true);
    try {
      const payload: Record<string, any> = {
        action: 'bulk_send_message',
        title: bulkMsgTitle.trim(),
        message: bulkMsgBody.trim(),
        type: bulkMsgType,
        userIds: targetIds,
      };

      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'فشلت عملية إرسال الإشعار الجماعي');
      }

      toast({
        title: '📢 تم إرسال الإشعار اللحظي',
        description: result.message || 'تم بث الإشعار بنجاح إلى جميع الكباتن المحددين.',
      });

      setIsBulkMessageOpen(false);
      setBulkMsgBody('');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ في إرسال الإشعار الجماعي',
        description: err.message || 'تعذر إرسال الإشعار الجماعي',
      });
    } finally {
      setSubmittingBulkMsg(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className={cn(styles.statusBadge, "bg-emerald-500/15 text-emerald-300 border-emerald-500/30")}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            متصل بالرادار
          </span>
        );
      case 'BUSY':
        return (
          <span className={cn(styles.statusBadge, "bg-amber-500/15 text-amber-300 border-amber-500/30")}>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            في رحلة
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className={cn(styles.statusBadge, "bg-rose-500/15 text-rose-300 border-rose-500/30")}>
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            موقوف مؤقتاً
          </span>
        );
      case 'BANNED':
        return (
          <span className={cn(styles.statusBadge, "bg-red-950/80 text-red-300 border-red-500/40")}>
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            محظور نهائياً
          </span>
        );
      case 'IDLE':
      default:
        return (
          <span className={cn(styles.statusBadge, "bg-slate-800/80 text-slate-200 border-slate-700")}>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            خامل
          </span>
        );
    }
  };

  const getVerificationBadge = (ver: string) => {
    switch (ver) {
      case 'APPROVED':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-2.5 py-1 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 ml-1 text-emerald-400" />
            معتمد وموثق رسمياً
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-rose-500/15 text-rose-300 border border-rose-500/40 text-xs font-bold px-2.5 py-1 shadow-sm">
            <XCircle className="w-3.5 h-3.5 ml-1 text-rose-400" />
            مرفوض
          </Badge>
        );
      case 'PENDING':
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-1 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 ml-1 text-amber-400" />
            قبول تلقائي (غير معتمد يدوي)
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* 1. Header & Actions */}
      <div className={styles.header}>
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#14B8A6]" />
            برج المراقبة والتحكم بالأسطول
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة متكاملة لهويات الكباتن، دقائق طيران الرادار، تدقيق المركبات، والحالات الأمنية.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Global Bulk Topup Button */}
          <Button
            type="button"
            onClick={() => {
              setBulkScope(selectedCaptainIds.size > 0 ? 'selected' : 'all');
              setIsBulkTopupOpen(true);
            }}
            className="bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#14B8A6]/20 transition-all cursor-pointer active:scale-95"
            title="شحن باقات دقائق أو رصيد نقدي لجميع الكباتن أو فئة محددة"
          >
            <Zap className="w-4 h-4" />
            <span>شحن الأسطول</span>
          </Button>

          {/* Global Bulk Message / Notification Button */}
          <Button
            type="button"
            onClick={() => {
              setBulkScope(selectedCaptainIds.size > 0 ? 'selected' : 'all');
              setIsBulkMessageOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
            title="بث إشعار وتوجيه إداري لحظي لجميع الكباتن أو فئة محددة"
          >
            <Send className="w-4 h-4 ml-0.5" />
            <span>إشعار جماعي</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => fetchCaptains()}
            disabled={loading}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={cn("w-4 h-4 text-[#14B8A6]", loading && "animate-spin")} />
            <span>تحديث فوري</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Bar */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#14B8A6]/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <Users className="h-3.5 w-3.5 text-[#14B8A6]" />
            إجمالي الكباتن بالأسطول
          </p>
          <p className={styles.kpiValue}>{stats.total}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">مسجلون بالنظام</span>
        </div>

        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            نشط على الرادار الآن
          </p>
          <p className={cn(styles.kpiValue, "text-emerald-400")}>{stats.active}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">جاهز لاستقبال الطلبات</span>
        </div>

        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            بانتظار تدقيق الوثائق
          </p>
          <p className={cn(styles.kpiValue, "text-amber-400")}>{stats.pendingVerification}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">مركبات ورخص جديدة</span>
        </div>

        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            موقوف / مخالفات
          </p>
          <p className={cn(styles.kpiValue, "text-rose-400")}>{stats.flagged}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">كوابح السوق أو حظر</span>
        </div>
      </div>

      {/* 3. Search and Multi-filter Controls */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-[#0B0F19]/90 border border-white/10 p-3.5 rounded-2xl">
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الهاتف، C-1250، اللوحة..."
            className={styles.searchInput}
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[11px]">
            <span className="text-slate-400 px-2 font-bold">الحالة:</span>
            {[
              { key: 'ALL', label: 'الكل' },
              { key: 'ACTIVE', label: 'نشط' },
              { key: 'IDLE', label: 'خامل' },
              { key: 'BUSY', label: 'في رحلة' },
              { key: 'SUSPENDED', label: 'معلق' },
              { key: 'BANNED', label: 'محظور' },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setStatusFilter(st.key)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition text-[11px]",
                  statusFilter === st.key
                    ? "bg-[#14B8A6] text-[#0B0F19]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Verification filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[11px]">
            <span className="text-slate-400 px-2 font-bold">الاعتماد:</span>
            {[
              { key: 'ALL', label: 'الكل' },
              { key: 'APPROVED', label: 'معتمد' },
              { key: 'PENDING', label: 'غير معتمد' },
            ].map((ver) => (
              <button
                key={ver.key}
                type="button"
                onClick={() => setVerificationFilter(ver.key)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition text-[11px]",
                  verificationFilter === ver.key
                    ? "bg-[#14B8A6] text-[#0B0F19]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {ver.label}
              </button>
            ))}
          </div>

          {/* Rank Tier filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[11px]">
            <span className="text-slate-400 px-2 font-bold">الرتبة:</span>
            {[
              { key: 'ALL', label: 'الكل' },
              { key: 'PLATINUM', label: 'بلاتيني' },
              { key: 'GOLD', label: 'ذهبي' },
              { key: 'SILVER', label: 'فضي' },
              { key: 'BRONZE', label: 'برونزي' },
            ].map((rk) => (
              <button
                key={rk.key}
                type="button"
                onClick={() => setRankFilter(rk.key)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition text-[11px]",
                  rankFilter === rk.key
                    ? "bg-[#14B8A6] text-[#0B0F19]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {rk.label}
              </button>
            ))}
          </div>

          {/* Reset Filters button if any filter is active */}
          {(statusFilter !== 'ALL' || verificationFilter !== 'ALL' || rankFilter !== 'ALL' || searchQuery.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setVerificationFilter('ALL');
                setRankFilter('ALL');
                setSearchQuery('');
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-bold transition"
              title="إعادة ضبط الفلاتر"
            >
              <RotateCcw className="w-3 h-3 text-[#14B8A6]" />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar for Selected Captains */}
      {selectedCaptainIds.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 p-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#14B8A6]/20 via-[#0B0F19]/95 to-indigo-950/40 border border-[#14B8A6]/40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#14B8A6]"></span>
            </span>
            <div className="text-xs">
              <span className="font-bold text-white">تم تحديد </span>
              <span className="font-black text-[#14B8A6] font-mono text-sm">{selectedCaptainIds.size}</span>
              <span className="font-bold text-white"> كابتن من الأسطول</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setBulkScope('selected');
                setIsBulkTopupOpen(true);
              }}
              className="bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-xs h-8 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>شحن للمحددين ({selectedCaptainIds.size})</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                setBulkScope('selected');
                setIsBulkMessageOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-8 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إشعار للمحددين ({selectedCaptainIds.size})</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={clearSelection}
              className="border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 text-xs h-8 px-3 rounded-xl transition-all cursor-pointer"
            >
              <span>إلغاء التحديد</span>
            </Button>
          </div>
        </div>
      )}

      {/* 4. Fleet Data Table */}
      <Card className={styles.tableCard}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
              <p className="text-xs font-bold">جاري استدعاء برج مراقبة الأسطول والبيانات السيادية...</p>
            </div>
          ) : filteredCaptains.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
              <Car className="h-10 w-10 text-slate-600" />
              <p className="text-sm font-bold text-slate-300">لا يوجد كباتن مطابقين لمعايير البحث</p>
              <p className="text-xs text-slate-500">جرّب تغيير فلاتر الحالة أو مسح نص البحث.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className={styles.tableHead}>
                  <tr>
                    {/* Master Checkbox Header */}
                    <th className="py-4 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className={cn(
                          "w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer mx-auto",
                          filteredCaptains.length > 0 && filteredCaptains.every(c => selectedCaptainIds.has(c.id))
                            ? "bg-[#14B8A6] border-[#14B8A6] text-[#0B0F19]"
                            : filteredCaptains.some(c => selectedCaptainIds.has(c.id))
                            ? "bg-[#14B8A6]/30 border-[#14B8A6] text-[#14B8A6]"
                            : "border-white/20 bg-black/40 hover:border-white/40"
                        )}
                        title={
                          filteredCaptains.length > 0 && filteredCaptains.every(c => selectedCaptainIds.has(c.id))
                            ? "إلغاء تحديد الكل"
                            : "تحديد جميع الكباتن الظاهرين"
                        }
                      >
                        {filteredCaptains.length > 0 && filteredCaptains.every(c => selectedCaptainIds.has(c.id)) ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : filteredCaptains.some(c => selectedCaptainIds.has(c.id)) ? (
                          <div className="w-2 h-0.5 bg-[#14B8A6] rounded" />
                        ) : null}
                      </button>
                    </th>
                    <th className="py-4 px-4 font-black text-slate-200">الكابتن والهوية</th>
                    <th className="py-4 px-4 font-black text-slate-200">المركبة واللوحة</th>
                    <th className="py-4 px-4 font-black text-slate-200">دقائق الرادار</th>
                    <th className="py-4 px-4 font-black text-slate-200">الرتبة والتقييم</th>
                    <th className="py-4 px-4 font-black text-slate-200">حالة الاعتماد</th>
                    <th className="py-4 px-4 font-black text-slate-200">الحالة التشغيلية</th>
                    <th className="py-4 px-4 font-black text-slate-200 text-center">إجراءات المشرف</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCaptains.map((captain) => {
                    const rankTheme = getRankTheme(captain.tier?.toLowerCase() || 'silver');
                    const hasMinutes = captain.wallet.total_minutes > 0;
                    const isSelected = selectedCaptainIds.has(captain.id);

                    return (
                      <tr
                        key={captain.id}
                        className={cn(
                          styles.tableRow,
                          isSelected && "bg-[#14B8A6]/[0.08] border-[#14B8A6]/30 hover:bg-[#14B8A6]/[0.12]"
                        )}
                      >
                        {/* Row Checkbox */}
                        <td className="py-4 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectOne(captain.id)}
                            className={cn(
                              "w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer mx-auto",
                              isSelected
                                ? "bg-[#14B8A6] border-[#14B8A6] text-[#0B0F19]"
                                : "border-white/20 bg-black/40 hover:border-white/40"
                            )}
                            title={isSelected ? "إلغاء التحديد" : "تحديد هذا الكابتن"}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                        </td>
                        {/* 1. Identity */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-[#14B8A6]/40 rounded-xl shadow-sm">
                              <AvatarFallback className="bg-[#14B8A6]/15 text-[#14B8A6] font-black text-xs">
                                {captain.full_name ? captain.full_name.substring(0, 2) : 'ك'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-white text-sm tracking-wide">{captain.full_name}</span>
                                <Badge variant="outline" className="font-mono text-[10px] font-bold bg-cyan-950/60 border-cyan-500/40 text-cyan-300 px-1.5 py-0.5 rounded-md">
                                  {captain.serial_id}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-300 text-xs font-mono font-semibold" dir="ltr">
                                <Phone className="h-3 w-3 text-[#14B8A6]" />
                                <span>{captain.phone}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Vehicle */}
                        <td className="py-4 px-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 font-bold text-white text-xs">
                              <Car className="h-4 w-4 text-[#14B8A6] shrink-0" />
                              <bdi className="font-black text-white text-xs tracking-wide">
                                {captain.vehicle.brand || 'مركبة'} {captain.vehicle.model}
                              </bdi>
                              {captain.vehicle.year ? (
                                <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-1.5 py-0.5 rounded font-bold">
                                  {captain.vehicle.year}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-[11px] bg-slate-900 border border-slate-700/80 px-2.5 py-0.5 rounded-md text-amber-300 tracking-wider inline-flex items-center gap-1 shadow-sm" dir="ltr">
                                <span>{captain.vehicle.plate || 'بدون لوحة'}</span>
                              </span>
                              {captain.vehicle.color && (
                                <span className="text-[11px] text-slate-300 font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                                  {captain.vehicle.color}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Flight Minutes */}
                        <td className="py-4 px-4">
                          <div className="space-y-1 font-mono">
                            {hasMinutes ? (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4 text-emerald-400" />
                                  <span className="font-black text-sm text-emerald-400">
                                    {captain.wallet.total_minutes}
                                  </span>
                                  <span className="text-xs font-bold text-slate-200">دقيقة</span>
                                </div>
                                <span className="text-[11px] font-bold text-emerald-400/90 font-mono block">
                                  ≈ {(captain.wallet.total_minutes / 60).toFixed(1)} ساعة طيران
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4 text-rose-400" />
                                  <span className="font-black text-sm text-rose-400">0</span>
                                  <span className="text-xs font-bold text-rose-300">دقيقة</span>
                                </div>
                                <span className="text-[10px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 rounded inline-block">
                                  منتهي الدقائق
                                </span>
                              </>
                            )}

                            {/* Cash Balance */}
                            <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 font-bold pt-1 border-t border-white/5">
                              <span className="text-slate-400 text-[10px] font-normal">نقدي:</span>
                              <span>{(captain.wallet.balance || 0).toFixed(2)} {getCaptainCurrency(captain)}</span>
                            </div>
                          </div>
                        </td>

                        {/* 4. Rank & Rating */}
                        <td className="py-4 px-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={cn("text-xs font-black px-2.5 py-0.5 rounded-lg border", rankTheme.bg, rankTheme.color, rankTheme.border, rankTheme.glow)}>
                                {rankTheme.label}
                              </Badge>
                              <div className="flex items-center gap-1 font-black font-mono text-amber-300 text-xs bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span>{captain.rating.toFixed(1)}</span>
                              </div>
                            </div>
                            {captain.penalty_count > 0 && (
                              <Badge className="bg-rose-500/15 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                                {captain.penalty_count} مخالفة مسجلة
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* 5. Verification status */}
                        <td className="py-4 px-4">
                          {getVerificationBadge(captain.verification_status)}
                        </td>

                        {/* 6. Operational status */}
                        <td className="py-4 px-4">
                          {getStatusBadge(captain.status)}
                        </td>

                        {/* 7. Action buttons */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Inspect */}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setInspectCaptain(captain)}
                              className="h-8 px-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                              title="عرض وتدقيق الملف والوثائق"
                            >
                              <Eye className="h-3.5 w-3.5 text-cyan-400" />
                              <span>تدقيق</span>
                            </Button>

                            {/* Top-up flight minutes */}
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setTopupCaptain(captain);
                                setMinutesToAdd(60);
                                setExtendDays(30);
                                setCashBalanceToAdd(0);
                              }}
                              className="h-8 px-3 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                              title="شحن باقات دقائق الرادار"
                            >
                              <Zap className="h-3.5 w-3.5 text-emerald-400" />
                              <span>شحن</span>
                            </Button>

                            {/* Security & Anti-Cheat */}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSecurityCaptain(captain);
                                setTargetStatus(captain.status);
                                setTargetTier(captain.tier);
                                setSecurityReason('');
                              }}
                              className="h-8 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                              title="إدارة الحالة والأمان والمخالفات"
                            >
                              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                              <span>أمان</span>
                            </Button>

                            {/* Direct Message / Notification */}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setMessageCaptain(captain);
                                setMessageTitle('رسالة من إدارة المنظومة');
                                setMessageBody('');
                                setMessageType('admin_message');
                              }}
                              className="h-8 px-3 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                              title="إرسال رسالة وتوجيه إداري فوري للكابتن"
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                              <span>مراسلة</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: Inspect Captain Full Profile & Documents                         */}
      {/* ========================================================================= */}
      <Dialog open={!!inspectCaptain} onOpenChange={(open) => !open && setInspectCaptain(null)}>
        <DialogContent className="max-w-2xl bg-[#0B0F19] border border-[#14B8A6]/30 text-white rounded-3xl p-6 text-right" dir="rtl">
          {inspectCaptain && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-[#14B8A6]/40 rounded-2xl">
                      <AvatarFallback className="bg-[#14B8A6]/20 text-[#14B8A6] font-black text-sm">
                        {inspectCaptain.full_name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                        {inspectCaptain.full_name}
                        <Badge className="font-mono text-xs bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                          {inspectCaptain.serial_id}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-400 mt-0.5">
                        كابتن بالأسطول | انضم بتاريخ {new Date(inspectCaptain.created_at).toLocaleDateString('ar-JO')}
                      </DialogDescription>
                    </div>
                  </div>
                  <div>
                    {getVerificationBadge(inspectCaptain.verification_status)}
                  </div>
                </div>
              </DialogHeader>

              {/* Identity & Contact Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-black/40 border border-white/5 p-3.5 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">رقم الهاتف</span>
                  <span className="font-mono font-bold text-white block mt-0.5" dir="ltr">{inspectCaptain.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">الموقع الجغرافي</span>
                  <span className="font-bold text-white block mt-0.5">{inspectCaptain.governorate} - {inspectCaptain.district}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">البريد الإلكتروني</span>
                  <span className="font-mono text-slate-300 block mt-0.5 truncate">{inspectCaptain.email || '-'}</span>
                </div>
              </div>

              {/* Vehicle Specs */}
              <div className="border border-white/10 bg-[#161F30]/40 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white flex items-center gap-2">
                    <Car className="h-4 w-4 text-[#14B8A6]" />
                    مواصفات وبيانات المركبة
                  </h4>
                  <span className="text-[10px] bg-black/60 px-2.5 py-0.5 rounded border border-white/10 text-cyan-400 font-bold">
                    {inspectCaptain.vehicle.affiliation_type === 'office-taxi' ? 'مكتب تاكسي' : inspectCaptain.vehicle.affiliation_type === 'smart-app' ? 'تطبيق ذكي' : 'كابتن حر / مستقل'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px]">المركبة</span>
                    <span className="font-bold text-white">{inspectCaptain.vehicle.brand} {inspectCaptain.vehicle.model}</span>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px]">سنة الصنع</span>
                    <span className="font-mono font-bold text-white">{inspectCaptain.vehicle.year || '-'}</span>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px]">رقم اللوحة</span>
                    <span className="font-mono font-bold text-amber-300">{inspectCaptain.vehicle.plate || '-'}</span>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px]">اللون</span>
                    <span className="font-bold text-white">{inspectCaptain.vehicle.color || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Document verification items */}
              <div className="border border-white/10 bg-black/30 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  المستندات والوثائق المرفوعة
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Identity Document */}
                  <div className="border border-white/10 bg-[#0B0F19] p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">الهوية الوطنية / الشخصية</p>
                      <p className="text-[10px] text-slate-500">
                        {inspectCaptain.documents.identity_url ? 'تم رفع المستند' : 'لم يتم الرفع بعد'}
                      </p>
                    </div>
                    {inspectCaptain.documents.identity_url ? (
                      <a
                        href={inspectCaptain.documents.identity_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14B8A6] hover:underline"
                      >
                        معاينة <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-600">غير متوفر</span>
                    )}
                  </div>

                  {/* Driving License */}
                  <div className="border border-white/10 bg-[#0B0F19] p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">رخصة القيادة الرسمية</p>
                      <p className="text-[10px] text-slate-500">
                        {inspectCaptain.documents.driving_license_url ? 'تم رفع المستند' : 'لم يتم الرفع بعد'}
                      </p>
                    </div>
                    {inspectCaptain.documents.driving_license_url ? (
                      <a
                        href={inspectCaptain.documents.driving_license_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14B8A6] hover:underline"
                      >
                        معاينة <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-600">غير متوفر</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons in Modal Footer */}
              <DialogFooter className="flex flex-row items-center justify-end gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  disabled={submittingAction}
                  onClick={async () => {
                    const ok = await executeAdminAction({
                      action: 'update_verification',
                      userId: inspectCaptain.id,
                      verificationStatus: 'APPROVED',
                    }, 'تم اعتماد وتوثيق الكابتن بنجاح');
                    if (ok) setInspectCaptain(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-9 rounded-xl px-5 shadow-lg shadow-emerald-600/20"
                >
                  {submittingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 ml-1" />}
                  اعتماد الكابتن كلياً
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: Radar Flight Minutes Allocation & Top-Up                         */}
      {/* ========================================================================= */}
      <Dialog open={!!topupCaptain} onOpenChange={(open) => !open && setTopupCaptain(null)}>
        <DialogContent className="max-w-md bg-[#0B0F19] border border-[#14B8A6]/40 text-white rounded-3xl p-6 text-right" dir="rtl">
          {topupCaptain && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#14B8A6]" />
                  شحن رصيد وباقات الكابتن
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-1">
                  تغذية حساب الكابتن <span className="text-white font-bold">{topupCaptain.full_name}</span> بدقائق طيران تشغيلية أو رصيد نقدي بالمحفظة.
                </DialogDescription>
              </DialogHeader>

              {/* Current Wallet status */}
              <div className="bg-black/60 border border-white/10 p-3.5 rounded-2xl grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">دقائق الرادار المتبقية:</span>
                  <span className="text-base font-black text-[#14B8A6]">{topupCaptain.wallet.total_minutes} دقيقة</span>
                  <span className="text-[10px] text-slate-400 block">≈ {((topupCaptain.wallet.total_minutes || 0) / 60).toFixed(1)} س</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">الرصيد النقدي الحالي:</span>
                  <span className="text-base font-black text-amber-400">
                    {(topupCaptain.wallet.balance || 0).toFixed(2)} {getCaptainCurrency(topupCaptain)}
                  </span>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTopupMode('minutes')}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer",
                    topupMode === 'minutes'
                      ? "border-[#14B8A6] bg-[#14B8A6]/20 text-[#14B8A6]"
                      : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>دقائق طيران الرادار</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTopupMode('cash')}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer",
                    topupMode === 'cash'
                      ? "border-amber-500 bg-amber-500/20 text-amber-300"
                      : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                  )}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>رصيد نقدي ({getCaptainCurrency(topupCaptain)})</span>
                </button>
              </div>

              {/* Topup Mode: Minutes */}
              {topupMode === 'minutes' ? (
                <>
                  {/* Quick Packages */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">اختر باقة دقائق سريعة:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { m: 60, label: '+60 دقيقة', sub: 'ساعة رادار' },
                        { m: 300, label: '+300 دقيقة', sub: '5 ساعات' },
                        { m: 600, label: '+600 دقيقة', sub: '10 ساعات' },
                        { m: 1440, label: '+1440 دقيقة', sub: '24 ساعة (يوم)' },
                      ].map((pkg) => (
                        <button
                          key={pkg.m}
                          type="button"
                          onClick={() => setMinutesToAdd(pkg.m)}
                          className={cn(
                            "p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between",
                            minutesToAdd === pkg.m
                              ? "border-[#14B8A6] bg-[#14B8A6]/10 text-white"
                              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          )}
                        >
                          <span className="font-mono font-black text-sm">{pkg.label}</span>
                          <span className="text-[10px] text-slate-400">{pkg.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Minutes Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">أو أدخل عدد الدقائق يدوياً:</label>
                    <Input
                      type="number"
                      min="1"
                      value={minutesToAdd}
                      onChange={(e) => setMinutesToAdd(Number(e.target.value))}
                      className="bg-black/60 border-white/10 text-white font-mono h-10 rounded-xl focus:border-[#14B8A6] text-right"
                    />
                  </div>
                </>
              ) : (
                /* Topup Mode: Cash */
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 block">
                    اختر مبلغ الشحن النقدي ({getCaptainCurrency(topupCaptain)}):
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 20, 50].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashBalanceToAdd(amt)}
                        className={cn(
                          "py-2 rounded-xl border text-xs font-mono font-bold transition cursor-pointer",
                          cashBalanceToAdd === amt
                            ? "border-amber-500 bg-amber-500/20 text-amber-300"
                            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        )}
                      >
                        +{amt} {getCaptainCurrency(topupCaptain)}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      أو أدخل المبلغ يدوياً ({getCaptainCurrency(topupCaptain)}):
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={cashBalanceToAdd}
                      onChange={(e) => setCashBalanceToAdd(Number(e.target.value))}
                      className="bg-black/60 border-white/10 text-white font-mono h-10 rounded-xl focus:border-amber-500 text-right"
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTopupCaptain(null)}
                  className="border-white/10 text-slate-300 text-xs h-9 rounded-xl cursor-pointer"
                >
                  إلغاء
                </Button>

                <Button
                  type="button"
                  disabled={submittingAction || (topupMode === 'minutes' ? minutesToAdd <= 0 : cashBalanceToAdd <= 0)}
                  onClick={async () => {
                    const capCurr = getCaptainCurrency(topupCaptain);
                    if (topupMode === 'minutes') {
                      const ok = await executeAdminAction({
                        action: 'topup_minutes',
                        userId: topupCaptain.id,
                        minutes: minutesToAdd,
                        extendDays,
                      }, `تم شحن ${minutesToAdd} دقيقة رادار بنجاح.`);
                      if (ok) setTopupCaptain(null);
                    } else {
                      const ok = await executeAdminAction({
                        action: 'adjust_balance',
                        userId: topupCaptain.id,
                        amount: cashBalanceToAdd,
                      }, `تم إيداع ${cashBalanceToAdd} ${capCurr} في محفظة الكابتن بنجاح.`);
                      if (ok) setTopupCaptain(null);
                    }
                  }}
                  className={cn(
                    "font-black text-xs h-10 px-5 rounded-xl shadow-lg transition-all cursor-pointer",
                    topupMode === 'minutes'
                      ? "bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] shadow-[#14B8A6]/20"
                      : "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20"
                  )}
                >
                  {submittingAction ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Zap className="h-4 w-4 ml-1" />}
                  {topupMode === 'minutes' ? 'تأكيد شحن الدقائق' : 'تأكيد الإيداع النقدي'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: Status, Penalties & Sovereign Anti-Cheat                         */}
      {/* ========================================================================= */}
      <Dialog open={!!securityCaptain} onOpenChange={(open) => !open && setSecurityCaptain(null)}>
        <DialogContent className="max-w-md bg-[#0B0F19] border border-amber-500/40 text-white rounded-3xl p-6 text-right" dir="rtl">
          {securityCaptain && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-400" />
                  إدارة الحالة والأمان والمخالفات
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-1">
                  التحكم بالرتبة السيادية، تصفير المخالفات، وفرض الإيقاف أو الحظر للكابتن <span className="text-white font-bold">{securityCaptain.full_name}</span>.
                </DialogDescription>
              </DialogHeader>

              {/* Status Change Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">تغيير الحالة التشغيلية:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { st: 'ACTIVE', label: 'تنشيط فوري', cl: 'text-emerald-400 border-emerald-500/30' },
                    { st: 'IDLE', label: 'خامل', cl: 'text-slate-300 border-slate-500/30' },
                    { st: 'SUSPENDED', label: 'تعليق مؤقت', cl: 'text-amber-400 border-amber-500/30' },
                    { st: 'BANNED', label: 'حظر نهائي', cl: 'text-rose-400 border-rose-500/30' },
                  ].map((s) => (
                    <button
                      key={s.st}
                      type="button"
                      onClick={() => setTargetStatus(s.st)}
                      className={cn(
                        "p-2.5 rounded-xl border text-center font-bold transition",
                        targetStatus === s.st
                          ? `bg-white/10 ${s.cl} font-black ring-1 ring-white/20`
                          : "border-white/5 bg-black/40 text-slate-500 hover:text-white"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change Sovereign Rank Tier */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">الرتبة السيادية (Tier):</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                  {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setTargetTier(tier)}
                      className={cn(
                        "py-2 rounded-xl border font-bold text-center transition",
                        targetTier === tier
                          ? "border-[#14B8A6] bg-[#14B8A6]/20 text-[#14B8A6]"
                          : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                      )}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* One-click Reset Penalties */}
              <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-300">سجل المخالفات وكوابح السوق</p>
                  <p className="text-[10px] text-slate-400">
                    المسجل حالياً: <span className="font-bold text-amber-400 font-mono">{securityCaptain.penalty_count} مخالفة</span>
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={submittingAction}
                  onClick={async () => {
                    await executeAdminAction({
                      action: 'reset_penalties',
                      userId: securityCaptain.id,
                    }, 'تم تصفير المخالفات وإعادة التقييم بنجاح.');
                  }}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] h-8 rounded-xl font-bold"
                >
                  <RotateCcw className="h-3 w-3 ml-1" />
                  تصفير المخالفات
                </Button>
              </div>

              {/* Stuck trip release button */}
              {securityCaptain.status === 'BUSY' && (
                <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-300">فك تعليق رحلة الكابتن</p>
                    <p className="text-[10px] text-slate-400">الكابتن عالق في وضع BUSY بسبب انقطاع شبكي</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={submittingAction}
                    onClick={async () => {
                      await executeAdminAction({
                        action: 'force_clear_trip',
                        userId: securityCaptain.id,
                      }, 'تم تحرير الكابتن وإعادته لوضع الجاهزية IDLE.');
                    }}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] h-8 rounded-xl font-bold"
                  >
                    فك التعليق
                  </Button>
                </div>
              )}

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSecurityCaptain(null)}
                  className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
                >
                  إلغاء
                </Button>

                <Button
                  type="button"
                  disabled={submittingAction}
                  onClick={async () => {
                    let ok = true;
                    if (targetStatus !== securityCaptain.status) {
                      ok = await executeAdminAction({
                        action: 'update_status',
                        userId: securityCaptain.id,
                        status: targetStatus,
                      }, `تم تحديث حالة الكابتن إلى ${targetStatus}`);
                    }
                    if (targetTier !== securityCaptain.tier) {
                      ok = await executeAdminAction({
                        action: 'update_tier',
                        userId: securityCaptain.id,
                        tier: targetTier,
                      }, `تم ترقية الرتبة إلى ${targetTier}`);
                    }
                    if (ok) setSecurityCaptain(null);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs h-10 px-5 rounded-xl shadow-lg shadow-amber-500/20"
                >
                  {submittingAction ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <ShieldCheck className="h-4 w-4 ml-1" />}
                  حفظ الإجراءات الأمنية
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: Send Direct Message & Administrative Directive                   */}
      {/* ========================================================================= */}
      <Dialog open={!!messageCaptain} onOpenChange={(open) => !open && setMessageCaptain(null)}>
        <DialogContent className="max-w-lg bg-[#0B0F19] border border-teal-500/40 text-white rounded-3xl p-6 text-right shadow-2xl backdrop-blur-xl" dir="rtl">
          {messageCaptain && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30">
                    <MessageSquare className="h-5 w-5 text-teal-400" />
                  </div>
                  <span>إرسال رسالة وتوجيه إداري للكابتن</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-1">
                  إرسال إشعار لحظي يظهر فوراً على شاشة الكابتن وقائمة إشعاراته.
                </DialogDescription>
              </DialogHeader>

              {/* Captain Target Profile Banner */}
              <div className="bg-[#161F30]/60 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-teal-500/40 rounded-xl">
                    <AvatarFallback className="bg-teal-500/20 text-teal-300 font-bold text-xs">
                      {messageCaptain.full_name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{messageCaptain.full_name}</span>
                      <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-mono">
                        {messageCaptain.serial_id}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {messageCaptain.phone} • {messageCaptain.governorate}
                    </p>
                  </div>
                </div>

                {/* Direct WhatsApp Action */}
                {messageCaptain.phone && (
                  <a
                    href={`https://wa.me/${messageCaptain.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً كابتن ${messageCaptain.full_name}، نتواصل معك من إدارة رادار الذكي.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all shrink-0"
                    title="فتح محادثة واتساب فورية"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>واتساب</span>
                  </a>
                )}
              </div>

              {/* Message Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">نوع الرسالة / الأولوية</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMessageType('admin_message')}
                    className={cn(
                      "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center",
                      messageType === 'admin_message'
                        ? "bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-sm"
                        : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                    )}
                  >
                    رسالة إدارية
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageType('warning')}
                    className={cn(
                      "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center",
                      messageType === 'warning'
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm"
                        : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                    )}
                  >
                    تنبيه تشغيلي
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageType('urgent')}
                    className={cn(
                      "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center",
                      messageType === 'urgent'
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm"
                        : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                    )}
                  >
                    إشعار عاجل
                  </button>
                </div>
              </div>

              {/* Message Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">عنوان الرسالة / الإشعار</label>
                <Input
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="مثال: رسالة من إدارة المنظومة"
                  className="bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl focus:border-teal-500 text-right"
                />
              </div>

              {/* Fast Quick Templates */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">نصوص سريعة جاهزة (بنقرة واحدة):</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "يرجى تجديد رخصة القيادة أو وثائق المركبة لتجنب تعليق الحساب.",
                    "تمت مراجعة حسابك واعتماد بياناتك ووثائقك بنجاح.",
                    "تنبيه إداري: نرجو الالتزام بعدم إلغاء الرحلات بعد قبولها لضمان استقرار حسابك.",
                    "شكر وتقدير من إدارة الرادار لأدائك المتميز والتزامك العالي.",
                    "يرجى التأكد من تشغيل محدد الموقع (GPS) بدقة عالية أثناء فترات العمل."
                  ].map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMessageBody(tpl)}
                      className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-2.5 py-1 rounded-lg transition-colors text-right"
                    >
                      {tpl.length > 35 ? tpl.slice(0, 35) + '...' : tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">نص الرسالة المرسلة</label>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="اكتب التوجيه أو الإشعار للكابتن هنا..."
                  rows={4}
                  className="w-full bg-black/60 border border-white/10 text-white text-xs p-3 rounded-xl focus:border-teal-500 outline-none resize-none text-right font-sans leading-relaxed"
                  required
                />
              </div>

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMessageCaptain(null)}
                  disabled={submittingMessage}
                  className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
                >
                  إلغاء
                </Button>

                <Button
                  type="button"
                  disabled={submittingMessage || !messageBody.trim()}
                  onClick={async () => {
                    setSubmittingMessage(true);
                    try {
                      const ok = await executeAdminAction({
                        action: 'send_message',
                        userId: messageCaptain.id,
                        title: messageTitle.trim(),
                        message: messageBody.trim(),
                        type: messageType,
                      }, 'تم إرسال الرسالة إلى الكابتن بنجاح عبر الإشعار اللحظي.');

                      if (ok) {
                        setMessageCaptain(null);
                        setMessageBody('');
                      }
                    } finally {
                      setSubmittingMessage(false);
                    }
                  }}
                  className="bg-teal-500 hover:bg-teal-600 text-[#0B0F19] font-black text-xs h-10 px-6 rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  {submittingMessage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-1" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 ml-1" />
                      إرسال الإشعار اللحظي
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 5: Bulk Top-Up (Fleet / Selected / Filtered)                        */}
      {/* ========================================================================= */}
      <Dialog open={isBulkTopupOpen} onOpenChange={setIsBulkTopupOpen}>
        <DialogContent className="max-w-lg bg-[#0B0F19] border border-[#14B8A6]/30 text-white rounded-3xl p-6 text-right" dir="rtl">
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#14B8A6]" />
                شحن الأسطول - باقات دقائق أو رصيد نقدي
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-1">
                شحن فوري متزامن وتحديث المحافظ وبث إشعار لحظي للكباتن.
              </DialogDescription>
            </DialogHeader>

            {/* Target Scope Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">الفئة المستهدفة بالشحن:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBulkScope('all')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    bulkScope === 'all'
                      ? "bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6] shadow-sm ring-1 ring-[#14B8A6]/40"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  <span>جميع الكباتن</span>
                  <span className="text-[11px] font-mono opacity-80">({captains.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkScope('selected')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    bulkScope === 'selected'
                      ? "bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6] shadow-sm ring-1 ring-[#14B8A6]/40"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  <span>المحددين يدوياً</span>
                  <span className="text-[11px] font-mono opacity-80">({selectedCaptainIds.size})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkScope('filtered')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    bulkScope === 'filtered'
                      ? "bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6] shadow-sm ring-1 ring-[#14B8A6]/40"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  <span>المطابقين للفلاتر</span>
                  <span className="text-[11px] font-mono opacity-80">({filteredCaptains.length})</span>
                </button>
              </div>

              {bulkScope === 'selected' && selectedCaptainIds.size === 0 && (
                <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl mt-1.5">
                  ⚠️ لم تحدد أي كابتن من الجدول بعد! يمكنك تحديد كباتن عبر المربعات في الجدول، أو اختيار (جميع الكباتن) أعلاه.
                </p>
              )}
            </div>

            {/* Topup Type Switch */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">نوع الشحن:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBulkTopupType('minutes')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer",
                    bulkTopupType === 'minutes'
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                  )}
                >
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>دقائق طيران الرادار</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkTopupType('cash')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer",
                    bulkTopupType === 'cash'
                      ? "bg-amber-500/20 border-amber-500 text-amber-300"
                      : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                  )}
                >
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span>رصيد مالي نقدي (Cash)</span>
                </button>
              </div>
            </div>

            {/* Minutes inputs */}
            {bulkTopupType === 'minutes' && (
              <div className="space-y-3 bg-white/[0.02] border border-white/10 p-3.5 rounded-2xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">اختر عدد الدقائق للشحن:</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { m: 30, label: '+30 دقيقة' },
                      { m: 60, label: '+ساعة (60)' },
                      { m: 120, label: '+ساعتان' },
                      { m: 300, label: '+5 ساعات' },
                    ].map((p) => (
                      <button
                        key={p.m}
                        type="button"
                        onClick={() => setBulkMinutes(p.m)}
                        className={cn(
                          "py-2 rounded-xl text-xs font-mono font-bold border transition text-center cursor-pointer",
                          bulkMinutes === p.m
                            ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                            : "bg-black/50 border-white/10 text-slate-400 hover:text-white"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-slate-400 shrink-0">أو إدخال مخصص:</span>
                    <Input
                      type="number"
                      min="5"
                      step="5"
                      value={bulkMinutes}
                      onChange={(e) => setBulkMinutes(Math.max(1, Number(e.target.value)))}
                      className="bg-black/60 border-white/10 text-white font-mono h-9 rounded-xl focus:border-emerald-500 text-right text-xs"
                      placeholder="عدد الدقائق"
                    />
                    <span className="text-xs text-slate-400">دقيقة</span>
                  </div>
                </div>
              </div>
            )}

            {/* Cash inputs */}
            {bulkTopupType === 'cash' && (
              <div className="space-y-3 bg-white/[0.02] border border-white/10 p-3.5 rounded-2xl">
                <label className="text-xs font-bold text-slate-300">اختر المبلغ المراد إيداعه:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 10, 20, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBulkCashAmount(amt)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-mono font-bold border transition text-center cursor-pointer",
                        bulkCashAmount === amt
                          ? "bg-amber-500/30 border-amber-400 text-amber-200"
                          : "bg-black/50 border-white/10 text-slate-400 hover:text-white"
                      )}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-slate-400 shrink-0">أو إدخال مخصص:</span>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={bulkCashAmount}
                    onChange={(e) => setBulkCashAmount(Math.max(0.5, Number(e.target.value)))}
                    className="bg-black/60 border-white/10 text-white font-mono h-9 rounded-xl focus:border-amber-500 text-right text-xs"
                    placeholder="المبلغ"
                  />
                  <span className="text-xs text-slate-400">رصيد</span>
                </div>
              </div>
            )}

            {/* Impact Summary */}
            <div className="bg-[#14B8A6]/10 border border-[#14B8A6]/30 p-3 rounded-2xl text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-[#14B8A6]" />
                <span>ملخص عملية الشحن:</span>
              </div>
              <p className="text-[11px] text-slate-300">
                سيتم شحن{' '}
                <span className="font-bold text-[#14B8A6] font-mono">
                  {bulkTopupType === 'minutes' ? `${bulkMinutes} دقيقة طيران` : `${bulkCashAmount} رصيد نقدي`}
                </span>{' '}
                إلى{' '}
                <span className="font-bold text-white font-mono">
                  ({getTargetCount(bulkScope)})
                </span>{' '}
                كابتن، وتحديث محافظهم فوراً وبث إشعار لحظي لهواتفهم.
              </p>
            </div>

            <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBulkTopupOpen(false)}
                disabled={submittingBulkTopup}
                className="border-white/10 text-slate-300 text-xs h-9 rounded-xl cursor-pointer"
              >
                إلغاء
              </Button>

              <Button
                type="button"
                disabled={
                  submittingBulkTopup ||
                  getTargetCount(bulkScope) === 0 ||
                  (bulkTopupType === 'minutes' ? bulkMinutes <= 0 : bulkCashAmount <= 0)
                }
                onClick={handleBulkTopup}
                className="bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-xs h-10 px-6 rounded-xl shadow-lg shadow-[#14B8A6]/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                {submittingBulkTopup ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-1" />
                    جاري الشحن الجماعي...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 ml-1" />
                    تأكيد الشحن لـ ({getTargetCount(bulkScope)}) كابتن
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 6: Bulk Send Message / Broadcast Notification                       */}
      {/* ========================================================================= */}
      <Dialog open={isBulkMessageOpen} onOpenChange={setIsBulkMessageOpen}>
        <DialogContent className="max-w-lg bg-[#0B0F19] border border-indigo-500/40 text-white rounded-3xl p-6 text-right" dir="rtl">
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-indigo-400" />
                بث إشعار وتوجيه جماعي للكباتن
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-1">
                إرسال رسالة توجيهية أو إشعار فوري يظهر مباشرة كنافذة منبثقة ونغمة تنبيه في هواتف الكباتن.
              </DialogDescription>
            </DialogHeader>

            {/* Target Scope Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">الفئة المستهدفة بالإشعار:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBulkScope('all')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    bulkScope === 'all'
                      ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-sm ring-1 ring-indigo-500/50"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  <span>جميع الكباتن</span>
                  <span className="text-[11px] font-mono opacity-80">({captains.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkScope('selected')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    bulkScope === 'selected'
                      ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-sm ring-1 ring-indigo-500/50"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  <span>المحددين يدوياً</span>
                  <span className="text-[11px] font-mono opacity-80">({selectedCaptainIds.size})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkScope('filtered')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    bulkScope === 'filtered'
                      ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-sm ring-1 ring-indigo-500/50"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  <span>المطابقين للفلاتر</span>
                  <span className="text-[11px] font-mono opacity-80">({filteredCaptains.length})</span>
                </button>
              </div>

              {bulkScope === 'selected' && selectedCaptainIds.size === 0 && (
                <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl mt-1.5">
                  ⚠️ لم تحدد أي كابتن من الجدول بعد! يمكنك تحديد كباتن عبر المربعات في الجدول، أو اختيار (جميع الكباتن) أعلاه.
                </p>
              )}
            </div>

            {/* Message Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">نوع الرسالة / الأولوية:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBulkMsgType('admin_message')}
                  className={cn(
                    "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                    bulkMsgType === 'admin_message'
                      ? "bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  رسالة إدارية
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMsgType('warning')}
                  className={cn(
                    "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                    bulkMsgType === 'warning'
                      ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  تنبيه تشغيلي
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMsgType('urgent')}
                  className={cn(
                    "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                    bulkMsgType === 'urgent'
                      ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm"
                      : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  إشعار عاجل
                </button>
              </div>
            </div>

            {/* Message Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">عنوان الإشعار:</label>
              <Input
                value={bulkMsgTitle}
                onChange={(e) => setBulkMsgTitle(e.target.value)}
                placeholder="عنوان الإشعار..."
                className="bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl focus:border-indigo-500 text-right"
              />
            </div>

            {/* Fast Quick Templates */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400">قوالب جاهزة سريعة (بنقرة واحدة):</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "بشرى سارة: تم شحن دقائق إضافية لحسابكم بمناسبة نهاية الأسبوع!",
                  "تنبيه هام: يرجى تفعيل وضع الاتصال، الطلبات في منطقتك مرتفعة الآن!",
                  "إشعار تشغيلي: يرجى التأكد من استقرار إشارة GPS وتحديث التطبيق لأحدث إصدار.",
                  "شكر وتقدير: إدارة المنظومة تشكركم على التزامكم العالي وخدمتكم الممتازة.",
                  "تنويه أمني: نذكركم بالالتزام بالتسعيرة الرسمية وعدم إلغاء الرحلات بعد قبولها."
                ].map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBulkMsgBody(tpl)}
                    className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-2.5 py-1 rounded-lg transition-colors text-right cursor-pointer"
                  >
                    {tpl.length > 35 ? tpl.slice(0, 35) + '...' : tpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">نص الرسالة المرسلة:</label>
              <textarea
                value={bulkMsgBody}
                onChange={(e) => setBulkMsgBody(e.target.value)}
                placeholder="اكتب التوجيه أو الإشعار لجميع الكباتن هنا..."
                rows={4}
                className="w-full bg-black/60 border border-white/10 text-white text-xs p-3 rounded-xl focus:border-indigo-500 outline-none resize-none text-right font-sans leading-relaxed"
                required
              />
            </div>

            {/* Broadcast Summary */}
            <div className="bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-2xl text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>ملخص البث اللحظي:</span>
              </div>
              <p className="text-[11px] text-slate-300">
                سيتم بث هذا الإشعار اللحظي إلى{' '}
                <span className="font-bold text-white font-mono">
                  ({getTargetCount(bulkScope)})
                </span>{' '}
                كابتن فوراً، وسيظهر في شاشاتهم كنافذة منبثقة مع رنين الإشعار.
              </p>
            </div>

            <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBulkMessageOpen(false)}
                disabled={submittingBulkMsg}
                className="border-white/10 text-slate-300 text-xs h-9 rounded-xl cursor-pointer"
              >
                إلغاء
              </Button>

              <Button
                type="button"
                disabled={submittingBulkMsg || getTargetCount(bulkScope) === 0 || !bulkMsgBody.trim()}
                onClick={handleBulkSendMessage}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                {submittingBulkMsg ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-1" />
                    جاري بث الإشعار...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 ml-1" />
                    بث الإشعار لـ ({getTargetCount(bulkScope)}) كابتن
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
