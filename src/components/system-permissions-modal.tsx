'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  ClipboardCheck,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  Smartphone,
  ExternalLink,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';

const styles = {
  content: 'max-w-[390px] w-[92vw] rounded-2xl border border-[#14B8A6]/30 bg-[#0A0F1D]/95 text-white p-4 shadow-2xl backdrop-blur-xl',
  headerRow: 'flex items-center justify-between gap-2.5 border-b border-white/[0.08] pb-2.5',
  headerStart: 'flex items-center gap-2 min-w-0',
  headerIconWrap: 'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#14B8A6]/15 text-[#14F5D5] border border-[#14B8A6]/30',
  title: 'text-xs sm:text-sm font-black text-white truncate',
  subtitle: 'text-[10px] text-slate-400 font-medium leading-none mt-0.5',
  closeIconButton: 'flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white/90 hover:text-white hover:bg-white/20 transition-all cursor-pointer shadow-sm active:scale-95',
  warningBanner: 'my-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 flex items-start gap-2',
  warningIcon: 'h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5',
  warningText: 'text-[10px] leading-relaxed text-amber-200/90 font-medium',
  cardList: 'my-2 space-y-2',
  permissionCard: 'rounded-xl border border-white/8 bg-white/[0.03] p-2.5 transition-colors',
  cardHeader: 'flex items-center justify-between gap-2',
  cardTitleWrap: 'flex items-center gap-2',
  cardIconWrap: 'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-[#14F5D5]',
  cardTitle: 'text-[11px] font-black text-white',
  cardDesc: 'mt-0.5 text-[9.5px] text-slate-400 leading-tight',
  statusBadgeGranted: 'inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-black text-emerald-300',
  statusBadgeDenied: 'inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 text-[9px] font-black text-rose-300',
  statusBadgePrompt: 'inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-black text-amber-300',
  actionButton: 'mt-2 h-7.5 w-full rounded-lg bg-[#14B8A6] font-black text-[11px] text-[#0A0F1D] hover:bg-[#2DD4BF] transition-all active:scale-[0.98]',
  actionButtonDisabled: 'mt-2 h-7.5 w-full rounded-lg bg-white/10 font-bold text-[11px] text-slate-400 cursor-not-allowed',
  instructionsToggle: 'w-full py-1 text-[10px] font-bold text-slate-400 hover:text-white flex items-center justify-between transition-colors',
  instructionsPanel: 'mt-1.5 rounded-xl bg-black/50 border border-white/5 p-2 space-y-1.5 text-[10px] text-slate-300 leading-relaxed max-h-36 overflow-y-auto',
  footerActions: 'mt-2.5 flex items-center gap-2',
  refreshButton: 'h-8.5 flex-1 rounded-xl border border-white/10 bg-white/5 font-bold text-[11px] text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5',
  closeButton: 'h-8.5 flex-1 rounded-xl bg-[#14B8A6] font-black text-[11px] text-[#0A0F1D] hover:bg-[#2DD4BF] transition-all active:scale-[0.98]',
} as const;

export type PermissionCheckStatus = 'checking' | 'granted' | 'prompt' | 'denied';

export function SystemPermissionsModal() {
  const { isArabic } = useDashboardLanguage();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<PermissionCheckStatus>('checking');
  const [clipboardStatus, setClipboardStatus] = useState<PermissionCheckStatus>('checking');
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [isRequestingClipboard, setIsRequestingClipboard] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [hasUserDismissed, setHasUserDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkPermissions = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // 0. Verify HTTPS / Secure Context
    const secure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    setIsSecureContext(secure);

    // 1. Geolocation Check via Permissions API
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocationStatus('denied');
      setIsOpen(true);
    } else if (navigator.permissions?.query) {
      try {
        const geoPerm = await navigator.permissions.query({ name: 'geolocation' });
        const state = geoPerm.state as PermissionCheckStatus;
        setLocationStatus(state);
        if (state !== 'granted') {
          setIsOpen(true);
        }
        geoPerm.onchange = () => {
          const next = geoPerm.state as PermissionCheckStatus;
          setLocationStatus(next);
          if (next !== 'granted') {
            setIsOpen(true);
          }
        };
      } catch {
        setLocationStatus('prompt');
        setIsOpen(true);
      }
    } else {
      setLocationStatus('prompt');
      setIsOpen(true);
    }

    // Direct active check using getCurrentPosition:
    // Catches OS-level disable (e.g. Windows location services off, Android location toggle off)
    // where permissions.query may report 'granted' for the domain, but OS returns code 2 (POSITION_UNAVAILABLE)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationStatus('granted');
        },
        () => {
          // Any error (1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT)
          // means Location is not working/disabled on device or browser
          setLocationStatus('denied');
          setIsOpen(true);
        },
        { enableHighAccuracy: false, timeout: 3500, maximumAge: 0 }
      );
    }

    // 2. Clipboard Check
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setClipboardStatus('denied');
    } else if (navigator.permissions?.query) {
      try {
        const clipPerm = await navigator.permissions.query({ name: 'clipboard-read' as any });
        const cState = clipPerm.state as PermissionCheckStatus;
        setClipboardStatus(cState);
        clipPerm.onchange = () => {
          const next = clipPerm.state as PermissionCheckStatus;
          setClipboardStatus(next);
          if (next === 'denied') {
            setIsOpen(true);
          }
        };
      } catch {
        // iOS Safari / Firefox don't support query('clipboard-read') but support user gesture
        setClipboardStatus('prompt');
      }
    } else {
      setClipboardStatus('prompt');
    }
  }, []);

  // Initial check on mount & system events
  useEffect(() => {
    void checkPermissions();

    const handleOpen = () => {
      setHasUserDismissed(false);
      setIsOpen(true);
      void checkPermissions();
    };

    const handleLocationDenied = () => {
      setLocationStatus('denied');
      setHasUserDismissed(false);
      setIsOpen(true);
    };

    const handleLocationGranted = () => {
      setLocationStatus('granted');
    };

    window.addEventListener('open-system-permissions-modal', handleOpen);
    window.addEventListener('system-location-denied', handleLocationDenied);
    window.addEventListener('system-location-granted', handleLocationGranted);

    return () => {
      window.removeEventListener('open-system-permissions-modal', handleOpen);
      window.removeEventListener('system-location-denied', handleLocationDenied);
      window.removeEventListener('system-location-granted', handleLocationGranted);
    };
  }, [checkPermissions]);

  // Evaluate whether to display modal automatically
  useEffect(() => {
    if (hasUserDismissed) return;

    const isLocGranted = locationStatus === 'granted';
    const isClipGranted = clipboardStatus === 'granted';

    // Fast check: if location is not granted or clipboard is denied or context is insecure
    if (locationStatus === 'denied' || locationStatus === 'prompt' || clipboardStatus === 'denied') {
      setIsOpen(true);
    } else if (!isSecureContext) {
      setIsOpen(true);
    } else if (isLocGranted && isClipGranted) {
      setIsOpen(false);
    }
  }, [locationStatus, clipboardStatus, isSecureContext, hasUserDismissed]);

  // Fallback timer: if after 400ms location is still not granted, guarantee popup is visible
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasUserDismissed) return;
      if (locationStatus !== 'granted') {
        setIsOpen(true);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [hasUserDismissed, locationStatus]);

  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }

    setIsRequestingLocation(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationStatus('granted');
        setIsRequestingLocation(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('request-live-location'));
        }
      },
      () => {
        setIsRequestingLocation(false);
        setLocationStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const requestClipboard = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
      setClipboardStatus('denied');
      return;
    }

    setIsRequestingClipboard(true);
    try {
      await navigator.clipboard.readText();
      setClipboardStatus('granted');
    } catch (err: unknown) {
      setClipboardStatus('denied');
    } finally {
      setIsRequestingClipboard(false);
    }
  };

  const allGranted = locationStatus === 'granted' && clipboardStatus === 'granted';

  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setHasUserDismissed(true);
        setIsOpen(false);
      }
    }}>
      <DialogContent
        className={styles.content}
        dir={isArabic ? 'rtl' : 'ltr'}
        hideCloseButton={true}
        onPointerDownOutside={(e) => {
          if (!allGranted) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (!allGranted) e.preventDefault();
        }}
      >
        {/* Header row with prominent close button */}
        <div className={styles.headerRow}>
          <div className={styles.headerStart}>
            <div className={styles.headerIconWrap}>
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className={styles.title}>
                {isArabic
                  ? 'أذونات المنظومة (الموقع والحافظة)'
                  : 'System Permissions (GPS & Clipboard)'}
              </DialogTitle>
              <DialogDescription className={styles.subtitle}>
                {isArabic
                  ? 'مطلوب لحساب المسار وقراءة الروابط'
                  : 'Required for live routing & links'}
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setHasUserDismissed(true);
              setIsOpen(false);
            }}
            aria-label={isArabic ? 'إغلاق' : 'Close'}
            title={isArabic ? 'إغلاق' : 'Close'}
            className={styles.closeIconButton}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Insecure Context (HTTP on mobile) Warning */}
        {!isSecureContext && (
          <div className={styles.warningBanner}>
            <AlertTriangle className={styles.warningIcon} />
            <p className={styles.warningText}>
              {isArabic
                ? 'تنبيه أمان: الرابط الحالي غير مشفر (HTTP). متصفحات الهواتف تحظر الـ GPS والحافظة تلقائياً خارج HTTPS أو localhost.'
                : 'Security Warning: Insecure HTTP connection. Mobile browsers automatically block GPS & Clipboard outside HTTPS or localhost.'}
            </p>
          </div>
        )}

        <div className={styles.cardList}>
          {/* Card 1: GPS Location */}
          <div className={styles.permissionCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleWrap}>
                <div className={styles.cardIconWrap}>
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className={styles.cardTitle}>
                    {isArabic ? 'إذن الموقع الجغرافي (GPS)' : 'Location Permission (GPS)'}
                  </h4>
                  <p className={styles.cardDesc}>
                    {isArabic
                      ? 'مطلوب لتحديد نقطة انطلاقك وحساب الأسعار'
                      : 'Required to detect origin & calculate pricing'}
                  </p>
                </div>
              </div>

              {locationStatus === 'granted' && (
                <span className={styles.statusBadgeGranted}>
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {isArabic ? 'مُفعّل' : 'Granted'}
                </span>
              )}
              {locationStatus === 'denied' && (
                <span className={styles.statusBadgeDenied}>
                  <XCircle className="h-2.5 w-2.5" />
                  {isArabic ? 'محظور' : 'Denied'}
                </span>
              )}
              {(locationStatus === 'prompt' || locationStatus === 'checking') && (
                <span className={styles.statusBadgePrompt}>
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {isArabic ? 'مطلوب' : 'Required'}
                </span>
              )}
            </div>

            {locationStatus !== 'granted' && (
              <Button
                type="button"
                onClick={requestLocation}
                disabled={isRequestingLocation}
                className={styles.actionButton}
              >
                {isRequestingLocation
                  ? (isArabic ? 'جاري طلب الإذن...' : 'Requesting...')
                  : (isArabic ? 'تفعيل إذن الموقع الآن' : 'Allow Location Access')}
              </Button>
            )}
          </div>

          {/* Card 2: Clipboard Access */}
          <div className={styles.permissionCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleWrap}>
                <div className={styles.cardIconWrap}>
                  <ClipboardCheck className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className={styles.cardTitle}>
                    {isArabic ? 'إذن قراءة الحافظة (Clipboard)' : 'Clipboard Access'}
                  </h4>
                  <p className={styles.cardDesc}>
                    {isArabic
                      ? 'مطلوب لقراءة روابط خرائط جوجل فور نسخها'
                      : 'Required to auto-import Google Maps links on copy'}
                  </p>
                </div>
              </div>

              {clipboardStatus === 'granted' && (
                <span className={styles.statusBadgeGranted}>
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {isArabic ? 'مُفعّل' : 'Granted'}
                </span>
              )}
              {clipboardStatus === 'denied' && (
                <span className={styles.statusBadgeDenied}>
                  <XCircle className="h-2.5 w-2.5" />
                  {isArabic ? 'محظور' : 'Denied'}
                </span>
              )}
              {(clipboardStatus === 'prompt' || clipboardStatus === 'checking') && (
                <span className={styles.statusBadgePrompt}>
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {isArabic ? 'مطلوب' : 'Required'}
                </span>
              )}
            </div>

            {clipboardStatus !== 'granted' && (
              <Button
                type="button"
                onClick={requestClipboard}
                disabled={isRequestingClipboard}
                className={styles.actionButton}
              >
                {isRequestingClipboard
                  ? (isArabic ? 'جاري فحص الحافظة...' : 'Testing...')
                  : (isArabic ? 'اختبار وتفعيل إذن الحافظة' : 'Allow Clipboard Access')}
              </Button>
            )}
          </div>
        </div>

        {/* Browser Settings Help Accordion */}
        <div>
          <button
            type="button"
            onClick={() => setShowInstructions(prev => !prev)}
            className={styles.instructionsToggle}
          >
            <span className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-[#14F5D5]" />
              {isArabic ? 'كيف أفعّل الأذونات المحظورة في المتصفح؟' : 'How to unblock in browser settings?'}
            </span>
            {showInstructions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showInstructions && (
            <div className={styles.instructionsPanel}>
              <p className="font-bold text-white">
                {isArabic ? '📱 على هواتف iPhone (Safari):' : '📱 On iPhone (Safari):'}
              </p>
              <p className="leading-relaxed">
                {isArabic
                  ? 'اضغط على زر (aA) أو الإعدادات في شريط العنوان ➔ إعدادات موقع الويب (Website Settings) ➔ اختر "الموقع: السماح" (Location: Allow).'
                  : 'Tap (aA) in Safari address bar ➔ Website Settings ➔ Set Location to Allow.'}
              </p>
              <p className="font-bold text-white mt-1.5">
                {isArabic ? '🤖 على هواتف Android (Chrome):' : '🤖 On Android (Chrome):'}
              </p>
              <p className="leading-relaxed">
                {isArabic
                  ? 'اضغط على أيقونة القفل أو الإعدادات بجانب الرابط ➔ الأذونات (Permissions) ➔ فعّل الموقع الجغرافي والحافظة.'
                  : 'Tap the lock/tune icon in Chrome address bar ➔ Permissions ➔ Turn on Location and Clipboard.'}
              </p>
              <p className="font-bold text-white mt-1.5">
                {isArabic ? '💻 على أجهزة الكمبيوتر (Windows / Chrome):' : '💻 On PC (Windows / Chrome):'}
              </p>
              <p className="leading-relaxed">
                {isArabic
                  ? 'إعدادات ويندوز (Windows Settings) ➔ الخصوصية والأمان (Privacy & Security) ➔ الموقع (Location) ➔ تفعيل "خدمات الموقع" (Location services). وفي المتصفح اضغط أيقونة القفل/الإعدادات بجانب الرابط واختر "السماح بالموقع".'
                  : 'Windows Settings ➔ Privacy & Security ➔ Location ➔ Turn ON "Location services". In browser, click lock/tune icon next to URL and set Location to Allow.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.footerActions}>
          <Button
            type="button"
            variant="outline"
            onClick={() => void checkPermissions()}
            className={styles.refreshButton}
          >
            <RefreshCw className="h-3 w-3 text-[#14F5D5]" />
            <span>{isArabic ? 'إعادة الفحص' : 'Re-check'}</span>
          </Button>

          <Button
            type="button"
            onClick={() => {
              setHasUserDismissed(true);
              setIsOpen(false);
            }}
            className={styles.closeButton}
          >
            {allGranted
              ? (isArabic ? 'تم التفعيل (متابعة)' : 'All Set (Continue)')
              : (isArabic ? 'المتابعة مؤقتاً' : 'Continue Anyway')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
