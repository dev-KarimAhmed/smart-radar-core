'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, Trip } from '@/core/types';
import { useToast } from './use-toast';
import { calculateSovereignDistance, latLngToH3Cell } from '@/core/logic/geospatial-kernel';
import { riderDashboardCopy } from '@/lib/i18n/rider-dashboard-copy';

interface NearbyDriver {
  uid: string;
  name: string;
  phone: string;
  rating: number;
  rank: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  vehicle: any;
  location: { lat: number; lng: number };
  distanceKm: number;
}

const copy = riderDashboardCopy.ar.portal;

/**
 * 🛡️ [RAD-MAP-075-RIDER-SHAKE] useAtomicHandshake Hook
 * Handles concurrent locks (anti-ghost), H3-cell price freezes,
 * and geodesic 1.5km bubble filtering for riders and captains in Jordan.
 */
export function useAtomicHandshake(user: User | null, riderCoords: { lat: number; lng: number } | null) {
  const { toast } = useToast();
  
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [frozenPrice, setFrozenPrice] = useState<number | null>(null);
  const [frozenH3, setFrozenH3] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);

  const lockRef = useRef(false);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scan for drivers within the geodesic 1.5km bubble
  const scanGeoBubble = useCallback(async () => {
    if (!riderCoords || !riderCoords.lat || !riderCoords.lng) {
      return;
    }
    setIsScanning(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'driver')
      );
      
      const snap = await getDocs(q);
      const list: NearbyDriver[] = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.location && data.location.lat && data.location.lng) {
          const distance = calculateSovereignDistance(
            riderCoords.lat,
            riderCoords.lng,
            data.location.lat,
            data.location.lng
          );

          // Geodesic Bubble Limit: 1.5 km (High Density Urban Protocol)
          if (distance <= 1.5) {
            list.push({
              uid: docSnap.id,
              name: data.name || copy.defaultDriverName,
              phone: data.phone || '',
              rating: data.rating || 4.8,
              rank: data.rank || 'Silver',
              vehicle: data.vehicle || {},
              location: data.location,
              distanceKm: Number(distance.toFixed(3))
            });
          }
        }
      });

      // Sort by closest distance
      list.sort((a, b) => a.distanceKm - b.distanceKm);
      setNearbyDrivers(list);
    } catch (error) {
      console.error("Error scanning geodesic bubble:", error);
    } finally {
      setIsScanning(false);
    }
  }, [riderCoords]);

  // Freeze pricing for a safe window to combat volatile pricing spikes
  const freezePricing = useCallback((distanceKm: number) => {
    if (!riderCoords) return null;
    
    const h3Cell = latLngToH3Cell(riderCoords.lat, riderCoords.lng, 9);
    setFrozenH3(h3Cell);

    // Constitutional base calculation (0.8 JD base, 0.25 JD per km)
    const baseRate = 0.80;
    const perKmRate = 0.25;
    const computedPrice = Number((baseRate + distanceKm * perKmRate).toFixed(2));
    
    setFrozenPrice(computedPrice);
    setCountdown(120); // 120 seconds freeze window
    
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          setFrozenPrice(null); // Price expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return { price: computedPrice, h3Cell };
  }, [riderCoords]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // Atomic Handshake Execution (Acquiring concurrent protection lock)
  const executeAtomicHandshake = useCallback(async (
    targetDriverId: string,
    targetDriverName: string,
    pickupString: string,
    dropoffString: string,
    exactDistance: number
  ) => {
    if (lockRef.current || isLocked) {
      toast({
        variant: 'destructive',
        title: copy.lockedTitle,
        description: copy.lockedDescription
      });
      return null;
    }

    // Acquire lock immediately (anti-ghost)
    lockRef.current = true;
    setIsLocked(true);

    try {
      if (!user?.uid) {
        throw new Error(copy.loginRequired);
      }

      if (!frozenPrice) {
        throw new Error(copy.priceExpired);
      }

      const tripId = 'trip-' + Date.now();
      const newTrip: Partial<Trip> = {
        id: tripId,
        riderId: user.uid,
        driverId: targetDriverId,
        status: 'searching',
        offerPrice: frozenPrice,
        pickupCoords: riderCoords || { lat: 31.95, lng: 35.91 },
        dropoff: dropoffString,
        h3Index: frozenH3,
        gridId: frozenH3,
        estimatedDistance: exactDistance,
        estimatedTime: Math.ceil(exactDistance * 2), // Approximate mins
        offers: [
          {
            driverId: targetDriverId,
            price: frozenPrice,
            driverName: targetDriverName,
            driverRating: 4.9,
            driverRank: 'Gold',
            driverVehicle: {
              make: copy.defaultVehicleMake,
              model: copy.defaultVehicleModel,
              modelYear: 2021,
              color: copy.defaultVehicleColor,
              plate: "33-99933"
            }
          }
        ]
      };

      // Atomic Single Write Write Trip Entry with Trip Serial ID (T-XXXXX)
      await runTransaction(db, async (transaction) => {
        const districtKey = (user?.district || 'global').replace(/\s+/g, '_');
        const counterRef = doc(db, 'system_counters', `${districtKey}_trip_serial`);
        const counterSnap = await transaction.get(counterRef);
        let nextCount = 10001;
        if (counterSnap.exists()) {
          nextCount = (counterSnap.data().current_count || 10000) + 1;
        }
        
        const serial_id = `T-${nextCount}`;
        newTrip.serial_id = serial_id;
        
        transaction.set(counterRef, { current_count: nextCount }, { merge: true });
        transaction.set(doc(db, 'trips', tripId), newTrip);
      });

      toast({
        title: copy.tripCreatedTitle,
        description: `${copy.tripCreatedDescription} ${frozenPrice} ${copy.currency}.`
      });

      return tripId;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: copy.requestFailedTitle,
        description: err.message || copy.requestFailedDescription
      });
      return null;
    } finally {
      // Release lock
      setIsLocked(false);
      lockRef.current = false;
    }
  }, [user?.uid, isLocked, frozenPrice, frozenH3, riderCoords, toast]);

  return {
    nearbyDrivers,
    isScanning,
    isLocked,
    frozenPrice,
    frozenH3,
    countdown,
    scanGeoBubble,
    freezePricing,
    executeAtomicHandshake
  };
}
