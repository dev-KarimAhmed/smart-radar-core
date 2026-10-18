'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  BellRing,
  ReceiptText,
  UserCheck,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Eye,
  Loader2,
  Volume2,
  VolumeX,
  X,
  Clock,
  Sparkles,
  Phone,
  Shield,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';

export interface AdminNotificationItem {
  id: string;
  category: 'RECEIPT' | 'CAPTAIN' | 'PASSWORD_RESET' | 'SYSTEM';
  title: string;
  description: string;
  createdAt: string;
  severity: 'urgent' | 'warning' | 'info';
  targetTab: 'wallet' | 'captains' | 'riders' | 'admins';
  targetSubtab?: string;
  isRead: boolean;
  payload: {
    transactionId?: string;
    profileId?: string;
    amount?: number;
    currency?: string;
    currencyCode?: string;
    channel?: string;
    receiptPath?: string;
    receiptImageUrl?: string | null;
    captainName?: string;
    captainPhone?: string;
    captainSerial?: string;
    governorate?: string;
    district?: string;
    captainId?: string;
    plateNumber?: string;
    vehicleBrand?: string;
    vehicleModel?: string;
    claimedPhone?: string;
    adminNote?: string;
  };
}

interface NotificationsSummary {
  totalUnread: number;
  pendingReceiptsCount: number;
  pendingCaptainsCount: number;
  pendingResetsCount: number;
  unreadSystemCount: number;
}

function playNotificationChime() {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {
      // Fallback: Web Audio API synth chime (zero external dependencies)
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch {}
    });
  } catch {}
}

export function AdminNotificationCenter() {
  const t = useTranslations('adminNotifications');
  const { isArabic, direction } = useDashboardLanguage();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<'ALL' | 'RECEIPT' | 'CAPTAIN' | 'PASSWORD_RESET' | 'SYSTEM'>('ALL');
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [summary, setSummary] = useState<NotificationsSummary>({
    totalUnread: 0,
    pendingReceiptsCount: 0,
    pendingCaptainsCount: 0,
    pendingResetsCount: 0,
    unreadSystemCount: 0,
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('radar_admin_notif_sound') !== 'disabled';
  });

  // Quick Receipt Review Modal
  const [reviewItem, setReviewItem] = useState<AdminNotificationItem | null>(null);
  const [creditType, setCreditType] = useState<'MINUTES' | 'CASH'>('MINUTES');
  const [minutesValue, setMinutesValue] = useState<number>(0);
  const [adminNote, setAdminNote] = useState<string>('');
  const [processingAction, setProcessingAction] = useState<boolean>(false);
  const [rejectMode, setRejectMode] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const previousUnreadCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const res = await adminFetch('/api/admin/notifications');
      const data = await res.json();

      if (data?.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        if (data.summary) {
          const newSummary = data.summary as NotificationsSummary;
          setSummary(newSummary);

          // Check if unread count increased to play sound & toast
          if (
            !isInitialLoadRef.current &&
            newSummary.totalUnread > previousUnreadCountRef.current &&
            soundEnabled
          ) {
            playNotificationChime();
            toast({
              title: t('audioToastTitle'),
              description: t('audioToastDesc', { count: newSummary.totalUnread }),
            });
          }

          previousUnreadCountRef.current = newSummary.totalUnread;
          isInitialLoadRef.current = false;
        }
      }
    } catch (err) {
      console.warn('[AdminNotificationCenter] Fetch error:', err);
    } finally {
      if (isManual) setLoading(false);
    }
  }, [soundEnabled, toast, t]);

  // Initial fetch and 25s polling pulse
  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 25000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Supabase Realtime subscriptions for instantaneous zero-latency updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-radar-notifications-stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallet_transactions' },
        (payload) => {
          const row = payload.new as any;
          if (row?.status === 'PENDING') {
            if (soundEnabled) {
              playNotificationChime();
              toast({
                title: t('toastNewReceiptTitle'),
                description: t('toastNewReceiptDesc', {
                  amount: row.amount || '',
                  channel: row.payment_channel || t('defaultPaymentChannel'),
                }),
              });
            }
            void fetchNotifications();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'captain_profiles' },
        (payload) => {
          const row = payload.new as any;
          if (row?.verification_status === 'PENDING') {
            void fetchNotifications();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_notifications' },
        () => {
          void fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [fetchNotifications, soundEnabled, toast]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('radar_admin_notif_sound', next ? 'enabled' : 'disabled');
      }
      return next;
    });
  };

  // Navigate to target tab
  const handleNavigateToTab = (tab: string, subtab?: string) => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-switch-tab', { detail: { tab } }));
      if (subtab && tab === 'wallet') {
        window.dispatchEvent(new CustomEvent('admin-wallet-subtab', { detail: { subtab } }));
      }
    }
  };

  // Open Quick Receipt Review Dialog
  const handleOpenReceiptReview = (item: AdminNotificationItem) => {
    const amt = item.payload.amount || 0;
    setReviewItem(item);
    setCreditType('MINUTES');
    setMinutesValue(Math.round(amt * 60)); // Default: 60 mins per 1 currency unit
    setAdminNote('');
    setRejectMode(false);
    setRejectionReason('');
  };

  // Execute Receipt Approval
  const handleApproveReceipt = async () => {
    if (!reviewItem?.payload.transactionId) return;
    try {
      setProcessingAction(true);
      const res = await adminFetch('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({
          action: 'APPROVE_RECEIPT',
          transactionId: reviewItem.payload.transactionId,
          creditType,
          minutesToGrant: minutesValue,
          adminNote,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || t('toastApproveErrorDesc'));
      }

      toast({
        title: t('toastApprovedTitle'),
        description: data.message || t('toastApprovedDesc'),
      });

      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n.id !== reviewItem.id));
      setSummary((prev) => ({
        ...prev,
        totalUnread: Math.max(0, prev.totalUnread - 1),
        pendingReceiptsCount: Math.max(0, prev.pendingReceiptsCount - 1),
      }));

      // Trigger cross-system refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('radar-wallet-refresh'));
      }

      setReviewItem(null);
      void fetchNotifications();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('toastApproveErrorTitle'),
        description: err.message || t('toastApproveErrorDesc'),
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Execute Receipt Rejection
  const handleRejectReceipt = async () => {
    if (!reviewItem?.payload.transactionId) return;
    try {
      setProcessingAction(true);
      const res = await adminFetch('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({
          action: 'REJECT_RECEIPT',
          transactionId: reviewItem.payload.transactionId,
          rejectionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || t('toastRejectErrorDesc'));
      }

      toast({
        title: t('toastRejectedTitle'),
        description: t('toastRejectedDesc'),
      });

      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n.id !== reviewItem.id));
      setSummary((prev) => ({
        ...prev,
        totalUnread: Math.max(0, prev.totalUnread - 1),
        pendingReceiptsCount: Math.max(0, prev.pendingReceiptsCount - 1),
      }));

      // Trigger cross-system refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('radar-wallet-refresh'));
      }

      setReviewItem(null);
      void fetchNotifications();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('toastRejectErrorTitle'),
        description: err.message || t('toastRejectErrorDesc'),
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Filtered notifications list
  const filteredNotifications = notifications.filter((item) => {
    if (filterTab === 'ALL') return true;
    return item.category === filterTab;
  });

  const hasUnread = summary.totalUnread > 0;

  return (
    <>
      {/* ================= Notifications Trigger Button ================= */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className={`relative h-10 px-3.5 rounded-xl border font-bold text-xs transition-all active:scale-95 flex items-center gap-2 ${
          hasUnread
            ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            : 'bg-[#161F30] hover:bg-[#1C273C] border-teal-500/20 text-slate-300 hover:text-white'
        }`}
        title={t('bellTitle')}
      >
        <div className="relative">
          {hasUnread ? (
            <BellRing className="w-4 h-4 text-amber-400 animate-bounce" />
          ) : (
            <Bell className="w-4 h-4 text-teal-400" />
          )}

          {hasUnread && (
            <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-[#0B0F19]">
              {summary.totalUnread > 99 ? '99+' : summary.totalUnread}
            </span>
          )}
        </div>
        <span className="hidden sm:inline">{t('notifications')}</span>
        {hasUnread && (
          <Badge className="bg-amber-500/20 text-amber-300 border-none text-[10px] py-0 px-1.5 hidden md:inline-flex">
            {summary.totalUnread} {t('newBadge')}
          </Badge>
        )}
      </Button>

      {/* ================= Main Notifications Center Dialog ================= */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl bg-[#0B0F19]/98 border border-teal-500/30 text-white shadow-2xl rounded-2xl p-0 overflow-hidden backdrop-blur-2xl max-h-[85vh] flex flex-col" dir={direction}>
          {/* Header */}
          <DialogHeader className={cn("p-4 sm:p-5 border-b border-white/10 bg-black/40 space-y-2", isArabic ? "text-right" : "text-left")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400">
                  <Bell className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>{t('title')}</span>
                    {hasUnread && (
                      <Badge className="bg-amber-500/20 text-amber-300 border-none text-[10px] font-black px-2 py-0.5">
                        {summary.totalUnread} {t('pendingBadge')}
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs">
                    {t('subtitle')}
                  </DialogDescription>
                </div>
              </div>

              {/* Action buttons in header */}
              <div className="flex items-center gap-1.5">
                {/* Sound Toggle */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleSound}
                  className={`h-8 w-8 p-0 rounded-lg border transition-all ${
                    soundEnabled
                      ? 'border-teal-500/30 text-teal-300 bg-teal-500/10 hover:bg-teal-500/20'
                      : 'border-white/10 text-slate-500 bg-black/40 hover:text-white'
                  }`}
                  title={soundEnabled ? t('muteSound') : t('enableSound')}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>

                {/* Refresh Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  onClick={() => fetchNotifications(true)}
                  className="h-8 w-8 p-0 rounded-lg border border-white/10 bg-black/40 text-slate-300 hover:text-teal-300 hover:bg-teal-500/10 transition-all"
                  title={t('refresh')}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 pt-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setFilterTab('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  filterTab === 'ALL'
                    ? 'bg-teal-500 text-[#0B0F19] shadow-[0_0_12px_rgba(20,184,166,0.3)]'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <span>{t('tabAll')}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'ALL' ? 'bg-[#0B0F19]/20 text-[#0B0F19]' : 'bg-white/10 text-slate-300'}`}>
                  {summary.totalUnread}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('RECEIPT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  filterTab === 'RECEIPT'
                    ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <ReceiptText className="w-3.5 h-3.5" />
                <span>{t('tabReceipts')}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'RECEIPT' ? 'bg-black/20 text-black' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {summary.pendingReceiptsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('CAPTAIN')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  filterTab === 'CAPTAIN'
                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{t('tabCaptains')}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'CAPTAIN' ? 'bg-black/20 text-black' : 'bg-cyan-500/20 text-cyan-300'}`}>
                  {summary.pendingCaptainsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('PASSWORD_RESET')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  filterTab === 'PASSWORD_RESET'
                    ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{t('tabResets')}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'PASSWORD_RESET' ? 'bg-black/20 text-black' : 'bg-amber-500/20 text-amber-300'}`}>
                  {summary.pendingResetsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('SYSTEM')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  filterTab === 'SYSTEM'
                    ? 'bg-teal-500 text-black shadow-[0_0_12px_rgba(20,184,166,0.3)]'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t('tabSystem')}</span>
              </button>
            </div>
          </DialogHeader>

          {/* Notifications List Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 scrollbar-thin">
            {loading && notifications.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
                <p className="text-xs">{t('loading')}</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-slate-400 p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{t('emptyTitle')}</p>
                  <p className="text-xs text-slate-500 mt-1">{t('emptyDesc')}</p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isReceipt = item.category === 'RECEIPT';
                const isCaptain = item.category === 'CAPTAIN';
                const isReset = item.category === 'PASSWORD_RESET';

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 transition-all hover:border-white/20 bg-black/40 flex flex-col sm:flex-row items-start justify-between gap-4 ${
                      isReceipt
                        ? 'border-emerald-500/30 hover:bg-emerald-950/10'
                        : isCaptain
                        ? 'border-cyan-500/30 hover:bg-cyan-950/10'
                        : isReset
                        ? 'border-amber-500/30 hover:bg-amber-950/10'
                        : 'border-white/10 hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Right: Icon + Details */}
                    <div className="flex items-start gap-3 w-full sm:w-auto flex-1">
                      {/* Category Icon */}
                      <div
                        className={`h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center mt-0.5 ${
                          isReceipt
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : isCaptain
                            ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                            : isReset
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-white/10 border-white/20 text-slate-300'
                        }`}
                      >
                        {isReceipt ? (
                          <ReceiptText className="w-5 h-5" />
                        ) : isCaptain ? (
                          <UserCheck className="w-5 h-5" />
                        ) : isReset ? (
                          <KeyRound className="w-5 h-5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5" />
                        )}
                      </div>

                      {/* Info Block */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-black text-white">{item.title}</h4>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

                        {/* Extra detail chips */}
                        {isReceipt && (
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                              {t('amount')}: {item.payload.amount} {item.payload.currency}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/10">
                              {t('channel')}: {item.payload.channel}
                            </span>
                            {item.payload.captainPhone && (
                              <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded-lg border border-white/5" dir="ltr">
                                {item.payload.captainPhone}
                              </span>
                            )}
                          </div>
                        )}

                        {isCaptain && (
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            {item.payload.plateNumber && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                                {t('plate')}: {item.payload.plateNumber}
                              </span>
                            )}
                            {item.payload.vehicleBrand && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/10">
                                {item.payload.vehicleBrand} {item.payload.vehicleModel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Left: Action Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      {isReceipt && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleOpenReceiptReview(item)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs h-8 px-3 rounded-xl transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                          >
                            <Eye className="w-3.5 h-3.5 ml-1" />
                            <span>{t('reviewAndApprove')}</span>
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleNavigateToTab('wallet', 'receipts')}
                            className="border-white/10 hover:bg-white/10 text-slate-300 text-xs h-8 px-2.5 rounded-xl"
                            title={t('goToReceipts')}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}

                      {isCaptain && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleNavigateToTab('captains')}
                          className="bg-cyan-500 hover:bg-cyan-600 text-black font-black text-xs h-8 px-3 rounded-xl transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                        >
                          <UserCheck className="w-3.5 h-3.5 ml-1" />
                          <span>{t('reviewCaptain')}</span>
                        </Button>
                      )}

                      {isReset && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleNavigateToTab('captains')}
                          className="bg-amber-500 hover:bg-amber-600 text-black font-black text-xs h-8 px-3 rounded-xl transition-all"
                        >
                          <KeyRound className="w-3.5 h-3.5 ml-1" />
                          <span>{t('reviewRequest')}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="p-3 sm:p-4 border-t border-white/10 bg-black/60 flex items-center justify-between sm:justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('footerDigitalJudge')}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white h-8 px-3 rounded-xl"
            >
              {t('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= Quick Receipt Review Dialog ================= */}
      {reviewItem && (
        <Dialog open={Boolean(reviewItem)} onOpenChange={(open) => !open && setReviewItem(null)}>
          <DialogContent className="sm:max-w-xl bg-[#0B0F19] border border-emerald-500/40 text-white shadow-2xl rounded-2xl p-5" dir={direction}>
            <DialogHeader className={cn("space-y-1.5 border-b border-white/10 pb-3", isArabic ? "text-right" : "text-left")}>
              <div className="flex items-center gap-2 text-emerald-400">
                <ReceiptText className="w-5 h-5 text-emerald-400" />
                <DialogTitle className="text-base sm:text-lg font-black text-white">
                  {t('reviewModalTitle')}
                </DialogTitle>
              </div>
              <DialogDescription className="text-slate-400 text-xs">
                {t('reviewModalDesc')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Receipt Image Preview */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/80 flex items-center justify-center min-h-52 max-h-72">
                {reviewItem.payload.receiptImageUrl ? (
                  <img
                    src={reviewItem.payload.receiptImageUrl}
                    alt={t('tabReceipts')}
                    className="max-h-72 w-full object-contain cursor-pointer hover:opacity-95 transition"
                    onClick={() => {
                      if (typeof window !== 'undefined' && reviewItem.payload.receiptImageUrl) {
                        window.open(reviewItem.payload.receiptImageUrl, '_blank');
                      }
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-slate-500 text-xs gap-1">
                    <ReceiptText className="w-8 h-8 text-slate-600" />
                    <span>{t('noImage')}</span>
                  </div>
                )}

                {reviewItem.payload.receiptImageUrl && (
                  <a
                    href={reviewItem.payload.receiptImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-2.5 left-2.5 bg-black/70 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/20 flex items-center gap-1 backdrop-blur-md"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{t('fullSize')}</span>
                  </a>
                )}
              </div>

              {/* Transaction & Captain Details Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-black/50 border border-white/5 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">{t('captainLabel')}</span>
                  <span className="font-bold text-white block truncate">{reviewItem.payload.captainName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">{t('phoneLabel')}</span>
                  <span className="font-bold text-slate-300 block" dir="ltr">{reviewItem.payload.captainPhone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">{t('channelLabel')}</span>
                  <span className="font-bold text-emerald-400 block">{reviewItem.payload.channel}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">{t('amountLabel')}</span>
                  <span className="font-bold text-amber-300 block text-sm">
                    {reviewItem.payload.amount} {reviewItem.payload.currency}
                  </span>
                </div>
              </div>

              {/* Toggle Modes: Approval vs Rejection */}
              {!rejectMode ? (
                <div className="space-y-3 pt-2">
                  <Label className={cn("text-xs font-bold text-slate-300 block", isArabic ? "text-right" : "text-left")}>
                    {t('creditMethodLabel')}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreditType('MINUTES');
                        setMinutesValue(Math.round((reviewItem.payload.amount || 0) * 60));
                      }}
                      className={`p-2.5 rounded-xl border text-start transition-all ${
                        creditType === 'MINUTES'
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/50'
                          : 'border-white/10 bg-black/40 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold block">{t('minutesOption')}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{t('minutesOptionDesc', { currency: reviewItem.payload.currency || '' })}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreditType('CASH')}
                      className={`p-2.5 rounded-xl border text-start transition-all ${
                        creditType === 'CASH'
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/50'
                          : 'border-white/10 bg-black/40 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold block">{t('cashOption')}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{t('cashOptionDesc', { amount: reviewItem.payload.amount || 0, currency: reviewItem.payload.currency || '' })}</span>
                    </button>
                  </div>

                  {creditType === 'MINUTES' && (
                    <div className={cn("space-y-1", isArabic ? "text-right" : "text-left")}>
                      <Label className="text-[11px] font-bold text-slate-400">{t('minutesCountLabel')}</Label>
                      <Input
                        type="number"
                        min="1"
                        value={minutesValue}
                        onChange={(e) => setMinutesValue(Number(e.target.value) || 0)}
                        className="bg-black/60 border-white/10 text-white font-mono text-xs h-9 rounded-xl text-start"
                      />
                    </div>
                  )}

                  <div className={cn("space-y-1", isArabic ? "text-right" : "text-left")}>
                    <Label className="text-[11px] font-bold text-slate-400">{t('adminNoteLabel')}</Label>
                    <Input
                      type="text"
                      placeholder={t('adminNotePlaceholder')}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      className="bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl text-start"
                    />
                  </div>
                </div>
              ) : (
                <div className={cn("space-y-2 pt-2", isArabic ? "text-right" : "text-left")}>
                  <Label className="text-xs font-bold text-rose-400 block">{t('rejectionReasonLabel')}</Label>
                  <Input
                    type="text"
                    placeholder={t('rejectionReasonPlaceholder')}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="bg-black/60 border-rose-500/40 focus:border-rose-500 text-white text-xs h-10 rounded-xl text-start"
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-400">{t('rejectionNotice')}</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex-row gap-2 sm:justify-start pt-3 border-t border-white/10">
              {!rejectMode ? (
                <>
                  <Button
                    type="button"
                    disabled={processingAction}
                    onClick={handleApproveReceipt}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs sm:text-sm h-10 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    {processingAction ? (
                      <>
                        <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                        {t('approving')}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                        {t('approveButton')}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={processingAction}
                    onClick={() => setRejectMode(true)}
                    className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 h-10 rounded-xl text-xs font-bold"
                  >
                    {t('rejectButton')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    disabled={processingAction || !rejectionReason.trim()}
                    onClick={handleRejectReceipt}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm h-10 rounded-xl transition-all"
                  >
                    {processingAction ? (
                      <>
                        <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                        {t('rejecting')}
                      </>
                    ) : (
                      <>
                        <XCircle className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                        {t('confirmRejectButton')}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={processingAction}
                    onClick={() => setRejectMode(false)}
                    className="border-white/10 text-slate-300 hover:bg-white/5 h-10 rounded-xl text-xs"
                  >
                    {t('backToApprove')}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

