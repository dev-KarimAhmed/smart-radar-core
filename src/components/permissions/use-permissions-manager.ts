import { useState, useEffect, useCallback } from 'react';
import {
  type PermissionCheckStatus,
  type DetectedEnvironment,
  getDetectedEnvironment,
} from './permissions-types';

export function usePermissionsManager() {
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
  const [detectedEnv, setDetectedEnv] = useState<DetectedEnvironment>('other');

  useEffect(() => {
    setMounted(true);
    setDetectedEnv(getDetectedEnvironment());
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
        setClipboardStatus('prompt');
      }
    } else {
      setClipboardStatus('prompt');
    }
  }, []);

  const requestLocation = () => {
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
    } catch {
      setClipboardStatus('denied');
    } finally {
      setIsRequestingClipboard(false);
    }
  };

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
  }, [checkPermissions, locationStatus, clipboardStatus]);

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

  const dismissModal = () => {
    setHasUserDismissed(true);
    setIsOpen(false);
  };

  const allGranted = locationStatus === 'granted' && clipboardStatus === 'granted';
  const hasAnyDenied = locationStatus === 'denied' || clipboardStatus === 'denied';

  return {
    mounted,
    isOpen,
    setIsOpen,
    locationStatus,
    clipboardStatus,
    isRequestingLocation,
    isRequestingClipboard,
    isSecureContext,
    showInstructions,
    setShowInstructions,
    isChecking,
    detectedEnv,
    allGranted,
    hasAnyDenied,
    requestLocation,
    requestClipboard,
    handleRecheck,
    dismissModal,
  };
}
