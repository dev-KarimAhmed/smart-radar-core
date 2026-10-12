'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';

export interface DelegateData {
  id: string;
  name: string;
  phone: string;
  referralCode: string;
  referredCount: number;
  deletionRate: number;
  revivalRate: number;
  pendingDues: number;
  status: 'active' | 'suspended';
  createdAt: string;
  dueDate?: string;
}

export interface DriverData {
  uid: string;
  name: string;
  phone: string;
  rating?: number;
  heartCount?: number;
  paidHoursRemaining?: number;
  status?: string;
  isBanned?: boolean;
  immunityScore?: number;
  currentDistrict?: string;
}

const CONSTANTS = Object.freeze({
  STABILITY_THRESHOLD_MS: 30 * 24 * 60 * 60 * 1000,
  PENALTY_FACTOR: 0.40,
});

export const useSovereignDashboard = () => {
  const tAuto = useTranslations();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [delegates, setDelegates] = useState<DelegateData[]>([]);
  const [drivers, setDrivers] = useState<DriverData[]>([]);
  const [loadingDelegates, setLoadingDelegates] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);

  const fetchDelegates = useCallback(async () => {
    console.log("[SSOT-Audit] Delegates are automatically synchronized in real-time via onSnapshot.");
  }, []);

  const fetchDrivers = useCallback(async () => {
    console.log("[SSOT-Audit] Drivers are automatically synchronized in real-time via onSnapshot.");
  }, []);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;

    setLoadingDelegates(true);
    setLoadingDrivers(true);

    // [SSOT-Law Real-time Synchronization]
    const qDelegates = query(collection(db, 'delegates'), where('status', '==', 'active'));
    const unsubDelegates = onSnapshot(qDelegates, (snapshot: any) => {
      if (snapshot.empty) {
        const defaults: DelegateData[] = [
          {
            id: 'delegate-1',
            name: tAuto('delegate1Name'),
            phone: '0795544332',
            referralCode: 'JO-AMMAN-GHUBAR-7',
            referredCount: 38,
            deletionRate: 8.5,
            revivalRate: 88.5,
            pendingDues: 120.00,
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: 'delegate-2',
            name: tAuto('delegate2Name'),
            phone: '0770112233',
            referralCode: 'IQ-BAGHDAD-KARRADA-9',
            referredCount: 64,
            deletionRate: 2.1,
            revivalRate: 94.2,
            pendingDues: 245.50,
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: 'delegate-3',
            name: tAuto('delegate3Name'),
            phone: '0780445566',
            referralCode: 'JO-SWAILEH-08',
            referredCount: 14,
            deletionRate: 15.0,
            revivalRate: 45.0,
            pendingDues: 40.00,
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ];
        defaults.forEach(async (d) => {
          try {
            await setDoc(doc(db, 'delegates', d.id), d);
          } catch (e: any) {
            console.error("Self-healing background delegation seeding error:", e);
          }
        });
        setDelegates(defaults);
      } else {
        const list = snapshot.docs.map((docSnap: any) => ({
          id: docSnap.id,
          ...docSnap.data()
        } as DelegateData));
        setDelegates(list);
      }
      setLoadingDelegates(false);
    }, (err: any) => {
      console.error('Error loading delegates inside sovereign dashboard:', err);
      setLoadingDelegates(false);
    });

    const qDrivers = query(collection(db, 'users'), where('role', '==', 'driver'));
    const unsubDrivers = onSnapshot(qDrivers, (snapshot: any) => {
      const list = snapshot.docs.map((docSnap: any) => {
        const data = docSnap.data();
        return {
          uid: docSnap.id,
          name: data.name || tAuto('unknownDriver'),
          phone: data.phone || '',
          rating: data.rating || 5.0,
          heartCount: data.heartCount || 0,
          paidHoursRemaining: data.paidHoursRemaining ?? (data.subscriptionHours ?? 0),
          status: data.status || 'idle',
          isBanned: data.isBanned || false,
          immunityScore: data.immunityScore ?? 100.0,
          currentDistrict: data.currentDistrict || tAuto('districtNaour')
        } as DriverData;
      });
      setDrivers(list);
      setLoadingDrivers(false);
    }, (err: any) => {
      console.error('Error loading drivers in sovereign dashboard:', err);
      setLoadingDrivers(false);
    });

    return () => {
      unsubDelegates();
      unsubDrivers();
    };
  }, [user, authLoading, tAuto]);

  const handleSovereignKillSwitch = useCallback(async (driverUid: string, driverName: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverUid })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          variant: 'destructive',
          title: tAuto('securityKillSwitchSuccess'),
          description: tAuto('driverImmunityRevoked', { driverName })
        });
        await fetchDrivers();
      } else {
        toast({
          variant: 'destructive',
          title: tAuto('killSwitchError'),
          description: data.error || tAuto('killSwitchServerError')
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: tAuto('killSwitchError'),
        description: err.message || tAuto('technicalError')
      });
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [fetchDrivers, toast, tAuto]);

  const handleReviveDriver = useCallback(async (driverUid: string, driverName: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/revive-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverUid })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: tAuto('revivalSuccess'),
          description: tAuto('driverRevivedMsg', { driverName })
        });
        await fetchDrivers();
      } else {
        toast({
          variant: 'destructive',
          title: tAuto('revivalFailure'),
          description: data.error || tAuto('blackBoxAlignmentError')
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: tAuto('unlockFailure'),
        description: err.message || tAuto('technicalError')
      });
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [fetchDrivers, toast, tAuto]);

  const handleClearDelegateDues = useCallback(async (delegateId: string, delegateName: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);

    // Save current state for potential rollback
    let rollbackDelegates: DelegateData[] = [];
    setDelegates(prev => {
      rollbackDelegates = [...prev];
      return prev.map(del =>
        del.id === delegateId
          ? { ...del, pendingDues: 0 }
          : del
      );
    });

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/clear-delegate-dues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delegateId, idToken })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: tAuto('financialSettlementSuccess'),
          description: tAuto('delegateDuesClearedMsg', { delegateName, netSettled: data.netSettled?.toFixed(2) || '0.00' })
        });
        await fetchDelegates();
      } else {
        if (rollbackDelegates.length > 0) {
          setDelegates(rollbackDelegates);
        }
        toast({
          variant: 'destructive',
          title: tAuto('settlementFailure'),
          description: data.error || tAuto('settlementServerError')
        });
      }
    } catch (err: any) {
      if (rollbackDelegates.length > 0) {
        setDelegates(rollbackDelegates);
      }
      toast({
        variant: 'destructive',
        title: tAuto('settlementFailure'),
        description: err.message
      });
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [fetchDelegates, toast, tAuto]);

  return {
    delegates,
    drivers,
    loadingDelegates,
    loadingDrivers,
    isProcessing,
    setIsProcessing,
    fetchDelegates,
    fetchDrivers,
    handleSovereignKillSwitch,
    handleReviveDriver,
    handleClearDelegateDues,
    CONSTANTS
  };
};
