'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  ClipboardCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';
import {
  styles,
  type PermissionCheckStatus,
  type DetectedEnvironment,
  getDetectedEnvironment,
} from './permissions/system-permissions-styles';
import { PermissionsGuidanceBanner } from './permissions/permissions-guidance-banner';

export type { PermissionCheckStatus, DetectedEnvironment };

export function SystemPermissionsModal() {
  const { isArabic } = useDashboardLanguage();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<PermissionCheckStatus>('checking');
  const [clipboardStatus, setClipboardStatus] = useState<PermissionCheckStatus>('checking');
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [isRequestingClipboard, setIsRequestingClipboard] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [hasUserDismissed, setHasUserDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [detectedEnv, setDetectedEnv] = useState<DetectedEnvironment>('other');

  useEffect(() => {
    setMounted(true);
    setDetectedEnv(getDetectedEnvironment());
  }, []);

  const checkPermissions = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const secure =
      window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    setIsSecureContext(secure);

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
      } catch {}
    }

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
        setClipboardStatus('prompt');
      }
    } else {
      setClipboardStatus('prompt');
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }

    setIsRequestingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationStatus('granted');
        setIsRequestingLocation(false);
        if (typeof window !== 'undefined') {
          try {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            window.localStorage.setItem('radar_last_known_gps', JSON.stringify(loc));
            window.localStorage.setItem('smart_radar_last_known_location', JSON.stringify(loc));
          } catch {}
          window.dispatchEvent(new CustomEvent('system-location-granted'));
          window.dispatchEvent(new CustomEvent('request-live-location'));
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setIsRequestingLocation(false);
          setLocationStatus('denied');
        } else {
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
  }, []);

  const requestClipboard = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
      setClipboardStatus('denied');
      return;
    }

    setIsRequestingClipboard(true);
    try {
      await navigator.clipboard.readText();
      setClipboardStatus('granted');
    } catch {
      setClipboardStatus('denied');
    } finally {
      setIsRequestingClipboard(false);
    }
  }, []);

  const handleRecheck = useCallback(async () => {
    setIsChecking(true);
    if (locationStatus !== 'granted') {
      requestLocation();
    }
    if (clipboardStatus !== 'granted') {
      void requestClipboard();
    }
    await checkPermissions();
    setTimeout(() => setIsChecking(false), 600);
  }, [checkPermissions, locationStatus, clipboardStatus, requestLocation, requestClipboard]);

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

  useEffect(() => {
    if (hasUserDismissed) return;

    const isLocGranted = locationStatus === 'granted';
    const isClipGranted = clipboardStatus === 'granted';

    if (locationStatus === 'denied' || locationStatus === 'prompt' || clipboardStatus === 'denied') {
      setIsOpen(true);
    } else if (!isSecureContext) {
      setIsOpen(true);
    } else if (isLocGranted && isClipGranted) {
      setIsOpen(false);
    }
  }, [locationStatus, clipboardStatus, isSecureContext, hasUserDismissed]);

  const allGranted = locationStatus === 'granted' && clipboardStatus === 'granted';
  const hasAnyDenied = locationStatus === 'denied' || clipboardStatus === 'denied';

  if (!mounted) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setHasUserDismissed(true);
          setIsOpen(false);
        }
      }}
    >
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
        </div>

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

        <div className={styles.cardList}>
          {/* Card 1: GPS Location */}
          <div className={styles.permissionCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleWrap}>
                <div className={styles.cardIconWrap}>
                  <MapPin className="h-3 w-3" />
                </div>
                <div className="min-w-0">
                  <h4 className={styles.cardTitle}>{isArabic ? 'الموقع الجغرافي (GPS)' : 'Location (GPS)'}</h4>
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
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={styles.statusBadgeDenied}>
                      <XCircle className="h-2.5 w-2.5" />
                      {isArabic ? 'محظور' : 'Denied'}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={requestLocation}
                      disabled={isRequestingLocation}
                      className={styles.inlineActionButton}
                    >
                      {isRequestingLocation
                        ? isArabic
                          ? 'جاري الفحص...'
                          : '...'
                        : isArabic
                        ? 'إعادة المحاولة'
                        : 'Retry'}
                    </Button>
                  </div>
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
                      ? isArabic
                        ? 'جاري الطلب...'
                        : '...'
                      : isArabic
                      ? 'تفعيل الآن'
                      : 'Enable'}
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
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={styles.statusBadgeDenied}>
                      <XCircle className="h-2.5 w-2.5" />
                      {isArabic ? 'محظور' : 'Denied'}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={requestClipboard}
                      disabled={isRequestingClipboard}
                      className={styles.inlineActionButton}
                    >
                      {isRequestingClipboard
                        ? isArabic
                          ? 'جاري الفحص...'
                          : '...'
                        : isArabic
                        ? 'إعادة المحاولة'
                        : 'Retry'}
                    </Button>
                  </div>
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
                      ? isArabic
                        ? 'جاري الفحص...'
                        : '...'
                      : isArabic
                      ? 'تفعيل الآن'
                      : 'Enable'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <PermissionsGuidanceBanner
          hasAnyDenied={hasAnyDenied}
          detectedEnv={detectedEnv}
          isArabic={isArabic}
        />

        <div className={styles.footerActions}>
          <Button
            type="button"
            variant="outline"
            onClick={handleRecheck}
            disabled={isChecking}
            className={styles.refreshButton}
          >
            <RefreshCw className={cn('h-3 w-3 text-[#14F5D5]', isChecking && 'animate-spin')} />
            <span>
              {isChecking
                ? isArabic
                  ? 'جاري الفحص...'
                  : 'Checking...'
                : isArabic
                ? 'إعادة الفحص'
                : 'Re-check'}
            </span>
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
              ? isArabic
                ? 'تم التفعيل (متابعة)'
                : 'All Set (Continue)'
              : isArabic
              ? 'المتابعة وتخطي'
              : 'Skip & Continue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
