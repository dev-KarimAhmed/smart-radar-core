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
  HelpCircle,
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
  content: 'max-w-[380px] w-[92vw] max-h-[85vh] overflow-y-auto rounded-2xl border border-[#14B8A6]/30 bg-[#0A0F1D]/95 text-white p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl space-y-2.5',
  headerRow: 'flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2',
  headerStart: 'flex items-center gap-2 min-w-0',
  headerIconWrap: 'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-[#14F5D5] border border-[#14B8A6]/30',
  title: 'text-xs sm:text-sm font-black text-white truncate',
  subtitle: 'text-[9.5px] text-slate-400 font-medium leading-none mt-0.5',
  closeBadgeButton: 'flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:text-white text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-sm shrink-0',
  warningBanner: 'rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 flex items-start gap-2',
  warningIcon: 'h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5',
  warningText: 'text-[9.5px] leading-relaxed text-amber-200/90 font-medium',
  cardList: 'space-y-1.5',
  permissionCard: 'rounded-xl border border-white/8 bg-white/[0.03] p-2.5 transition-colors',
  cardHeader: 'flex items-center justify-between gap-2',
  cardTitleWrap: 'flex items-center gap-2 min-w-0',
  cardIconWrap: 'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-[#14F5D5]',
  cardTitle: 'text-[11px] font-bold text-white leading-tight',
  cardDesc: 'text-[9px] text-slate-400 leading-tight',
  statusBadgeGranted: 'inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-black text-emerald-300 shrink-0',
  statusBadgeDenied: 'inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 text-[9px] font-black text-rose-300 shrink-0',
  statusBadgePrompt: 'inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-black text-amber-300 shrink-0',
  inlineActionButton: 'h-6 px-2.5 rounded-md bg-[#14B8A6] font-bold text-[10px] text-[#0A0F1D] hover:bg-[#2DD4BF] transition-all active:scale-[0.98] shrink-0',
  deniedBanner: 'rounded-xl border border-rose-500/25 bg-rose-500/10 p-2 flex items-start gap-2 text-slate-300',
  instructionsToggle: 'w-full py-0.5 text-[9.5px] font-medium text-slate-400 hover:text-[#14F5D5] flex items-center justify-between transition-colors',
  instructionsPanel: 'rounded-xl bg-black/50 border border-white/5 p-2 space-y-1 text-[9.5px] text-slate-300 leading-relaxed max-h-32 overflow-y-auto',
  footerActions: 'pt-1 flex items-center gap-2',
  refreshButton: 'h-8.5 flex-1 rounded-xl border border-white/10 bg-white/5 font-bold text-[10.5px] text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5',
  closeButton: 'h-8.5 flex-1 rounded-xl bg-[#14B8A6] font-black text-[10.5px] text-[#0A0F1D] hover:bg-[#2DD4BF] transition-all active:scale-[0.98]',
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
  const [isChecking, setIsChecking] = useState(false);

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
        if (state === 'denied') {
          setIsOpen(true);
        }
        geoPerm.onchange = () => {
          const next = geoPerm.state as PermissionCheckStatus;
          setLocationStatus(next);
          if (next === 'denied') {
            setIsOpen(true);
          }
        };
      } catch {
        // iOS Safari throws on permissions.query({ name: 'geolocation' })
        // We do not force prompt or open modal here; let getCurrentPosition check below.
      }
    }

    // Direct active check using getCurrentPosition:
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationStatus('granted');
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setLocationStatus('denied');
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
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
 
  const handleRecheck = useCallback(async () => {
    setIsChecking(true);
    await checkPermissions();
    setTimeout(() => setIsChecking(false), 500);
  }, [checkPermissions]);

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
          window.dispatchEvent(new CustomEvent('system-location-granted'));
          window.dispatchEvent(new CustomEvent('request-live-location'));
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setIsRequestingLocation(false);
          setLocationStatus('denied');
        } else {
          // Retry with standard accuracy if timeout or unavailable
          navigator.geolocation.getCurrentPosition(
            () => {
              setLocationStatus('granted');
              setIsRequestingLocation(false);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('system-location-granted'));
                window.dispatchEvent(new CustomEvent('request-live-location'));
              }
            },
            (err2) => {
              setIsRequestingLocation(false);
              if (err2.code === err2.PERMISSION_DENIED) {
                setLocationStatus('denied');
              }
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
          );
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
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
  const hasAnyDenied = locationStatus === 'denied' || clipboardStatus === 'denied';

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
        onPointerDownOutside={() => {
          setHasUserDismissed(true);
          setIsOpen(false);
        }}
        onInteractOutside={() => {
          setHasUserDismissed(true);
          setIsOpen(false);
        }}
      >
        {/* Header row with prominent close badge button */}
        <div className={styles.headerRow}>
          <div className={styles.headerStart}>
            <div className={styles.headerIconWrap}>
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className={styles.title}>
                {isArabic ? 'أذونات المنظومة' : 'System Permissions'}
              </DialogTitle>
              <DialogDescription className={styles.subtitle}>
                {isArabic ? 'الموقع الجغرافي والحافظة' : 'GPS & Clipboard'}
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setHasUserDismissed(true);
              setIsOpen(false);
            }}
            aria-label={isArabic ? 'إغلاق وتخطي' : 'Close and skip'}
            className={styles.closeBadgeButton}
          >
            <X className="h-3 w-3" />
            <span>{isArabic ? 'إغلاق' : 'Close'}</span>
          </button>
        </div>

        {/* Insecure Context (HTTP on mobile) Warning */}
        {!isSecureContext && (
          <div className={styles.warningBanner}>
            <AlertTriangle className={styles.warningIcon} />
            <p className={styles.warningText}>
              {isArabic
                ? 'تنبيه أمان: الرابط غير مشفر (HTTP). المتصفحات تحظر الـ GPS والحافظة خارج HTTPS.'
                : 'Security Warning: Insecure HTTP connection. Browsers block GPS outside HTTPS.'}
            </p>
          </div>
        )}

        {/* Permission items list */}
        <div className={styles.cardList}>
          {/* Card 1: GPS Location */}
          <div className={styles.permissionCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleWrap}>
                <div className={styles.cardIconWrap}>
                  <MapPin className="h-3 w-3" />
                </div>
                <div className="min-w-0">
                  <h4 className={styles.cardTitle}>
                    {isArabic ? 'الموقع الجغرافي (GPS)' : 'Location (GPS)'}
                  </h4>
                  <p className={styles.cardDesc}>
                    {isArabic ? 'لحساب المسافات والأسعار' : 'For live routes & pricing'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
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
                  <Button
                    type="button"
                    size="sm"
                    onClick={requestLocation}
                    disabled={isRequestingLocation}
                    className={styles.inlineActionButton}
                  >
                    {isRequestingLocation
                      ? (isArabic ? 'جاري الطلب...' : '...')
                      : (isArabic ? 'تفعيل الآن' : 'Enable')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Clipboard Access */}
          <div className={styles.permissionCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleWrap}>
                <div className={styles.cardIconWrap}>
                  <ClipboardCheck className="h-3 w-3" />
                </div>
                <div className="min-w-0">
                  <h4 className={styles.cardTitle}>
                    {isArabic ? 'قراءة الحافظة (Clipboard)' : 'Clipboard'}
                  </h4>
                  <p className={styles.cardDesc}>
                    {isArabic ? 'لقراءة روابط الخرائط المنسوخة' : 'Reads copied map links'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
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
                  <Button
                    type="button"
                    size="sm"
                    onClick={requestClipboard}
                    disabled={isRequestingClipboard}
                    className={styles.inlineActionButton}
                  >
                    {isRequestingClipboard
                      ? (isArabic ? 'جاري الفحص...' : '...')
                      : (isArabic ? 'تفعيل الآن' : 'Enable')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Single Compact Denied Guidance Banner */}
        {hasAnyDenied && (
          <div className={styles.deniedBanner}>
            <Lock className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-[10px] leading-relaxed text-slate-300 flex-1">
              <span className="font-bold text-rose-300">
                {isArabic ? 'الأذونات محظورة في المتصفح أو النظام: ' : 'Blocked in browser or system: '}
              </span>
              {isArabic
                ? 'في الآيفون (سفاري): إن كان مفعلاً بزر aA، تأكد أيضاً من (إعدادات الآيفون ⚙️ ➔ الخصوصية والأمن ➔ خدمات الموقع ➔ مواقع Safari ➔ أثناء استخدام التطبيق).'
                : 'On iPhone (Safari): Also check (Settings ⚙️ ➔ Privacy & Security ➔ Location Services ➔ Safari Websites ➔ While Using App).'}
            </div>
          </div>
        )}

        {/* Browser Settings Help Accordion (Optional) */}
        <div>
          <button
            type="button"
            onClick={() => setShowInstructions(prev => !prev)}
            className={styles.instructionsToggle}
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="h-3 w-3 text-[#14F5D5]" />
              {isArabic ? 'شرح فك الحظر بالتفصيل حسب جهازك' : 'Detailed device instructions'}
            </span>
            {showInstructions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showInstructions && (
            <div className={styles.instructionsPanel}>
              <p className="font-bold text-white">
                {isArabic ? '📱 هواتف iPhone (متصفح Safari):' : '📱 iPhone (Safari):'}
              </p>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <p>
                  {isArabic
                    ? '1️⃣ داخل سفاري: اضغط زر (aA) بشريط العنوان ➔ إعدادات موقع الويب ➔ اختر الموقع: "السماح".'
                    : '1️⃣ In Safari: Tap (aA) in address bar ➔ Website Settings ➔ Set Location to "Allow".'}
                </p>
                <p className="text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 leading-relaxed">
                  {isArabic
                    ? '⚠️ الخطوة الأهم إن استمر الرفض: ادخل إعدادات الآيفون العامة ⚙️ ➔ الخصوصية والأمن ➔ خدمات الموقع ➔ مواقع Safari ➔ اختر "أثناء استخدام التطبيق" وفعّل "الموقع الدقيق".'
                    : '⚠️ Crucial step if still blocked: Open iPhone Settings ⚙️ ➔ Privacy & Security ➔ Location Services ➔ Safari Websites ➔ Select "While Using the App" & turn ON "Precise Location".'}
                </p>
              </div>
              <p className="font-bold text-white mt-1">
                {isArabic ? '🤖 هواتف Android (Chrome):' : '🤖 Android (Chrome):'}
              </p>
              <p>
                {isArabic
                  ? 'اضغط أيقونة القفل 🔒 بجانب الرابط ➔ الأذونات ➔ فعّل الموقع والحافظة.'
                  : 'Tap lock icon 🔒 ➔ Permissions ➔ Allow Location & Clipboard.'}
              </p>
              <p className="font-bold text-white mt-1">
                {isArabic ? '💻 الكمبيوتر (Windows / Chrome):' : '💻 PC (Windows / Chrome):'}
              </p>
              <p>
                {isArabic
                  ? 'إعدادات ويندوز ➔ الخصوصية ➔ فعّل "خدمات الموقع". واضغط أيقونة القفل 🔒 بالمتصفح واختر "سماح".'
                  : 'Windows Settings ➔ Privacy ➔ Turn ON Location. Click lock 🔒 in Chrome ➔ Allow.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.footerActions}>
          <Button
            type="button"
            variant="outline"
            onClick={handleRecheck}
            disabled={isChecking}
            className={styles.refreshButton}
          >
            <RefreshCw className={cn("h-3 w-3 text-[#14F5D5]", isChecking && "animate-spin")} />
            <span>{isChecking ? (isArabic ? 'جاري الفحص...' : 'Checking...') : (isArabic ? 'إعادة الفحص' : 'Re-check')}</span>
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
              : (isArabic ? 'المتابعة وتخطي' : 'Skip & Continue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
