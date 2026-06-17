'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SovereignAd } from './use-admin-ads';
import { trackSovereignError } from '@/lib/error-tracker';

export function useAdLifecycle() {
  const [pendingAds, setPendingAds] = useState<SovereignAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const pendingQuery = query(
      collection(db, 'promos'),
      where('status', '==', 'PENDING')
    );

    const unsubscribe = onSnapshot(pendingQuery, (snapshot) => {
      const fetched: SovereignAd[] = [];
      snapshot.forEach((snap) => {
        const data = snap.data();
        fetched.push({
          id: snap.id,
          status: data.status || 'PENDING',
          content: {
            title: data.content?.title || data.title || '',
            description: data.content?.description || data.description || '',
            posterUrl: data.content?.posterUrl || data.posterUrl || '',
          },
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          targetDistrict: data.targetDistrict,
          targetGovernorate: data.targetGovernorate,
          currentImpressions: data.currentImpressions || 0,
          targetImpressions: data.targetImpressions || 10000,
          clicksCount: data.clicksCount || 0,
          role: data.role || 'all',
          endDate: data.endDate || '2026-12-31',
          ...data
        } as SovereignAd);
      });
      setPendingAds(fetched);
      setLoading(false);
    }, (error) => {
      trackSovereignError(error, { context: 'useAdLifecycle_PendingFetch' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { pendingAds, loading };
}
