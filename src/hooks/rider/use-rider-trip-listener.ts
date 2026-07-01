'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, doc, onSnapshot, getDoc, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackSovereignError } from '@/lib/error-tracker';
import type { Trip, User as DriverUser, TripStatus } from '@/core/types';
import { getSurroundingGridIds } from '@/lib/geo-grid';
import { calculateSovereignDistance } from '@/core/logic/geospatial-kernel';

export function useRiderTripListener(user: DriverUser | null) {
  const [listenerState, setListenerState] = useState<{
    trip: Trip | null;
    status: TripStatus;
  }>({ trip: null, status: 'idle' });
  const [acceptedDriver, setAcceptedDriver] = useState<DriverUser | null>(null);
  const [pulsedDrivers, setPulsedDrivers] = useState<(DriverUser & { distance: number })[]>([]);
  const [isPulsing, setIsPulsing] = useState(false);
  const isPulsingRef = useRef(false);

  const prevTripRef = useRef<Trip | null>(null);

  const resetState = useCallback(() => {
    prevTripRef.current = null;
    setListenerState({ trip: null, status: 'idle' });
    setAcceptedDriver(null);
    setPulsedDrivers([]);
    setIsPulsing(false);
  }, []);

  const setInternalStatus = useCallback((status: TripStatus) => {
    setListenerState(prev => ({ ...prev, status }));
  }, []);

  const trip = listenerState.trip;
  const internalStatus = listenerState.status;

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
      where('riderId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        // [بروتوكول الربط الشرياني V2.6-Secured - فرز العهد الملاحي على الحافة]
        const trips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
        
        // فرز تصاعدي زمني للحصول على الرحلة الأكثر حداثة بصفر تداخل شبكي وصفر متطلبات كشافات
        trips.sort((a, b) => {
          const getMs = (val: any) => {
            if (!val) return 0;
            if (typeof val.toMillis === 'function') return val.toMillis();
            if (val.seconds) return val.seconds * 1000;
            return new Date(val).getTime();
          };
          return getMs(b.createdAt) - getMs(a.createdAt);
        });

        const updatedTrip = trips[0];
        
        // التحقق من الحداثة الزمنية للرحلة لمنع السقوط في فخ الرحلات منتهية الصلاحية
        const getTripTimeMs = (val: any) => {
          if (!val) return Date.now();
          if (typeof val.toMillis === 'function') return val.toMillis();
          if (val.seconds) return val.seconds * 1000;
          return new Date(val).getTime();
        };

        const isRecent = Date.now() - getTripTimeMs(updatedTrip.createdAt) < 15 * 60 * 1000; // نافذة 15 دقيقة
        const prevTrip = prevTripRef.current;
        
        if (JSON.stringify(prevTrip) === JSON.stringify(updatedTrip)) {
          return;
        }

        // الحفاظ على حالة التزامن الفوري كمرجع موحد ومستقر قبل السقوط
        prevTripRef.current = updatedTrip;

        // التحقق من الحالات النهائية والمؤرشفة والقديمة لتسريح شاشة الراكب فوراً
        if (updatedTrip.status === 'archived') {
          resetState();
          return;
        }

        // تحديد الحالة التالية للواجهة مع منع تمزق قنوات الراكب
        let nextStatus: TripStatus = updatedTrip.status;
        if (updatedTrip.status === 'completed') {
          if (isRecent) {
            nextStatus = 'rating';
          } else {
            resetState();
            return;
          }
        } else if (updatedTrip.status === 'checkpoint_required') {
          nextStatus = 'checkpoint_required';
        } else if (updatedTrip.status === 'cancelled') {
          resetState();
          return;
        } else if (!['searching', 'busy'].includes(updatedTrip.status)) {
          // أي حالة غريبة أو منتهية نقوم بتسريحها لحماية تدفق الواجهات
          resetState();
          return;
        }

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

        setListenerState({
          trip: updatedTrip,
          status: nextStatus
        });
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
