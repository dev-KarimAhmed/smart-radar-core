'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  FlaskConical,
  Clock,
  Zap,
  Send,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import type { RiderUser } from './riders-management-panel';
import { cn } from '@/lib/utils';

interface AdminRiderInactivitySimulationPanelProps {
  riders: RiderUser[];
  selectedRiderId: string | null;
  onSelectRider: (riderId: string) => void;
  onRefresh: () => Promise<void> | void;
  onClose: () => void;
  isArabic?: boolean;
}

export function AdminRiderInactivitySimulationPanel({
  riders,
  selectedRiderId,
  onSelectRider,
  onRefresh,
  onClose,
  isArabic = true,
}: AdminRiderInactivitySimulationPanelProps) {
  const t = useTranslations('adminRiders');
  const { toast } = useToast();

  const [searchRider, setSearchRider] = useState('');
  const [customDays, setCustomDays] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [lastResult, setLastResult] = useState<{
    message: string;
    timestamp: string;
  } | null>(null);

  // Filter riders for the quick selection pills
  const filteredRiders = useMemo(() => {
    const q = searchRider.toLowerCase().trim();
    if (!q) return riders.slice(0, 30); // show first 30 for performance
    return riders.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.serial_id.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [riders, searchRider]);

  const selectedRider = useMemo(() => {
    if (!selectedRiderId) return riders[0] || null;
    return riders.find((r) => r.id === selectedRiderId) || riders[0] || null;
  }, [riders, selectedRiderId]);

  const referralInfo = selectedRider?.referral_activity;
  const isCurrentlyActive = referralInfo?.is_active ?? true;
  const daysInactive = referralInfo?.days_inactive ?? 0;

  // Simulate shifting days ago (11, 20, 0, or custom)
  const handleSimulateDays = async (days: number) => {
    if (!selectedRider) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'يرجى اختيار راكب أولاً' : 'Please select a rider first',
      });
      return;
    }

    setIsSimulating(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          action: 'simulate_rider_activity',
          riderId: selectedRider.id,
          daysAgo: days,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || (isArabic ? 'فشلت عملية المحاكاة' : 'Simulation failed'));
      }

      const msg = data.message || (isArabic ? 'تمت المحاكاة بنجاح' : 'Simulation successful');
      setLastResult({
        message: msg,
        timestamp: new Date().toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US'),
      });

      toast({
        title: isArabic ? '🧪 نجاح المحاكاة' : '🧪 Simulation Success',
        description: msg,
      });

      await onRefresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في المحاكاة' : 'Simulation Error',
        description: err?.message || (isArabic ? 'تعذر تطبيق المحاكاة' : 'Could not apply simulation'),
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Direct operational account status update (ACTIVE / IDLE)
  const handleUpdateStatus = async (status: 'ACTIVE' | 'IDLE') => {
    if (!selectedRider) return;
    setIsUpdatingStatus(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_status',
          userId: selectedRider.id,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || (isArabic ? 'فشل تحديث الحالة' : 'Failed to update status'));
      }

      toast({
        title: isArabic ? '⚡ تحديث الحالة التشغيلية' : '⚡ Operational Status Updated',
        description: data.message || (isArabic ? `تم تغيير حالة الحساب إلى ${status}` : `Status changed to ${status}`),
      });

      await onRefresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: err?.message || (isArabic ? 'تعذر تحديث الحالة' : 'Could not update status'),
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Sweep and send 10-day inactivity alert notifications to referring captains
  const handleRunNotificationCheck = async () => {
    setIsChecking(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          action: 'run_inactivity_check',
          captainId: referralInfo?.captain_id || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || (isArabic ? 'فشل فحص عدم النشاط' : 'Inactivity check failed'));
      }

      const count = data.notificationsDispatched || 0;
      const msg = data.message || (count > 0
        ? (isArabic ? `تم إرسال (${count}) إشعار تنبيه للكباتن بنجاح 🚀` : `Successfully dispatched ${count} alerts to captains 🚀`)
        : (isArabic ? 'تم الفحص: لا توجد إشعارات مستحقة حالياً' : 'Check complete: no pending alerts due'));

      setLastResult({
        message: msg,
        timestamp: new Date().toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US'),
      });

      toast({
        title: count > 0 ? (isArabic ? '🚀 تم إرسال الإشعارات' : '🚀 Alerts Dispatched') : (isArabic ? 'ℹ️ اكتمل الفحص' : 'ℹ️ Check Complete'),
        description: msg,
      });

      await onRefresh();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('radar_notifications_updated'));
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في الفحص والإرسال' : 'Check & Dispatch Error',
        description: err?.message || (isArabic ? 'تعذر تشغيل الفحص' : 'Could not run check'),
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="relative rounded-3xl border border-amber-500/35 bg-gradient-to-b from-amber-500/15 via-[#0B0F19]/95 to-[#0B0F19] p-4 sm:p-5 text-white shadow-2xl space-y-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-500/20">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-amber-200 flex items-center gap-2">
              <span>{t('simulationPanelTitle')}</span>
              <span className="text-[10px] bg-amber-500/20 border border-amber-400/40 text-amber-300 px-1.5 py-0.5 rounded-md font-mono font-black">
                {t('simulationBadge')}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t('simulationSubtitle')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={isArabic ? 'إغلاق المحاكاة' : 'Close simulation'}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 1. Rider Selector with search & quick pills */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-amber-400" />
            <span>{t('simulationSelectRider')}</span>
          </label>
          <div className="relative w-full sm:w-64">
            <Search className="absolute start-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchRider}
              onChange={(e) => setSearchRider(e.target.value)}
              placeholder={t('simulationSearchRider')}
              className="h-8 text-xs bg-black/60 border-white/15 px-8 text-white rounded-xl placeholder:text-slate-500 focus:border-amber-400"
            />
          </div>
        </div>

        {/* Rider Pills List */}
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-2xl border border-white/10 bg-black/40">
          {filteredRiders.map((r) => {
            const isSelected = selectedRider?.id === r.id;
            const rRef = r.referral_activity;
            const rIsActive = rRef?.is_active ?? true;
            const rDays = rRef?.days_inactive ?? 0;

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectRider(r.id)}
                className={cn(
                  "text-xs font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 select-none",
                  isSelected
                    ? "border-amber-400 bg-amber-500/30 text-amber-100 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    !rIsActive ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                  )}
                />
                <span className="truncate max-w-[120px]">{r.full_name}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  ({rDays > 0 ? `${rDays}ي` : (isArabic ? 'نشط' : 'active')})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Target Rider Card Info */}
      {selectedRider && (
        <div className="rounded-2xl border border-white/10 bg-black/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">{selectedRider.full_name}</span>
              <Badge variant="outline" className="font-mono text-[10px] bg-cyan-950/60 border-cyan-500/40 text-cyan-300">
                {selectedRider.serial_id}
              </Badge>
              <Badge
                className={cn(
                  "text-[10px] font-black border",
                  !isCurrentlyActive
                    ? "bg-amber-950/80 border-amber-500/40 text-amber-300"
                    : "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                )}
              >
                {!isCurrentlyActive ? `${t('simulationInactiveBadge', { days: daysInactive })} ⚠️` : `${t('simulationActiveBadge')} 🟢`}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-bold border-white/20 text-slate-300">
                {selectedRider.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-mono text-slate-300" dir="ltr">
                <Phone className="h-3 w-3 text-amber-400" />
                <span>{selectedRider.phone}</span>
              </span>
              <span>•</span>
              <span className="text-slate-300">
                {referralInfo?.captain_name ? (
                  <span className="text-amber-200">
                    {t('simulationLinkedCaptain')} {referralInfo.captain_name} ({referralInfo.captain_serial || referralInfo.captain_phone})
                  </span>
                ) : (
                  <span className="text-slate-400 italic">
                    {t('simulationNoLinkedCaptain')}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Quick Direct Status Toggle (ACTIVE / IDLE) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isUpdatingStatus || selectedRider.status === 'ACTIVE'}
              onClick={() => handleUpdateStatus('ACTIVE')}
              className="h-8 text-xs font-bold border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5 ml-1 text-emerald-400" />
              <span>{t('simulationMakeActive')}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isUpdatingStatus || selectedRider.status === 'IDLE'}
              onClick={() => handleUpdateStatus('IDLE')}
              className="h-8 text-xs font-bold border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
            >
              <span>{t('simulationMakeIdle')}</span>
            </Button>
          </div>
        </div>
      )}

      {/* 3. Preset Time Simulation Buttons (Matching Captain's Screen) */}
      <div className="space-y-2">
        <span className="text-xs font-black text-slate-300 block text-start">
          {t('simulationControlHeading')}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {/* 11 Days Inactive */}
          <Button
            type="button"
            variant="outline"
            disabled={isSimulating || !selectedRider}
            onClick={() => handleSimulateDays(11)}
            className="h-9 text-xs font-black border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/10"
          >
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>{t('simulationBtn11Days')}</span>
          </Button>

          {/* 20 Days Inactive */}
          <Button
            type="button"
            variant="outline"
            disabled={isSimulating || !selectedRider}
            onClick={() => handleSimulateDays(20)}
            className="h-9 text-xs font-black border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/10"
          >
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>{t('simulationBtn20Days')}</span>
          </Button>

          {/* Active Today */}
          <Button
            type="button"
            variant="outline"
            disabled={isSimulating || !selectedRider}
            onClick={() => handleSimulateDays(0)}
            className="h-9 text-xs font-black border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/10"
          >
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span>{t('simulationBtnToday')}</span>
          </Button>

          {/* Custom Days Input */}
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min="0"
              max="365"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              placeholder={t('simulationCustomDaysPlaceholder')}
              className="h-9 text-xs font-mono font-bold bg-black/60 border-white/20 text-white rounded-xl focus:border-amber-400 px-2.5 text-center"
            />
            <Button
              type="button"
              disabled={isSimulating || !selectedRider || !customDays}
              onClick={() => handleSimulateDays(Number(customDays) || 0)}
              className="h-9 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-all"
            >
              <span>{t('simulationBtnCustom')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Action Banner: Run Notification Check */}
      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button
          type="button"
          disabled={isChecking}
          onClick={handleRunNotificationCheck}
          className="w-full sm:w-auto px-6 h-10 rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:brightness-110 active:scale-[0.98] font-black text-xs text-slate-950 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          {isChecking ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span>{isChecking ? t('simulationChecking') : t('simulationRunCheckBtn')}</span>
        </Button>

        {lastResult && (
          <div className="text-xs text-slate-300 flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-white">{lastResult.message}</span>
            <span className="text-[10px] text-slate-400 font-mono">({lastResult.timestamp})</span>
          </div>
        )}
      </div>
    </div>
  );
}

