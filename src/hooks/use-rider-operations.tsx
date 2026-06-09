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
  
  const { location: anchorLocation } = useGeospatialAnchor();
  
  const { capturedLink, clearCapturedLink } = useLinkCatcher();

  // تفعيل التقاط الروابط المشتركة ميكانيكياً من تطبيق خرائط جوجل بصفر تكلفة سحابية
  useEffect(() => {
    if (capturedLink) {
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
    setEstimatedDistance(0);
    setEstimatedTime(0);
    setPickup(''); 
    setLastCalculatedUrl('');
  }, []);

  // [علاج تزييف الحقيقة] - مراقب يصفر العدادات إذا تم العبث بالرابط بعد الاحتساب
  useEffect(() => {
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
      const { trackSovereignError } = require('@/lib/error-tracker');
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
    if (!pickup) {
      toast({ variant: 'destructive', ...SovereignDict.ERRORS.EMPTY_LINK });
      return;
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
        exactPickupCoords: currentAnchor,
        obfuscatedPickupCoords,
        h3Index,
        gridId,
        district: user?.district || 'unknown',
        riderRating: user?.rating !== undefined ? user.rating : (user?.ratingSum && user?.ratingCount ? user.ratingSum / user.ratingCount : 5.0),
        riderRatingSum: user?.ratingSum || 0,
        riderRatingCount: user?.ratingCount || 0,
        riderName: user?.name || 'فارس الأفق'
    });
  }, [rawRequestRide, seats, dropoff, pickup, requiresOfficialRate, estimatedTime, estimatedDistance, user?.district]);
  
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
      await rawRateTrip({ ...ratings, driverId: acceptedDriver.uid, vehicleId: acceptedDriver.vehicle.plate });
    }
  }, [rawRateTrip, acceptedDriver]);

  const value = useMemo(() => ({
    trip, tripStatus, acceptedDriver, requestRide, isRequesting, cancelTrip, isCancelling,
    rateTrip, isRating, isRequestModalOpen, openRequestModal, closeRequestModal, executeRedPathGuillotine,
    isExecutingGuillotine, confirmCheckpoint, isConfirmingCheckpoint, selectOffer, isSelectingOffer,
    seats, setSeats, dropoff, setDropoff, pickup, setPickup: handlePickupChange, requiresOfficialRate, setRequiresOfficialRate,
    isResolvingUrl, openMapsForDestination, calculateSovereignMetrics, pasteFromClipboard, 
    estimatedDistance, estimatedTime, pulsedDrivers, isPulsing, isLocationConfirmed, resetLocationMetrics
  }), [
    trip, tripStatus, acceptedDriver, requestRide, isRequesting, cancelTrip, isCancelling,
    rateTrip, isRating, isRequestModalOpen, openRequestModal, closeRequestModal, executeRedPathGuillotine,
    isExecutingGuillotine, confirmCheckpoint, isConfirmingCheckpoint, selectOffer, isSelectingOffer,
    seats, dropoff, pickup, handlePickupChange, requiresOfficialRate, isResolvingUrl, openMapsForDestination, 
    calculateSovereignMetrics, pasteFromClipboard, estimatedDistance, estimatedTime, pulsedDrivers, 
    isPulsing, isLocationConfirmed, resetLocationMetrics
  ]);

  return <RiderOperationsContext.Provider value={value}>{children}</RiderOperationsContext.Provider>;
}

export function useRiderOperations() {
  const context = useContext(RiderOperationsContext);
  if (context === undefined) throw new Error('useRiderOperations must be used within a RiderOperationsProvider');
  return context;
}
