'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import {
  Users,
  Search,
  Star,
  MapPin,
  Calendar,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Phone,
  AlertTriangle,
  RotateCcw,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertOctagon,
  Send,
  MessageSquare,
  Navigation,
  CheckSquare,
  Square,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

export interface RiderUser {
  id: string;
  serial_id: string;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'IDLE' | 'BUSY' | 'SUSPENDED' | 'BANNED';
  tier: string;
  rating: number;
  trust_score: number;
  consecutive_cancellations: number;
  completed_trips_count?: number;
  governorate: string;
  district: string;
  created_at: string;
  updated_at: string;
  wallet: {
    balance: number;
    currency_code: string;
  };
}

const styles = {
  header: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/10",
  kpiGrid: "grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6",
  kpiCard: "rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg relative overflow-hidden",
  kpiTitle: "text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5",
  kpiValue: "text-2xl font-black text-white font-mono",
  searchContainer: "relative w-full sm:w-80",
  searchInput: "bg-black/70 border-white/15 text-white pl-3 pr-9 h-10 text-xs rounded-xl focus:border-[#14B8A6] text-right font-medium placeholder:text-slate-500",
  searchIcon: "absolute right-3 top-3 h-4 w-4 text-slate-400",
  tableCard: "rounded-2xl border border-white/10 bg-[#0B0F19]/95 overflow-hidden shadow-2xl backdrop-blur-xl",
  tableHead: "border-b border-white/10 bg-[#0F172A]/90 text-slate-200 text-xs font-black tracking-wide",
  tableRow: "border-b border-white/[0.06] transition-colors hover:bg-white/[0.03]",
  avatar: "flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 font-black border border-cyan-500/30 text-xs",
  statusBadge: "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-sm",
} as const;

export function RidersManagementPanel() {
  const { toast } = useToast();
  const [riders, setRiders] = useState<RiderUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [immunityFilter, setImmunityFilter] = useState<string>('ALL');

  // Multi-selection state
  const [selectedRiderIds, setSelectedRiderIds] = useState<Set<string>>(new Set());

  // Modals state
  const [inspectRider, setInspectRider] = useState<RiderUser | null>(null);
  const [securityRider, setSecurityRider] = useState<RiderUser | null>(null);

  // Direct Message modal inputs
  const [messageRider, setMessageRider] = useState<RiderUser | null>(null);
  const [messageTitle, setMessageTitle] = useState('رسالة من إدارة المنظومة');
  const [messageBody, setMessageBody] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'admin_message' | 'warning' | 'urgent'>('admin_message');
  const [submittingMessage, setSubmittingMessage] = useState(false);

  // Bulk Broadcast modal inputs
  const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
  const [bulkScope, setBulkScope] = useState<'all' | 'selected' | 'filtered'>('all');
  const [bulkMsgTitle, setBulkMsgTitle] = useState('إشعار توجيهي من إدارة المنظومة');
  const [bulkMsgBody, setBulkMsgBody] = useState('');
  const [bulkMsgType, setBulkMsgType] = useState<'info' | 'admin_message' | 'warning' | 'urgent'>('admin_message');
  const [submittingBulkMessage, setSubmittingBulkMessage] = useState(false);

  // Security modal inputs
  const [targetStatus, setTargetStatus] = useState<string>('IDLE');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchRiders = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await adminFetch('/api/admin/users?role=RIDER');
      const data = await res.json();
      if (data?.success && Array.isArray(data.users)) {
        setRiders(data.users);
      } else {
        throw new Error(data?.error || 'فشل تحميل بيانات الركاب');
      }
    } catch (err: any) {
      console.warn('[RidersManagementPanel] fetch error:', err);
      toast({
        variant: 'destructive',
        title: 'خطأ استدعاء الركاب',
        description: err.message || 'تعذر جلب بيانات الركاب من قاعدة البيانات',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchRiders();
  }, [fetchRiders]);

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

      await fetchRiders(true);
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

  // Filtered riders
  const filteredRiders = useMemo(() => {
    return riders.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.full_name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.serial_id.toLowerCase().includes(q) ||
        r.governorate.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' || r.status === statusFilter;

      let matchesImmunity = true;
      if (immunityFilter === 'HIGH') matchesImmunity = r.trust_score >= 4.5;
      else if (immunityFilter === 'WARNING') matchesImmunity = r.trust_score >= 4.2 && r.trust_score < 4.5;
      else if (immunityFilter === 'CRITICAL') matchesImmunity = r.trust_score < 4.2;

      return matchesSearch && matchesStatus && matchesImmunity;
    });
  }, [riders, searchQuery, statusFilter, immunityFilter]);

  // Multi-selection helpers
  const handleSelectAll = () => {
    if (selectedRiderIds.size === filteredRiders.length) {
      setSelectedRiderIds(new Set());
    } else {
      setSelectedRiderIds(new Set(filteredRiders.map((r) => r.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedRiderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // KPI Statistics
  const stats = useMemo(() => {
    const total = riders.length;
    const online = riders.filter(r => r.status === 'ACTIVE' || r.status === 'BUSY').length;
    const idle = riders.filter(r => r.status === 'IDLE').length;
    const suspended = riders.filter(r => r.status === 'SUSPENDED' || r.status === 'BANNED').length;
    const atRisk = riders.filter(r => r.trust_score < 4.2 || r.consecutive_cancellations >= 3).length;
    const completedTrips = riders.reduce((acc, r) => acc + (r.completed_trips_count || 0), 0);
    return { total, online, idle, suspended, atRisk, completedTrips };
  }, [riders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className={cn(styles.statusBadge, "bg-emerald-500/15 text-emerald-300 border-emerald-500/30")}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            نشط بالرادار
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

  const getImmunityBadge = (score: number) => {
    if (score >= 4.5) {
      return (
        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs shadow-sm">
          <Star className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
          <span>{score.toFixed(1)}</span>
          <span className="text-[10px] text-emerald-400/90 font-bold">(ممتاز)</span>
        </span>
      );
    }
    if (score >= 4.2) {
      return (
        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs shadow-sm">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          <span>{score.toFixed(1)}</span>
          <span className="text-[10px] text-amber-400/90 font-bold">(إنذار)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 font-mono font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 rounded-lg text-xs shadow-sm animate-pulse">
        <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
        <span>{score.toFixed(1)}</span>
        <span className="text-[10px] text-rose-300 font-bold">(خطر أمني)</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* 1. Header & Actions */}
      <div className={styles.header}>
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            إدارة الركاب والمناعة السلوكية
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            متابعة هويات الركاب، جدار الحماية الجنائي وكبح الإلغاء المتتالي.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Global Bulk Message / Notification Button */}
          <Button
            type="button"
            onClick={() => {
              setBulkScope(selectedRiderIds.size > 0 ? 'selected' : 'all');
              setIsBulkMessageOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
            title="بث إشعار وتوجيه إداري لحظي لجميع الركاب أو فئة محددة"
          >
            <Send className="w-4 h-4 ml-0.5" />
            <span>إشعار جماعي</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => fetchRiders()}
            disabled={loading}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={cn("w-4 h-4 text-cyan-400", loading && "animate-spin")} />
            <span>تحديث فوري</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Bar */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            إجمالي الركاب المسجلين
          </p>
          <p className={styles.kpiValue}>{stats.total}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">حسابات نشطة بالمنصة</span>
        </div>

        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            النشطون بالرادار
          </p>
          <p className={cn(styles.kpiValue, "text-emerald-400")}>{stats.online}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">متصلون ويطلبون الآن</span>
        </div>

        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <CheckCircle2 className="h-3.5 w-3.5 text-[#14B8A6]" />
            الرحلات المنفذة بنجاح
          </p>
          <p className={cn(styles.kpiValue, "text-[#14B8A6]")}>{stats.completedTrips}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">إجمالي الرحلات المكتملة</span>
        </div>

        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            حسابات معلقة وموقوفة
          </p>
          <p className={cn(styles.kpiValue, "text-rose-400")}>{stats.suspended}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">ممنوعون من بث العوامة</span>
        </div>

        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            تحت الرقابة السلوكية
          </p>
          <p className={cn(styles.kpiValue, "text-amber-400")}>{stats.atRisk}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">دون 4.2 أو تكرار الإلغاء</span>
        </div>
      </div>

      {/* 3. Search and Multi-filter Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#0B0F19]/90 border border-white/10 p-3.5 rounded-2xl">
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الهاتف، R-1252، أو المدينة..."
            className={styles.searchInput}
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[11px]">
            <span className="text-slate-500 px-2 font-bold">الحالة:</span>
            {['ALL', 'ACTIVE', 'IDLE', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition text-[11px]",
                  statusFilter === st
                    ? "bg-cyan-500 text-black font-black"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {st === 'ALL' ? 'الكل' : st === 'ACTIVE' ? 'نشط' : st === 'IDLE' ? 'جاهز' : 'معلق'}
              </button>
            ))}
          </div>

          {/* Immunity filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[11px]">
            <span className="text-slate-500 px-2 font-bold">مؤشر النزاهة:</span>
            {[
              { key: 'ALL', label: 'الكل' },
              { key: 'HIGH', label: 'عالي (4.5+)' },
              { key: 'WARNING', label: 'إنذار (4.2-4.4)' },
              { key: 'CRITICAL', label: 'خطر (<4.2)' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setImmunityFilter(f.key)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition text-[11px]",
                  immunityFilter === f.key
                    ? "bg-cyan-500 text-black font-black"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Floating Action Bar for Selected Riders */}
      {selectedRiderIds.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 p-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-[#0B0F19]/95 to-indigo-950/40 border border-cyan-500/40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
            </span>
            <div className="text-xs">
              <span className="font-bold text-white">تم تحديد </span>
              <span className="font-black text-cyan-400 font-mono text-sm">{selectedRiderIds.size}</span>
              <span className="font-bold text-white"> راكب من القائمة</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setBulkScope('selected');
                setIsBulkMessageOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-8 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 ml-0.5" />
              <span>إشعار للمحددين ({selectedRiderIds.size})</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedRiderIds(new Set())}
              className="border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 text-xs h-8 px-3 rounded-xl transition-all cursor-pointer"
            >
              <span>إلغاء التحديد</span>
            </Button>
          </div>
        </div>
      )}

      {/* 4. Riders Data Table */}
      <Card className={styles.tableCard}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-xs font-bold">جاري استدعاء سجلات الركاب والمناعة السلوكية...</p>
            </div>
          ) : filteredRiders.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
              <ShieldCheck className="h-10 w-10 text-slate-600" />
              <p className="text-sm font-bold text-slate-300">لا يوجد ركاب مطابقين للبحث</p>
              <p className="text-xs text-slate-500">جرّب تعديل الفلاتر أو إفراغ خانة البحث.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className={styles.tableHead}>
                  <tr>
                    <th className="py-4 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredRiders.length > 0 && selectedRiderIds.size === filteredRiders.length}
                        onChange={handleSelectAll}
                        className="rounded border-white/20 bg-black/60 text-cyan-500 focus:ring-cyan-500 h-4 w-4 cursor-pointer"
                        title="تحديد الكل"
                      />
                    </th>
                    <th className="py-4 px-4 font-black text-slate-200">الراكب والهوية</th>
                    <th className="py-4 px-4 font-black text-slate-200">الموقع الجغرافي</th>
                    <th className="py-4 px-4 font-black text-slate-200">مؤشر النزاهة (المناعة)</th>
                    <th className="py-4 px-4 font-black text-slate-200">الرحلات المنفذة</th>
                    <th className="py-4 px-4 font-black text-slate-200">الإلغاءات المتتالية</th>
                    <th className="py-4 px-4 font-black text-slate-200">الحالة</th>
                    <th className="py-4 px-4 font-black text-slate-200 text-center">إجراءات المشرف</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRiders.map((rider) => {
                    const isAtRisk = rider.trust_score < 4.2 || rider.consecutive_cancellations >= 3;

                    return (
                      <tr key={rider.id} className={styles.tableRow}>
                        {/* Checkbox */}
                        <td className="py-4 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedRiderIds.has(rider.id)}
                            onChange={() => handleToggleSelect(rider.id)}
                            className="rounded border-white/20 bg-black/60 text-cyan-500 focus:ring-cyan-500 h-4 w-4 cursor-pointer"
                          />
                        </td>

                        {/* 1. Identity */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-cyan-500/40 rounded-xl shadow-sm">
                              <AvatarFallback className="bg-cyan-500/15 text-cyan-400 font-black text-xs">
                                {rider.full_name ? rider.full_name.substring(0, 2) : 'ر'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-white text-sm tracking-wide">{rider.full_name}</span>
                                <Badge variant="outline" className="font-mono text-[10px] font-bold bg-cyan-950/60 border-cyan-500/40 text-cyan-300 px-1.5 py-0.5 rounded-md">
                                  {rider.serial_id}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-300 text-xs font-mono font-semibold" dir="ltr">
                                <Phone className="h-3 w-3 text-cyan-400" />
                                <span>{rider.phone}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Location */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 text-slate-200 font-bold bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-xs">
                            <MapPin className="h-3.5 w-3.5 text-[#14B8A6]" />
                            {rider.governorate} - {rider.district}
                          </span>
                        </td>

                        {/* 3. Behavioral Immunity Trust Score */}
                        <td className="py-4 px-4">
                          {getImmunityBadge(rider.trust_score)}
                        </td>

                        {/* 4. Completed Trips */}
                        <td className="py-4 px-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 font-mono font-bold px-2.5 py-1 rounded-lg text-xs border shadow-sm",
                            (rider.completed_trips_count ?? 0) > 0
                              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                              : "bg-black/40 border-white/10 text-slate-400"
                          )}>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span>{rider.completed_trips_count ?? 0} رحلة ناجحة</span>
                          </span>
                        </td>

                        {/* 5. Consecutive cancellations */}
                        <td className="py-4 px-4">
                          {rider.consecutive_cancellations > 0 ? (
                            <Badge className={cn(
                              "font-mono font-bold text-xs px-2.5 py-1 border shadow-sm",
                              rider.consecutive_cancellations >= 3
                                ? "bg-red-950/80 text-red-300 border-red-500/40"
                                : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                            )}>
                              {rider.consecutive_cancellations} إلغاء متتالي ⚠️
                            </Badge>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs font-semibold">0 إلغاء</span>
                          )}
                        </td>

                        {/* 6. Status */}
                        <td className="py-4 px-4">
                          {getStatusBadge(rider.status)}
                        </td>

                        {/* 7. Action buttons */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Inspect */}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setInspectRider(rider)}
                              className="h-8 px-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                              title="عرض تفاصيل الراكب وسجل السلوك"
                            >
                              <Eye className="h-3.5 w-3.5 text-cyan-400" />
                              <span>ملف</span>
                            </Button>

                            {/* Security & Immunity Reset */}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSecurityRider(rider);
                                setTargetStatus(rider.status);
                              }}
                              className={cn(
                                "h-8 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer",
                                isAtRisk
                                  ? "border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                              )}
                              title="إدارة النزاهة والحظر وتصفير العقوبات"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>أمان</span>
                            </Button>

                            {/* Direct Message / Notification */}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setMessageRider(rider);
                                setMessageTitle('رسالة من إدارة المنظومة');
                                setMessageBody('');
                                setMessageType('admin_message');
                              }}
                              className="h-8 px-3 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                              title="إرسال رسالة وتوجيه إداري فوري للراكب"
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
      {/* MODAL 1: Rider Full Profile & Behavioral Details                          */}
      {/* ========================================================================= */}
      <Dialog open={!!inspectRider} onOpenChange={(open) => !open && setInspectRider(null)}>
        <DialogContent className="max-w-lg bg-[#0B0F19] border border-cyan-500/30 text-white rounded-3xl p-6 text-right" dir="rtl">
          {inspectRider && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-cyan-500/40 rounded-2xl">
                      <AvatarFallback className="bg-cyan-500/20 text-cyan-300 font-black text-sm">
                        {inspectRider.full_name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                        {inspectRider.full_name}
                        <Badge className="font-mono text-xs bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                          {inspectRider.serial_id}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-400 mt-0.5">
                        حساب راكب مسجل | انضم في {new Date(inspectRider.created_at).toLocaleDateString('ar-JO')}
                      </DialogDescription>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(inspectRider.status)}
                  </div>
                </div>
              </DialogHeader>

              {/* Identity & Location */}
              <div className="grid grid-cols-2 gap-3 bg-black/40 border border-white/5 p-3.5 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">رقم الهاتف الرسمي</span>
                  <span className="font-mono font-bold text-white block mt-0.5" dir="ltr">{inspectRider.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">المحافظة واللواء</span>
                  <span className="font-bold text-white block mt-0.5">{inspectRider.governorate} - {inspectRider.district}</span>
                </div>
              </div>

              {/* Behavioral Immunity Breakdown (AGENTS.md V2.6) */}
              <div className="border border-white/10 bg-[#161F30]/40 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  مؤشرات جدار الحماية الجنائي والنزاهة السلوكية
                </h4>

                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px]">الرحلات المنفذة بنجاح</span>
                    <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                      {inspectRider.completed_trips_count ?? 0} رحلة
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {(inspectRider.completed_trips_count ?? 0) > 0 ? 'سجل رحلات مكتمل' : 'لا توجد رحلات منفذة'}
                    </span>
                  </div>

                  <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px]">مؤشر النزاهة السلوكية</span>
                    <span className="text-lg font-black text-white font-mono mt-0.5 block">
                      {inspectRider.trust_score.toFixed(1)} / 5.0
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {inspectRider.trust_score < 4.2 ? '⚠️ معرض للإسقاط والحظر' : '✅ سلوك سليم ومستقر'}
                    </span>
                  </div>

                  <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px]">الإلغاءات المتتالية</span>
                    <span className="text-lg font-black text-amber-400 font-mono mt-0.5 block">
                      {inspectRider.consecutive_cancellations} طلبات
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      كبح النبض: 3 إلغاءات تخصم 0.5
                    </span>
                  </div>
                </div>

                {inspectRider.trust_score < 4.2 && (
                  <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-xs text-rose-300 font-bold flex items-start gap-2">
                    <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      تنبيه سيادي: رصيد مناعة هذا الحساب هبط عن الحد الحرج (4.2). يوصى بإعادة التأهيل أو الحظر النهائي.
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter className="flex items-center justify-end border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInspectRider(null)}
                  className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
                >
                  إغلاق
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: Rider Security, Status & Immunity Reset                          */}
      {/* ========================================================================= */}
      <Dialog open={!!securityRider} onOpenChange={(open) => !open && setSecurityRider(null)}>
        <DialogContent className="max-w-md bg-[#0B0F19] border border-amber-500/40 text-white rounded-3xl p-6 text-right" dir="rtl">
          {securityRider && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-400" />
                  إدارة الأمان والمناعة السلوكية
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-1">
                  التحكم بحالة حساب الراكب <span className="text-white font-bold">{securityRider.full_name}</span> وإعادة التأهيل.
                </DialogDescription>
              </DialogHeader>

              {/* Status Change Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">تغيير حالة حساب الراكب:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { st: 'ACTIVE', label: 'تنشيط فوري', cl: 'text-emerald-400 border-emerald-500/30' },
                    { st: 'IDLE', label: 'خامل', cl: 'text-slate-300 border-slate-500/30' },
                    { st: 'SUSPENDED', label: 'تعليق مؤقت', cl: 'text-amber-400 border-amber-500/30' },
                    { st: 'BANNED', label: 'حظر قطعي نهائي', cl: 'text-rose-400 border-rose-500/30' },
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

              {/* One-click Behavioral Immunity Reset */}
              <div className="bg-[#14B8A6]/10 border border-[#14B8A6]/30 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-[#14B8A6] flex items-center gap-1.5">
                    <RotateCcw className="h-4 w-4" />
                    إعادة التأهيل وتصفير العقوبات السلوكية
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  يقوم هذا الإجراء بتصفير عداد الإلغاءات المتتالية وإعادة مؤشر النزاهة والمناعة إلى 5.0 نجوم كاملة، وتفعيل الحساب فوراً.
                </p>
                <Button
                  type="button"
                  size="sm"
                  disabled={submittingAction}
                  onClick={async () => {
                    const ok = await executeAdminAction({
                      action: 'reset_penalties',
                      userId: securityRider.id,
                    }, 'تمت إعادة تأهيل الراكب وتصفير العقوبات بنجاح.');
                    if (ok) setSecurityRider(null);
                  }}
                  className="w-full bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] text-xs font-black h-9 rounded-xl shadow-md shadow-[#14B8A6]/20 cursor-pointer"
                >
                  {submittingAction ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <RotateCcw className="h-4 w-4 ml-1" />}
                  تصفير العقوبات واستعادة النزاهة (5.0)
                </Button>
              </div>

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSecurityRider(null)}
                  className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
                >
                  إلغاء
                </Button>

                <Button
                  type="button"
                  disabled={submittingAction}
                  onClick={async () => {
                    const ok = await executeAdminAction({
                      action: 'update_status',
                      userId: securityRider.id,
                      status: targetStatus,
                    }, `تم تحديث حالة الراكب إلى ${targetStatus}`);
                    if (ok) setSecurityRider(null);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs h-10 px-5 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {submittingAction ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <ShieldCheck className="h-4 w-4 ml-1" />}
                  تأكيد تعديل الحالة
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: Send Direct Message & Notification to Rider                      */}
      {/* ========================================================================= */}
      <Dialog open={!!messageRider} onOpenChange={(open) => !open && setMessageRider(null)}>
        <DialogContent className="max-w-lg bg-[#0B0F19] border border-teal-500/40 text-white rounded-3xl p-6 text-right shadow-2xl backdrop-blur-xl" dir="rtl">
          {messageRider && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30">
                    <MessageSquare className="h-5 w-5 text-teal-400" />
                  </div>
                  <span>إرسال رسالة وتوجيه إداري للراكب</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-1">
                  إرسال إشعار لحظي يظهر فوراً على شاشة هاتف الراكب وقائمة إشعاراته.
                </DialogDescription>
              </DialogHeader>

              {/* Rider Target Profile Banner */}
              <div className="bg-[#161F30]/60 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-teal-500/40 rounded-xl">
                    <AvatarFallback className="bg-teal-500/20 text-teal-300 font-bold text-xs">
                      {messageRider.full_name ? messageRider.full_name.substring(0, 2) : 'ر'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{messageRider.full_name}</span>
                      <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-mono">
                        {messageRider.serial_id}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {messageRider.phone} • {messageRider.governorate}
                    </p>
                  </div>
                </div>

                {/* Direct WhatsApp Action */}
                {messageRider.phone && (
                  <a
                    href={`https://wa.me/${messageRider.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً ${messageRider.full_name}، نتواصل معك من إدارة تطبيق رادار الذكي.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all shrink-0 cursor-pointer"
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
                      "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
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
                      "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
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
                      "py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
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
                    "مرحباً بك في رادار الذكي! نتمنى لك تجربة رحلات ممتعة وآمنة دائماً.",
                    "تنبيه إداري: نرجو الالتزام بعدم تكرار إلغاء الطلبات للحفاظ على مؤشر نزاهة حسابك.",
                    "تمت إعادة تأهيل وتنشيط حسابك بنجاح، يمكنك الآن طلب الرحلات بشكل طبيعي.",
                    "عروض وخصومات حصرية متوفرة الآن في منطقتك على رحلاتك القادمة.",
                    "يرجى التأكد من تشغيل محدد الموقع (GPS) بدقة عالية لضمان سرعة استجابة الكباتن."
                  ].map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMessageBody(tpl)}
                      className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-2.5 py-1 rounded-lg transition-colors text-right cursor-pointer"
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
                  placeholder="اكتب الرسالة أو التوجيه للراكب هنا..."
                  rows={4}
                  className="w-full bg-black/60 border border-white/10 text-white text-xs p-3 rounded-xl focus:border-teal-500 outline-none resize-none text-right font-sans leading-relaxed"
                  required
                />
              </div>

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMessageRider(null)}
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
                        userId: messageRider.id,
                        title: messageTitle.trim(),
                        message: messageBody.trim(),
                        type: messageType,
                      }, 'تم إرسال الرسالة إلى الراكب بنجاح عبر الإشعار اللحظي.');

                      if (ok) {
                        setMessageRider(null);
                        setMessageBody('');
                      }
                    } finally {
                      setSubmittingMessage(false);
                    }
                  }}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-teal-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  {submittingMessage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>إرسال الرسالة الآن</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: Bulk Send Message / Broadcast Notification to Riders             */}
      {/* ========================================================================= */}
      <Dialog open={isBulkMessageOpen} onOpenChange={setIsBulkMessageOpen}>
        <DialogContent className="max-w-lg bg-[#0B0F19] border border-indigo-500/40 text-white rounded-3xl p-6 text-right shadow-2xl backdrop-blur-xl" dir="rtl">
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-indigo-400" />
                بث إشعار وتوجيه جماعي للركاب
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-1">
                إرسال رسالة توجيهية أو إشعار فوري يظهر مباشرة في هواتف الركاب وقائمة إشعاراتهم.
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
                  <span>جميع الركاب</span>
                  <span className="text-[11px] font-mono opacity-80">({riders.length})</span>
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
                  <span className="text-[11px] font-mono opacity-80">({selectedRiderIds.size})</span>
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
                  <span className="text-[11px] font-mono opacity-80">({filteredRiders.length})</span>
                </button>
              </div>

              {bulkScope === 'selected' && selectedRiderIds.size === 0 && (
                <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl mt-1.5">
                  ⚠️ لم تحدد أي راكب من الجدول بعد! يمكنك تحديد ركاب عبر المربعات في الجدول، أو اختيار (جميع الركاب) أعلاه.
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
                  "تحديث جديد في التطبيق: أصبح طلب الرحلات أسرع وأسهل الآن!",
                  "عروض حصرية: خصومات مميزة على جميع المشاوير هذا الأسبوع.",
                  "تنبيه: نرجو التأكد من دقة موقع الانطلاق على الخريطة لتسهيل وصول الكابتن.",
                  "شكراً لثقتكم برادار الذكي - خدمة التوصيل الأسرع والأكثر أماناً.",
                  "نتمنى لكم أسبوعاً سعيداً ورحلات موفقة وآمنة مع رادار الذكي."
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
              <label className="text-xs font-bold text-slate-300">محتوى الإشعار:</label>
              <textarea
                value={bulkMsgBody}
                onChange={(e) => setBulkMsgBody(e.target.value)}
                placeholder="اكتب نص الإشعار الجماعي الموجه للركاب هنا..."
                rows={4}
                className="w-full bg-black/60 border border-white/10 text-white text-xs p-3 rounded-xl focus:border-indigo-500 outline-none resize-none text-right font-sans leading-relaxed"
                required
              />
            </div>

            <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBulkMessageOpen(false)}
                disabled={submittingBulkMessage}
                className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
              >
                إلغاء
              </Button>

              <Button
                type="button"
                disabled={submittingBulkMessage || !bulkMsgBody.trim() || (bulkScope === 'selected' && selectedRiderIds.size === 0)}
                onClick={async () => {
                  let targetIds: string[] = [];
                  if (bulkScope === 'selected') {
                    targetIds = Array.from(selectedRiderIds);
                  } else if (bulkScope === 'filtered') {
                    targetIds = filteredRiders.map((r) => r.id);
                  }

                  setSubmittingBulkMessage(true);
                  try {
                    const ok = await executeAdminAction({
                      action: 'bulk_send_message',
                      role: 'RIDER',
                      userIds: targetIds.length > 0 ? targetIds : undefined,
                      title: bulkMsgTitle.trim(),
                      message: bulkMsgBody.trim(),
                      type: bulkMsgType,
                    }, 'تم بث الإشعار بنجاح إلى الركاب.');

                    if (ok) {
                      setIsBulkMessageOpen(false);
                      setBulkMsgBody('');
                      setSelectedRiderIds(new Set());
                    }
                  } finally {
                    setSubmittingBulkMessage(false);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
              >
                {submittingBulkMessage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>بث الإشعار الآن</span>
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
