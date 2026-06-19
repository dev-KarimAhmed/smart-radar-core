'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './use-auth';
import type { Trip, User, Offer } from '@/core/types';
import { useToast } from './use-toast';
import { useRiderTripListener } from './rider/use-rider-trip-listener';
import { useRiderTransactions } from './use-rider-transactions';
import { calculateSovereignGridId } from '@/lib/geo-grid';
import { trackSovereignError } from '@/lib/error-tracker';
import { generateSovereignSearchUrl, estimateTripTime } from '@/lib/geospatial';
import { useGeospatialAnchor } from './use-geospatial-anchor';
import { calculateSovereignDistance, latLngToH3Cell, getH3CellCentroid } from '@/core/logic/geospatial-kernel';
import { sanitizeUrl, resolveSovereignUrl } from '@/lib/sovereign-digger';
import { SovereignDict } from '@/lib/sovereign-dictionary';
import { useLinkCatcher } from './use-link-catcher';
import { dexieDb, RadarCaptainFavoriteKernel } from '@/lib/dexie-db';
import { RadarAntiCheatKernel } from '@/core/logic/anti-cheat-kernel';
import { useSovereignControls } from './use-sovereign-controls';

interface RiderOperationsContextType {
  trip: Trip | null;
  tripStatus: any;
  acceptedDriver: User | null;
  isRequestModalOpen: boolean;
  openRequestModal: () => void;
  closeRequestModal: () => void;
  requestRide: () => Promise<void>;
  isRequesting: boolean;
  cancelTrip: () => Promise<void>;
  isCancelling: boolean;
  rateTrip: (ratings: any) => Promise<void>;
  isRating: boolean;
  executeRedPathGuillotine: () => Promise<void>;
  isExecutingGuillotine: boolean;
  confirmCheckpoint: () => Promise<void>;
  isConfirmingCheckpoint: boolean;
  selectOffer: (offer: Offer) => Promise<void>;
  isSelectingOffer: boolean;
  seats: string;
  setSeats: (seats: string) => void;
  dropoff: string;
  setDropoff: (dropoff: string) => void;
  pickup: string; 
  setPickup: (link: string) => void;
  requiresOfficialRate: boolean;
  setRequiresOfficialRate: (requires: boolean) => void;
  isResolvingUrl: boolean;
  openMapsForDestination: () => void;
  calculateSovereignMetrics: () => Promise<void>;
  pasteFromClipboard: () => Promise<void>;
  estimatedDistance: number;
  estimatedTime: number;
  pulsedDrivers: any;
  isPulsing: boolean;
  isLocationConfirmed: boolean;
  resetLocationMetrics: () => void;
  isRadarActive: boolean | null;
}

export const RiderOperationsContext = createContext<RiderOperationsContextType | undefined>(undefined);

export function RiderOperationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [seats, setSeats] = useState('1');
  const [dropoff, setDropoff] = useState(''); 
  const [pickup, setPickup] = useState(''); 
  const [requiresOfficialRate, setRequiresOfficialRate] = useState(false);
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [lastCalculatedUrl, setLastCalculatedUrl] = useState('');
  const isProgrammaticUpdateRef = useRef(false);
  
  const { location: anchorLocation } = useGeospatialAnchor();
  const { isRadarActive } = useSovereignControls();

  // تدوين الإحداثيات محلياً على الحافة كبصمة مستقرة للتحقيق الجنائي لاحقاً في الـ Local Buffer
  useEffect(() => {
    if (anchorLocation && anchorLocation.lat && anchorLocation.lng) {
      try {
        const stored = localStorage.getItem('sovereign_gps_local_buffer');
        const buffer = stored ? JSON.parse(stored) : [];
        const entry = {
          lat: anchorLocation.lat,
          lng: anchorLocation.lng,
          timestamp: Date.now(),
          source: anchorLocation.source
        };
        // الحفاظ على آخر 10 نقاط ملاحية فقط
        buffer.push(entry);
        if (buffer.length > 10) {
          buffer.shift();
        }
        localStorage.setItem('sovereign_gps_local_buffer', JSON.stringify(buffer));
      } catch (err) {
        console.warn("Failed to write to local sovereign GPS buffer", err);
      }
    }
  }, [anchorLocation]);
  
  const { capturedLink, clearCapturedLink } = useLinkCatcher();

  // تفعيل التقاط الروابط المشتركة ميكانيكياً من تطبيق خرائط جوجل بصفر تكلفة سحابية
  useEffect(() => {
    if (capturedLink) {
      isProgrammaticUpdateRef.current = true;
      setEstimatedDistance(0);
      setEstimatedTime(0);
      const cleanInput = sanitizeUrl(capturedLink);
      setPickup(cleanInput);
      setLastCalculatedUrl('');
      setIsRequestModalOpen(true);
      clearCapturedLink();
      toast({
        title: "تم التقاط الختم الجغرافي",
        description: "تم استقبال الختم الملاحي لخرائط جوجل تلقائياً بصفر تكلفة سحابية.",
      });
      setTimeout(() => {
        isProgrammaticUpdateRef.current = false;
      }, 100);
    }
  }, [capturedLink, clearCapturedLink, toast]);
  
  // [علاج الربط المتبادل] - تجميد الموقع لمنع الـ Re-renders العشوائية مع حركة الـ GPS
  const anchorRef = useRef(anchorLocation);
  useEffect(() => {
    anchorRef.current = anchorLocation;
  }, [anchorLocation]);

  const { trip, acceptedDriver, internalStatus, setInternalStatus, resetState: resetTripListener, pulsedDrivers, isPulsing } = useRiderTripListener(user);
  
  /**
   * [SCR-2026-FIX-FLOW] تصفير متزامن وشامل
   * يضمن تطابق حالة الحقول مع حالة العدادات (منع تمزق المسار).
   */
  const resetLocationMetrics = useCallback(() => {
    isProgrammaticUpdateRef.current = true;
    setEstimatedDistance(0);
    setEstimatedTime(0);
    setPickup(''); 
    setLastCalculatedUrl('');
    setTimeout(() => {
      isProgrammaticUpdateRef.current = false;
    }, 100);
  }, []);

  // [علاج تزييف الحقيقة] - مراقب يصفر العدادات إذا تم العبث بالرابط بعد الاحتساب
  useEffect(() => {
    if (isProgrammaticUpdateRef.current) {
      return;
    }
    if (pickup !== lastCalculatedUrl && estimatedDistance > 0) {
      setEstimatedDistance(0);
      setEstimatedTime(0);
    }
  }, [pickup, lastCalculatedUrl, estimatedDistance]);

  const handlePickupChange = useCallback((link: string) => {
    setPickup(link);
  }, []);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        resetLocationMetrics(); // تصفير قبل اللصق الجديد
        handlePickupChange(text.trim());
        toast({ ...SovereignDict.SUCCESS.LINK_CAPTURED });
      }
    } catch (err) {
      trackSovereignError(err, { context: 'ClipboardPaste_Failed' });
      toast({ variant: 'destructive', ...SovereignDict.ERRORS.SECURITY_BLOCK });
    }
  }, [handlePickupChange, resetLocationMetrics, toast]);

  /**
   * [SCR-2026-SURGERY-DONE] دالة الاحتساب المعقمة والمجردة (Loose Coupling)
   */
  const calculateSovereignMetrics = useCallback(async () => {
    const currentAnchor = anchorRef.current; 

    if (!currentAnchor) {
        toast({ variant: 'destructive', ...SovereignDict.ERRORS.GPS_DISABLED });
        return;
    }
    
    if (!pickup) {
        toast({ variant: 'destructive', ...SovereignDict.ERRORS.EMPTY_LINK });
        return;
    }

    try {
        setIsResolvingUrl(true);
        isProgrammaticUpdateRef.current = true;
        
        const currentUrl = sanitizeUrl(pickup);
        setPickup(currentUrl);

        // [الاقتران الضعيف] - طلب الإحداثيات من المحرك المركزي
        const destCoords = await resolveSovereignUrl(currentUrl);

        if (destCoords) {
            const finalDistance = calculateSovereignDistance(currentAnchor.lat, currentAnchor.lng, destCoords.lat, destCoords.lng);
            setEstimatedDistance(finalDistance);
            setEstimatedTime(estimateTripTime(finalDistance));
            setLastCalculatedUrl(currentUrl); 
            
            toast({ 
                title: SovereignDict.SUCCESS.CALCULATION_DONE.title, 
                description: `${SovereignDict.SUCCESS.CALCULATION_DONE.description} ${finalDistance.toFixed(1)} كم` 
            });
        } else {
            setEstimatedDistance(0);
            toast({ variant: 'default', ...SovereignDict.WARNINGS.BLIND_SPOT });
        }

    } catch (error: any) {
        trackSovereignError(error, { context: 'SovereignMetrics_Surgery_P16' });
        if (error.message === 'CORS_FALLBACK_REQUIRED') {
            toast({ variant: 'destructive', ...SovereignDict.ERRORS.CORS_FALLBACK_GUIDE });
        } else {
            toast({ variant: 'destructive', ...SovereignDict.ERRORS.CONSTITUTIONAL_BREACH });
        }
    } finally {
        setIsResolvingUrl(false);
        setTimeout(() => {
          isProgrammaticUpdateRef.current = false;
        }, 150);
    }
  }, [pickup, toast]);  

  // [مراقبة الالتماس التلقائي] - بمجرد إدخال أو لصق رابط جديد، يتم التحفيز التلقائي للاحتساب بصفر نقرات وبكامل النزاهة
  const autoTriggeredRef = useRef<string>('');
  useEffect(() => {
    const trimmed = pickup ? pickup.trim() : '';
    if (trimmed && trimmed !== lastCalculatedUrl && trimmed !== autoTriggeredRef.current && !isResolvingUrl) {
      const looksLikeLinkOrCoord = trimmed.includes('maps') || 
                                   trimmed.includes('http') || 
                                   trimmed.includes('ps://') ||
                                   trimmed.includes('naps://') ||
                                   /(-?\d{1,2}\.\d+)(?:\+2C|%2C|%2c|,)\s*(-?\d{1,3}\.\d+)/i.test(trimmed) ||
                                   /@(-?\d+\.\d+),(-?\d+\.\d+)/.test(trimmed);
      if (looksLikeLinkOrCoord) {
        autoTriggeredRef.current = trimmed;
        const timer = setTimeout(() => {
          calculateSovereignMetrics();
        }, 400); // تأخير بفر 400ms لتأمين اكتمال حركة الكيبورد أو اللصق بالهاتف
        return () => clearTimeout(timer);
      }
    }
  }, [pickup, lastCalculatedUrl, isResolvingUrl, calculateSovereignMetrics]);

  /**
   * [SCR-2026-DICT-FIX] استئصال الصدى المزدوج
   */
  const openMapsForDestination = useCallback(() => {
    if (!dropoff) {
        toast({ variant: 'default', ...SovereignDict.WARNINGS.WRITE_DESTINATION });
        return;
    }
    window.open(generateSovereignSearchUrl(dropoff), '_blank');
  }, [dropoff, toast]);
  
  const {
    requestRide: rawRequestRide, isRequesting, cancelTrip, isCancelling,
    rateTrip: rawRateTrip, isRating, executeRedPathGuillotine,
    isExecutingGuillotine, confirmCheckpoint, isConfirmingCheckpoint,
    selectOffer, isSelectingOffer,
  } = useRiderTransactions(user, trip, acceptedDriver, resetTripListener, setInternalStatus);
  
  const requestRide = useCallback(async () => {
    if (isRadarActive === false) {
      toast({
        variant: 'destructive',
        title: 'الخدمة معلقة مؤقتاً',
        description: 'الخدمة معلقة مؤقتاً بناءً على القرارات الرسمية الموحدة لنظام بينكم.',
      });
      return;
    }

    if (!pickup) {
      toast({ variant: 'destructive', ...SovereignDict.ERRORS.EMPTY_LINK });
      return;
    }
    
    const cancels = user?.consecutiveCancellations || 0;
    const initialRiderRating = user?.rating !== undefined ? user.rating : (user?.ratingSum && user?.ratingCount ? user.ratingSum / user.ratingCount : 5.0);

    const throttleResult = RadarAntiCheatKernel.throttleRiderFloodAttack({
      riderId: user?.uid || 'unknown',
      activeRequestsCount: (trip && ['searching', 'busy', 'checkpoint_required'].includes(trip.status)) ? 1 : 0,
      consecutiveCancellations: cancels,
      trustRating: initialRiderRating
    });

    if (!throttleResult.allowRequest) {
      toast({
        variant: 'destructive',
        title: '🚨 جدار الحماية النسيجي للراكب',
        description: throttleResult.updatedRider.trustRating <= 4.2 
          ? `لقد تجاوزت الحد الأقصى للإلغاءات المتتالية (${cancels}/3). سقط رصيد مناعتك إلى عتبة التطهير الميداني.`
          : 'يُحظر تماماً قذف أكثر من طلب واحد نشط في نفس الوقت لحماية صالة المزاد من الإغراق الكاذب.'
      });
      return;
    }

    let activeRiderRating = throttleResult.updatedRider.trustRating;
    if (cancels >= 2) {
      activeRiderRating = Math.min(activeRiderRating, 4.2); // يسقط رصيد مناعته تلقائياً إلى عتبة التطهير (4.2)
    }

    const currentAnchor = anchorRef.current || { lat: 31.9522, lng: 35.9106 };
    const h3Index = latLngToH3Cell(currentAnchor.lat, currentAnchor.lng, 9);
    const obfuscatedPickupCoords = getH3CellCentroid(currentAnchor.lat, currentAnchor.lng, 9);
    const gridId = currentAnchor ? calculateSovereignGridId(currentAnchor.lat, currentAnchor.lng) : 'unknown';
    
    await rawRequestRide({
        seats: parseInt(seats) || 1, 
        dropoff, 
        pickup,  
        requiresOfficialRate,
        estimatedTime, 
        estimatedDistance, 
        pickupCoords: obfuscatedPickupCoords, 
        obfuscatedPickupCoords,
        h3Index,
        gridId,
        district: user?.district || 'unknown',
        riderRating: activeRiderRating,
        riderRatingSum: user?.ratingSum || 0,
        riderRatingCount: user?.ratingCount || 0,
        riderName: user?.name || 'فارس الأفق'
    });
  }, [rawRequestRide, seats, dropoff, pickup, requiresOfficialRate, estimatedTime, estimatedDistance, user, trip, toast]);
  
  const tripStatus = useMemo(() => {
    if (isRequesting) return 'searching';
    if (internalStatus !== 'idle') return internalStatus;
    return trip?.status || 'idle';
  }, [isRequesting, trip?.status, internalStatus]);

  const isLocationConfirmed = useMemo(() => estimatedDistance > 0 && !isResolvingUrl, [estimatedDistance, isResolvingUrl]);

  const openRequestModal = useCallback(() => {
    if (user?.isRatingRequired) {
      toast({ variant: "destructive", ...SovereignDict.ERRORS.RATING_REQUIRED });
      return;
    }
    setIsRequestModalOpen(true);
  }, [user, toast]);

  /**
   * [SCR-2026-STATE-SHIELD] حماية الذاكرة المرحلية
   * لم يعد يتم تصفير البيانات عند الإغلاق لمنع فقدان مدخلات الراكب.
   */
  const closeRequestModal = useCallback(() => {
    setIsRequestModalOpen(false);
  }, []);

  const rateTrip = useCallback(async (ratings: any) => {
    if (acceptedDriver?.uid && acceptedDriver?.vehicle?.plate) {
      if (ratings.giveHeart) {
        try {
          const tripObject = {
            captainId: acceptedDriver.uid || `rated-${Date.now()}`,
            captainName: acceptedDriver.name || 'كابتن رادار',
            captainPhone: acceptedDriver.phone || '079000000',
            vehicleInfo: `${acceptedDriver.vehicle.make || ''} ${acceptedDriver.vehicle.color || ''}`,
            captainType: (acceptedDriver as any).rank === 'PLATINUM' ? 'careem' : (acceptedDriver as any).rank === 'GOLD' ? 'uber' : 'independent',
            tripId: trip?.id || `rated-${Date.now()}`
          };
          RadarCaptainFavoriteKernel.mummifyTrustedCaptain(tripObject, true);

          await dexieDb.favoriteCaptains.add({
            tripId: tripObject.tripId,
            captainName: tripObject.captainName,
            captainRank: (acceptedDriver as any).rank || 'GOLD',
            captainPhone: tripObject.captainPhone,
            vehicleInfo: tripObject.vehicleInfo,
            finalPrice: Number((trip as any)?.offerPrice || (trip as any)?.price || 3.0),
            timestamp: Date.now(),
            heartedAt: Date.now()
          });
          console.log("💾 Saved rated driver as favorite to local Dexie database");
        } catch (e) {
          console.error("Failed to auto-favorite on trip completion:", e);
        }
      }
      await rawRateTrip({ ...ratings, driverId: acceptedDriver.uid, vehicleId: acceptedDriver.vehicle.plate });
    }
  }, [rawRateTrip, acceptedDriver, trip]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('sovereign_trip_status', String(tripStatus));
        window.dispatchEvent(new CustomEvent('sovereign-status-change', {
          detail: { role: 'rider', status: tripStatus }
        }));
      } catch (e) {
        console.error("Failed to update sovereign_trip_status in sessionStorage/dispatchEvent:", e);
      }
    }
  }, [tripStatus]);

  const value = useMemo(() => ({
    trip, tripStatus, acceptedDriver, requestRide, isRequesting, cancelTrip, isCancelling,
    rateTrip, isRating, isRequestModalOpen, openRequestModal, closeRequestModal, executeRedPathGuillotine,
    isExecutingGuillotine, confirmCheckpoint, isConfirmingCheckpoint, selectOffer, isSelectingOffer,
    seats, setSeats, dropoff, setDropoff, pickup, setPickup: handlePickupChange, requiresOfficialRate, setRequiresOfficialRate,
    isResolvingUrl, openMapsForDestination, calculateSovereignMetrics, pasteFromClipboard, 
    estimatedDistance, estimatedTime, pulsedDrivers, isPulsing, isLocationConfirmed, resetLocationMetrics,
    isRadarActive
  }), [
    trip, tripStatus, acceptedDriver, requestRide, isRequesting, cancelTrip, isCancelling,
    rateTrip, isRating, isRequestModalOpen, openRequestModal, closeRequestModal, executeRedPathGuillotine,
    isExecutingGuillotine, confirmCheckpoint, isConfirmingCheckpoint, selectOffer, isSelectingOffer,
    seats, dropoff, pickup, handlePickupChange, requiresOfficialRate, isResolvingUrl, openMapsForDestination, 
    calculateSovereignMetrics, pasteFromClipboard, estimatedDistance, estimatedTime, pulsedDrivers, 
    isPulsing, isLocationConfirmed, resetLocationMetrics, isRadarActive
  ]);

  return <RiderOperationsContext.Provider value={value}>{children}</RiderOperationsContext.Provider>;
}

export function useRiderOperations() {
  const context = useContext(RiderOperationsContext);
  return context || null;
}
