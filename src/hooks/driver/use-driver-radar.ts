'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackSovereignError } from '@/lib/error-tracker';
import { SOVEREIGN_CONSTANTS } from '@/core/constants/sovereign-protocols';
import { calculateSovereignGridId, getSurroundingGridIds } from '@/lib/geo-grid';
import { calculateSovereignDistance } from '@/core/logic/geospatial-kernel';
import { useGeospatialAnchor } from '../use-geospatial-anchor';
import type { Trip, User } from '@/core/types';
import { RadarSovereignCommuteKernel, geoEngine, SovereignCaptainMovement } from '@/lib/commute-kernel';
import { sovereignEventBroker } from '@/lib/event-broker';

/**
 * [SCR-2026-047] رادار تحديد فرسان الأفق القريب
 */
export function useDriverRadar(user: User | null, driverStatus: string, updateDriverDoc?: Function) {
  const { location: driverLocation } = useGeospatialAnchor(driverStatus === 'active');
  const [rawTrips, setRawTrips] = useState<Trip[]>([]);
  const [tick, setTick] = useState(0);
  const lastGridId = useRef<string>("");
  const lastSentLocation = useRef<{ lat: number; lng: number } | null>(null);
  const lastSentTime = useRef<number>(0);

  const [currentDistrict, setCurrentDistrict] = useState<string>(() => user?.district || 'وادي السير');
  const [currentH3Cell, setCurrentH3Cell] = useState<string>("0x892f35ffffffff");
  const [isDisconnectionLockActive, setIsDisconnectionLockActive] = useState<boolean>(false);

  useEffect(() => {
    if (driverStatus !== 'active') return;
    const interval = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(interval);
  }, [driverStatus]);

  const [rejectedTripIds, setRejectedTripIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = sessionStorage.getItem('sovereign_rejected_trips_v1');
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      trackSovereignError(err, { context: 'useDriverRadar_SessionStorageRetrieval' });
      return [];
    }
  });

  const rejectRequest = useCallback((tripId: string) => {
    setRejectedTripIds(prev => {
        const next = [...new Set([...prev, tripId])];
        sessionStorage.setItem('sovereign_rejected_trips_v1', JSON.stringify(next));
        return next;
    });
  }, []);

  const latVal = driverLocation?.lat;
  const lngVal = driverLocation?.lng;
  const driverLocationSpeed = driverLocation?.speed;
  const driverLocationSource = driverLocation?.source;

  const surroundingGridIds = useMemo(() => {
    if (!latVal || !lngVal) return [];
    return getSurroundingGridIds(latVal, lngVal);
  }, [latVal, lngVal]);

  const currentGridAreaKey = useMemo(() => {
    return JSON.stringify([...surroundingGridIds].sort());
  }, [surroundingGridIds]);

  // Hook 1: Location updates and Grid shifting (Only updates Firestore on satisfying throttler constraints: Distance >= 15m OR Time >= 10s)
  useEffect(() => {
    if (driverStatus !== 'active' || !latVal || !lngVal) {
      return;
    }

    const now = Date.now();
    let shouldUpdate = false;

    if (!lastSentLocation.current || lastSentTime.current === 0) {
      // First update ever: allow immediately
      shouldUpdate = true;
    } else {
      const distanceKm = calculateSovereignDistance(
        lastSentLocation.current.lat,
        lastSentLocation.current.lng,
        latVal,
        lngVal
      );
      const distanceMeters = distanceKm * 1000;
      const timeElapsedMs = now - lastSentTime.current;

      // [SCR-2026-THROTTLER]: Verify if either Distance >= 15 Meters OR Time >= 10 Seconds is met
      if (distanceMeters >= 15 || timeElapsedMs >= 10000) {
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      if (currentGridAreaKey !== lastGridId.current) {
        setRawTrips([]); 
        setRejectedTripIds([]);
        lastGridId.current = currentGridAreaKey;
      }
      
      const primaryGridId = calculateSovereignGridId(latVal, lngVal);
      const updateData = {
        gridId: primaryGridId,
        location: { lat: latVal, lng: lngVal, speed: driverLocationSpeed, source: driverLocationSource || 'fallback' }
      };

      if (updateDriverDoc) {
        updateDriverDoc(updateData);
      }
      sovereignEventBroker.emit('DRIVER_DOC_UPDATE', updateData);

      lastSentLocation.current = { lat: latVal, lng: lngVal };
      lastSentTime.current = now;
    }
  }, [driverStatus, latVal, lngVal, currentGridAreaKey, driverLocationSpeed, driverLocationSource, updateDriverDoc]);

  // Hook 2: Commute handshakes and locks
  useEffect(() => {
    if (driverStatus !== 'active' || !latVal || !lngVal || !user) {
      return;
    }

    // ⚖️ [SCR-COMMUTE-PROTO-155] Run core instant commute check & Handshake Lock Verification
    const storedHash = localStorage.getItem(`sovereign_shake_${user.uid}`) || '';
    
    // Read from localStorage to remain perfectly aligned with synchronous tick updates and avoid Firestore async replication lag (State Desync)
    const storedPaidVal = localStorage.getItem(`sovereign_paid_${user.uid}`);
    const storedBonusVal = localStorage.getItem(`sovereign_bonus_${user.uid}`);
    
    const localPaid = storedPaidVal !== null ? Number(storedPaidVal) : (user.paidHoursRemaining ?? 0);
    const localBonus = storedBonusVal !== null ? Number(storedBonusVal) : (user.bonusHoursRemaining ?? 0);

    const captainConfig: SovereignCaptainMovement = {
      captainId: user.uid,
      homeDistrict: user.district || 'وادي السير',
      currentH3Cell,
      currentDistrict,
      isVehicleOccupied: (driverStatus as string) === 'busy',
      isRadarActive: (driverStatus as string) === 'active',
      localPaidRemaining: localPaid,
      localBonusRemaining: localBonus,
      storedHash: storedHash || RadarSovereignCommuteKernel.generateStateHash(user.uid, localPaid, localBonus)
    };

    const commuteResult = RadarSovereignCommuteKernel.syncLocationAndFetchTrips(
      captainConfig,
      geoEngine,
      { lat: latVal, lng: lngVal }
    );

    setIsDisconnectionLockActive(commuteResult.isDisconnectionLockActive);

    if (commuteResult.allowedToSeeLocalTrips) {
      if (commuteResult.activeDistrictPool !== currentDistrict) {
        setCurrentDistrict(commuteResult.activeDistrictPool);
      }
      if (commuteResult.nextH3Cell !== currentH3Cell) {
        setCurrentH3Cell(commuteResult.nextH3Cell);
      }
    }
  }, [driverStatus, latVal, lngVal, user, currentDistrict, currentH3Cell]);

  // Hook 3: Stable Trips Subscriber (Zero Network Chattiness)
  useEffect(() => {
    if (driverStatus !== 'active' || surroundingGridIds.length === 0) {
      setRawTrips([]);
      return;
    }

    const q = query(
      collection(db, 'trips'),
      where('status', '==', 'searching'),
      where('gridId', 'in', surroundingGridIds),
      limit(SOVEREIGN_CONSTANTS.RADAR_SCAN_LIMIT) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rawRequests = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Trip));
      setRawTrips(rawRequests);
    }, (err) => {
      trackSovereignError(err, { context: 'DriverRadarListener' });
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverStatus, currentGridAreaKey]); 

  const requests = useMemo(() => {
    if (!driverLocation) return [];

    return rawTrips
      .filter(req => !rejectedTripIds.includes(req.id))
      .map(req => {
        const targetCoords = req.obfuscatedPickupCoords || req.pickupCoords;
        const distance = calculateSovereignDistance(
          driverLocation.lat, driverLocation.lng, targetCoords.lat, targetCoords.lng
        );
        return { req, distance };
      })
      .filter(item => item.distance <= SOVEREIGN_CONSTANTS.RADAR_RADIUS_KM)
      .filter(item => {
        const req = item.req as any;
        const riderRating = req.riderRating !== undefined 
          ? req.riderRating 
          : (req.riderRatingSum && req.riderRatingCount 
              ? req.riderRatingSum / req.riderRatingCount 
              : 5.0);

        if (riderRating <= 4.2) {
          const getCreatedAtMs = (val: any) => {
            if (!val) return Date.now();
            if (typeof val.toMillis === 'function') return val.toMillis();
            if (val.seconds) return val.seconds * 1000;
            return new Date(val).getTime();
          };
          const creationMs = getCreatedAtMs(req.createdAt);
          const passedSecs = (Date.now() - creationMs) / 1000;
          if (passedSecs < 15) {
            return false; // Delayed from broadcasting!
          }
        }
        return true;
      })
      .sort((a, b) => a.distance - b.distance)
      .map(item => item.req);
  }, [rawTrips, driverLocation, rejectedTripIds, tick]);

  return { 
    driverLocation, 
    requests, 
    rejectRequest, 
    rejectedTripIds, 
    driverSpeed: driverLocation?.speed || 0,
    currentDistrict,
    currentH3Cell,
    isDisconnectionLockActive
  };
}
