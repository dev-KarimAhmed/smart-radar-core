'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase-client';
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
  };
}

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

  // Topup modal inputs
  const [minutesToAdd, setMinutesToAdd] = useState<number>(60);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [cashBalanceToAdd, setCashBalanceToAdd] = useState<number>(0);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Security modal inputs
  const [targetStatus, setTargetStatus] = useState<string>('IDLE');
  const [targetTier, setTargetTier] = useState<string>('SILVER');
  const [securityReason, setSecurityReason] = useState<string>('');

  const fetchCaptains = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token || '';

      const res = await fetch('/api/admin/users?role=CAPTAIN', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

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
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token || '';

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
        statusFilter === 'ALL' || c.status === statusFilter;

      const matchesVerification =
        verificationFilter === 'ALL' || c.verification_status === verificationFilter;

      const matchesRank =
        rankFilter === 'ALL' || c.tier === rankFilter;

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
            خامل / جاهز
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
            معتمد وموثق
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
            قيد التدقيق
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
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchCaptains()}
            disabled={loading}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs h-10 px-4 rounded-xl flex items-center gap-2"
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
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#0B0F19]/90 border border-white/10 p-3.5 rounded-2xl">
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
            <span className="text-slate-500 px-2 font-bold">الحالة:</span>
            {['ALL', 'ACTIVE', 'IDLE', 'BUSY', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition text-[11px]",
                  statusFilter === st
                    ? "bg-[#14B8A6] text-[#0B0F19]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {st === 'ALL' ? 'الكل' : st === 'ACTIVE' ? 'نشط' : st === 'IDLE' ? 'خامل' : st === 'BUSY' ? 'في رحلة' : 'معلق'}
              </button>
            ))}
          </div>

          {/* Verification filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[11px]">
            <span className="text-slate-500 px-2 font-bold">الاعتماد:</span>
            {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map((ver) => (
              <button
                key={ver}
                type="button"
                onClick={() => setVerificationFilter(ver)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition text-[11px]",
                  verificationFilter === ver
                    ? "bg-[#14B8A6] text-[#0B0F19]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {ver === 'ALL' ? 'الكل' : ver === 'APPROVED' ? 'معتمد' : ver === 'PENDING' ? 'قيد التدقيق' : 'مرفوض'}
              </button>
            ))}
          </div>
        </div>
      </div>

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

                    return (
                      <tr key={captain.id} className={styles.tableRow}>
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
                                  منتهي الرصيد
                                </span>
                              </>
                            )}
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
              <DialogFooter className="flex flex-row items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInspectCaptain(null)}
                  className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
                >
                  إغلاق
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    disabled={submittingAction}
                    onClick={async () => {
                      const ok = await executeAdminAction({
                        action: 'update_verification',
                        userId: inspectCaptain.id,
                        verificationStatus: 'REJECTED',
                      }, 'تم رفض مستندات الكابتن');
                      if (ok) setInspectCaptain(null);
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-9 rounded-xl px-4"
                  >
                    رفض المستندات
                  </Button>

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
                </div>
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
                  شحن باقات دقائق طيران الرادار
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-1">
                  تغذية رصيد الكابتن <span className="text-white font-bold">{topupCaptain.full_name}</span> بدقائق تشغيلية فورية للظهور واستقبال الطلبات.
                </DialogDescription>
              </DialogHeader>

              {/* Current Wallet status */}
              <div className="bg-black/60 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">الرصيد المتبقي حالياً:</span>
                  <span className="text-base font-black text-[#14B8A6]">{topupCaptain.wallet.total_minutes} دقيقة</span>
                </div>
                <div className="text-left">
                  <span className="text-slate-500 text-[10px] block">المعادل بالساعات:</span>
                  <span className="text-sm font-bold text-slate-300">{(topupCaptain.wallet.total_minutes / 60).toFixed(1)} س</span>
                </div>
              </div>

              {/* Quick Packages */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">اختر باقة شحن سريعة:</label>
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

              {/* Extension days */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">تمديد صلاحية الباقة:</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { days: 30, label: '+30 يوماً' },
                    { days: 60, label: '+60 يوماً' },
                    { days: 90, label: '+90 يوماً' },
                  ].map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setExtendDays(opt.days)}
                      className={cn(
                        "py-2 rounded-xl border font-bold text-center transition",
                        extendDays === opt.days
                          ? "border-[#14B8A6] bg-[#14B8A6]/15 text-[#14B8A6]"
                          : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTopupCaptain(null)}
                  className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
                >
                  إلغاء
                </Button>

                <Button
                  type="button"
                  disabled={submittingAction || minutesToAdd <= 0}
                  onClick={async () => {
                    const ok = await executeAdminAction({
                      action: 'topup_minutes',
                      userId: topupCaptain.id,
                      minutes: minutesToAdd,
                      extendDays,
                    }, `تم شحن ${minutesToAdd} دقيقة رادار بنجاح.`);
                    if (ok) setTopupCaptain(null);
                  }}
                  className="bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-xs h-10 px-5 rounded-xl shadow-lg shadow-[#14B8A6]/20"
                >
                  {submittingAction ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Zap className="h-4 w-4 ml-1" />}
                  تأكيد الشحن الفوري
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
                    { st: 'IDLE', label: 'خامل / جاهز', cl: 'text-slate-300 border-slate-500/30' },
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
    </div>
  );
}
