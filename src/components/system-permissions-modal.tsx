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
  content: 'max-w-[460px] rounded-2xl border border-[#14B8A6]/30 bg-[#0A0F1D] text-white p-6 shadow-2xl backdrop-blur-xl',
  headerRtl: 'text-right',
  headerLtr: 'text-left',
  title: 'text-lg font-black text-white flex items-center gap-2',
  titleIcon: 'h-5 w-5 text-[#14F5D5]',
  description: 'text-xs leading-relaxed text-slate-300 mt-1',
  warningBanner: 'my-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5',
  warningIcon: 'h-4 w-4 text-amber-400 shrink-0 mt-0.5',
  warningText: 'text-[11px] leading-relaxed text-amber-200/90 font-bold',
  cardList: 'my-3.5 space-y-3',
  permissionCard: 'rounded-xl border border-white/8 bg-white/[0.03] p-3.5 transition-colors',
  cardHeader: 'flex items-center justify-between gap-2',
  cardTitleWrap: 'flex items-center gap-2.5',
  cardIconWrap: 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-[#14F5D5]',
  cardTitle: 'text-xs font-black text-white',
  cardDesc: 'mt-1 text-[11px] leading-normal text-slate-400',
  statusBadgeGranted: 'inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black text-emerald-300',
  statusBadgeDenied: 'inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-black text-rose-300',
  statusBadgePrompt: 'inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-black text-amber-300',
  actionButton: 'mt-2.5 h-9 w-full rounded-lg bg-[#14B8A6] font-bold text-xs text-[#0A0F1D] hover:bg-[#2DD4BF] transition-all active:scale-[0.98]',
  actionButtonDisabled: 'mt-2.5 h-9 w-full rounded-lg bg-white/10 font-bold text-xs text-slate-400 cursor-not-allowed',
  instructionsToggle: 'w-full py-1 text-[11px] font-bold text-slate-400 hover:text-white flex items-center justify-between transition-colors',
  instructionsPanel: 'mt-2 rounded-xl bg-black/40 border border-white/5 p-3 space-y-2 text-[11px] text-slate-300',
  footerActions: 'mt-4 flex items-center gap-2',
  refreshButton: 'h-11 flex-1 rounded-xl border border-white/10 bg-white/5 font-bold text-xs text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5',
  closeButton: 'h-11 flex-1 rounded-xl bg-[#14B8A6] font-black text-xs text-[#0A0F1D] hover:bg-[#2DD4BF] transition-all active:scale-[0.98]',
} as const;

export type PermissionCheckStatus = 'checking' | 'granted' | 'prompt' | 'denied';

export function SystemPermissionsModal() {
  const { isArabic } = useDashboardLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<PermissionCheckStatus>('checking');
  const [clipboardStatus, setClipboardStatus] = useState<PermissionCheckStatus>('checking');
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [isRequestingClipboard, setIsRequestingClipboard] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [hasUserDismissed, setHasUserDismissed] = useState(false);

  const checkPermissions = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // 0. Verify HTTPS / Secure Context
    const secure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    setIsSecureContext(secure);

    // 1. Geolocation Check
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocationStatus('denied');
    } else if (navigator.permissions?.query) {
      try {
        const geoPerm = await navigator.permissions.query({ name: 'geolocation' });
        setLocationStatus(geoPerm.state as PermissionCheckStatus);
        geoPerm.onchange = () => {
          setLocationStatus(geoPerm.state as PermissionCheckStatus);
        };
      } catch {
        setLocationStatus('prompt');
      }
    } else {
      setLocationStatus('prompt');
    }

    // 2. Clipboard Check
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setClipboardStatus('denied');
    } else if (navigator.permissions?.query) {
      try {
        const clipPerm = await navigator.permissions.query({ name: 'clipboard-read' as any });
        setClipboardStatus(clipPerm.state as PermissionCheckStatus);
        clipPerm.onchange = () => {
          setClipboardStatus(clipPerm.state as PermissionCheckStatus);
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
      setShowInstructions(true);
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
    if (locationStatus === 'checking' || clipboardStatus === 'checking') return;

    // Small delay to prevent layout flicker on initial hydration
    const timer = setTimeout(() => {
      const isLocGranted = locationStatus === 'granted';
      const isClipGranted = clipboardStatus === 'granted';

      // If either permission is not granted or we are on insecure HTTP, show popup
      if (!isLocGranted || !isClipGranted || !isSecureContext) {
        if (locationStatus === 'denied' || clipboardStatus === 'denied') {
          setShowInstructions(true);
        }
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 400);

    return () => clearTimeout(timer);
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
          window.dispatchEvent(new CustomEvent('request-live-location'));
        }
      },
      (err) => {
        setIsRequestingLocation(false);
        if (err.code === 1) { // PERMISSION_DENIED
          setLocationStatus('denied');
        } else {
          setLocationStatus('prompt');
        }
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
      if (
        err instanceof Error &&
        (err.name === 'NotAllowedError' ||
          err.name === 'SecurityError' ||
          err.message.toLowerCase().includes('denied') ||
          err.message.toLowerCase().includes('not allowed'))
      ) {
        setClipboardStatus('denied');
      } else {
        setClipboardStatus('prompt');
      }
    } finally {
      setIsRequestingClipboard(false);
    }
  };

  const allGranted = locationStatus === 'granted' && clipboardStatus === 'granted';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setHasUserDismissed(true);
        setIsOpen(false);
      }
    }}>
      <DialogContent className={styles.content} dir={isArabic ? 'rtl' : 'ltr'}>
        <DialogHeader className={cn(isArabic ? styles.headerRtl : styles.headerLtr)}>
          <DialogTitle className={styles.title}>
            <ShieldAlert className={styles.titleIcon} />
            <span>
              {isArabic
                ? 'فحص أذونات المنظومة (الموقع والحافظة)'
                : 'System Permissions Check (GPS & Clipboard)'}
            </span>
          </DialogTitle>
          <DialogDescription className={styles.description}>
            {isArabic
              ? 'يتطلب نظام الرادار الذكي إذن الموقع الجغرافي لحساب المسار وقراءة الحافظة لجلب روابط الوجهات بدقة.'
              : 'Smart Radar requires Location (GPS) for live routing and Clipboard access to ingest destination links.'}
          </DialogDescription>
        </DialogHeader>

        {/* Insecure Context (HTTP on mobile) Warning */}
        {!isSecureContext && (
          <div className={styles.warningBanner}>
            <AlertTriangle className={styles.warningIcon} />
            <p className={styles.warningText}>
              {isArabic
                ? 'تنبيه أمان: الرابط الحالي غير مشفر (HTTP). متصفحات الهواتف تحظر الـ GPS والحافظة تلقائياً خارج الروابط المشفرة (HTTPS) أو localhost.'
                : 'Security Warning: Insecure HTTP connection. Mobile browsers automatically block GPS and Clipboard unless running over HTTPS or localhost.'}
            </p>
          </div>
        )}

        <div className={styles.cardList}>
          {/* Card 1: GPS Location */}
          <div className={styles.permissionCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleWrap}>
                <div className={styles.cardIconWrap}>
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h4 className={styles.cardTitle}>
                    {isArabic ? 'إذن الموقع الجغرافي (GPS)' : 'Location Permission (GPS)'}
                  </h4>
                  <p className={styles.cardDesc}>
                    {isArabic
                      ? 'مطلوب لتحديد موقع انطلاقك بدقة وحساب الأسعار'
                      : 'Required to detect your origin & calculate fair pricing'}
                  </p>
                </div>
              </div>

              {locationStatus === 'granted' && (
                <span className={styles.statusBadgeGranted}>
                  <CheckCircle2 className="h-3 w-3" />
                  {isArabic ? 'مُفعّل' : 'Granted'}
                </span>
              )}
              {locationStatus === 'denied' && (
                <span className={styles.statusBadgeDenied}>
                  <XCircle className="h-3 w-3" />
                  {isArabic ? 'محظور' : 'Denied'}
                </span>
              )}
              {(locationStatus === 'prompt' || locationStatus === 'checking') && (
                <span className={styles.statusBadgePrompt}>
                  <AlertTriangle className="h-3 w-3" />
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
                  <ClipboardCheck className="h-4 w-4" />
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
                  <CheckCircle2 className="h-3 w-3" />
                  {isArabic ? 'مُفعّل' : 'Granted'}
                </span>
              )}
              {clipboardStatus === 'denied' && (
                <span className={styles.statusBadgeDenied}>
                  <XCircle className="h-3 w-3" />
                  {isArabic ? 'محظور' : 'Denied'}
                </span>
              )}
              {(clipboardStatus === 'prompt' || clipboardStatus === 'checking') && (
                <span className={styles.statusBadgePrompt}>
                  <AlertTriangle className="h-3 w-3" />
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
              <Lock className="h-3.5 w-3.5 text-[#14F5D5]" />
              {isArabic ? 'كيف أفعّل الأذونات المحظورة في المتصفح؟' : 'How to unblock in browser settings?'}
            </span>
            {showInstructions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
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
              <p className="font-bold text-white mt-2">
                {isArabic ? '🤖 على هواتف Android (Chrome):' : '🤖 On Android (Chrome):'}
              </p>
              <p className="leading-relaxed">
                {isArabic
                  ? 'اضغط على أيقونة القفل أو الإعدادات بجانب الرابط ➔ الأذونات (Permissions) ➔ فعّل الموقع الجغرافي والحافظة.'
                  : 'Tap the lock/tune icon in Chrome address bar ➔ Permissions ➔ Turn on Location and Clipboard.'}
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
            <RefreshCw className="h-3.5 w-3.5 text-[#14F5D5]" />
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
