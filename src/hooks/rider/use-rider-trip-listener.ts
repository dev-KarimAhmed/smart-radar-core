'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, doc, onSnapshot, getDoc, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackSovereignError } from '@/lib/error-tracker';
import type { Trip, User as DriverUser, TripStatus } from '@/core/types';
import { getSurroundingGridIds } from '@/lib/geo-grid';
import { calculateSovereignDistance } from '@/core/logic/geospatial-kernel';

export function useRiderTripListener(user: DriverUser | null) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [internalStatus, setInternalStatus] = useState<TripStatus>('idle');
  const [acceptedDriver, setAcceptedDriver] = useState<DriverUser | null>(null);
  const [pulsedDrivers, setPulsedDrivers] = useState<(DriverUser & { distance: number })[]>([]);
  const [isPulsing, setIsPulsing] = useState(false);
  const isPulsingRef = useRef(false);

  const prevTripRef = useRef<Trip | null>(null);

  const resetState = useCallback(() => {
    prevTripRef.current = null;
    setTrip(null);
    setAcceptedDriver(null);
    setInternalStatus('idle');
    setPulsedDrivers([]);
    setIsPulsing(false);
  }, []);

  const fetchRealDriverProfile = useCallback(async (driverId: string) => {
    try {
      const driverRef = doc(db, 'users', driverId);
      const driverSnap = await getDoc(driverRef);
      if (driverSnap.exists()) {
        setAcceptedDriver({ uid: driverSnap.id, ...driverSnap.data() } as DriverUser);
      }
    } catch (error) {
      trackSovereignError(error, { context: 'FetchRealDriverProfile' });
    }
  }, []);

  const acceptedDriverRef = useRef(acceptedDriver);
  acceptedDriverRef.current = acceptedDriver;

  useEffect(() => {
    if (user?.role !== 'rider' || !user?.uid) {
      if (trip) resetState();
      return;
    }

    const q = query(
      collection(db, 'trips'),
      where('riderId', '==', user.uid),
      where('status', 'not-in', ['completed', 'cancelled', 'archived']),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        const tripDoc = snapshot.docs[0];
        const updatedTrip = { id: tripDoc.id, ...tripDoc.data() } as Trip;
        const prevTrip = prevTripRef.current;
        
        if (JSON.stringify(prevTrip) === JSON.stringify(updatedTrip)) {
          return;
        }

        // Keep local ref synchronized immediately to act as SSOT before state schedules take effect
        prevTripRef.current = updatedTrip;

        // Determine next status and set it cleanly outside of functional state updater
        let nextStatus: TripStatus = updatedTrip.status;
        if (updatedTrip.status === 'completed' && prevTrip?.status !== 'completed') {
          nextStatus = 'rating';
        } else if (updatedTrip.status === 'checkpoint_required') {
          nextStatus = 'checkpoint_required';
        }

        setInternalStatus(nextStatus);

        if (updatedTrip.status === 'busy' && updatedTrip.driverId && (!acceptedDriverRef.current || acceptedDriverRef.current.uid !== updatedTrip.driverId)) {
          fetchRealDriverProfile(updatedTrip.driverId);
        }

        // Pulsed Sweep Logic
        if (updatedTrip.status === 'searching' && (!updatedTrip.offers || updatedTrip.offers.length === 0) && !isPulsingRef.current) {
            isPulsingRef.current = true;
            setIsPulsing(true);
            try {
                const surroundingGridIds = getSurroundingGridIds(updatedTrip.pickupCoords.lat, updatedTrip.pickupCoords.lng);
                const driversQuery = query(
                  collection(db, 'users'),
                  where('role', '==', 'driver'),
                  where('status', '==', 'active'),
                  where('gridId', 'in', surroundingGridIds),
                  limit(30)
                );
                const driversSnapshot = await getDocs(driversQuery);
                const nearbyDrivers = driversSnapshot.docs.map(doc => {
                    const data = doc.data() as DriverUser;
                    return {
                        ...data,
                        uid: doc.id,
                        distance: calculateSovereignDistance(
                            updatedTrip.pickupCoords.lat,
                            updatedTrip.pickupCoords.lng,
                            (data as any).location?.lat || 0,
                            (data as any).location?.lng || 0
                        )
                    };
                }).filter(d => d.distance <= 1.5).sort((a, b) => a.distance - b.distance).slice(0, 9);
                setPulsedDrivers(nearbyDrivers);
            } catch (error) {
                trackSovereignError(error, { context: 'PulsedSweep' });
            } finally {
                isPulsingRef.current = false;
                setIsPulsing(false);
            }
        }

        setTrip(updatedTrip);
      } else {
        // Fallback simulation in dev mode if database is un-seeded or empty to ensure smooth interactive evaluation
        if (import.meta.env.DEV && prevTripRef.current === null) {
           // We keep the idle state as is
        } else {
           resetState();
        }
      }
    }, (error) => {
        trackSovereignError(error, { context: 'Rider_ActiveTripListener' });
        resetState();
    });

    return () => unsubscribe();
  }, [user?.uid, user?.role, resetState, fetchRealDriverProfile]);

  return { trip, acceptedDriver, internalStatus, setInternalStatus, resetState, pulsedDrivers, isPulsing };
}
